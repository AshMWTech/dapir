import type { RouteConfig } from '../src';
import type { RouteHandler } from './hello';

export const handler: RouteHandler = (ctx) => ctx.res.json({ message: 'Hey! Go to the site... not the api...' });

export const configuration: RouteConfig = {
  enabled: true,
  documentation: {
    public: false,
    operationId: 'api_root',
  },
};
