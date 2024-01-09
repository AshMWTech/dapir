import { RouteConfig, RouteHandler, authenticationMethod } from '../index';

export const handler: RouteHandler = (ctx) => ctx.res.json({ message: 'Hey! Go to the docs... not the api root...' });

export const configuration: RouteConfig = {
  enabled: true,
  documentation: {
    public: false,
    operationId: 'api_root',
  },
  security: {
    authentication: [
      'loggedIn',
      authenticationMethod('hasPermission', { where: (req) =>  }),
      {
        method: 'cumInAssable',
        data: 'anything',
      },
    ],
  },
};
