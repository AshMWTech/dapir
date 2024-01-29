import express from 'express';
import { Documentation } from './documentation';
import { HttpStatus } from '../utils/httpStatus';
import { LocalRouteMethods } from './server';

export interface RouteFile<Handler> {
  configuration?: RouteConfig<any, any>;
  handler: Handler;
}

export interface RouteAuthenticationMethodWithData<
  Context extends {},
  Methods extends LocalRouteMethods<Context>,
  Method extends keyof Methods = keyof Methods,
> {
  method: Method;
  // This should be the type of the specified method above, but it is a union of all the possible types.
  data: any;
}

export interface RouteConfig<Context extends {}, Methods extends LocalRouteMethods<Context>> {
  enabled: boolean;
  middleware?: (RouteAuthenticationMethodWithData<Context, Methods> | keyof Methods)[];
  documentation: Documentation;
}

export type GenericResponse = (
  status: HttpStatus,
  opts?: {
    error?: boolean;
    message?: string;
    data?: any;
    code?: string;
  },
) => express.Response<any, Record<string, any>>;

export type ExpressGenericResponse = express.Response<any, Record<string, any>>;

export interface HTTPContext {
  // HTTP Context
  req: express.Request;
  res: express.Response;
  next: express.NextFunction;
  respond: GenericResponse;
  variables: Map<string, any>;
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
