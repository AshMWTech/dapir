import { Request } from 'express';
import { Context } from '..';
import { CtxMiddlewareFunction } from '../../src/types/server';

interface Data {
  where: (req: Request) => string;
}

export const hasPermission: CtxMiddlewareFunction<Context, Data> = (ctx, data) => {
  console.log(data.where(ctx.req));
  return ctx.next();
};
