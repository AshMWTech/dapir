import type { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

export interface Documentation {
  public: boolean;
  operationId: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPI.ParameterObject[];
  responses?: {
    [key: string]: OpenAPI.ResponseObject;
  },
  schemas?: {
    [key: string]: OpenAPI.SchemaObject;
  }
  requestBody?: OpenAPI.RequestBodyObject;
}

export interface OpenAPIDocs {
  paths: Record<string, Record<string, OpenAPI.OperationObject>>;
  schemas: Record<string, OpenAPI.SchemaObject>;
}