import { Endpoint } from "../utils/types"; //, Leaf, PartType }
import { methodDetailsToString, schemaToString } from "../ui/helpers/endpoint-parsers" //
import { ChatMessage } from "../ui/helpers/count-tokens";
import tokenizer from "gpt-tokenizer";
import callOpenAI from "./callOpenAI";

export async function describeApiEndpoint(endpoint: Endpoint, model: string): Promise<string | null> {
  const methodsString = Object.entries(endpoint.data.methods)
    .map(([method, details]) => `${method.toUpperCase()}: ` + methodDetailsToString(details))
    .join('\n');

  let endpointPrompt = `Concisely describe the functionality of this API endpoint in 1 sentence. Aim for at most 20 words. Give an overview information you need to use the endpoint. Here is an example request and response: ${methodsString}.`;
  console.log('Endpoint Prompt', endpointPrompt[0], model);
 
  try {
    const endpointDescription = await callOpenAI(endpointPrompt, model);
    if (endpointDescription.choices && endpointDescription.choices.length > 0 && endpointDescription.choices[0].message) {
      return endpointDescription.choices[0].message.content;
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
  console.log(endpointDescription[0], model)

  async function traverseSchema(schema: any, parentPath: string) {
    if (schema.type === 'object') {
      if (schema.properties) {
        for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
          const fullParamPath = `${parentPath}|properties|${paramName}`;
          const example = getParameterExample(endpoint, fullParamPath);
          if (example !== undefined) {
            mostRecentExamples[fullParamPath] = example;
          }
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

      try {
        const example = mostRecentExamples[parentPath];

        const paramPrompt = `You are explaining how a request body parameter inside an API endpoint with is used. The endpoint has description: ${endpointDescription}.
        The parameter has path '${parentPath}' and type '${schemaToString(schema)}'. Here is an example usage: ${example}. Give a short, concise description of the parameter in 1 sentence under 20 words.
        `

        const paramDescription = await callOpenAI(paramPrompt, model);
        if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
          parameterDescriptions[parentPath] = paramDescription.choices[0].message.content;
          console.log(`Description of '${parentPath}':`, parameterDescriptions[parentPath])
        } else {
          console.warn(`Unexpected OpenAI response format for parameter '${parentPath}':`, paramDescription);
          parameterDescriptions[parentPath] = null;
        }

        //parameterDescriptions[parentPath] = 'TEST RESPONSE PARAM'
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
  const mostRecentExamples: Record<string, any> = {};
  console.log(endpointDescription)

  async function traverseSchema(schema: any, parentPath: string) {
    if (schema.type === 'object') {
      if (schema.properties) {
        for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
          const fullParamPath = `${parentPath}|properties|${paramName}`;
          const example = getParameterExample(endpoint, fullParamPath);
          if (example !== undefined) {
            mostRecentExamples[fullParamPath] = example;
          }
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

      try {
        const example = mostRecentExamples[parentPath];

        const paramPrompt = `You are explaining how a response body parameter inside an API endpoint with is used. The endpoint has description: ${endpointDescription}.
        The parameter has path '${parentPath}' and type '${schemaToString(schema)}'. Here is an example usage: ${example}. Give a short, concise description of the parameter in 1 sentence under 20 words.
        `

        const paramDescription = await callOpenAI(paramPrompt, model);
        if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
          parameterDescriptions[parentPath] = paramDescription.choices[0].message.content;
          console.log(`Description of '${parentPath}':`, parameterDescriptions[parentPath])
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
            const example = getParameterExample(endpoint, fullParamPath);
            if (example !== undefined) {
              mostRecentExamples[fullParamPath] = example;
            }
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
  
    for (const methodType of Object.keys(endpoint.data.methods)) {
      const method = endpoint.data.methods[methodType];
      if (method.queryParameters) {
        traverseParameters(method.queryParameters, `${methodType}|queryParameters`);
      }
    }
    console.log(parametersToDescribe);
    for (const { path, schema } of parametersToDescribe) {
      try {
        const example = mostRecentExamples[path];

        const paramPrompt = `You are explaining how a query parameter inside an API endpoint is used. The endpoint has description: ${endpointDescription}.
        The parameter has path '${path}' and type '${schemaToString(schema)}'. Here is an example usage: ${example}. Give a short, concise description of the parameter in 1 sentence under 20 words.
        `

        const paramDescription = await callOpenAI(paramPrompt, model);
        if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
          parameterDescriptions[path] = paramDescription.choices[0].message.content;
          console.log(`Description of '${path}':`, parameterDescriptions[path])
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
  

function getParameterExample(endpoint: Endpoint, paramPath: string): any {

  const pathParts = paramPath.split('|');
  const methodType = pathParts[0].toUpperCase();

  if (endpoint.data.methods[methodType]) {
    const method = endpoint.data.methods[methodType];
    if (method.request && method.request['application/json'] && method.request['application/json'].mostRecent) {
      const mostRecent = method.request['application/json'].mostRecent;

      let example: any = mostRecent;
      for (let i = 5; i < pathParts.length; i += 2) {
        const propertyName = pathParts[i];

        if (example && example.hasOwnProperty(propertyName)) {
          example = example[propertyName];
        } else {
          return undefined;
        }
      }
      
      if (Array.isArray(example)) {
        if (example.length > 2){
          example.push('... (' + (example.length - 1) + ' items not shown)')
        }
      }

      else if (typeof example === 'string') {
        const characterCount = example.length;
        const maxLength = 20

        if (characterCount > maxLength) {
          const chatMessages: ChatMessage[] = [{ role: "user", content: example }];
          const tokens = tokenizer.encodeChat(chatMessages, "gpt-4");
          const tokenCount = tokens.length;
          const characterTokenRatio = characterCount / tokenCount;

          if (characterTokenRatio < 2) {
            const truncated = example.slice(0, maxLength) + '...';
            example = truncated;
          }}
      }

      return example;
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}


