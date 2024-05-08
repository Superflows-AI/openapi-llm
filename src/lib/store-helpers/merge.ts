import { mergeSchemas, Schema } from "genson-js";

import type { Leaf } from "../../utils/types";

type Data = Leaf["methods"]["get"];
type Req = NonNullable<Leaf["methods"]["get"]["request"]>;
type Res = Leaf["methods"]["get"]["response"];
type Query = Leaf["methods"]["get"]["queryParameters"]; 
// type MostRecent = {
//   [key: string]: unknown; 
// };

const mergeAuthentication = (dest: Leaf, src: Leaf): void => {
  if (!src.authentication) return;
  if (!dest.authentication) dest.authentication = {};
  Object.entries(src.authentication).forEach(([key, value]) => {
    dest.authentication![key] = value;
  });
};

const mergeRequest = (dest: Data, src: Req = {}) => {
  Object.entries(src).forEach(([mediaType, srcData]) => {
    // Nothing in dest or src to merge
    if (!srcData || !srcData.body) return;
    // Nothing in dest to merge, but src has data
    if (dest["request"]?.[mediaType]) {
      dest["request"][mediaType] = srcData;
    } else {
      // Both src and dest have data
      dest["request"]![mediaType]!.body = mergeSchemas([
        dest["request"]![mediaType]!.body!,
        srcData.body,
      ]);
      dest["request"]![mediaType]!.mostRecent = srcData.mostRecent;
    }
  });
};

const mergeResponse = (dest: Data, src: Res = {}) => {

  Object.entries(src).forEach(([statusCode, srcMediaTypeObj]) => {
    // statusCode in src does not exist in dest
    if (!dest["response"]?.[statusCode]) {
      dest["response"][statusCode] = srcMediaTypeObj;
      return;
    }
    // statusCode exists in both dest and src
    Object.entries(srcMediaTypeObj).forEach(([mediaType, mediaTypeData]) => {
      const srcData = srcMediaTypeObj[mediaType]!;
      if (!dest["response"]?.[statusCode]?.[mediaType]) {
        // dest does not contain mediaType, set from src
        dest["response"][statusCode]![mediaType] = srcData;
        return;
      } else {
        // merge schemas
        dest["response"][statusCode]![mediaType]!.body = mergeSchemas([
          dest["response"]![statusCode]![mediaType]!.body!,
          srcData.body || {},
        ]);
        dest["response"]![statusCode]![mediaType]!.mostRecent = mediaTypeData.mostRecent;
      }
    });
  });
};

const mergeQueryParameters = (dest: Data, src: Query = {}) => {
  // Assume src and dest have the same method structure and we're merging for a specific method, e.g., 'get'
  const destQueryParams = dest.queryParameters;

  // If there's nothing to merge from src, exit early
  if (!src|| !src.parameters) return;

  // If dest does not have existing query parameters, directly assign from src
  if (!destQueryParams || !destQueryParams.parameters) {
    dest.queryParameters = src;
  } else {
    // If both src and dest have query parameters, merge them
    dest.queryParameters!.parameters = mergeSchemas([
      destQueryParams.parameters!,
      src.parameters,
    ]);
    dest.queryParameters!.mostRecent = src.mostRecent;
  }
};


export const mergeLeaves = (dest: Leaf, src: Leaf): Leaf => {
  mergeAuthentication(dest, src);
  for (const [method, methodObj] of Object.entries(src.methods)) {
    // Method doesn't exist in dest, set src and continue to next method
    if (!dest.methods[method]) {
      dest.methods[method] = methodObj;
      continue;
    }
    const srcSchema = src.methods[method]!;
    const destSchema = dest.methods[method]!;
    // Merge request
    if (destSchema.request || srcSchema.request) {
      mergeRequest(destSchema, srcSchema.request);
    }

    // Merge query params
    if (destSchema.queryParameters || srcSchema.queryParameters) {
      mergeQueryParameters(destSchema, srcSchema.queryParameters);
    }

    // Merge request headers
    if (destSchema.requestHeaders || srcSchema.requestHeaders) {
      const schemas = [
        destSchema.requestHeaders,
        srcSchema.requestHeaders,
      ].filter(Boolean) as Schema[];
      destSchema.requestHeaders = mergeSchemas(schemas);
    }

    // Merge response headers
    if (destSchema.responseHeaders || srcSchema.responseHeaders) {
      const schemas = [
        destSchema.responseHeaders,
        srcSchema.responseHeaders,
      ].filter(Boolean) as Schema[];
      destSchema.responseHeaders = mergeSchemas(schemas);
    }

    // Merge responses
    mergeResponse(destSchema, methodObj.response);
  }
  return dest;
};
