import type { Schema } from "genson-js";
import { Endpoint } from "../../utils/types";
import tokenizer from "gpt-tokenizer";
import { ChatMessage } from "./count-tokens"; 

type Result = { [key: string]: any };

// Helper function to convert method details into a string
export function methodDetailsToString(method: any): string {

  const requestString = method.request ? Object.entries(method.request as { [mediaType: string]: any }).map(([mediaType, req]) => {
      const parsedRequest = JSON.stringify(findExamplesFromJSON(req.mostRecent))
      return `${mediaType}: Summarised Example Request: ${parsedRequest}`;
  }).join('\n') : 'No request info';

  const responseString = method.response ? Object.entries(method.response as { [statusCode: string]: { [mediaType: string]: any } }).map(([statusCode, responses]) => {
    return `${statusCode}: ` + Object.entries(responses).map(([mediaType, res]) => {
      const mostRecent = res.mostRecent ? JSON.stringify(findExamplesFromJSON(res.mostRecent)) : 'No recent sample';
      return `${mediaType}: Summarised Example Response: ${mostRecent}`;
    }).join('\n');
  }).join('\n') : 'No response info';

  return `Request:\n${requestString}\nResponse:\n${responseString}`;
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

// Function to convert the endpoint object into a string representation
export function endpointToString(endpoint: Endpoint): string {
  const partsString = endpoint.parts.map(part => `${part.part} (type: ${part.type})`).join(', ');
  const methodsString = Object.entries(endpoint.data.methods).map(([method, details]) => {
      return `${method.toUpperCase()}: ` + methodDetailsToString(details);
  }).join('\n');

  return `Pathname: ${endpoint.pathname}\nParts: [${partsString}]\nMethods:\n${methodsString}`;
}

export function findExamplesFromJSON(data: any, maxLength: number = 30, result: Result = {}, visited = new Set()): Result {
  if (data !== null && typeof data === 'object') {
    if (visited.has(data)) {
      return result;
    }
    visited.add(data);

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];

        if (Array.isArray(value)) {
          result[key] = value.length > 0 ? [findExamplesFromJSON(value[0], maxLength, {}, visited)] : [];
          result[key].push('... (' + (value.length - 1) + ' items not shown)');
        } else if (typeof value === 'object' && value !== null) {
          result[key] = findExamplesFromJSON(value, maxLength, {}, visited);
        } else if (typeof value === 'string') {
          const characterCount = value.length;

          if (characterCount > maxLength) {
            const chatMessages: ChatMessage[] = [{ role: "user", content: value }];
            const tokens = tokenizer.encodeChat(chatMessages, "gpt-4");
            const tokenCount = tokens.length;
            const characterTokenRatio = characterCount / tokenCount;

            if (characterTokenRatio < 2) {
              const truncated = value.slice(0, maxLength) + '...';
              result[key] = truncated;
            } else {
              result[key] = value;
          }}
        } else {
          result[key] = value;
        }
      }
    }
  }

  return result;
}
