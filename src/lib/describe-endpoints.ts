import { Endpoint } from "../utils/types";
import type { Schema } from "genson-js";
import { methodDetailsToString, schemaToString, truncateExample, capitalizeFirstLetter, getExample, getParameterPaths } from "./description-helpers/endpoint-parsers" //getQueryParameterExample 
import { endpointSystemPrompt, parameterSystemPrompt, endpointDescriptionPrompt, queryParameterDescriptionPrompt, requestParameterDescriptionPrompt, responseParameterDescriptionPrompt } from "./description-helpers/prompts";
import { callOpenAI, exponentialRetryWrapper} from "./callOpenAI";


export function getEndpointPrompt (endpoint: Endpoint): string {
  const methodsString = Object.entries(endpoint.data.methods)
  .map(([method, details]) => `${method.toUpperCase()}: ` + methodDetailsToString(details))
  .join('\n');

  return endpointDescriptionPrompt(methodsString);
}

export async function describeApiEndpoint(endpoint: Endpoint, model: string): Promise<string | null> {

  const endpointPrompt = getEndpointPrompt(endpoint);

  try {

    const endpointDescription = await exponentialRetryWrapper(callOpenAI, [endpointPrompt, endpointSystemPrompt, model], 5)

    if (endpointDescription.choices && endpointDescription.choices.length > 0 && endpointDescription.choices[0].message) {
      
      const content = endpointDescription.choices[0].message.content;
      const capContent = capitalizeFirstLetter(content);
      
      return capContent;
    } else {
      console.warn('Unexpected OpenAI response format:', endpointDescription);
      return null;
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return null;
  }
}

export function getRequestBodyParameterPrompts(endpoint: Endpoint, endpointDescription: string): Record<string, string> {
  
  const endpointId = `${endpoint.host}${endpoint.pathname}`;
  const parameterPrompts: Record<string, string> = {};

  const paramPaths = getParameterPaths(endpoint);

  paramPaths.forEach((paramPath) => {
    const splitPath = paramPath.split('|');
    const reqres = splitPath[1];

    if (reqres === 'request') {
      const example = truncateExample(getExample(endpoint, paramPath), paramPath);
      const exampleType = typeof example;

      const paramExample = JSON.stringify(example);
      const paramPrompt = requestParameterDescriptionPrompt(endpointId, endpointDescription, paramPath, exampleType, paramExample);
      parameterPrompts[paramPath] = paramPrompt;   
    }
  });
  return parameterPrompts;
}

export async function describeRequestBodyParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};

  const paramPrompts = getRequestBodyParameterPrompts(endpoint, endpointDescription);

  for (const parentPath in paramPrompts) {
    try {

      const paramDescription = await exponentialRetryWrapper(callOpenAI, [paramPrompts[parentPath], parameterSystemPrompt, model], 5)

      if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
        const content = paramDescription.choices[0].message.content;
        const capContent = capitalizeFirstLetter(content);
        parameterDescriptions[parentPath] = capContent;
        } else {
          console.warn(`Unexpected OpenAI response format for parameter '${parentPath}':`, paramDescription);
          parameterDescriptions[parentPath] = null;
        }

        } catch (error) {
          console.error(`Error describing parameter '${parentPath}':`, error);
          parameterDescriptions[parentPath] = null;
        }
      }
  return parameterDescriptions;
}

export function getResponseBodyParameterPrompts(endpoint: Endpoint, endpointDescription: string): Record<string, string> {
  
  const endpointId = `${endpoint.host}${endpoint.pathname}`;
  const parameterPrompts: Record<string, string> = {};

  const paramPaths = getParameterPaths(endpoint);

  paramPaths.forEach((paramPath) => {
    const splitPath = paramPath.split('|');
    const reqres = splitPath[1];

    if (reqres === 'response') {
      const example = truncateExample(getExample(endpoint, paramPath), paramPath);
      const exampleType = typeof example;

      const paramExample = JSON.stringify(example);
      const paramPrompt = responseParameterDescriptionPrompt(endpointId, endpointDescription, paramPath, exampleType, paramExample);
      parameterPrompts[paramPath] = paramPrompt;   
    }
  });
  return parameterPrompts;
}

export async function describeResponseBodyParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};

  const paramPrompts = getResponseBodyParameterPrompts(endpoint, endpointDescription);

  for (const parentPath in paramPrompts) {

    try {
      const paramPrompt = paramPrompts[parentPath];
      const paramDescription = await exponentialRetryWrapper(callOpenAI, [paramPrompt, parameterSystemPrompt, model], 5);

      if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
        const content = paramDescription.choices[0].message.content;
        const capContent = capitalizeFirstLetter(content);
        parameterDescriptions[parentPath] = capContent;
      } else {
        console.warn(`Unexpected OpenAI response format for parameter '${parentPath}':`, paramDescription);
        parameterDescriptions[parentPath] = null;
      }

      } catch (error) {
        console.error(`Error describing parameter '${parentPath}':`, error);
        parameterDescriptions[parentPath] = null;
      }
    }
  return parameterDescriptions;
}

export function getQueryParameterPrompts(endpoint: Endpoint, endpointDescription: string) : Record<string, string> {
  const parameterPrompts: Record<string, string> = {};
  const parametersToDescribe: Array<{ path: string; schema: Schema }> = [];
  const endpointId = `${endpoint.host}${endpoint.pathname}`;

  for (const methodType of Object.keys(endpoint.data.methods)) {
    const method = endpoint.data.methods[methodType];
    if (method.queryParameters) {
      const examples = method.queryParameters.mostRecent as Record<string, Schema>;
      const params = method.queryParameters.parameters;

      // Check if params exists and has properties
      if (params && params.properties) {
        // Iterate through each parameter in params.properties
        for (const paramName of Object.keys(params.properties)) {
          const param = params.properties[paramName];
          const paramPath = `${methodType}|queryParameters|parameters|properties|${paramName}`;

          // Check if an example exists for the current parameter
          const example = examples[paramName];

          // Store the parameter information
          parametersToDescribe.push({
            path: paramPath,
            schema: param,
          });

          const promptExample = JSON.stringify(truncateExample(example, paramPath));
            
          const paramPrompt = queryParameterDescriptionPrompt(endpointId, endpointDescription, paramPath, schemaToString(param), promptExample);
          parameterPrompts[paramPath] = paramPrompt;
        }
      }
    }
  }
  return parameterPrompts;
}


export async function describeQueryParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};

  const paramPrompts = getQueryParameterPrompts(endpoint, endpointDescription);

  for (const paramPath in paramPrompts) {
    const paramPrompt = paramPrompts[paramPath];

    try {
      const paramDescription = await exponentialRetryWrapper(callOpenAI, [paramPrompt, parameterSystemPrompt, model], 5);
      if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
        const content = paramDescription.choices[0].message.content;
        const capContent = capitalizeFirstLetter(content);
        parameterDescriptions[paramPath] = capContent;
      } else {
        console.warn(`Unexpected OpenAI response format for parameter '${paramPath}':`, paramDescription);
        parameterDescriptions[paramPath] = null;
      }
    } catch (error) {
      console.error(`Error describing parameter '${paramPath}':`, error);
      parameterDescriptions[paramPath] = null;
    }
  }
  return parameterDescriptions;
  }
