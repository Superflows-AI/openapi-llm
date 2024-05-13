import {Endpoint} from "../../utils/types";
import {
  getQueryParameterPrompts,
  getRequestBodyParameterPrompts,
  getResponseBodyParameterPrompts
} from "../../lib/describe-endpoints";
import tokenizer from "gpt-tokenizer";
import {getEndpointPrompt} from "../../lib/description-helpers/endpoint-prompt.ts";


export interface ChatMessage {
  role?: 'system' | 'user' | 'assistant'
  name?: string
  content: string
}

export default function estimateEndpointTokens(endpoint: Endpoint): number {

  const endpointPrompt = getEndpointPrompt(endpoint);
  const queryParameterPrompts = getQueryParameterPrompts(endpoint, endpointPrompt);
  const responseBodyPrompts = getResponseBodyParameterPrompts(endpoint, endpointPrompt);
  const requestBodyParameterPrompts = getRequestBodyParameterPrompts(endpoint, endpointPrompt);

  const nReqPrompts = Object.keys(responseBodyPrompts).length;
  const nResPrompts = Object.keys(requestBodyParameterPrompts).length;
  const nQueryPrompts = Object.keys(queryParameterPrompts).length;

  const endpointTokens = countTokens(endpointPrompt);

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
