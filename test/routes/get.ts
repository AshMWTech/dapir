import type { RouteConfig } from '../../src';
import type { RouteHandler } from '../index';

export const handler: RouteHandler = (ctx) => ctx.res.json({ message: 'Hey! Go to the docs... not the api root...' });

export const configuration: RouteConfig = {
  enabled: true,
  documentation: {
    public: false,
    operationId: 'api_root',
  },
};
