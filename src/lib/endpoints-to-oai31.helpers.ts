import type { Schema } from "genson-js";
import {
  ContentObject,
  HeaderObject,
  HeadersObject,
  MediaTypeObject,
  OpenApiBuilder,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  SecuritySchemeObject,
} from "openapi3-ts/oas31";

import { Options } from "./RequestStore.js";
import { Authentication, AuthType, Endpoint, Leaf, PartType } from "../utils/types.js";

export const createSecuritySchemeTypes = (
  auth?: Authentication,
): SecuritySchemeObject | undefined => {
  if (!auth) return;
  const isBearer = auth.authType === AuthType.HTTP_HEADER_BEARER;
  const isBasic = auth.authType === AuthType.HTTP_HEADER_BASIC;
  const isDigest = auth.authType === AuthType.HTTP_HEADER_DIGEST;
  if (isBearer || isBasic || isDigest) {
    const httpAuth: SecuritySchemeObject = {
      type: auth.type,
      in: auth.in,
      scheme: auth.scheme,
    };
    return httpAuth;
  }
  const isAPIKeyHeader = auth.authType.startsWith(AuthType.APIKEY_HEADER_);
  const isAPIKeyCookie = auth.authType.startsWith(AuthType.APIKEY_COOKIE_);
  if (isAPIKeyHeader || isAPIKeyCookie) {
    const apiKeyHeader: SecuritySchemeObject = {
      type: auth.type,
      in: auth.in,
      name: auth.name,
    };
    return apiKeyHeader;
  }
};

export const shouldIncludeRequestBody = (method: string) => {
  return !new Set(["get", "delete", "head"]).has(method.toLowerCase());
};

type RequestType = Leaf["methods"]["get"]["request"];

export const createRequestTypes = (
  requestType: RequestType,
  options: Options
) => {
  if (!requestType) return;
  const contentObject: ContentObject = {};
  Object.entries(requestType).forEach(([mediaType, data]) => {
    const mediaTypeObject: MediaTypeObject = {
      schema: data.body,
      ...(!!options.enableMoreInfo && { example: data.mostRecent }),
    };
    contentObject[mediaType] = mediaTypeObject;
  });
  const requestBodyObject: RequestBodyObject = {
    content: contentObject,
  };
  return requestBodyObject;
};

type ResponseType = Leaf["methods"]["get"]["response"];


export const createResponseTypes = (
  responseType: ResponseType,
  headers: Schema | undefined,
  options: Options,
  endpointDescription?: string
) => {
  // Create response headers
  const headersObject: HeadersObject = {};
  if (headers && headers.properties) {
    Object.entries(headers.properties).forEach(([name, schema]) => {
      const headerObj: HeaderObject = {
        required: false,
        schema,
      };
      headersObject[name] = headerObj;
    });
  }

  // Initialise responses object, set response objects from status codes
  const responsesObject: ResponsesObject = {};
  Object.entries(responseType).forEach(([statusCode, mediaTypeObj]) => {
    Object.entries(mediaTypeObj).forEach(([mediaType, data]) => {
      const contentObject: ContentObject = {};
      const mediaTypeObject: MediaTypeObject = {
        schema: data.body,
        ...(!!options.enableMoreInfo && { example: data.mostRecent }),
      };
      contentObject[mediaType] = mediaTypeObject;
      const responseObject: ResponseObject = {
        content: contentObject,
        description: endpointDescription || "",
        headers: headersObject,
      };
      responsesObject[statusCode] = responseObject;
    });
  });

  return responsesObject;
};

export const createBuilderAndDocRoot = (
  endpoints: Array<Endpoint>,
): OpenApiBuilder => {
  const builder = OpenApiBuilder.create({
    openapi: "3.1.0",
    info: {
      title: "OpenAPI Specification",
      version: "1.0.0",
      description: `A specification generated by [openapi-llm by Superflows](https://github.com/Superflows-AI/openapi-llm), built on top of [openapi-devtools](https://github.com/AndrewWalsh/openapi-devtools). Contains ${
        endpoints.length
      } endpoint${endpoints.length === 1 ? "" : "s"}.`,
    },
    paths: {},
  });
  return builder;
};

export const createPathParameterTypes = (
  endpoint: Endpoint,
): Array<ParameterObject> => {
  const dynamicParts = endpoint.parts.filter(
    ({ type }) => type === PartType.Dynamic,
  );
  const parameters: ParameterObject[] = dynamicParts.map(({ part: name }) => ({
    name,
    in: "path",
    required: true,
    schema: {
      type: "string",
    },
  }));
  return parameters;
};

export const createQueryParameterTypes = (
  queryParameters: Schema | undefined,
  options: Options,
  mostRecent?: any,
): Array<ParameterObject> => {
  if (!queryParameters?.properties) return [];
  const namesAndSchemas = Object.entries(queryParameters.properties);
  return namesAndSchemas.map(([name, schema]) => {
    const parameterObject: ParameterObject = {
      name,
      in: "query",
      required: false,
      schema,
      ...(options.enableMoreInfo && mostRecent && { example: mostRecent[name] })
    };
    return parameterObject;
  });
};


export const formatAuthType = (str: string) => {
  return str.replace(/_/g, " ").toLowerCase();
};
