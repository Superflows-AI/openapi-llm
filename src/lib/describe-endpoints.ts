import { Endpoint } from "../utils/types";
import type { Schema } from "genson-js";
import { methodDetailsToString, schemaToString, truncateExample, capitalizeFirstLetter, getParameterExample, getResponseParameterExample } from "./description-helpers/endpoint-parsers" //getQueryParameterExample 
import { endpointSystemPrompt, parameterSystemPrompt, endpointDescriptionPrompt, parameterDescriptionPrompt } from "./description-helpers/prompts";
import { callOpenAI, exponentialRetryWrapper} from "./callOpenAI";


export function getEndpointPrompt (endpoint: Endpoint): string {
  const methodsString = Object.entries(endpoint.data.methods)
  .map(([method, details]) => `${method.toUpperCase()}: ` + methodDetailsToString(details))
  .join('\n');

  return endpointDescriptionPrompt(methodsString);;
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
  
  const mostRecentExamples: Record<string, Schema | null> = {};
  const endpointId = `${endpoint.host}${endpoint.pathname}`;
  const parameterPrompts: Record<string, string> = {};

  async function traverseSchema(schema: Schema, parentPath: string) {
    if (schema.type === 'object') {
      if (schema.properties) {
        for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
          const fullParamPath = `${parentPath}|properties|${paramName}`;
          try {
            const example = truncateExample(getParameterExample(endpoint, fullParamPath), parentPath);
            if (example !== undefined) {
              mostRecentExamples[fullParamPath] = example !== null ? example : null;
            }
          } catch {
            console.warn(`Did not find example at ${fullParamPath}`);
          }
          traverseSchema(paramSchema, fullParamPath);
        }
      }
    } else if (schema.anyOf) {
      const combinedSchemas = schema.anyOf;
      for (const [index, subSchema] of combinedSchemas.entries()) {
        const fullParamPath = `${parentPath}[${index}]`;
        traverseSchema(subSchema, fullParamPath);
      }
    } else {
        let example = truncateExample(getParameterExample(endpoint, parentPath), parentPath);
        if (typeof example !== 'string'){
          example = JSON.stringify(example);
        }
        
        const schemaPrompt = schemaToString(schema);
        const paramExample = JSON.stringify(example);
        const paramPrompt = parameterDescriptionPrompt(endpointId, endpointDescription, parentPath, schemaPrompt, paramExample);
        parameterPrompts[parentPath] = paramPrompt;   
    }
  }


  for (const methodType of Object.keys(endpoint.data.methods)) {
    const method = endpoint.data.methods[methodType];
    if (method.request) {
      for (const [contentType, req] of Object.entries(method.request)) {
        if (req.body) {
          traverseSchema(req.body, `${methodType}|request|${contentType}|body`);
        }
      }
    }
  }
  return parameterPrompts;
}

export async function describeRequestBodySchemaParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};
  
  // const endpointId = `${endpoint.host}${endpoint.pathname}`;

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

export function getResponseBodyPrompts(endpoint: Endpoint, endpointDescription: string) : Record<string, string> {
  const endpointId = `${endpoint.host}${endpoint.pathname}`;
  const parameterPrompts: Record<string, string> = {};
  console.log('ENDPOINT:', endpoint);

  // TRAVERSE SCHEMA IS RETURNING TO EARLY WHEN IT FINDS AN ARRAY

  async function traverseSchema(schema: Schema, parentPath: string) {
    if (schema.type === 'object') {
      if (schema.properties) {
        for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
          // If the currentschema has properties, go through the properties and recall traverseSchema

          const fullParamPath = `${parentPath}|properties|${paramName}`;
          traverseSchema(paramSchema, fullParamPath);
        } 
      } else if (schema.items) {
          const fullParamPath = `${parentPath}`;
          traverseSchema(schema.items, fullParamPath);
      }
    } else if (schema.type === 'array') {
        // If the current schema is type array, unless the schema has items, get the example 
        // If the schema has items, recall traverseSchema
        if (schema.items) {
          const fullParamPath = `${parentPath}|items`;
          traverseSchema(schema.items, fullParamPath);
        } else {
          traverseSchema(schema, parentPath);
        }
        // TODO: I don't think this does anything
        // let example = truncateExample(getResponseParameterExample(endpoint, parentPath), parentPath);

        // if (typeof example !== 'string'){
        //   example = JSON.stringify(example);
        // }
        
      }
    else {
      // If the schema is not an object or array, get the example

      // TODO: This seems to fail if the example is an array of objects
      // Probably isn't included in the path?
      console.log('Endpoint:', endpoint);
      console.log('Response parentPath', parentPath);
      let example = truncateExample(getResponseParameterExample(endpoint, parentPath), parentPath);
      if (typeof example !== 'string'){
        example = JSON.stringify(example);
      }

      const promptExample = JSON.stringify(example);
      const paramPrompt = parameterDescriptionPrompt(endpointId, endpointDescription, parentPath, schemaToString(schema), promptExample)
      parameterPrompts[parentPath] = paramPrompt;
    }
  }

  // THE PATHS HERE COULD BE INCORRECT

  for (const methodType of Object.keys(endpoint.data.methods)) {
    const method = endpoint.data.methods[methodType];
    if (method.response) {
      for (const [statusCode, responses] of Object.entries(method.response)) {
        for (const [contentType, res] of Object.entries(responses)) {
          if (res.body) {
            traverseSchema(res.body, `${methodType}|response|${statusCode}|${contentType}|body`);
          }
        }
      }
    }
  }
  return parameterPrompts;
}


export async function describeResponseBodySchemaParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};

  const paramPrompts = getResponseBodyPrompts(endpoint, endpointDescription);

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
            
          const paramPrompt = parameterDescriptionPrompt(endpointId, endpointDescription, paramPath, schemaToString(param), promptExample);
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
