import type { Schema } from "genson-js";
import { SecuritySchemeType } from "openapi3-ts/oas31";
import type { RadixRouter } from "radix3";

export type JSONType =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONType }
  | Array<JSONType>;

// Unique identifier for each type of authentication, aligned to oai31
export enum AuthType {
  HTTP_HEADER_BEARER = "Bearer",
  HTTP_HEADER_BASIC = "Basic",
  HTTP_HEADER_DIGEST = "Digest",
  APIKEY_HEADER_ = "APIKEY_HEADER_",
  APIKEY_COOKIE_ = "APIKEY_COOKIE_",
}

// Can be dynamic e.g. APIKEY_HEADER_ + name
export type AuthTypeString = AuthType | string;

// Modelled on a Security Scheme Object https://spec.openapis.org/oas/v3.1.0#security-scheme-object
export interface Authentication {
  // So there is a straightforward way of identifying the type
  authType: AuthTypeString;
  // One of: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  type: SecuritySchemeType;
  // Could potentially generate some form of description from token values
  description?: string;
  // The name of the header, query or cookie parameter to be used. Used only with apiKey
  name?: string;
  // The location of the API key, "query", "header" or "cookie"
  in: "query" | "header" | "cookie";
  // A valid HTTP auth scheme defined in RFC9110. Only used when type = http
  scheme?: "Basic" | "Bearer" | "Digest";
}

// A Leaf stores data about an endpoint
export type Leaf = {
  // Name is based on authType, which should be unique per authentication variant
  authentication?: {
    [name: AuthTypeString]: Authentication;
  };
  description?: string;
  // The current pathname of this endpoint, which may be static or parameterised
  pathname: string;
  // Methods such as GET, POST and schema values for requests
  methods: {
    [method: string]: {
      // Requests may not contain a body
      request?: {
        // mediaType is a mime type such as application/json
        [mediaType: string]: {
          body?: Schema;
          // Sample of the most recent request
          mostRecent?: unknown;
        };
      };
      requestHeaders?: Schema;
      response: {
        [statusCode: string]: {
          [mediaType: string]: {
            body?: Schema;
            // Sample of the most recent response
            mostRecent?: unknown;
          };
        };
      };
      responseHeaders?: Schema;
      queryParameters?: {
        parameters?: Schema;
        mostRecent?: unknown;
      }
      
    };
  };
};

export enum PartType {
  Static,
  Dynamic,
}
export type Parts = Array<{ part: string; type: PartType }>;
// An Endpoint wraps a Leaf with additional data. Used as an intermediary step to simplify conversion into OAI.


export type Endpoint = {
  // A host e.g. example.com
  host: string;
  // The full path including parameters, such as /1/:param1/:param2/4
  pathname: string;
  // An array of parts such as 1, 2, and 3 in /1/2/3. Includes their type, static or dynamic (parameter)
  parts: Parts;
  // Data for this endpoint
  data: Leaf;
  // Natural language description of the endpoint
  description?: string;
};

export type TokenCounts = {
  [key: string]: number;
};

export enum DescriptionStatus {
  INACTIVE,
  ACTIVE,
  COMPLETED
}

export enum Status {
  INIT,
  RECORDING,
  STOPPED,
}

export type RouteData = { data: Leaf };
type Router = RadixRouter<RouteData>;
export type RouterMap = { [host: string]: Router };
export type LeafMap = { [host: string]: Record<string, RouteData> };

export type EndpointsByHost = Array<{ endpoints: Endpoint[]; host: string }>;
export type Method = Leaf["methods"];
export type MethodInstance = Leaf["methods"][string];
export type Data = Leaf["methods"]["get"];
export type Req = NonNullable<Leaf["methods"]["get"]["request"]>;
export type Res = Leaf["methods"]["get"]["response"];
export type Query = Leaf["methods"]["get"]["queryParameters"]; 