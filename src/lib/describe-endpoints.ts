import { Endpoint } from "../utils/types"; //, Leaf, PartType }
import { methodDetailsToString, schemaToString } from "./description-helpers/endpoint-parsers" //
//import { ChatMessage } from "../ui/helpers/count-tokens";
import { endpointSystemPrompt, parameterSystemPrompt, endpointDescriptionPrompt, parameterDescriptionPrompt } from "./description-helpers/prompts";
//import tokenizer from "gpt-tokenizer";
import callOpenAI from "./callOpenAI";

function capitalizeFirstLetter(string: string | null): string | null {
  if (string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
  }
  return null;
}

export async function describeApiEndpoint(endpoint: Endpoint, model: string): Promise<string | null> {
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
      // } else if (schema.type === 'array') {
      // const example = JSON.stringify(getParameterExample(endpoint, parentPath));
      //     if (example !== undefined) {
      //       const schemaPrompt = schemaToString(schema);
      //       //console.log('describeResponseBody example:', example)
      //       const paramPrompt = parameterDescriptionPrompt(endpointDescription, parentPath, schemaPrompt, example);
      //       if (paramPrompt && model) {}
      //       const paramDescription = 'TEST BODY PARAMS'// await callOpenAI(paramPrompt, model);
      //       parameterDescriptions[parentPath] = paramDescription;
      //     }
      // if (schema.items) {
      //   const fullParamPath = `${parentPath}|items`;
      //   traverseSchema(schema.items, fullParamPath);
      // }
    } else if (schema.oneOf || schema.anyOf) {
      const combinedSchemas = schema.oneOf || schema.anyOf;
      for (const [index, subSchema] of combinedSchemas.entries()) {
        const fullParamPath = `${parentPath}[${index}]`;
        traverseSchema(subSchema, fullParamPath);
      }
    }
    
    else {

      try {
        //const example = mostRecentExamples[parentPath];
        const example = JSON.stringify(getParameterExample(endpoint, parentPath));
        const schemaPrompt = schemaToString(schema);
        const paramPrompt = parameterDescriptionPrompt(endpointDescription, parentPath, schemaPrompt, example);
        const paramDescription = await callOpenAI(paramPrompt, parameterSystemPrompt, model); //'TEST BODY PARAMS'// 
        if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
          const content = paramDescription.choices[0].message.content;
          const capContent = capitalizeFirstLetter(content);
          parameterDescriptions[parentPath] = capContent;
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
        const example = JSON.stringify(getParameterExample(endpoint, parentPath));
        if (example !== undefined) {
          const schemaPrompt = schemaToString(schema);
          //console.log('describeResponseBody example:', example)
          const paramPrompt = parameterDescriptionPrompt(endpointDescription, parentPath, schemaPrompt, example);
          if (paramPrompt && model) {}
          const paramDescription = 'TEST BODY PARAMS'// await callOpenAI(paramPrompt, model);
          parameterDescriptions[parentPath] = paramDescription;
        }
        if (schema.items) {
          const fullParamPath = `${parentPath}|items`;
          traverseSchema(schema.items, fullParamPath);
        }
      }
    
    
    // else if (schema.type === 'array' && schema.items) {
    //   const fullParamPath = `${parentPath}|items`;
    //   traverseSchema(schema.items, fullParamPath);
    // } else if (schema.oneOf || schema.anyOf) {
    //   const combinedSchemas = schema.oneOf || schema.anyOf;
    //   for (const [index, subSchema] of combinedSchemas.entries()) {
    //     const fullParamPath = `${parentPath}[${index}]`;
    //     traverseSchema(subSchema, fullParamPath);
    //   }
    // } 
    else {

      try {

        //const example = mostRecentExamples[parentPath];
        const example = JSON.stringify(getResponseParameterExample(endpoint, parentPath));
        const paramPrompt = parameterDescriptionPrompt(endpointDescription, parentPath, schemaToString(schema), example)
        console.log('RESPONSE BODY PROMPT:', parameterSystemPrompt, paramPrompt, model[0])
        const paramDescription = await callOpenAI(paramPrompt, parameterSystemPrompt, model);  // 'TEST RESPONSE BODY PARAM';
        //parameterDescriptions[parentPath] = paramDescription;

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

  for (const methodType of Object.keys(endpoint.data.methods)) {
    const method = endpoint.data.methods[methodType];
    if (method.queryParameters) {
      traverseParameters(method.queryParameters, `${methodType}|queryParameters`);
    }
  }

  for (const { path, schema } of parametersToDescribe) {
    try {
      const example = JSON.stringify(getParameterExample(endpoint, path));
      const paramPrompt = parameterDescriptionPrompt(endpointDescription, path, schemaToString(schema), example)

      if (paramPrompt && model){}

      const paramDescription = 'TEST QUERY PARAM' // await callOpenAI(paramPrompt, model);
      parameterDescriptions[path] = paramDescription
      // if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
      //   const content = paramDescription.choices[0].message.content;
      //   const capContent = capitalizeFirstLetter(content);
      //   parameterDescriptions[path] = capContent;
      // } else {
      //   console.warn(`Unexpected OpenAI response format for parameter '${path}':`, paramDescription);
      //   parameterDescriptions[path] = null;
      // }

    } catch (error) {
      console.error(`Error describing parameter '${path}':`, error);
      parameterDescriptions[path] = null;
    }
  }

  return parameterDescriptions;
}

function getResponseParameterExample(endpoint: Endpoint, paramPath: string): string | undefined {
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
            reconstructedPath += '|'; // Add the separator only if something is already in the string
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

function getParameterExample(endpoint: Endpoint, paramPath: string): string | undefined {
  //console.log('Parameter path:', paramPath);
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
  console.log('Reconstructed Path:', reconstructedPath);

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






        //console.log('Initial current object:', currentObj);
  
    // if (paramType === 'queryParameters') {
    //   currentObj = currentObj.queryParameters;
    // } else if (paramType === 'request') {
    //   const mediaType = pathParts[2];
    //   currentObj = currentObj.request?.[mediaType]?.body;
    // } else if (paramType === 'response') {
    //   const statusCode = pathParts[2];
    //   const mediaType = pathParts[3];
    //   currentObj = currentObj.response[statusCode]?.[mediaType]?.body;
    // } else {
    //   console.log(`RETURNING UNDEFINED IN paramType === 'queryParameters'`);
    //   return undefined;
    // }
    // console.log('Current object after paramType check:', currentObj);
  
    // if (currentObj && currentObj.mostRecent) {
    //   let example = currentObj.mostRecent;
    //   console.log('Most recent example:', example);
  
    //   if (typeof example === 'string') {
    //     const characterCount = example.length;
    //     const maxLength = 20;
    //     if (characterCount > maxLength) {
    //       const chatMessages: ChatMessage[] = [{ role: "user", content: example }];
    //       const tokens = tokenizer.encodeChat(chatMessages, "gpt-4");
    //       const tokenCount = tokens.length;
    //       const characterTokenRatio = characterCount / tokenCount;
    //       if (characterTokenRatio < 2) {
    //         const truncated = example.slice(0, maxLength) + '...';
    //         example = truncated;
    //       }
    //     }
    //     return example;
    //   } else if (typeof example === 'object') {
    //     return JSON.stringify(example, null, 2);
    //   } else {
    //     return String(example);
    //   }
    // } else {
    //   console.log('mostRecent key not found in currentObj');
    //   return undefined;
    // }



// function getParameterExample(endpoint: Endpoint, paramPath: string): any {

//   const pathParts = paramPath.split('|');
//   const methodType = pathParts[0].toUpperCase();

//   if (endpoint.data.methods[methodType]) {
//     const method = endpoint.data.methods[methodType];
//     if (method.request && method.request['application/json'] && method.request['application/json'].mostRecent) {
//       const mostRecent = method.request['application/json'].mostRecent;

//       let example: any = mostRecent;
//       for (let i = 5; i < pathParts.length; i += 2) {
//         const propertyName = pathParts[i];

//         if (example && example.hasOwnProperty(propertyName)) {
//           example = example[propertyName];
//         } else {
//           return undefined;
//         }
//       }
      
//       if (Array.isArray(example)) {
//         if (example.length > 2){
//           example.push('... (' + (example.length - 1) + ' items not shown)')
//         }
//       }

//       else if (typeof example === 'string') {
//         const characterCount = example.length;
//         const maxLength = 20

//         if (characterCount > maxLength) {
//           const chatMessages: ChatMessage[] = [{ role: "user", content: example }];
//           const tokens = tokenizer.encodeChat(chatMessages, "gpt-4");
//           const tokenCount = tokens.length;
//           const characterTokenRatio = characterCount / tokenCount;

//           if (characterTokenRatio < 2) {
//             const truncated = example.slice(0, maxLength) + '...';
//             example = truncated;
//           }}
//       }
//       // if (typeof example === 'object' && example !== null) {
//       //   try {
//       //       example = JSON.stringify(example);
//       //   } catch (error) {
//       //       console.error("Error in stringifying object:", error);
//       //       return null;
//       //   }}
//       return JSON.stringify(example);
//     } else {
//       return undefined;
//     }
//   } else {
//     return undefined;
//   }
// }

