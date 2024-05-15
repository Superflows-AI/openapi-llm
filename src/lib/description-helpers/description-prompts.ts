export function queryParameterDescriptionPrompt(endpointId: string, endpointDescription: string, parentPath: string, schema: string, example: string): string {

  return `You are an expert programmer. Your task is to write an OpenAPI description (similar to EXAMPLE_DESCRIPTIONS) for a QUERY_PARAMETER in API. You are limited to 1 sentence and a maximum of 20 words. Follow the RULES.

EXAMPLE_DESCRIPTIONS:
"""
Filter by > or < the number of employees

---

Date and time of engagement start in YYYY-MM-DD format

---

Limit the number of results returned
"""

API:
"""
URL: ${endpointId}
Description: ${endpointDescription}
"""

QUERY_PARAMETER:
"""
Parameter path: ${parentPath}
Type: ${schema}
Example: ${example}
"""

RULES:
1. BE EXTREMELY CONCISE
2. Write an OpenAPI description for QUERY_PARAMETER
3. DO NOT include the QUERY_PARAMETER type`;
}

export function requestParameterDescriptionPrompt(endpointId: string, endpointDescription: string, parentPath: string, schema: string, example: string): string {

  return `You are an expert programmer. Your task is to write an OpenAPI description (similar to EXAMPLE_DESCRIPTIONS) for a REQUEST_PARAMETER in API. You are limited to 1 sentence and a maximum of 20 words. Follow the RULES.

EXAMPLE_DESCRIPTIONS:
"""
Filter by > or < the number of employees

---

Date and time of engagement start in YYYY-MM-DD format

---

Limit the number of results returned
"""

API:
"""
URL: ${endpointId}
Description: ${endpointDescription}
"""

REQUEST_PARAMETER:
"""
Parameter path: ${parentPath}
Type: ${schema}
Example: ${example}
"""

RULES:
1. BE EXTREMELY CONCISE
2. Write an OpenAPI description for REQUEST_PARAMETER
3. DO NOT include the REQUEST_PARAMETER type`;
}


export function responseParameterDescriptionPrompt(endpointId: string, endpointDescription: string, parentPath: string, schema: string, example: string): string {

  return `You are an expert programmer. Your task is to write an OpenAPI description (similar to EXAMPLE_DESCRIPTIONS) for a RESPONSE_FIELD in API. You are limited to 1 sentence and a maximum of 20 words. Follow the RULES.

EXAMPLE_DESCRIPTIONS:
"""
Deal value (USD)

---

Date and time of engagement start in YYYY-MM-DD format

---

Last time the data was updated
"""

API:
"""
URL: ${endpointId}
Description: ${endpointDescription}
"""

RESPONSE_FIELD:
"""
Field path: ${parentPath}
Type: ${schema}
Example: ${example}
"""

RULES:
1. BE EXTREMELY CONCISE
2. Write an OpenAPI description for RESPONSE_FIELD
3. DO NOT include the RESPONSE_FIELD type`;
}
