process.chdir(__dirname);
import { Server, HTTPContext } from '../src/index';

const context = {
  test: 'test',
};

const api = new Server<typeof context>({
  port: 3000,
  host: '0.0.0.0',
  cors: {
    enabled: true,
    origin: '*',
  },
  routes: {
    enabled: true,
    folder: './routes',
    context: context,
    documentation: {
      enabled: true,
      path: '/docs',
      private_key: 'yes',
    },
  },
  websocket: {
    enabled: false,
  },
});

export type RouteHandler = typeof api.routeHandler<HTTPContext>;

api.listen();
