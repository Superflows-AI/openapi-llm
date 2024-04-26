import { Endpoint } from "../utils/types"; //, Leaf, PartType }
import { methodDetailsToString } from "../ui/helpers/endpoint-parsers" //schemaToString
//import callOpenAI from "./callOpenAI";

export async function describeApiEndpoint(endpoint: Endpoint, model: string): Promise<string | null> {
  const methodsString = Object.entries(endpoint.data.methods)
    .map(([method, details]) => `${method.toUpperCase()}: ` + methodDetailsToString(details))
    .join('\n');

  let endpointPrompt = `Concisely describe the functionality of this API endpoint. Here is an example request and response: ${methodsString}.`;
  console.log('Endpoint Prompt', endpointPrompt[0], model);
  return 'TEST ENDPOINT'
  // try {
  //   const endpointDescription = await callOpenAI(endpointPrompt, model);
  //   if (endpointDescription.choices && endpointDescription.choices.length > 0 && endpointDescription.choices[0].message) {
  //     return endpointDescription.choices[0].message.content;
  //   } else {
  //     console.warn('Unexpected OpenAI response format:', endpointDescription);
  //     return null;
  //   }
  // } catch (error) {
  //   console.error('Error calling OpenAI:', error);
  //   return null;
  // }
}

export async function describeRequestBodySchemaParameters(endpoint: Endpoint, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};

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
      console.log('Request Body Parameter Prompt', model);
      parameterDescriptions[parentPath] = 'TEST REQUEST PARAM';
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

// export async function describeRequestBodySchemaParameters(endpoint: Endpoint, model: string): Promise<Record<string, string | null>> {
//   const parameterDescriptions: Record<string, string | null> = {};

//   // TWO CASES WHERE THIS FAILS -- APPLICATION.JSON, AND PROPERTIES. THIS LEADS TO PARENTPATH NOT MATCHING THE ENDPOINT

//   function traverseSchema(schema: any, parentPath: string) {
//     if (schema.type === 'object' && schema.properties) {

//       for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
//         const fullParamPath = `${parentPath}|${paramName}`;
//         traverseSchema(paramSchema, fullParamPath);
//       }
//     } else if (schema.oneOf || schema.anyOf) {
//       const combinedSchemas = schema.oneOf || schema.anyOf;
//       for (const [index, subSchema] of combinedSchemas.entries()) {
//         const fullParamPath = `${parentPath}[${index}]`;
//         traverseSchema(subSchema, fullParamPath);
//       }
//     } else {
//       //const paramPrompt = `Concisely describe the parameter in the request body schema:\n${schemaToString(schema)}`;
//       console.log('Request Body Parameter Prompt',model); //  paramPrompt, 
//       parameterDescriptions[parentPath] = 'TEST REQUEST PARAM';


//     }
//   }

//   for (const methodType of Object.keys(endpoint.data.methods)) {
//     const method = endpoint.data.methods[methodType];
//     if (method.request) {
//       for (const req of Object.values(method.request)) {
//         if (req.body) {
//           traverseSchema(req.body, `${methodType}|request|body`);
//         }
//       }
//     }
//   }

//   // console.log('RequestBodySchemaParameters Descriptions:', parameterDescriptions);
//   return parameterDescriptions;
// }
            // try {
            //   const paramDescription = await callOpenAI(paramPrompt, model);
            //   if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
            //     parameterDescriptions[paramName] = paramDescription.choices[0].message.content;
            //     console.log(`Description of '${paramName}':`, parameterDescriptions[paramName])
            //   } else {
            //     console.warn(`Unexpected OpenAI response format for parameter '${paramName}':`, paramDescription);
            //     parameterDescriptions[paramName] = null;
            //   }
            // } catch (error) {
            //   console.error(`Error describing parameter '${paramName}':`, error);
            //   parameterDescriptions[paramName] = null;
            // }
        //   }
        // }
      
      //   for (const methodType of Object.keys(endpoint.data.methods)) {
      //     const method = endpoint.data.methods[methodType];
      //     if (method.request) {
      //       for (const req of Object.values(method.request)) {
      //         if (req.body) {
      //           traverseSchema(req.body, `${methodType}|request|body`);
      //         }
      //       }
      //     }
      //   }
      
      //   // console.log('RequestBodySchemaParameters Descriptions:', parameterDescriptions);
      //   return parameterDescriptions;
      // }


  export async function describeResponseBodySchemaParameters(endpoint: Endpoint, model: string): Promise<Record<string, string | null>> {
    const parameterDescriptions: Record<string, string | null> = {};
  
    function traverseSchema(schema: any, parentPath: string) {
      if (schema.type === 'object' && schema.properties) {
        for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
          const fullParamPath = `${parentPath}.properties.${paramName}`;
          traverseSchema(paramSchema, fullParamPath);
        }
      } else if (schema.oneOf || schema.anyOf) {
        const combinedSchemas = schema.oneOf || schema.anyOf;
        for (const [index, subSchema] of combinedSchemas.entries()) {
          const fullParamPath = `${parentPath}.oneOf[${index}]`; // or `anyOf[${index}]` depending on the case
          traverseSchema(subSchema, fullParamPath);
        }
      } else {
        //const paramPrompt = `Concisely describe the parameter in the response body schema:\n${schemaToString(schema)}`;
        console.log('Response Body Parameter Prompt', model);
        //paramPrompt, 
        parameterDescriptions[parentPath] = 'TEST RESPONSE PARAM';


              // try {
              //   const paramDescription = await callOpenAI(paramPrompt, model);
              //   if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
              //     parameterDescriptions[paramName] = paramDescription.choices[0].message.content;
              //   } else {
              //     console.warn(`Unexpected OpenAI response format for parameter '${paramName}':`, paramDescription);
              //     parameterDescriptions[paramName] = null;
              //   }
              // } catch (error) {
              //   console.error(`Error describing parameter '${paramName}':`, error);
              //   parameterDescriptions[paramName] = null;
              // }
            }
          }
        
    for (const methodType of Object.keys(endpoint.data.methods)) {
      const method = endpoint.data.methods[methodType];
      if (method.response) {
        for (const [statusCode, responses] of Object.entries(method.response)) {
          for (const [contentType, res] of Object.entries(responses)) {
            if (res.body) {
              traverseSchema(res.body, `${methodType}.response.${statusCode}.${contentType}.body`);
            }
          }
        }
      }
    }
  
    // console.log('ResponseBodySchemaParameters Descriptions:', parameterDescriptions);
    return parameterDescriptions;
  }

  export async function describeRequestHeaders(endpoint: Endpoint, model: string): Promise<Record<string, string | null>> {
    const parameterDescriptions: Record<string, string | null> = {};
  
    function traverseSchema(schema: any, parentPath: string) {
      if (schema.type === 'object' && schema.properties) {
        for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
          const fullParamPath = `${parentPath}|${paramName}`;
          traverseSchema(paramSchema, fullParamPath);
        }
      } else if (schema.oneOf || schema.anyOf) {
        const combinedSchemas = schema.oneOf || schema.anyOf;
        for (const [index, subSchema] of combinedSchemas.entries()) {
          const fullParamPath = `${parentPath}[${index}]`;
          traverseSchema(subSchema, fullParamPath);
        }
      } else {
        //const paramPrompt = `Concisely describe the parameter in the request headers:\n${schemaToString(schema)}`;
        console.log('Request Header Parameter Prompt',  model); //paramPrompt,
        parameterDescriptions[parentPath] = 'TEST HEADER';
        // try {
        //   const paramDescription = await callOpenAI(paramPrompt, model);
        //   if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
        //     parameterDescriptions[paramName] = paramDescription.choices[0].message.content;
        //   } else {
        //     console.warn(`Unexpected OpenAI response format for parameter '${paramName}':`, paramDescription);
        //     parameterDescriptions[paramName] = null;
        //   }
        // } catch (error) {
        //   console.error(`Error describing parameter '${paramName}':`, error);
        //   parameterDescriptions[paramName] = null;
        // }
      }
    }
  
    for (const methodType of Object.keys(endpoint.data.methods)) {
      const method = endpoint.data.methods[methodType];
      if (method.requestHeaders) {
        traverseSchema(method.requestHeaders, `${methodType.toLowerCase()}|${endpoint.pathname}|headers`);
      }
    }
  
    //('RequestHeaders Parameters Descriptions:', parameterDescriptions);
    return parameterDescriptions;
  }