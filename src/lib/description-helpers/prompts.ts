export const endpointSystemPrompt = `You are an expert, articulate programmer. 
In 1 sentence and a maximum of 20 words explain how the API endpoint is used in the context of the endpoint based on the example usage of query parameters, request body, and response body provided.
RULES: 
1) Focus on useful information for a programmer. 
2) Be concise. Use grammatically incorrect sentences if it conveys the information more concisely. 
3) Never repeat the API method, parameter names, parameter types or the website the API is hosted on`;

export function endpointDescriptionPrompt(methodsString: string): string {

  return `Here is an example usage of an API endpoint, including Query Parameters, Request Body and Response Body from an API endpoint: ${methodsString}.
  
  Explain how the API endpoint is used without referencing parts of the example. 

  ASSISTANT:  This is an endpoint that`;
}

export const parameterSystemPrompt = `You are an expert, articulate programmer. 

In 1 sentence and a maximum of 20 words explain how this parameter works in the context of the API endpoint based on the details provided. 
RULES:
1) Focus on useful information for a programmer. 
2) Be concise. Use grammatically incorrect sentences if it conveys the information more concisely. 
3) Never repeat the API method, parameter names, parameter types or the website the API is hosted on`;


export function queryParameterDescriptionPrompt(endpointId: string, endpointDescription: string, parentPath: string, schema: string, example: string): string {

  return `HUMAN:

  Here is information about a query parameter in an API endpoint, including the type of parameter, example usage, and the API endpoint description:
  - ENDPOINT_ID: ${endpointId}
  - ENDPOINT_DESCRIPTION: ${endpointDescription}
  - PATH_TO_PARAMETER: '${parentPath}'
  - TYPE_OF_PARAMETER: '${schema}'
  - EXAMPLE_USAGE: '${example}'

  Explain how the query parameter works without including the information shown here.`;
}

export function requestParameterDescriptionPrompt(endpointId: string, endpointDescription: string, parentPath: string, schema: string, example: string): string {

  return `HUMAN:

  Here is information about a request body parameter in an API endpoint, including the type of parameter, example usage, and the API endpoint description:
  - ENDPOINT_ID: ${endpointId}
  - ENDPOINT_DESCRIPTION: ${endpointDescription}
  - PATH_TO_PARAMETER: '${parentPath}'
  - TYPE_OF_PARAMETER: '${schema}'
  - EXAMPLE_USAGE: '${example}'

  Explain how the request parameter works without including the information shown here.`;
}


export function responseParameterDescriptionPrompt(endpointId: string, endpointDescription: string, parentPath: string, schema: string, example: string): string {

  return `HUMAN:

  Here is information about a reponse parameter from API endpoint, including the type of parameter, example usage, and the API endpoint description:
  - ENDPOINT_ID: ${endpointId}
  - ENDPOINT_DESCRIPTION: ${endpointDescription}
  - PATH_TO_PARAMETER: '${parentPath}'
  - TYPE_OF_PARAMETER: '${schema}'
  - EXAMPLE_USAGE: '${example}'

  Explain what the response parameter means without including the information shown here. Get straight to the point, do not tell me it's a parameter.`;
}

