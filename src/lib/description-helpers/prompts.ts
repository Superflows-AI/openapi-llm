export const endpointSystemPrompt = `You are an expert, articulate programmer. 
In 1 sentence and a maximum of 20 words explain how the API endpoint is used in the context of the endpoint based on the example usage of query parameters, request body, and response body provided.
RULES: 
1) Focus on useful information for a programmer. 
2) Be concise. Use grammatically incorrect sentences if it conveys the information more concisely. 
3) Never repeat the API method, parameter names, parameter types or the website the API is hosted on`;

export function endpointDescriptionPrompt(methodsString: string): string {

  return `I need to understand how an API endpoint works and what it is used for. 

  Some good descriptions of endpoints would be:
  - Retrieves page revisions and information about the page
  - Search all deals. Includes industry and size of company
  - Search contacts by name or filter by attributes
  
  Here is an example usage of an API endpoint, including Query Parameters, Request Body and Response Body from an API endpoint: ${methodsString}.

  Explain the API endpoint in a similar way to the good descriptions provided without including the information shown here. Get straight to the point - do not include anything that is obvious from the information provided.`;
}

export const parameterSystemPrompt = `You are an expert, articulate programmer. 

In 1 sentence and a maximum of 20 words explain how this parameter works in the context of the API endpoint based on the details provided. 
RULES:
1) Focus on useful information for a programmer. 
2) Be concise. Use grammatically incorrect sentences if it conveys the information more concisely. 
3) Never repeat the API method, parameter names, parameter types or the website the API is hosted on`;


export function queryParameterDescriptionPrompt(endpointId: string, endpointDescription: string, parentPath: string, schema: string, example: string): string {

  return `I need to understand how a query parameter in an API endpoint works and what it is used for. 

  Some good descriptions of parameters would be:
  - Filter by > or < the number of employees
  - Date and time of engagement start
  - Limit the number of results returned

  Here is information about a query parameter I need to understand, including the type of parameter, example usage, and the API endpoint description:
  - ENDPOINT_ID: ${endpointId}
  - ENDPOINT_DESCRIPTION: ${endpointDescription}
  - PATH_TO_PARAMETER: '${parentPath}'
  - TYPE_OF_PARAMETER: '${schema}'
  - EXAMPLE_USAGE: '${example}'

  Explain the query parameter in a similar way to the good descriptions provided without including the information shown here.`;
}

export function requestParameterDescriptionPrompt(endpointId: string, endpointDescription: string, parentPath: string, schema: string, example: string): string {

  return `I need to understand how a request parameter in an API endpoint works and what it is used for. 

  Some good descriptions of parameters would be:
  - Filter by > or < the number of employees
  - Date and time of engagement start
  - Limit the number of results returned

  Here is information about a request body parameter in an API endpoint, including the type of parameter, example usage, and the API endpoint description:
  - ENDPOINT_ID: ${endpointId}
  - ENDPOINT_DESCRIPTION: ${endpointDescription}
  - PATH_TO_PARAMETER: '${parentPath}'
  - TYPE_OF_PARAMETER: '${schema}'
  - EXAMPLE_USAGE: '${example}'

  Explain the request parameter in a similar way to the good descriptions provided without including the information shown here.`;
}


export function responseParameterDescriptionPrompt(endpointId: string, endpointDescription: string, parentPath: string, schema: string, example: string): string {

  return `I need to understand how a response parameter in an API endpoint works and what it is used for. 

  Some good descriptions of parameters would be:
  - Value of the deal in USD
  - Date and time of engagement start
  - The last time the specific page was updated from the database 

  Here is information about a response parameter from API endpoint, including the type of parameter, example usage, and the API endpoint description:
  - ENDPOINT_ID: ${endpointId}
  - ENDPOINT_DESCRIPTION: ${endpointDescription}
  - PATH_TO_PARAMETER: '${parentPath}'
  - TYPE_OF_PARAMETER: '${schema}'
  - EXAMPLE_USAGE: '${example}'

  Explain the response parameter in a similar way to the good descriptions provided without including the information shown here.`;
}

