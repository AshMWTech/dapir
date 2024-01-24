import express from 'express';
import { ExpressErrorResponse, HTTPContext } from './httprouter';
import { APIInfoObject } from 'documentation';
import { WebSocketServer } from 'ws';

// interface MiddlewareDataDynamic {
//   dynamic: true;
//   where: 'body' | 'query' | 'header';
//   name: string | string[];
// }
// type MiddlewareData = Record<string, any | MiddlewareDataDynamic>;

export type CtxMiddlewareFunction<Context = {}, Data = any> = (
  ctx: Context & HTTPContext,
  data: Data,
) => (express.NextFunction | ExpressErrorResponse | void) | Promise<express.NextFunction | ExpressErrorResponse | void>;
export type MiddlewareFunction = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => (express.NextFunction | void) | Promise<express.NextFunction | void>;
export type MiddlewareWhen = 'init' | 'precors' | 'postcors' | 'predocs' | 'postdocs' | 'preroutes' | 'postroutes' | 'finish';
export interface GlobalRouteMiddleware {
  name: string;
  when: MiddlewareWhen;
  priority?: number;
  handle: MiddlewareFunction;
}

export interface LocalRouteMethods<Context = {}> {
  [key: string]: CtxMiddlewareFunction<Context>;
}

// export type LocalRouteMiddleware<Context, Methods extends LocalRouteMethods<Context>> =
//   | { enabled: false }
//   | {
//       enabled: true;
//       methods: Methods;
//     };

export interface ServerConfigMiddleware<Context extends {}, Methods extends LocalRouteMethods<Context>> {
  global: GlobalRouteMiddleware[];
  local: Methods;
};

export interface ServerConfig<Context extends {}, Methods extends LocalRouteMethods<Context>> {
  port: number;
  host: string;
  cors: { enabled: false } | { enabled: true; origin: string };
  routes: {
    enabled: boolean;
    folder: string;
    context: Context;
    middleware: ServerConfigMiddleware<Context, Methods>;
    documentation:
      | { enabled: false }
      | {
          enabled: true;
          open_api: APIInfoObject;
          path: string;
          private_key: string;
        };
  };
  websocket:
    | { enabled: false }
    | {
        enabled: true;
        path: string;
        wss?: WebSocketServer;
      };
}
