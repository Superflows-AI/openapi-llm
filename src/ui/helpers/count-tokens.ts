import { Endpoint } from "../../utils/types";
import { getEndpointMethodPrompt, getQueryParameterPrompts, getResponseBodyParameterPrompts, getRequestBodyParameterPrompts } from "../../lib/describe-endpoints";
import tokenizer from "gpt-tokenizer";

export interface ChatMessage {
  role?: 'system' | 'user' | 'assistant'
  name?: string
  content: string
}

// endpoint: Endpoint, method: string, endpointDescription: string

export default function estimateEndpointMethodTokens(endpoint: Endpoint, method: string, endpointId: string): number {
  
  const mockEndpointMethodDescription = 'An example endpoint description of approximately the correct length'
  
  const endpointMethodPrompt = getEndpointMethodPrompt(endpoint.data.methods[method], method, endpointId);
  const queryParameterPrompts = getQueryParameterPrompts(endpoint, method, mockEndpointMethodDescription)
  const responseBodyPrompts = getResponseBodyParameterPrompts(endpoint, method, mockEndpointMethodDescription)
  const requestBodyParameterPrompts =getRequestBodyParameterPrompts(endpoint, method, mockEndpointMethodDescription)

  const nReqPrompts = Object.keys(responseBodyPrompts).length;
  const nResPrompts = Object.keys(requestBodyParameterPrompts).length;
  const nQueryPrompts = Object.keys(queryParameterPrompts).length;

  const endpointTokens = countTokens(endpointMethodPrompt);

  // GPT4
  const endpointInputTokenCost = endpointTokens * 0.00003;
  const endpointOutputTokenCost = 23 * 0.00006;

  // GPT3.5-turbo
  const parameterInputTokenCost = (nReqPrompts + nResPrompts + nQueryPrompts) * 0.0000005;
  const parameterOutputTokenCost = (nReqPrompts + nResPrompts + nQueryPrompts) * 23 * 0.0000005;

  return endpointInputTokenCost + parameterInputTokenCost + endpointOutputTokenCost + parameterOutputTokenCost;
}

function countTokens(message: string): number {
  const gptMessage: ChatMessage[] = [{role: "user", content: message}];

  // Per the docs, the tokenizer should be the same for 3.5-turbo and 4.
  const encoded = tokenizer.encodeChat(gptMessage, "gpt-4");

  return encoded.length;
}
