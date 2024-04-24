import { Endpoint } from "../utils/types"; //, Leaf, PartType }
import { methodDetailsToString, schemaToString } from "../ui/helpers/endpoint-parsers"
import callOpenAI from "./callOpenAI";

export async function describeApiEndpoint(endpoint: Endpoint, model: string): Promise<string | null> {
  const methodsString = Object.entries(endpoint.data.methods)
    .map(([method, details]) => `${method.toUpperCase()}: ` + methodDetailsToString(details))
    .join('\n');

  let endpointPrompt = `Concisely describe the functionality of this API endpoint. Here is an example request and response: ${methodsString}.`;
  console.log('Endpoint Prompt', endpointPrompt, model);

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

export async function describeRequestBodySchemaParameters(endpoint: Endpoint, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};

  for (const method of Object.values(endpoint.data.methods)) {
    if (method.request) {
      for (const req of Object.values(method.request)) {
        if (req.body && req.body.properties) {
          for (const [paramName, paramSchema] of Object.entries(req.body.properties)) {
            const paramPrompt = `Concisely describe the '${paramName}' parameter in the request body schema:\n${schemaToString(paramSchema)}`;
            console.log('Request Body Parameter Prompt', paramPrompt, model);

            try {
              const paramDescription = await callOpenAI(paramPrompt, model);
              if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
                parameterDescriptions[paramName] = paramDescription.choices[0].message.content;
              } else {
                console.warn(`Unexpected OpenAI response format for parameter '${paramName}':`, paramDescription);
                parameterDescriptions[paramName] = null;
              }
            } catch (error) {
              console.error(`Error describing parameter '${paramName}':`, error);
              parameterDescriptions[paramName] = null;
            }
          }
        }
      }
    }
  }

  return parameterDescriptions;
}

export async function describeResponseBodySchema(endpoint: Endpoint, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};

  for (const method of Object.values(endpoint.data.methods)) {
    if (method.response) {
      for (const responses of Object.values(method.response)) {
        for (const res of Object.values(responses)) {
          if (res.body && res.body.properties) {
            for (const [paramName, paramSchema] of Object.entries(res.body.properties)) {
              const paramPrompt = `Concisely describe the '${paramName}' parameter in the response body schema:\n${schemaToString(paramSchema)}`;
              console.log('Response Body Parameter Prompt', paramPrompt, model);

              try {
                const paramDescription = await callOpenAI(paramPrompt, model);
                if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
                  parameterDescriptions[paramName] = paramDescription.choices[0].message.content;
                } else {
                  console.warn(`Unexpected OpenAI response format for parameter '${paramName}':`, paramDescription);
                  parameterDescriptions[paramName] = null;
                }
              } catch (error) {
                console.error(`Error describing parameter '${paramName}':`, error);
                parameterDescriptions[paramName] = null;
              }
            }
          }
        }
      }
    }
  }

  return parameterDescriptions;
}

export async function describeRequestHeaders(endpoint: Endpoint, model: string): Promise<Record<string, string | null>> {
  const parameterDescriptions: Record<string, string | null> = {};

  for (const method of Object.values(endpoint.data.methods)) {
    if (method.requestHeaders && method.requestHeaders.properties) {
      for (const [paramName, paramSchema] of Object.entries(method.requestHeaders.properties)) {
        const paramPrompt = `Concisely describe the '${paramName}' parameter in the request headers:\n${schemaToString(paramSchema)}`;
        console.log('Request Header Parameter Prompt', paramPrompt, model);

        try {
          const paramDescription = await callOpenAI(paramPrompt, model);
          if (paramDescription.choices && paramDescription.choices.length > 0 && paramDescription.choices[0].message) {
            parameterDescriptions[paramName] = paramDescription.choices[0].message.content;
          } else {
            console.warn(`Unexpected OpenAI response format for parameter '${paramName}':`, paramDescription);
            parameterDescriptions[paramName] = null;
          }
        } catch (error) {
          console.error(`Error describing parameter '${paramName}':`, error);
          parameterDescriptions[paramName] = null;
        }
      }
    }
  }

  return parameterDescriptions;
}