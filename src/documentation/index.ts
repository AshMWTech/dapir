import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import log from "../utils/log";
import type { RouteDocumentation } from './route';

export interface OpenAPIDocs {
  paths: Record<string, Record<string, OpenAPI.OperationObject>>;
  schemas: Record<string, OpenAPI.SchemaObject>;
}

export interface APIInfoObject {
  info: {
    title: string
    version: string
    license: {
      name: string
      identifier: string
    }
  }
  externalDocs: {
    url: string
    description: string
  }
  servers: {
    url: string
  }[]
}

export default class Documentation {
  docs: Record<'public'|'private', OpenAPIDocs>;
  operationIds: Set<string>;
  schemaNames: Set<string>;
  defaultObject: APIInfoObject;

  constructor(openAPIObject?: APIInfoObject) {
    this.docs = { 
      public: {paths: {}, schemas: {}}, 
      private: {paths: {}, schemas: {}}
    };

    this.defaultObject = {
      info: {
        title: 'OpenAPI Documentation',
        version: '1.0.0',
        license: {
          name: "MIT",
          identifier: "MIT"
        },
      },
      externalDocs: {
        url: "https://example.com",
        description: "Example Documentation"
      },
      servers: [
        {
          url: "https://example.com/",
        }
      ],
    }
    if(openAPIObject) this.setup(openAPIObject);

    this.operationIds = new Set();
    this.schemaNames = new Set();

    this.addSchema("GenericResponse", {
      type: "object",
      required: ["success", "code", "status"],
      properties: {
        error: {
          type: "boolean",
          description: "Whether the request errored."
        },
        status: {
          type: "number",
          description: "The HTTP status code.",
        },
        code: {
          type: "string",
          description: "The error code."
        },
        message: {
          type: "string",
          description: "The error message.",
        },
        data: {
          description: "The validation error messages."
        }
      }
    });
  }

  addSchema(name: string, schema: OpenAPI.SchemaObject, publicSchema = false) {
    if (this.schemaNames.has(name)) {
      log('error', ` ↳ [Documentation] Schema conflict '${name}' already exists.`);
      return;
    }
    this.schemaNames.add(name);
    this.docs[publicSchema ? "public" : "private"].schemas[name] = schema;
  }

  addPath(path: string, method: string, object: OpenAPI.OperationObject, publicPath = false) {
    if (!this.docs[publicPath ? "public" : "private"].paths[path]) this.docs[publicPath ? "public" : "private"].paths[path] = {};
    this.docs[publicPath ? "public" : "private"].paths[path][method] = object;
  }

  addRoute(configuration: RouteDocumentation, routePath: string, method: string) {
    const isPublic = configuration.public ?? false;
    const openAPIPath = routePath.replace(/\[([^\]]+)\]/g, '{$1}');

    configuration.operationId = configuration.operationId ?? (method+openAPIPath.replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, ''));
    if (this.operationIds.has(configuration.operationId)) {
      log('error', ` ↳ [Documentation] Operation ID conflict '${configuration.operationId}' already exists.`);
      return;
    }
    this.operationIds.add(configuration.operationId);

    for (const [name,data] of Object.entries(configuration?.schemas ?? {})) this.addSchema(name, data, isPublic);

    this.addPath(openAPIPath, method, {
      parameters: [
        routePath.split('/').filter(x=>x.startsWith('[')).map(x=>({ name: x.replace(/\[([^\]]+)\]/g, '$1'), in: 'path', required: true, schema: { type: 'string' } })),
        configuration.parameters
      ].flat(1).filter(x=>x) as (OpenAPI.ReferenceObject | OpenAPI.ParameterObject)[],
      requestBody: configuration?.requestBody,
      summary: 'No summary provided.',
      description: 'No description provided.',
      operationId: configuration?.operationId,
      responses: configuration?.responses ?? {}
    }, isPublic)
  }

  setup(apiobj: APIInfoObject) {
    this.defaultObject = Object.assign(this.defaultObject, apiobj);
  }

  build(showPrivate: boolean = false) {
    const APIObject = {
      openapi: "3.1.0",
      ...this.defaultObject,
      paths: { ...this.docs.public.paths },
      components: {
        schemas: { ...this.docs.public.schemas },
      }
    };
    
    if (showPrivate) {
      for (let [path, pathObj] of Object.entries(this.docs.private.paths)) {
        if (!path || !pathObj) continue;
        if (!APIObject.paths.hasOwnProperty(path)) APIObject.paths[path] = {};
        for (let [method, methodObj] of Object.entries(pathObj)) {
          APIObject.paths[path][method] = methodObj;
        }
      }
      APIObject.components.schemas = Object.assign(this.docs.private.schemas, this.docs.public.schemas);
    }

    return APIObject;
  }
}