import type { Schema } from "genson-js";
import { Endpoint, MethodInstance } from "../../utils/types"; 
import tokenizer from "gpt-tokenizer";
import { ChatMessage } from "../../ui/helpers/count-tokens"; 
import type { Req, Res } from "../../utils/types";

export type Result = { [key: string]: unknown };


export function methodDetailsToString(method: MethodInstance): string {
  /** Helper function to convert method details into a string **/ 

  const queryParametersString = method.queryParameters
    ? Object.entries(method.queryParameters.parameters?.properties || {})
        .map(([paramName, paramSchema]) => {
          const example = (method.queryParameters?.mostRecent as Record<string, unknown>)?.[paramName];
          const exampleString = example !== undefined ? JSON.stringify(example) : 'No recent example';
          const paramType = (paramSchema as { type?: string }).type || 'unknown';
          return `${paramName}: ${paramType}. ${exampleString}`;
        })
        .join('\n')
    : 'No query parameters';


  const requestString = method.request
    ? Object.entries(method.request as { [mediaType: string]: Req }).map(([mediaType, req]) => {
        const parsedRequest = req.mostRecent
          ? JSON.stringify(findExamplesFromJSON(req.mostRecent))
          : 'No recent example';
        return `${mediaType}: Summarised Example Request: ${parsedRequest}`;
      }).join('\n')
    : 'No request info';

  const responseString = method.response
    ? Object.entries(method.response as { [statusCode: string]: { [mediaType: string]: Res } }).map(([statusCode, responses]) => {
        return `${statusCode}: ` + Object.entries(responses).map(([mediaType, res]) => {
          const mostRecent = res.mostRecent
            ? JSON.stringify(findExamplesFromJSON(res.mostRecent))
            : 'No recent sample';
          return `${mediaType}: Summarised Example Response: ${mostRecent}`;
        }).join('\n');
      }).join('\n')
    : 'No response info';

  return `Query Parameters: \n${queryParametersString}\nRequest:\n${requestString}\nResponse:\n${responseString}`;
}

export function endpointToString(endpoint: Endpoint): string {
  const partsString = endpoint.parts.map(part => `${part.part} (type: ${part.type})`).join(', ');
  const methodsString = Object.entries(endpoint.data.methods).map(([method, details]) => {
      return `${method.toUpperCase()}: ` + methodDetailsToString(details);
  }).join('\n');

  return `Pathname: ${endpoint.pathname}\nParts: [${partsString}]\nMethods:\n${methodsString}`;
}

export function schemaToString(schema: Schema): string {
  /** Helper function to convert schema objects into a string representation **/

  let schemaDetails = schema.type ? `Type: ${schema.type}` : '';
  if (schema.properties) {
      const propertiesString = Object.entries(schema.properties).map(([key, val]) => {
          return `${key}: ${schemaToString(val)}`;
      }).join(', ');
      schemaDetails += schemaDetails ? `, Properties: {${propertiesString}}` : `Properties: {${propertiesString}}`;
  }
  return schemaDetails;
}

export function findExamplesFromJSON(data: unknown, maxLength: number = 30, result: Result = {}, visited = new Set()): Result {
  if (typeof data === 'string') {
    result['example'] = truncateString(data);
    return result;
  }

  if (data !== null && typeof data === 'object') {
    if (visited.has(data)) {
      return result;
    }
    visited.add(data);

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const value = data[i];
        if (i === 0) {
          result[i.toString()] = findExamplesFromJSON(value, maxLength, {}, visited);
        } else {
          result[i.toString()] = '... (' + (data.length - 1) + ' items not shown)';
          break;
        }
      }
    } else if (data.constructor === Object) {
      const dataObj = data as Record<string, unknown>;
      for (const key in dataObj) {
        if (Object.prototype.hasOwnProperty.call(dataObj, key)) {
          const value = dataObj[key];
          if (Array.isArray(value)) {
            result[key] = value.length > 0 ? [findExamplesFromJSON(value[0], maxLength, {}, visited)] : [];
            (result[key] as unknown[]).push('... (' + (value.length - 1) + ' items not shown)');
          } else if (typeof value === 'object' && value !== null) {
            result[key] = findExamplesFromJSON(value, maxLength, {}, visited);
          } else if (typeof value === 'string') {
            result[key] = truncateString(value);
          } else {
            result[key] = value;
          }
        }
      }
    }
  }

  return result;
}

export function getExample(endpoint: Endpoint, parameterPath: string): unknown {

  const pathParts = parameterPath.split('|');
  const methodType = pathParts[0];
  const requestResponseType = pathParts[1];
  let contentType = pathParts[2];
  let statusCode = ''
  if (requestResponseType === 'response') {
    statusCode = pathParts[2];
    contentType = pathParts[3];
  }
  
  const startIndex = requestResponseType === 'request' ? 5 : 6;
  const mostRecentPath = pathParts.slice(startIndex).filter(part => part !== 'items' && part !== 'properties');
  const currentMethod = endpoint.data.methods[methodType];

  // Declare currentContentType without initialization here.
  let currentContentType: { body?: any; mostRecent?: any } | undefined;

  if (requestResponseType === 'request') {
    const currentReqRes = currentMethod.request;
    currentContentType = currentReqRes ? currentReqRes[contentType] : undefined;
  } else if (requestResponseType === 'response') {
    const currentReqRes = currentMethod.response;
    const currentStatusCode = currentReqRes[statusCode];
    currentContentType = currentStatusCode ? currentStatusCode[contentType] : undefined;
  } else {
    console.warn('Invalid request/response type');
    return undefined;
  }

  // Check and use currentContentType properly.
  const currentMostRecent = currentContentType && 'mostRecent' in currentContentType ? currentContentType.mostRecent : undefined;

  if (!currentMostRecent) {
    console.warn('Most Recent not found');
    return undefined;
  }

  let currentObj: any = currentMostRecent;

  for (let i = 0; i < mostRecentPath.length; i++) {
    const part = mostRecentPath[i];  // Current part of the path to access

    if (currentObj && typeof currentObj === 'object') {  // Ensure current object is valid
      if (part in currentObj) {
        // Move deeper into the object structure
        currentObj = currentObj[part];
      } else if (Array.isArray(currentObj)) {
        // Handle arrays: Search within each object in the array for the key
        let found = false;
        for (let item of currentObj) {
          if (part in item) {
            currentObj = item[part];
            found = true;
            break;  // Assume only one item in the array will have the key
          }
        }
        if (!found) {
          console.warn('Parameter path not found in any array items:', part);
          return undefined; // Part not found in any items of the array
        }
      } else {
        console.warn('Parameter path not found:', part);
        return undefined; // Part not found in current object
      }
    } else {
      console.log('Invalid object at path:', currentObj);
      return undefined; // Current object is not valid
    }
  }

  return currentObj;
}
  
export function getParameterPaths(endpoint: Endpoint): Array<string> {
  const parameterPaths: Array<string> = [];

  async function traverseSchema(schema: Schema, parentPath: string) {
    if (schema.type === 'object') {
      if (schema.properties) {
        for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
          const fullParamPath = `${parentPath}|properties|${paramName}`;
          traverseSchema(paramSchema, fullParamPath);
        }
      } else if (schema.items) {
        const fullParamPath = `${parentPath}`;
        traverseSchema(schema.items, fullParamPath);
      }
    } else if (schema.type === 'array') {
      if (schema.items) {
        const fullParamPath = `${parentPath}|items`;
        traverseSchema(schema.items, fullParamPath);
      } else {
        traverseSchema(schema, parentPath);
      }
    } else {
      parameterPaths.push(parentPath);
    }
  }

  for (const methodType of Object.keys(endpoint.data.methods)) {
    const method = endpoint.data.methods[methodType];
    if (method.request) {
      for (const [contentType, req] of Object.entries(method.request)) {
        if (req.body) {
          const paramPath = `${methodType}|request|${contentType}|body`;
          traverseSchema(req.body, paramPath);
        }
      }
    }
    if (method.response) {
      for (const [statusCode, responses] of Object.entries(method.response)) {
        for (const [contentType, res] of Object.entries(responses)) {
          if (res.body) {
            const paramPath = `${methodType}|response|${statusCode}|${contentType}|body`;
            traverseSchema(res.body, paramPath);
          }
        }
      }
    }
  }
  return parameterPaths;
}

export function truncateString(value: string, maxLength: number = 30): string {
  /** Function that uses a tokenizer to estimate useful information content, 
   * and truncates low information accordingly **/
  const characterCount = value.length;
  let truncated = value
  if (characterCount > maxLength) {
    const chatMessages: ChatMessage[] = [{ role: "user", content: value }];
    const tokens = tokenizer.encodeChat(chatMessages, "gpt-4");
    const tokenCount = tokens.length;
    const characterTokenRatio = characterCount / tokenCount;

    if (characterTokenRatio < 2) {
      truncated = value.slice(0, maxLength) + '...';
    } else {
      truncated = value;
  }}
  return truncated
}

export function truncateExample(example: unknown, path: string, maxLength: number = 30): unknown {
  const pathParts = path.split('|');
  const parameterName = pathParts.pop();

  // Check if parameterName is undefined and handle it
  if (!parameterName) {
    console.error("No parameter name provided in the path.");
    return example; // Return the example as is or handle as needed
  }

  
  function truncateValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(item => truncateValue(item));
    } else if (typeof value === 'object' && value !== null) {
      const valueObj = value as Record<string, unknown>;
      const truncatedObject: { [key: string]: unknown } = {};
      for (const key in valueObj) {
        truncatedObject[key] = truncateValue(valueObj[key]);
      }
      return truncatedObject;
    }
    return value;
  }

  function extractRelevantObject(objects: unknown[]): unknown {
    return objects.map(obj => {
      if (parameterName && obj && typeof obj === 'object' && parameterName in obj) {
        const objRecord = obj as Record<string, unknown>;
        const extracted = { [parameterName]: truncateValue(objRecord[parameterName]) };
        return extracted;
      }
      return null;
    }).find(obj => obj !== null);
  }

  const stringExample = JSON.stringify(example)

  if (stringExample == undefined) {
    return null
  }

  const characterCount: number = stringExample.length;

  if (characterCount <= maxLength) {
    return example;  // Return as is if under maxLength
  }

  if (typeof example === 'string') {
    return truncateString(example, maxLength);
  } else if (Array.isArray(example)) {
    if (example.length === 0) return '[]'; // Handle empty arrays

    let displayedExample: unknown;
    if (example[0] && typeof example[0] === 'object') {
      // Handle array of objects looking specifically for an object containing the parameter
      const relevantObject = extractRelevantObject(example);
      displayedExample = relevantObject ? relevantObject : truncateValue(example[0]);  // Use a truncated example that includes the parameter
    } else {
      // Handle array of primitives or nested arrays
      displayedExample = truncateValue(example[0]);
    }
    const moreCount = example.length - 1;
    return `[${JSON.stringify(displayedExample)}${moreCount > 0 ? `, ... (${moreCount} more items)` : ''}]`;
  }
  return truncateValue(example);  // Fallback for any other types
}

export function parseFormUrlEncoded(encodedString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const pairs = encodedString.split('&');
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  });
  return params;
}

export function capitalizeFirstLetter(string: string | null): string | null {
  if (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
  }
  return string;
}

