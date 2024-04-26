import { isEmpty } from "lodash";
import {
  OpenApiBuilder,
  OperationObject,
  PathItemObject,
  SecurityRequirementObject,
  SecuritySchemeObject,
  SchemaObject,
} from "openapi3-ts/oas31";

import {
  createBuilderAndDocRoot,
  createPathParameterTypes,
  createQueryParameterTypes,
  createRequestTypes,
  createResponseTypes,
  createSecuritySchemeTypes,
  formatAuthType,
  shouldIncludeRequestBody,
} from "./endpoints-to-oai31.helpers.js";
import { Options } from "./RequestStore.js";
import { defaultOptions } from "./store-helpers/persist-options.js";
import { AuthTypeString, Endpoint } from "../utils/types.js";


interface MediaTypeSchema {
  schema: {
    properties: Record<string, any>;
    [key: string]: any; // Additional properties of the schema
  };
  [key: string]: any; // Additional properties of the media type object
}

const endpointsToOAI31 = (
  endpoints: Array<Endpoint>,
  options: Options = defaultOptions,
  requestBodySchemaParamDescriptions: Record<string, Record<string, string | null>> = {},
  responseBodySchemaParamDescriptions: Record<string, Record<string, string | null>> = {},
  requestHeaderSchemaParamDescriptions: Record<string, Record<string, string | null>> = {}
): OpenApiBuilder => {
  const builder = createBuilderAndDocRoot(endpoints);
  const uniqueHosts = new Set<string>();
  const uniqueAuth = new Map<AuthTypeString, SecuritySchemeObject>();

  for (const endpoint of endpoints) {
    const fullPath = `/${endpoint.parts.map((p) => p.part).join("/")}`;
    const pathParameterObjects = createPathParameterTypes(endpoint);
    uniqueHosts.add(endpoint.host);
    const auth = endpoint.data.authentication;
    if (auth) {
      Object.values(auth).forEach((value) => {
        const securitySchema = createSecuritySchemeTypes(value);
        if (securitySchema) {
          uniqueAuth.set(formatAuthType(value.authType), securitySchema);
        }
      });
    }

    for (const method of Object.keys(endpoint.data.methods)) {
      const methodLower = method.toLowerCase();
      const endpointMethod = endpoint.data.methods[method]!;

      const endpointId = `${endpoint.host}${endpoint.pathname}`;

      const queryParameterObjects = createQueryParameterTypes(
        endpointMethod.queryParameters,
        requestHeaderSchemaParamDescriptions,
        endpointId
      );

      const requestBody = createRequestTypes(
        endpointMethod.request,
        options,
        requestHeaderSchemaParamDescriptions,
        endpointId
      );

      const responses = createResponseTypes(
        endpointMethod.response,
        endpointMethod.responseHeaders,
        options,
        endpoint.description,
      );
      const security: SecurityRequirementObject[] = [];
      if (!isEmpty(endpoint.data.authentication)) {
        Object.values(endpoint.data.authentication).forEach((value) => {
          security.push({ [formatAuthType(value.authType)]: [] });
        });
      };

      const operation: OperationObject = {
        summary: fullPath,
        description: endpoint.description || `**Host**: http://${endpoint.host}`,
        responses,
        ...(security && { security }),
      };

      const requestBodyParamDescriptions = requestBodySchemaParamDescriptions[endpointId] || {};
      const responseBodyParamDescriptions = responseBodySchemaParamDescriptions[endpointId] || {};
      const requestHeaderParamDescriptions = requestHeaderSchemaParamDescriptions[endpointId] || {};

      const allParameterObjects = [
        ...pathParameterObjects,
        ...queryParameterObjects,
      ];

      if (allParameterObjects.length) {
        operation.parameters = allParameterObjects.map((param) => {
          if (param.in === "path") {
            return {
              ...param,
              description: requestBodyParamDescriptions[param.name] || param.description,
            };
          } else if (param.in === "query") {
            return {
              ...param,
              description: requestHeaderParamDescriptions[param.name] || param.description,
            };
          }
          return param;
        });
      }

      function isSchemaObject(obj: any): obj is SchemaObject {
        return obj && typeof obj === 'object' && 'properties' in obj;
      }

      if (requestBody && shouldIncludeRequestBody(method)) {
        operation.requestBody = {
          ...requestBody,
          description: requestBody.description,
          content: Object.entries(requestBody.content || {}).reduce<Record<string, MediaTypeSchema>>((acc, [mediaType, mediaTypeObject]) => {
            acc[mediaType] = {
              ...mediaTypeObject,
              schema: {
                ...mediaTypeObject.schema,
                properties: isSchemaObject(mediaTypeObject.schema) ? Object.entries(mediaTypeObject.schema.properties || {}).reduce((propAcc, [propName, propSchema]) => {
                  if (propSchema && typeof propSchema === "object") {
                    propAcc[propName] = {
                      ...propSchema,
                      description: responseBodyParamDescriptions[propName] || (propSchema as SchemaObject).description,
                    };
                  }
                  return propAcc;
                }, {} as Record<string, SchemaObject>) : {},
              },
            };
            return acc;
          }, {}),
        };
      }

      const pathItemObject: PathItemObject = {
        [methodLower]: operation,
      };

      const path = endpoint.pathname;
      const { rootDoc } = builder;
      rootDoc.paths = rootDoc.paths || {};
      const specPath = rootDoc.paths?.[path];
      if (specPath) {
        specPath[methodLower as "get"] = operation;
      } else {
        rootDoc.paths[path] = pathItemObject;
      }
    }
  }

  uniqueAuth.forEach((auth, key) => {
    if (!builder.rootDoc.components) {
      builder.rootDoc.components = {};
    }
    if (!builder.rootDoc.components.securitySchemes) {
      builder.rootDoc.components.securitySchemes = {};
    }
    builder.rootDoc.components.securitySchemes[key] = auth;
  });

  return builder;
};

export default endpointsToOAI31;
