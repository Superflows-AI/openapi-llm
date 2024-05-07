import type { Schema } from "genson-js";
import { Endpoint } from "../../utils/types";
import tokenizer from "gpt-tokenizer";
import { ChatMessage } from "../../ui/helpers/count-tokens"; 

export type Result = { [key: string]: any };

// Helper function to convert method details into a string
export function methodDetailsToString(method: any): string {

  const queryParametersString = method.queryParameters
    ? Object.entries(method.queryParameters.params?.properties || {})
        .map(([paramName, paramSchema]) => {
          const example = method.queryParameters.mostRecent?.[paramName];
          const exampleString = example !== undefined ? JSON.stringify(example) : 'No recent example';
          const paramType = (paramSchema as { type?: string }).type || 'unknown';
          return `${paramName}: ${paramType}. ${exampleString}`;
        })
        .join('\n')
    : 'No query parameters';


  const requestString = method.request
    ? Object.entries(method.request as { [mediaType: string]: any }).map(([mediaType, req]) => {
        const parsedRequest = req.mostRecent
          ? JSON.stringify(findExamplesFromJSON(req.mostRecent))
          : 'No recent example';
        return `${mediaType}: Summarised Example Request: ${parsedRequest}`;
      }).join('\n')
    : 'No request info';

  const responseString = method.response
    ? Object.entries(method.response as { [statusCode: string]: { [mediaType: string]: any } }).map(([statusCode, responses]) => {
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

// Helper function to convert schema objects into a string representation
export function schemaToString(schema: Schema): string {
  let schemaDetails = schema.type ? `Type: ${schema.type}` : '';
  if (schema.properties) {
      const propertiesString = Object.entries(schema.properties).map(([key, val]) => {
          return `${key}: ${schemaToString(val)}`;
      }).join(', ');
      schemaDetails += schemaDetails ? `, Properties: {${propertiesString}}` : `Properties: {${propertiesString}}`;
  }
  return schemaDetails;
}


export function findExamplesFromJSON(data: any, maxLength: number = 30, result: Result = {}, visited = new Set()): Result {
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
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];
          if (Array.isArray(value)) {
            result[key] = value.length > 0 ? [findExamplesFromJSON(value[0], maxLength, {}, visited)] : [];
            result[key].push('... (' + (value.length - 1) + ' items not shown)');
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

// Function that uses a tokenizer to estimate useful information content, and truncates low information accordingly
export function truncateString(value: string, maxLength: number = 30): string {
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


export function truncateExample(example: any, path: string, maxLength: number = 30): any {
  const pathParts = path.split('|');
  const parameterName = pathParts.pop();

  // Check if parameterName is undefined and handle it
  if (!parameterName) {
    console.error("No parameter name provided in the path.");
    return example; // Return the example as is or handle as needed
  }

  // Recursive function to truncate elements or object properties
  function truncateValue(value: any): any {
    if (Array.isArray(value)) {
      return value.map(item => truncateValue(item));
    } else if (typeof value === 'object' && value !== null) {
      const truncatedObject: { [key: string]: any } = {};
      for (const key in value) {
        truncatedObject[key] = truncateValue(value[key]);
      }
      return truncatedObject;
    }
    return value; // Return as is for numbers, booleans, etc.
  }

  // Function to extract an object containing only the desired parameter if it exists
  function extractRelevantObject(objects: any[]): any {
    return objects.map(obj => {
      if (parameterName && obj && typeof obj === 'object' && parameterName in obj) {
        const extracted = { [parameterName]: truncateValue(obj[parameterName]) };
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

    let displayedExample: any;
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


export function getResponseParameterExample(endpoint: Endpoint, paramPath: string): string | undefined {
  const pathParts = paramPath.split('|');
  const method = pathParts[0];

  const methods = ['POST', 'GET', 'PUT', 'DELETE', 'PATCH']

  let reconstructedPath = '';

  for (let i = 0; i < pathParts.length; i++) {
    let pathElement = pathParts[i]
    if (!methods.includes(pathElement) && pathElement !== 'properties' && pathElement !== 'items') {
        if (pathElement === 'body') {
          pathElement = 'mostRecent'
        }
        if (reconstructedPath.length > 0) {
            reconstructedPath += '|'; 
        }
        reconstructedPath += pathElement;
    }
  }

  function getExample(obj: any, paramPath: string): any {
    const pathParts = paramPath.split('|');

    let currentObj = obj;
    for (const part of pathParts) {
      if (Array.isArray(currentObj)) {
        return currentObj;
      }
      if (currentObj.hasOwnProperty(part)) {
        currentObj = currentObj[part];
      } else {
        return undefined;
      }
    }
    return currentObj;
  }
  const example = getExample(endpoint.data.methods[method], reconstructedPath);
  return example
  }




export function getParameterExample(endpoint: Endpoint, paramPath: string): string | undefined {
  const pathParts = paramPath.split('|');

  const methods = ['POST', 'GET', 'PUT', 'DELETE', 'PATCH']
  const method = pathParts[0];

  let reconstructedPath = '';

  for (let i = 0; i < pathParts.length; i++) {
    let pathElement = pathParts[i]
    if (!methods.includes(pathElement) && pathElement !== 'properties' && pathElement !== 'items') {
      if (pathElement === 'body') {
        pathElement = 'mostRecent'
      }
      if (reconstructedPath.length > 0) {
          reconstructedPath += '|'; // Add the separator only if something is already in the string
      }
      reconstructedPath += pathElement;
    }
  }

  function getExample(obj: any, paramPath: string): any {
    const pathParts = paramPath.split('|');

    let currentObj = obj;
    for (const part of pathParts) {
      if (currentObj.hasOwnProperty(part)) {
        currentObj = currentObj[part];
      } else {
        return undefined;
      }
    }
    return currentObj;
  }

  const example = getExample(endpoint.data.methods[method], reconstructedPath);
  return example;
}

