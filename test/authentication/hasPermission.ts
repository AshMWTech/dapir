import { Context } from '..';
import { CtxMiddlewareFunction } from '../../src/types/server';

interface Data {
  where: string;
}

export const hasPermission: CtxMiddlewareFunction<Context, Data> = (ctx, data) => {
  console.log(data.where);
  return ctx.next();
};
