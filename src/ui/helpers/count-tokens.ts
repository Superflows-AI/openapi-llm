import { Endpoint } from "../../utils/types";
import { getEndpointPrompt, getQueryParameterPrompts, getResponseBodyPrompts, getRequestBodyParameterPrompts } from "../../lib/describe-endpoints";
import tokenizer from "gpt-tokenizer";


export interface ChatMessage {
  role?: 'system' | 'user' | 'assistant'
  name?: string
  content: string
}

export default function countTokens(endpoint: Endpoint): number {

  const endpointPrompt = getEndpointPrompt(endpoint);
  const queryParameterPrompts = getQueryParameterPrompts(endpoint, endpointPrompt);
  const responseBodyPrompts = getResponseBodyPrompts(endpoint, endpointPrompt);
  const requestBodyParameterPrompts = getRequestBodyParameterPrompts(endpoint, endpointPrompt);

  function concatValues(record: Record<string, string>): string {
    return Object.values(record).join();  // Joins all values with new lines
  }

  const message = `${endpointPrompt}
                  ${concatValues(queryParameterPrompts)}
                  ${concatValues(responseBodyPrompts)}
                  ${concatValues(requestBodyParameterPrompts)}`;

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

