import {Endpoint, MethodInstance, type Req, type Res} from "../../utils/types.ts";
import {findExamplesFromJSON} from "./endpoint-parsers.ts";

export function getEndpointPrompt (endpoint: Endpoint): string {
    /** Gets endpoint description system prompt **/

  const methodsString = Object.entries(endpoint.data.methods)
  .map(([method, details]) => `${method.toUpperCase()}: ${endpoint.host}${endpoint.pathname}\n${methodDetailsToString(details)}`)
  .join('\n');

  return `You are an expert programmer. Your task is to write an OpenAPI description for the API_ENDPOINT in 1 sentence and a maximum of 20 words. Follow the RULES.

RULES:
1. Focus on useful information for a programmer.
2. BE CONCISE
3. DO NOT repeat the API method, parameter names, parameter types or the website the API is hosted on

EXAMPLES:
"""
- Update a deal by id
- Retrieves page revisions and information about the page
- Search contacts by name or filter by attributes
"""

API_ENDPOINT:
"""
${methodsString}
"""`
}


function methodDetailsToString(method: MethodInstance): string {
  /** Helper function to convert method details into a string **/

  const queryParametersString = method.queryParameters
    ? "Query Parameters (in TS format):\n{\n" + Object.entries(method.queryParameters.parameters?.properties || {})
        .map(([paramName, paramSchema]) => {
          const example = (method.queryParameters?.mostRecent as Record<string, string>)?.[paramName];
          const exampleString = example ? " // Example: " + decodeURIComponent(example) : '';
          const paramType = (paramSchema as { type?: string }).type || 'unknown';
          return `${paramName}: ${paramType}${exampleString.slice(0, 100)}${exampleString.length > 100 ? "..." : ""}`;
        })
        .join('\n') + "\n}"
    : 'No query parameters';


  const requestString = method.request
    ? Object.values(method.request as { [mediaType: string]: Req }).map((req) => {
        const parsedRequest = req.mostRecent
          ? JSON.stringify(findExamplesFromJSON(req.mostRecent))
          : 'No recent example';
        return `\nExample request body:\n${parsedRequest}`;
      }).join('\n')
    : 'No request body';

  const responseString = method.response
    ? Object.entries(method.response as { [statusCode: string]: { [mediaType: string]: Res } }).map(([statusCode, responses]) => {
        return Object.values(responses).map((res) => {
          const mostRecent = res.mostRecent
            ? JSON.stringify(findExamplesFromJSON(res.mostRecent))
            : 'No recent sample';
          return `Example response (status: ${statusCode}):\n${mostRecent}`;
        }).join('\n');
      }).join('\n')
    : 'No response';

  return `\n${queryParametersString}\n${requestString}\n\n${responseString}`;
}
