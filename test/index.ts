process.chdir(__dirname);
import { Server, HTTPContext } from '../src/index';
import { hasPermission } from './authentication/hasPermission';

const context = {
  test: 'test',
};

const api = new Server({
  port: 3000,
  host: '0.0.0.0',
  cors: {
    enabled: true,
    origin: '*',
  },
  routes: {
    enabled: true,
    folder: './routes',
    context: context,
    middleware: {
      global: [
        {
          name: 'test',
          when: 'precors',
          handle: async (req, res, next) => {
            console.log('this is before anything ever happens!');
            next();
          },
        },
      ],
      local: {
        loggedIn: () => undefined,
        hasPermission,
        needsBot: () => undefined,
        cumInAssable: () => undefined,
      },
    },
    documentation: {
      enabled: true,
      open_api: {
        info: {
          title: 'Test API',
          version: '1.0.0',
          license: {
            name: 'MIT',
            identifier: 'MIT',
          },
        },
        externalDocs: {
          url: 'https://example.com',
          description: 'Example Documentation',
        },
        servers: [
          {
            url: 'https://example.com/',
          },
        ],
      },
      path: '/docs',
      private_key: 'yes',
    },
  },
  websocket: {
    enabled: false,
  },
});

// Export necessary shit
export type RouteHandler = typeof api.routeHandler<HTTPContext>;
export type RouteConfig = typeof api.routeConfig;
export type Context = typeof context;
export const authenticationMethod = api.authenticationMethod;

// Prior to starting the server, you can middleware
// api.addMiddleware({
//   name: 'test',
//   when: 'precors',
//   middleware: async (req, res, next) => {
//     console.log('this is before anything ever happens!');
//     next();
//   },
// });

// Start the server
api.listen();
