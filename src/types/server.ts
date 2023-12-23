import express from 'express';
import { ExpressErrorResponse, HTTPContext } from './httprouter';
import { APIInfoObject } from 'documentation';
import { WebSocketServer } from 'ws';

export type CtxMiddlewareFunction<Context> = (ctx: Context & HTTPContext) => (express.NextFunction | ExpressErrorResponse | void) | Promise<express.NextFunction | ExpressErrorResponse | void>;
export type MiddlewareFunction = (req: express.Request, res: express.Response, next: express.NextFunction) => (express.NextFunction | void) | Promise<express.NextFunction | void>;
export type MiddlewareWhen = 'init' | 'precors' | 'postcors' | 'predocs' | 'postdocs' | 'preroutes' | 'postroutes' | 'finish';
export interface RouteMiddleware {
  name: string;
  when: MiddlewareWhen;
  priority?: number;
  handle: MiddlewareFunction;
}

export interface ServerConfig<Context = {}> {
  port: number;
  host: string;
  cors: { enabled: false } | { enabled: true; origin: string };
  routes: {
    enabled: boolean;
    folder: string;
    context: Context;
    middleware: RouteMiddleware[];
    security?: {
      authentication?:
        | { enabled: false }
        | {
            enabled: true;
            handle: CtxMiddlewareFunction<Context>;
          };
    }
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