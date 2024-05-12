import { Endpoint } from "../../utils/types";
import { getEndpointPrompt, getQueryParameterPrompts, getResponseBodyParameterPrompts, getRequestBodyParameterPrompts } from "../../lib/describe-endpoints";
import tokenizer from "gpt-tokenizer";


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


  const avgParameterPromptTokens = 203;

  const endpointTokens = countTokens(endpointPrompt);

  const parameterInputTokens = (nReqPrompts + nResPrompts + nQueryPrompts) * avgParameterPromptTokens;

  const endpointInputTokenCost = endpointTokens * 0.00003;
  const parameterInputTokenCost = parameterInputTokens * 0.0000005;
  const endpointOutputTokenCost = 23 * 0.00006;
  const parameterOutputTokenCost = (nReqPrompts + nResPrompts + nQueryPrompts) * 23 * 0.0000005; 
  const totalTokenCost = Math.round((endpointInputTokenCost + parameterInputTokenCost + endpointOutputTokenCost + parameterOutputTokenCost) * 100) / 100;

  return totalTokenCost;
}

function countTokens(message: string): number {
  let gptMessage: ChatMessage[];
  if (typeof message === "string") {
    gptMessage = [{ role: "user", content: message }];
  } else {
    gptMessage = message as ChatMessage[];
  }

  // Per the docs, the tokenizer should be the same for 3.5-turbo and 4.
  const encoded = tokenizer.encodeChat(gptMessage, "gpt-4");

  return encoded.length;
}
