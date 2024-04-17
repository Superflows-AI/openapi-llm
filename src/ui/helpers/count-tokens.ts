import { Endpoint} from "../../utils/types";
import type { Schema } from "genson-js";
import tokenizer from "gpt-tokenizer";

export interface ChatMessage {
  role?: 'system' | 'user' | 'assistant'
  name?: string
  content: string
}

export default function countTokens(endpoint: Endpoint): number {

  const message = endpointToString(endpoint)

  let gptMessage: ChatMessage[];

  if (typeof message === "string") {
    gptMessage = [{ role: "user", content: message }];
  } else {
    gptMessage = message as ChatMessage[];
  }

  // Per the docs, the tokenizer should be the same for 3.5-turbo and 4.
  const encoded = tokenizer.encodeChat(gptMessage, "gpt-4");

  // console.log('In get token count, token count:', encoded.length)
  return encoded.length;
}

// Function to convert the endpoint object into a string representation
export function endpointToString(endpoint: Endpoint): string {
    const partsString = endpoint.parts.map(part => `${part.part} (type: ${part.type})`).join(', ');
    const methodsString = Object.entries(endpoint.data.methods).map(([method, details]) => {
        return `${method.toUpperCase()}: ` + methodDetailsToString(details);
    }).join('\n');

    return `Pathname: ${endpoint.pathname}\nParts: [${partsString}]\nMethods:\n${methodsString}`;
}

// Helper function to convert method details into a string
export function methodDetailsToString(method: any): string {
    const requestString = method.request ? Object.entries(method.request as { [mediaType: string]: any }).map(([mediaType, req]) => {
        const bodyString = req.body ? schemaToString(req.body) : 'No body';
        const mostRecent = req.mostRecent ? JSON.stringify(req.mostRecent) : 'No recent sample';
        return `${mediaType}: Body: ${bodyString}, Most Recent: ${mostRecent}`;
    }).join('\n') : 'No request info';

    const responseString = method.response ? Object.entries(method.response as { [statusCode: string]: { [mediaType: string]: any } }).map(([statusCode, responses]) => {
        return `${statusCode}: ` + Object.entries(responses).map(([mediaType, res]) => {
            const bodyString = res.body ? schemaToString(res.body) : 'No body';
            const mostRecent = res.mostRecent ? JSON.stringify(res.mostRecent) : 'No recent sample';
            return `${mediaType}: Body: ${bodyString}, Most Recent: ${mostRecent}`;
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

