import { Endpoint, MethodInstance } from "../utils/types";
import type { Schema } from "genson-js";
import { methodDetailsToString, schemaToString, truncateExample, capitalizeFirstLetter, getExample, getParameterPaths } from "./description-helpers/endpoint-parsers" //getQueryParameterExample 
import { queryParameterDescriptionPrompt, requestParameterDescriptionPrompt, responseParameterDescriptionPrompt } from "./description-helpers/description-prompts";
import { getEndpointPrompt } from "./description-helpers/endpoint-prompt";
import { callOpenAI, exponentialRetryWrapper} from "./callOpenAI";


function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export function getEndpointMethodPrompt (endpointMethod: MethodInstance, method: string, endpointId: string): string {

  const methodsString = `${method.toUpperCase()}: ${endpointId}\n${methodDetailsToString(endpointMethod, method, endpointId)}`

  const prompt = getEndpointPrompt(methodsString);
  return prompt;
}

export async function describeApiEndpoint(endpoint: Endpoint, method: string, model: string): Promise<string | null> {
  
  const endpointMethod = endpoint.data.methods[method];
  const endpointId = `${endpoint.host}${endpoint.pathname}`;
  const endpointPrompt = getEndpointMethodPrompt(endpointMethod, method, endpointId);

  try {
    const endpointDescription = await exponentialRetryWrapper(callOpenAI, [endpointPrompt, model], 5)
    if (endpointDescription.choices && endpointDescription.choices.length > 0 && endpointDescription.choices[0].message) {
      const content = endpointDescription.choices[0].message.content;
      return capitalizeFirstLetter(content);
    } else {
      console.warn('Unexpected OpenAI response format:', endpointDescription);
      return null;
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return null;
  }
}

export function getRequestBodyParameterPrompts(endpoint: Endpoint, method: string, endpointDescription: string): Record<string, string> {
  
  const endpointId = `${endpoint.host}${endpoint.pathname}/${method}`;
  
  const parameterPrompts: Record<string, string> = {};

  const paramPaths = getParameterPaths(endpoint.data.methods[method], method);

  paramPaths.forEach((paramPath) => {
    const splitPath = paramPath.split('|');
    const reqres = splitPath[1];

    if (reqres === 'request') {
      const example = truncateExample(getExample(endpoint, paramPath), paramPath);
      const exampleType = typeof example;

      const paramExample = JSON.stringify(example);
      parameterPrompts[paramPath] = requestParameterDescriptionPrompt(endpointId, endpointDescription, paramPath, exampleType, paramExample);
    }
  });
  return parameterPrompts;
}

export async function describeRequestBodyParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {}; 
  const descriptionPromises = [];
  const baseDelay = 50; // base delay in milliseconds

  for (const method in endpoint.data.methods) {
    const paramPrompts = getRequestBodyParameterPrompts(endpoint, method, endpointDescription);

    for (const parentPath in paramPrompts) {
      // Add a delay for each API call, incrementing the delay for each new request
      const descriptionPromise = delay(baseDelay)
        .then(() => exponentialRetryWrapper(callOpenAI, [paramPrompts[parentPath], model], 5))
        .then(paramDescription => {
          if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
            const content = paramDescription.choices[0].message.content;
            parameterDescriptions[parentPath] = capitalizeFirstLetter(content);
          } else {
            console.warn(`Unexpected OpenAI response format for parameter '${parentPath}':`, paramDescription);
            parameterDescriptions[parentPath] = null;
          }
        })
        .catch(error => {
          console.error(`Error describing parameter '${parentPath}':`, error);
          parameterDescriptions[parentPath] = null;
        });

      descriptionPromises.push(descriptionPromise);
    }
  }

  // Wait for all promises to resolve
  await Promise.all(descriptionPromises);

  return parameterDescriptions;
}


export function getResponseBodyParameterPrompts(endpoint: Endpoint, method: string, endpointDescription: string): Record<string, string> {
  
  const endpointId = `${endpoint.host}${endpoint.pathname}/${method}`;
  const parameterPrompts: Record<string, string> = {};

  const paramPaths = getParameterPaths(endpoint.data.methods[method], method);

  paramPaths.forEach((paramPath) => {
    const splitPath = paramPath.split('|');
    const reqres = splitPath[1];

    if (reqres === 'response') {
      const example = truncateExample(getExample(endpoint, paramPath), paramPath);
      const exampleType = typeof example;

      const paramExample = JSON.stringify(example);
      parameterPrompts[paramPath] = responseParameterDescriptionPrompt(endpointId, endpointDescription, paramPath, exampleType, paramExample);
    }
  });
  return parameterPrompts;
}


export async function describeResponseBodyParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};
  const descriptionPromises = []; // Starting with no delay for the first request
  const baseDelay = 50;   // Delay increment for each subsequent request

  for (const method in endpoint.data.methods) {
    const paramPrompts = getResponseBodyParameterPrompts(endpoint, method, endpointDescription);

    for (const parentPath in paramPrompts) {
      // Add a delay for each API call, incrementing the delay for each new request
      const descriptionPromise = delay(baseDelay)
        .then(() => exponentialRetryWrapper(callOpenAI, [paramPrompts[parentPath], model], 5))
        .then(paramDescription => {
          if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
            const content = paramDescription.choices[0].message.content;
            parameterDescriptions[parentPath] = capitalizeFirstLetter(content);
          } else {
            console.warn(`Unexpected OpenAI response format for parameter '${parentPath}':`, paramDescription);
            parameterDescriptions[parentPath] = null;
          }
        })
        .catch(error => {
          console.error(`Error describing parameter '${parentPath}':`, error);
          parameterDescriptions[parentPath] = null;
        });

      descriptionPromises.push(descriptionPromise);
    }
  }

  // Wait for all the promises to resolve
  await Promise.all(descriptionPromises);

  return parameterDescriptions;
}

export function getQueryParameterPrompts(endpoint: Endpoint, method: string, endpointDescription: string) : Record<string, string> {
  const parameterPrompts: Record<string, string> = {};
  const parametersToDescribe: Array<{ path: string; schema: Schema }> = [];
  const endpointId = `${endpoint.host}${endpoint.pathname}/${method}`;

  const endpointMethod = endpoint.data.methods[method];
  if (endpointMethod.queryParameters) {

    const examples = endpointMethod.queryParameters.mostRecent as Record<string, Schema>;
    const params = endpointMethod.queryParameters.parameters;

    // Check if params exists and has properties
    if (params && params.properties) {
      // Iterate through each parameter in params.properties
      for (const paramName of Object.keys(params.properties)) {
        const param = params.properties[paramName];
        const paramPath = `${method}|queryParameters|parameters|properties|${paramName}`;

        // Check if an example exists for the current parameter
        const example = examples[paramName];

        // Store the parameter information
        parametersToDescribe.push({
          path: paramPath,
          schema: param,
        });

        const promptExample = JSON.stringify(truncateExample(example, paramPath));

        parameterPrompts[paramPath] = queryParameterDescriptionPrompt(endpointId, endpointDescription, paramPath, schemaToString(param), promptExample);
      }
    }
  }
  return parameterPrompts;
}

export async function describeQueryParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};
  const descriptionPromises = [];
  const baseDelay = 50; // base delay in milliseconds

  for (const method in endpoint.data.methods) {
    const paramPrompts = getQueryParameterPrompts(endpoint, method, endpointDescription);

    for (const paramPath in paramPrompts) {
      const paramPrompt = paramPrompts[paramPath];

      // Prepare a promise with a delay
      const descriptionPromise = delay(baseDelay)
        .then(() => exponentialRetryWrapper(callOpenAI, [paramPrompt, model], 5))
        .then(paramDescription => {
          if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
            const content = paramDescription.choices[0].message.content;
            parameterDescriptions[paramPath] = capitalizeFirstLetter(content);
          } else {
            console.warn(`Unexpected OpenAI response format for parameter '${paramPath}':`, paramDescription);
            parameterDescriptions[paramPath] = null;
          }
        })
        .catch(error => {
          console.error(`Error describing parameter '${paramPath}':`, error);
          parameterDescriptions[paramPath] = null;
        });

      descriptionPromises.push(descriptionPromise); // Increment delay for the next promise
    }
  }

  // Wait for all the promises to resolve
  await Promise.all(descriptionPromises);

  return parameterDescriptions;
}


