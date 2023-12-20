import type { Context } from './context';
import { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';
import { Documentation } from './documentation';

export interface RouteFile {
  configuration?: RouteConfig;
  handler: SocketHandler;
}

export interface RouteConfig {
  enabled: boolean;
  security?: {
    authentication?: boolean;
    forAdminOnly?: boolean;
  };
  documentation: Documentation;
}

export interface WSContext {
  // WS Context
  ws: WebSocket;
  req: IncomingMessage;
};

export type RawSocketContext = Context & WSContext;
export type RawSocketHandler = (ctx: RawSocketContext) => Promise<any> | any;

export type SocketContext = RawSocketContext & {
  respond: (event: string, data: any) => void;
  socketId: string;
};
export type SocketHandler = (ctx: SocketContext) => Promise<any> | any;

/**
 * Requires ctx as first arg then all other args are added by using the generic's array.
 * @param  {SocketContext} ctx
 * @param  {T} ...args
 * @example const service: RouterService<[string, null | string[]]> = (ctx, stringProperty, nullOrStringArray) => // Do stuff
 */
export type RouteService<T extends any[], R = any> = (ctx: SocketContext, ...args: T) => Promise<R>;