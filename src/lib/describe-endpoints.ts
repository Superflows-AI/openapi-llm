import { Endpoint } from "../utils/types";
import { methodDetailsToString, schemaToString, truncateExample, capitalizeFirstLetter, getParameterExample, getResponseParameterExample, getQueryParameterExample } from "./description-helpers/endpoint-parsers" //
import { endpointSystemPrompt, parameterSystemPrompt, endpointDescriptionPrompt, parameterDescriptionPrompt } from "./description-helpers/prompts";
import callOpenAI from "./callOpenAI";


export async function describeApiEndpoint(endpoint: Endpoint, model: string): Promise<string | null> {
  console.log('ENDPOINT:', endpoint);
  const methodsString = Object.entries(endpoint.data.methods)
    .map(([method, details]) => `${method.toUpperCase()}: ` + methodDetailsToString(details))
    .join('\n');

  let endpointPrompt = endpointDescriptionPrompt(methodsString);

  try {
    const endpointDescription = await callOpenAI(endpointPrompt, endpointSystemPrompt, model);
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

export async function describeRequestBodySchemaParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};
  const mostRecentExamples: Record<string, any> = {};

  async function traverseSchema(schema: any, parentPath: string) {
    if (schema.type === 'object') {
      if (schema.properties) {
        for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
          const fullParamPath = `${parentPath}|properties|${paramName}`;
          const example = truncateExample(getParameterExample(endpoint, fullParamPath), parentPath);
          if (example !== undefined) {
            mostRecentExamples[fullParamPath] = example;
          }
          traverseSchema(paramSchema, fullParamPath);
        }
      } else if (schema.additionalProperties) {
        const fullParamPath = `${parentPath}|additionalProperties`;
        traverseSchema(schema.additionalProperties, fullParamPath);
      }
    } else if (schema.oneOf || schema.anyOf) {
      const combinedSchemas = schema.oneOf || schema.anyOf;
      for (const [index, subSchema] of combinedSchemas.entries()) {
        const fullParamPath = `${parentPath}[${index}]`;
        traverseSchema(subSchema, fullParamPath);
      }
    }
    
    else {

      try {
        let example = truncateExample(getParameterExample(endpoint, parentPath), parentPath);
        if (typeof example !== 'string'){
          example = JSON.stringify(example);
        }
        
        const schemaPrompt = schemaToString(schema);
        const paramPrompt = parameterDescriptionPrompt(endpointDescription, parentPath, schemaPrompt, example);
        const paramDescription = await callOpenAI(paramPrompt, parameterSystemPrompt, model);
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
  return parameterDescriptions;
}


export async function describeResponseBodySchemaParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};

  async function traverseSchema(schema: any, parentPath: string) {
    if (schema.type === 'object') {
      if (schema.properties) {
        for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
          const fullParamPath = `${parentPath}|properties|${paramName}`;
          traverseSchema(paramSchema, fullParamPath);
        }
      } else if (schema.additionalProperties) {
        const fullParamPath = `${parentPath}|additionalProperties`;
        traverseSchema(schema.additionalProperties, fullParamPath);
      }
    } else if (schema.type === 'array') {
        let example = truncateExample(getParameterExample(endpoint, parentPath), parentPath);
        if (typeof example !== 'string'){
          example = JSON.stringify(example);
        }
        if (example !== undefined) {
          parameterDescriptions[parentPath] = null;
        }
        if (schema.items) {
          const fullParamPath = `${parentPath}|items`;
          traverseSchema(schema.items, fullParamPath);
        }
      }
    
    else {

      try {

        let example = truncateExample(getResponseParameterExample(endpoint, parentPath), parentPath);
        if (typeof example !== 'string'){
          example = JSON.stringify(example);
        }
        const paramPrompt = parameterDescriptionPrompt(endpointDescription, parentPath, schemaToString(schema), example)
        console.log('RESPONSE BODY PROMPT:', parameterSystemPrompt, paramPrompt, model[0])
        const paramDescription = await callOpenAI(paramPrompt, parameterSystemPrompt, model); 

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
  }

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

  return parameterDescriptions;
}

export async function describeQueryParameters(endpoint: Endpoint, endpointDescription: string, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};
  const parametersToDescribe: Array<{ path: string; schema: any }> = [];
  const mostRecentExamples: Record<string, any> = {};

  function traverseParameters(parameters: any, parentPath: string) {
    if (parameters.type === 'object') {
      if (parameters.properties) {
        for (const [paramName, paramSchema] of Object.entries(parameters.properties)) {
          const fullParamPath = `${parentPath}|properties|${paramName}`;
          const example = getParameterExample(endpoint, fullParamPath);
          if (example !== undefined) {
            mostRecentExamples[fullParamPath] = example;
          }
          traverseSchema(paramSchema, fullParamPath);
        }
      } else if (parameters.additionalProperties) {
        const fullParamPath = `${parentPath}|additionalProperties`;
        traverseSchema(parameters.additionalProperties, fullParamPath);
      }
    } else if (parameters.type === 'array' && parameters.items) {
      const fullParamPath = `${parentPath}|items`;
      traverseSchema(parameters.items, fullParamPath);
    } else if (parameters.oneOf || parameters.anyOf) {
      const combinedSchemas = parameters.oneOf || parameters.anyOf;
      for (const [index, subSchema] of combinedSchemas.entries()) {
        const fullParamPath = `${parentPath}[${index}]`;
        traverseSchema(subSchema, fullParamPath);
      }
    } else {
      parametersToDescribe.push({ path: parentPath, schema: parameters });
    }
  }

  function traverseSchema(schema: any, parentPath: string) {
    if (schema.type === 'object') {
      if (schema.properties) {
        for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
          const fullParamPath = `${parentPath}|properties|${paramName}`;
          traverseSchema(paramSchema, fullParamPath);
        }
      } else if (schema.additionalProperties) {
        const fullParamPath = `${parentPath}|additionalProperties`;
        traverseSchema(schema.additionalProperties, fullParamPath);
      }
    } else if (schema.type === 'array' && schema.items) {
      const fullParamPath = `${parentPath}|items`;
      traverseSchema(schema.items, fullParamPath);
    } else if (schema.oneOf || schema.anyOf) {
      const combinedSchemas = schema.oneOf || schema.anyOf;
      for (const [index, subSchema] of combinedSchemas.entries()) {
        const fullParamPath = `${parentPath}[${index}]`;
        traverseSchema(subSchema, fullParamPath);
      }
    } else {
      parametersToDescribe.push({ path: parentPath, schema });
    }
  }

  const parameterExamplesStore: Record<string, string | null> = {};

  // Go through the different method types and get the parameters to describe
  for (const methodType of Object.keys(endpoint.data.methods)) {

    const method = endpoint.data.methods[methodType];

    if (method.queryParameters) {
      traverseParameters(method.queryParameters, `${methodType}|queryParameters`);

      if (parametersToDescribe.length !== 0) {
          const paramExamples = getQueryParameterExample(parametersToDescribe, endpoint, methodType)
          if (paramExamples === null) {
            Object.assign(parameterExamplesStore, paramExamples)
          }
        }
      }  
    }



  for (const { path, schema } of parametersToDescribe) {
    try {
      let example = truncateExample(parameterExamplesStore[path], path);
        if (typeof example !== 'string'){
          example = JSON.stringify(example);
        }
      const paramPrompt = parameterDescriptionPrompt(endpointDescription, path, schemaToString(schema), example);
      console.log('CURRENT PARAMETER PATH', path);
      console.log('QUERY PARAMETER PROMPT', paramPrompt);
      // await callOpenAI(paramPrompt, model);
      const paramDescription = await callOpenAI(paramPrompt, parameterSystemPrompt, model);
      if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
        const content = paramDescription.choices[0].message.content;
        const capContent = capitalizeFirstLetter(content);
        parameterDescriptions[path] = capContent;
      } else {
        console.warn(`Unexpected OpenAI response format for parameter '${path}':`, paramDescription);
        parameterDescriptions[path] = null;
      }

    } catch (error) {
      console.error(`Error describing parameter '${path}':`, error);
      parameterDescriptions[path] = null;
    }
  }

  return parameterDescriptions;
}
