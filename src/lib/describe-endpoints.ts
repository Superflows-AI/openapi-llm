import { Endpoint } from "../utils/types"; //, Leaf, PartType }
import { methodDetailsToString } from "../ui/helpers/count-tokens"


// Function to process OpenAPI data
// async function describeApiEndpoint(endpoint: Endpoint, GPTParams: GPTParams, model: string) {
//   let descriptions = {
//     endpoints: {},
//   };

//   const partsString = endpoint.parts.map(part => `${part.part} (type: ${part.type})`).join(', ');

//   const methodsString = Object.entries(endpoint.data.methods).map(([method, details]) => {
//     return `${method.toUpperCase()}: ` + methodDetailsToString(details);  
//     }).join('\n');

//   // Generate description for the endpoint
//   let endpointPrompt = `Describe the functionality of an API endpoint that ${method} to ${path}.`;
  
//   const endpointDescription = await getOAIRequestCompletion(endpointPrompt, GPTParams, model);

//   const parameterDict = extractMethodsInfo(endpoint.data)
  
//   for (let param of parameterDict) {
//     let paramPrompt = `Describe the purpose of the parameter ${param.name} in the context of an ${method.toUpperCase()} request to ${path}.`;
//     const paramDescription = await getOAIRequestCompletion(paramPrompt, GPTParams, model);

//   }
// }

export async function describeApiEndpoint(endpoint: Endpoint, GPTParams: GPTParams, model: string) {
  // let descriptions = {
  //     endpoints: {},
  //     methods: {},
  // };

  const partsString = endpoint.parts.map(part => `${part.part} (type: ${part.type})`).join(', ');

  const methodsString = Object.entries(endpoint.data.methods).map(([method, details]) => {
        return `${method.toUpperCase()}: ` + methodDetailsToString(details);  
        }).join('\n');

  let endpointPrompt = `Describe the functionality of this API endpoint. It has part: ${partsString}. The methods are: ${methodsString}.`;
  const endpointDescription = await getOAIRequestCompletion(endpointPrompt, GPTParams, model);

  // Generating method details and descriptions
  // const methodDetails = extractMethodsInfo(endpoint.data); 

  // for (const [method, details] of Object.entries(methodDetails)) {
  //     // Generate description for each method
  //     let methodPrompt = `Describe the functionality of an API endpoint that uses ${method} to ${endpoint.path}.`;

  //     descriptions.methods[method] = {
  //         description: await getOAIRequestCompletion(methodPrompt, GPTParams, model),
  //         details: {}
  //     };

  //     // Generate description for parameters within each method if necessary
  //     for (const [key, value] of Object.entries(details)) {
  //         let paramPrompt = `Describe the purpose of the ${key} in the context of a ${method.toUpperCase()} request to ${endpoint.path}.`;
  //         descriptions.methods[method].details[key] = await getOAIRequestCompletion(paramPrompt, GPTParams, model);
  //     }
  // }

  // You can now return descriptions or add it to the endpoint data
  return endpointDescription; // or modify endpoint object to include descriptions
}

export interface GPTParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[] | null;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Function | null;
  user?: string;
}

export const defaultParams: GPTParams = {
  // This max tokens number is the maximum output tokens
  max_tokens: 1000,
  temperature: 0.6,
  top_p: 1,
  frequency_penalty: 0.5,
  presence_penalty: 0,
};

// // Example usage of describeApiEndpoint
// async function main(defaultParams: GPTParams) {
//   const endpoint: Endpoint = {
//       parts: [{ part: "userId", type: "string" }],
//       data: {
//           pathname: "/users",
//           methods: {
//               GET: {
//                   requestHeaders: { type: "object", properties: { Authorization: { type: "string" } } },
//                   response: {
//                       '200': {
//                           'application/json': {
//                               body: { type: 'object', properties: { userId: { type: 'string' }, userName: { type: 'string' } } },
//                               mostRecent: { userId: "123", userName: "John Doe" }
//                           }
//                       }
//                   }
//               }
//           }
//       },
//       path: "/users/{userId}"
//   };

//   const description = await describeApiEndpoint(endpoint, defaultParams, "gpt-4");
//   console.log(description);
// }

// main(defaultParams);



function getOAIRequestCompletion(
  prompt: string,
  params: GPTParams = {},
  model: string,
): {
  url: string;
  options: { method: string; headers: HeadersInit; body: string };
} {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    // Use our default params, rather than OpenAI's when these aren't specified
    body: JSON.stringify({
      model,
      prompt,
      ...defaultParams,
      ...params,
    }),
  };

  return { url: `https://api.openai.com/v1/completions`, options };
}


// function extractMethodsInfo(endpointData: Leaf): { [key: string]: any } {
//   const methodsInfo: { [key: string]: any } = {};
//   for (const method in endpointData.methods) {
//     const methodData = endpointData.methods[method];
//     const methodDetails: any = {};

//     if (methodData.request) {
//       methodDetails.request = {};
//       for (const mediaType in methodData.request) {
//         methodDetails.request[mediaType] = {
//           body: methodData.request[mediaType].body,
//           mostRecent: methodData.request[mediaType].mostRecent
//         };
//       }
//     }

//     if (methodData.requestHeaders) {
//       methodDetails.requestHeaders = methodData.requestHeaders;
//     }

//     methodDetails.response = {};
//     for (const statusCode in methodData.response) {
//       methodDetails.response[statusCode] = {};
//       for (const mediaType in methodData.response[statusCode]) {
//         methodDetails.response[statusCode][mediaType] = {
//           body: methodData.response[statusCode][mediaType].body,
//           mostRecent: methodData.response[statusCode][mediaType].mostRecent
//         };
//       }
//     }

//     if (methodData.responseHeaders) {
//       methodDetails.responseHeaders = methodData.responseHeaders;
//     }

//     if (methodData.queryParameters) {
//       methodDetails.queryParameters = methodData.queryParameters;
//     }

//     methodsInfo[method] = methodDetails;
//   }
//   return methodsInfo;
// }


