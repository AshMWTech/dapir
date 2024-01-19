import express from 'express';
import log from './utils/log';
import { WebSocketServer } from 'ws';
import { Server as HttpServer, IncomingMessage as HttpIncomingMessage, ServerResponse as HttpServerResponse } from 'http';
import indexFolder from './utils/indexFolder';
import { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import Documentation from './documentation';
import { HTTPContext, RouteFile, RouteConfig, RouteAuthenticationMethodWithData } from './types/httprouter';
import { HttpStatus } from 'utils/httpStatus';
import { AuthenticationMethods, CtxMiddlewareFunction, MiddlewareWhen, RouteMiddleware, ServerConfig } from './types/server';

interface OASchemaFile {
  enabled: boolean;
  publicSchemas: boolean;
  schemas: Record<string, OpenAPI.SchemaObject>;
}

export class Server<Context extends {}, Methods extends AuthenticationMethods<Context>> {
  config: ServerConfig<Context, Methods>;
  express: express.Express;
  server: HttpServer<typeof HttpIncomingMessage, typeof HttpServerResponse> | undefined;
  startedAt: Date | null;
  wss: WebSocketServer | undefined;
  documentation: Documentation | undefined;
  middleware: RouteMiddleware[];

  // types: Used to generate type, ignore safely
  routeConfig: RouteConfig<Context, Methods>;
  routeHandler<MoreContext = {}>(ctx: Context & MoreContext): any {}
  // /types

  constructor(config: ServerConfig<Context, Methods>) {
    this.config = config;

    // types: Used to generate type, ignore safely
    this.routeConfig = {} as any;
    // /types

    this.wss = config.websocket.enabled ? config.websocket.wss || new WebSocketServer({ noServer: true }) : undefined;
    this.documentation =
      config.routes.enabled && config.routes.documentation.enabled ? new Documentation(config.routes.documentation.open_api) : undefined;
    this.middleware = config?.routes?.middleware || [];

    this.startedAt = null;
    this.express = express();
  }

  validateConfig() {
    if (this.config.routes.enabled) {
      if (!this.config.routes.folder) return log('error', 'Routes folder is not defined');
      if (!this.config.routes.context) return log('error', 'Routes context is not defined');
      if (!this.config.routes.middleware) return log('error', 'Routes middleware is not defined');
      if (this.config.routes.middleware) {
        for (const middleware of this.config.routes.middleware) {
          if (!middleware.name) return log('error', 'Middleware must have a name');
          if (!middleware.when) return log('error', `Middleware '${middleware.name}' needs a 'when' property`);
          if (!middleware.handle) return log('error', `Middleware '${middleware.name}' needs a 'handle' property`);
          if (typeof middleware.handle != 'function') return log('error', `Middleware '${middleware.name}' handle must be a function`);
        }
      }
      if (this.config.routes.documentation.enabled) {
        if (!this.config.routes.documentation.path) return log('error', 'Routes documentation path is not defined');
        if (!this.config.routes.documentation.private_key) return log('error', 'Routes documentation private_key is not defined');
      }
    }
    if (this.config.websocket.enabled) {
      if (!this.config.websocket.path) return log('error', 'Websocket path is not defined');
    }
    return true;
  }

  addMiddleware(routeMiddleWare: RouteMiddleware) {
    if (this.startedAt !== null) return log('error', 'Cannot add middleware after server has started');
    if (!routeMiddleWare.name) return log('error', 'Middleware must have a name');
    if (!routeMiddleWare.when) return log('error', `Middleware '${routeMiddleWare.name}' needs a 'when' property`);
    if (!routeMiddleWare.handle) return log('error', `Middleware '${routeMiddleWare.name}' needs a 'handle' property`);
    if (typeof routeMiddleWare.handle != 'function') return log('error', `Middleware '${routeMiddleWare.name}' handle must be a function`);
    this.middleware.push(routeMiddleWare);
  }

  removeMiddleware(name: string) {
    if (this.startedAt !== null) return log('error', 'Cannot remove middleware after server has started');
    this.middleware = this.middleware.filter((x) => x.name != name);
  }

  private async init(key?: string) {
    if (key != 'listen_init') return;
    const runMiddleware = async (when: MiddlewareWhen) => {
      const middleware = this.middleware.filter((x) => x.when == when).sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
      middleware.forEach((x) => this.express.use(x.handle));
    };
    runMiddleware('init');
    this.express.use(express.json({ limit: '50mb' }));
    this.express.use(express.urlencoded({ extended: true, limit: '50mb' }));
    if (this.config.cors.enabled) {
      runMiddleware('precors');
      this.express.use((req, res, next) => {
        //@ts-expect-error Cors is enabled... stupid typescript
        if (this.config.cors.origin != '*') res.header('Access-Control-Allow-Origin', this.config.cors.origin);
        else res.header('Access-Control-Allow-Origin', req.headers.origin ?? '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type');
        res.header('Access-Control-Allow-Credentials', 'true');
        if (req.method == 'OPTIONS') return res.status(204).send();
        next();
      });
      runMiddleware('postcors');
    }
    if (this.config.routes.enabled) {
      const files = await indexFolder(this.config.routes.folder);
      if (this.config.routes.documentation.enabled) {
        runMiddleware('predocs');
        if (!this.documentation) this.documentation = new Documentation();
        const filteredDocFiles = files.filter((x) => !x.directory).filter((x) => /^(oa\-schema)\.(js|ts)$/.test(x.name));
        log('info', `Found ${filteredDocFiles.length} documentation files`);
        for (const file of filteredDocFiles) {
          if (file.directory) continue;

          const imported = await import(file.fullPath);
          if (!imported) continue;

          const doc = imported as OASchemaFile;
          if (!doc.enabled || !doc.schemas) continue;

          log(
            'debug',
            `Loaded schema ${file.path
              .replace(/\\/g, '/')
              .replace(/^routes/, '')
              .replace(/\(([^\)]+)\)\//g, '')}/${file.name}`,
          );

          for (const schemaName in doc.schemas) {
            if (!doc.schemas[schemaName]) continue;
            this.documentation.addSchema(schemaName, doc.schemas[schemaName], doc.publicSchemas);
          }
        }
        log('debug', `Loaded GET ${this.config.routes.documentation.path}`);
        this.express.get(this.config.routes.documentation.path, (req, res, next) => {
          // @ts-expect-error Documentation is enabled
          return res.send(this.documentation?.build(req.query?.key != (this.config.routes.documentation.private_key as string)));
        });
        runMiddleware('postdocs');
      }

      runMiddleware('preroutes');
      const keywordRoutes = files.filter((x) => !x.directory).filter((x) => /^(get|put|patch|post|delete|head)\.(js|ts)$/.test(x.name));
      const namedRoutes = files.filter((x) => !x.directory).filter((x) => /^(.*)\.(get|put|patch|post|delete|head)\.(js|ts)$/.test(x.name));
      const filteredRoutes = [...keywordRoutes, ...namedRoutes];
      log('info', `Found ${filteredRoutes.length} route files`);
      let routesInit = new Set();
      for (const file of filteredRoutes) {
        if (file.directory) continue;

        const imported = await import(file.fullPath);
        if (!imported) continue;

        // Apparently the bundler has no clue wtf "this" is when used like "this.routeHandler<HTTPContext>"
        const instance = this;
        type RouteHandler = typeof instance.routeHandler<HTTPContext>;

        const route = imported as RouteFile<RouteHandler>;
        if (!route.configuration?.enabled) continue;
        if (!route.handler || typeof route.handler != 'function') {
          log('error', `Route ${file.name} does not have a handler function.`);
          continue;
        }

        const routeName = file.name.split('.').slice(-2)?.[0] ?? 'route';
        const method = routeName as 'get' | 'put' | 'patch' | 'post' | 'delete' | 'head';
        let routePath = file.path
          .replace(/\\/g, '/')
          .replace(/^routes/, '')
          .replace(/\(([^\)]+)\)\//g, '');
        if (routePath.length == 0) routePath = '/';
        
        const namedPortion = file.name.split('.').slice(0, -2);
        if (namedPortion.length > 0) routePath += '/' + namedPortion.join('.');

        log('debug', `Loaded route ${method.toUpperCase()} ${routePath}`);

        if (routesInit.has(method+routePath)) {
          log('error', ` ↳ [Router | Aborted] Duplicate path & method combination found.`);
          continue;
        }
        routesInit.add(method+routePath);

        let routeAuth: { method: string; data: object; handle: CtxMiddlewareFunction<Context> }[] = [];
        if (this.config.routes.security?.authentication?.enabled)
          for (let authMethod of route.configuration?.security?.authentication ?? []) {
            let authName = String(typeof authMethod == 'object' ? authMethod.method : authMethod);
            let authData = typeof authMethod == 'object' ? authMethod.data : undefined;
            if (!authName) {
              log('error', `Route ${file.name} has an invalid authentication method '${authName}'`);
              continue;
            }
            let serverMethod = this.config.routes.security.authentication.methods[authName];
            if (!serverMethod) {
              log('error', `Route ${file.name} has an invalid authentication method '${authName}'`);
              continue;
            }
            routeAuth.push({ method: authName, data: authData, handle: serverMethod });
          }

        if (this.documentation) this.documentation.addRoute(route.configuration?.documentation, routePath, method);

        const routeFunc = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
          const errorResponse = (status: HttpStatus, opts?: { message?: string; data?: any; code?: string }) => {
            return res
              .status(status)
              .send({ error: true, status: status, code: opts?.code || HttpStatus[status], message: opts?.message, data: opts?.data });
          };

          const variables = new Map();
          for (let auth of routeAuth) {
            let worked = false;
            let goNext = () => (worked = true);
            await auth.handle({ ...this.config.routes.context, req, res, next: goNext, errorResponse, variables }, auth.data);
            if (worked == false) return;
          }

          try {
            return route.handler({ ...this.config.routes.context, req, res, next, errorResponse, variables });
          } catch (error) {
            log('error', (error as Error).message ?? 'Unknown error');
            return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, {
              message: (error as Error).message ?? 'Unknown error',
              code: 'UNKNOWN_ROUTE_ERROR',
            });
          }
        };

        this.express[method](routePath.replace(/\[([^\]]+)\]/g, ':$1'), routeFunc);
      }
      runMiddleware('postroutes');
    }
    runMiddleware('finish');
  }

  async listen() {
    if (this.validateConfig() != true) return;
    if (this.startedAt !== null) return log('error', 'Server already listening');
    this.startedAt = new Date();
    await this.init('listen_init');
    if (this.config.websocket.enabled && this.wss == undefined) {
      this.wss = new WebSocketServer({ noServer: true });
    }
    const server = this.express.listen(this.config.port, this.config.host, () => {
      log('ready', `Server listening at http://${this.config.host}:${this.config.port}`);
    });
    this.server = server;
    server.on('upgrade', (request, socket, head) => {
      if (this.config.websocket.enabled == false || this.config.websocket.path !== request.url) {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }
      if (!request.headers.upgrade || request.headers.upgrade.toLowerCase() !== 'websocket') {
        socket.write('HTTP/1.1 426 Upgrade Required\r\n' + 'Connection: Upgrade\r\n' + 'Upgrade: WebSocket\r\n\r\n');
        socket.destroy();
        return;
      }
      if (this.wss == undefined) {
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
        return;
      }

      this.wss.handleUpgrade(request, socket, head, (ws) => (this.wss as WebSocketServer).emit('connection', ws, request));
    });
  }

  stop() {
    this.server?.close();
    this.wss?.close();
  }

  /**
   * Helper Functions
   */

  authenticationMethod<Method extends keyof Methods>(
    method: Method,
    data: Parameters<Methods[Method]>[1],
  ): RouteAuthenticationMethodWithData<Context, Methods, Method> {
    return { method, data } as RouteAuthenticationMethodWithData<Context, Methods, Method>;
  }
}
