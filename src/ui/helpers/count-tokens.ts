import { Endpoint } from "../../utils/types";
import { endpointToString } from "./endpoint-parsers";
import tokenizer from "gpt-tokenizer";

export interface ChatMessage {
  role?: 'system' | 'user' | 'assistant'
  name?: string
  content: string
}

export default function countTokens(endpoint: Endpoint): number {

  const message = endpointToString(endpoint)

  let gptMessage: ChatMessage[];

  if (typeof message === "string") {
    gptMessage = [{ role: "user", content: message }];
  } else {
    gptMessage = message as ChatMessage[];
  }

  // Per the docs, the tokenizer should be the same for 3.5-turbo and 4.
  const encoded = tokenizer.encodeChat(gptMessage, "gpt-4");

  // console.log('In get token count, token count:', encoded.length)
  return encoded.length;
}

