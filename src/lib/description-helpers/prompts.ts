
export function endpointDescriptionPrompt(methodsString: string): string {


  /*
  You are an expert, articulate programmer. You aim to concisely describe the functionality of an API endpoint in 1 sentence. Aim for at most 20 words that give an overview information you need to use the endpoint.

  HUMAN: Explain what this endpoint does: `

  ASSISTANT: 

  HUMAN: Explain what this endpoint does: '${methodsString}'

  ASSISTANT: 

  */

  const paramPrompt = `HUMAN: Here is an example request and response from an API endpoint: ${methodsString}. Concisely describe the functionality of this API endpoint in 1 sentence. Aim for at most 30 words. Give an overview information you need to use the endpoint. 

  Do not restate that this is an endpoint instead describe what it does, what it is for, and how to use it. AVOID UNNECESSARY WORDS - ONLY PROVIDE SPECIFIC USEFUL INFORMATION.
  
  ASSISTANT:  This is an endpoint that`;

  console.log(paramPrompt);

  return paramPrompt}

export function parameterDescriptionPrompt(endpointDescription: string, parentPath: string, schema: string, example: string): string {

  /*
    You are an expert, articulate programmer. You aim to concisely describe the functionality of a parameter in an API endpoint in 1 sentence. Aim for at most 20 words that give an overview information you need to use the parameter.

    HUMAN: Explain how this parameter is used. It is in an endpoint with description 'Collects ' on path '${parentPath}' with type '${schema}'. Here is an example of it being set: '${example}'

    ASSISTANT:

    HUMAN: Explain how this parameter is used. It is in an endpoint with description '${endpointDescription}' on path '${parentPath}' with type '${schema}'. Here is an example of it being set: '${example}'

    ASSISTANT:
  `

  */

  const paramPrompt = `You are an expert, articulate programmer. In 1 sentence and a maximum of 20 words explain how this parameter should is used in the context of the endpoint based on the following details: 
  - ENDPOINT_DESCRIPTION: ${endpointDescription}
  - PATH_TO_PARAMETER: '${parentPath}'
  - TYPE_OF_PARAMETER: '${schema}'
  - EXAMPLE_USAGE: '${example}'

  RULES:
  - Focus on useful information for a programmer
  - Never include useless information
  - Be concise
  - The user already knows the key information. Do not repeat the obvious information
  ASSISTANT:  This parameter is a ${schema} that`;

  console.log(paramPrompt);

  // const paramPrompt = `You are an expert, articulate programmer. You aim to concisely describe the functionality of a parameter in an API endpoint in 1 sentence. It sits inside an API endpoint with description: ${endpointDescription}.
  // The parameter has path '${parentPath}' and type '${schema}'. Here is an example usage: ${example}. Give a short, concise description of the parameter in 1 sentence under 20 words that give an overview information you need to use the parameter. Get straight to the point, don't explain that this is a parameter.
  // `

  return paramPrompt
}

/*

Generate a concise description for a parameter based on the following details: 
- ENDPOINT_DESCRIPTION: Retrieve a user's detailed profile information
- PATH_TO_PARAMETER: /users/{user_id}
- TYPE_OF_PARAMETER: Integer
- EXAMPLE_USAGE: /users/12345

Description:

*/

//const paramPrompt = `You are explaining how a response body parameter inside an API endpoint with is used. The endpoint has description: ${endpointDescription}.
        //The parameter has path '${parentPath}' and type '${schemaToString(schema)}'. Here is an example usage: ${example}. Give a short, concise description of the parameter in 1 sentence under 20 words.
        //`