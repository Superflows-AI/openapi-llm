export function getEndpointPrompt (methodsString: string): string {
    /** Gets endpoint description system prompt **/

  return `You are an expert programmer. Your task is to write an OpenAPI description for the API_ENDPOINT in 1 sentence and a maximum of 20 words. Follow the RULES.

RULES:
1. Focus on useful information for a programmer.
2. BE CONCISE
3. DO NOT repeat the API method, parameter names, parameter types or the website the API is hosted on

EXAMPLES:
"""
- Update a deal by id
- Retrieves page revisions and information about the page
- Search contacts by name or filter by attributes
"""

API_ENDPOINT:
"""
${methodsString}
"""`
}

