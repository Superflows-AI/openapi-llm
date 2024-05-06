export const endpointSystemPrompt = `You are an expert, articulate programmer. In 1 sentence and a maximum of 20 words explain how the API endpoint is used in the context of the endpoint based on the details provided.
RULES: 
1) Focus on useful information for a programmer. 
2) Be concise. Use grammatically incorrect sentences if it conveys the information more concisely. 
3) Never repeat information already obvious in an API spec, like the method, the parameter name or the website it relates to.
4) Do not use quote marks or unnecessary punctuation`;

export function endpointDescriptionPrompt(methodsString: string): string {

  const paramPrompt = `Here is an example request and response from an API endpoint: ${methodsString}.
  
  ASSISTANT:  This is an endpoint that`;

  return paramPrompt};

export const parameterSystemPrompt = `You are an expert, articulate programmer. In 1 sentence and a maximum of 20 words explain how this parameter should is used in the context of the API endpoint based on the details provided. RULES:
1) Focus on useful information for a programmer. 2) Be concise. Use grammatically incorrect sentences if it conveys the information more concisely. 3) Never repeat information already obvious in an API spec, like the method, the parameter name or the website is relates. 4) Do not use quote marks or unnecessary punctuation`;

export function parameterDescriptionPrompt(endpointDescription: string, parentPath: string, schema: string, example: string): string {


  const paramPrompt = `
  - ENDPOINT_DESCRIPTION: ${endpointDescription}
  - PATH_TO_PARAMETER: '${parentPath}'
  - TYPE_OF_PARAMETER: '${schema}'
  - EXAMPLE_USAGE: '${example}'

  ASSISTANT:  This parameter is a ${schema} that`;

  return paramPrompt
};
