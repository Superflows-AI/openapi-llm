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

In 1 sentence and a maximum of 20 words explain how this parameter should is used in the context of the API endpoint based on the details provided. 
RULES:
1) Focus on useful information for a programmer. 
2) Be concise. Use grammatically incorrect sentences if it conveys the information more concisely. 
3) Never repeat the API method, parameter names, parameter types or the website the API is hosted on`;

export function parameterDescriptionPrompt(endpointId: string, endpointDescription: string, parentPath: string, schema: string, example: string): string {

  return `HUMAN:
  - ENDPOINT_ID: www.youtube.com/youtubei/v1/player
  - ENDPOINT_DESCRIPTION: Takes in JSON requests containing client and user details, video context, and returns detailed video data, including playback status and video details.
  - PATH_TO_PARAMETER: 'POST|request|application/json|body|properties|context|properties|adSignalsInfo|properties|params'
  - TYPE_OF_PARAMETER: 'Type: array'
  - EXAMPLE_USAGE: '"[{\"key\":\"dt\",\"value\":\"1715243977084\"}, ... (16 more items)]"'

 Explain how this parameter in the API endpoint is used without including the information shown here.

ASSISTANT: Pass an array of key-value pairs to customize ad signals.
  
  
  Here is information about a parameter in an API endpoint, including the type of parameter, example usage, and the API endpoint description:
  - ENDPOINT_ID: ${endpointId}
  - ENDPOINT_DESCRIPTION: ${endpointDescription}
  - PATH_TO_PARAMETER: '${parentPath}'
  - TYPE_OF_PARAMETER: '${schema}'
  - EXAMPLE_USAGE: '${example}'

  Explain how the API endpoint is used without including the information shown here.

  ASSISTANT:  This parameter is a that`;
}



