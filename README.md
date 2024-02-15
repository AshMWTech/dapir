# dAPIr

Dan's API Router (dAPIr) is a simple API router based on Express.js that leverages the file system for creating routes. dAPIr also helps you manage and create OpenAPI documentation.

# Quick Start

Let's get started with using **dAPIr**!

## Create API

Create your API route file

```ts
process.chdir(__dirname);
import { Server, HTTPContext } from '@ashmwtech/dapir';

// Context that will be passed throughout app (databases, wrappers, etc)
const context = {
  test: 'test',
};

// Create api
const api = new Server({
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
  }
})

// Export types
export type RouteHandler = typeof api.routeHandler<HTTPContext>;
export type RouteConfig = typeof api.routeConfig;
export type Context = typeof context;
export const authenticationMethod = api.authenticationMethod;

// Start server
api.listen();
```

## Routing

### Creating a route file

**dAPIr** uses the file system to create routes. To create a route create a ts file with a HTTP method as the name. To create a dynamic url create a folder or prefix the file name with `[var]` (replace var with whatever you want it to be named). Here are some examples of what they might look like.

| File Path | Route Path |
|---|---|
| /get.ts | GET / |
| /foo/get.ts | GET /foo |
| /foo.get.ts | GET /foo |
| /bar/post.ts | POST /bar |
| /bar/get.ts | GET /bar |
| /[id]/get.ts | GET /:id |
| /[id].get.ts | GET /:id |

> **dAPIr** will detect duplicate routes and error them to the console.

### Setup route

To setup a route, simply import the types from your api index.

```ts
import { RouteConfig, RouteHandler } from '@/';

export const handler: RouteHandler = (ctx) => ctx.res.json({ message: 'Hello World' });

export const configuration: RouteConfig = { /* ... */ };
```

## Middlewares

**dAPIr** supports two types of middlewares, global and local.

### Global Middleware

Global Middlewares run on every request

> Unfinished...

### Local Middleware

> Unfinished...