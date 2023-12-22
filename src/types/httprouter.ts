import express from 'express';
import { Documentation } from './documentation';
import { HttpStatus } from '../utils/httpStatus';

export interface RouteFile<Handler> {
  configuration?: RouteConfig;
  handler: Handler;
}

export interface RouteConfig {
  enabled: boolean;
  security?: {
    authentication?: boolean;
  };
  documentation: Documentation;
}

export interface HTTPContext {
  // HTTP Context
  req: express.Request;
  res: express.Response;
  next: express.NextFunction;
  errorResponse: (
    status: HttpStatus,
    opts?: {
      message?: string;
      data?: any;
      code?: string;
    },
  ) => express.Response<any, Record<string, any>>;
}

// Converted to `export type RouteHandler = typeof api.routeHandler<HTTPContext>;`
//
// export type RouterContext = Context & HTTPContext;
// export type RouteHandler = (ctx: RouterContext) => Promise<any> | any;

// Authentication
// export interface ContextUser {
//   id: string;
//   username: string;
//   email: string;
//   createdAt: Date;
//   flags: number;
// }

// export interface RouterContextAuthed extends RouterContext {
//   user: ContextUser;
// }
// export type RouteHandlerAuthed = (ctx: RouterContextAuthed) => Promise<any> | any;

/**
 * Requires ctx as first arg then all other args are added by using the generic's array.
 * @param  {RouterContext} ctx
 * @param  {T} ...args
 * @example const service: RouterService<[string, null | string[]]> = (ctx, stringProperty, nullOrStringArray) => // Do stuff
 */
// export type RouteService<T extends any[], R = any> = (ctx: Context, ...args: T) => Promise<R>;
