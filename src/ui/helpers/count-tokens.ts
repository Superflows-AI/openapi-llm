import { Endpoint } from "../../utils/types";
import { getEndpointPrompt, getQueryParameterPrompts, getResponseBodyPrompts, getRequestBodyParameterPrompts } from "../../lib/describe-endpoints";
import tokenizer from "gpt-tokenizer";


export interface ChatMessage {
  role?: 'system' | 'user' | 'assistant'
  name?: string
  content: string
}

export default function estimateEndpointTokens(endpoint: Endpoint): number {

  const endpointPrompt = getEndpointPrompt(endpoint);
  const queryParameterPrompts = getQueryParameterPrompts(endpoint, endpointPrompt);
  const responseBodyPrompts = getResponseBodyPrompts(endpoint, endpointPrompt);
  const requestBodyParameterPrompts = getRequestBodyParameterPrompts(endpoint, endpointPrompt);

  const nReqPrompts = Object.keys(responseBodyPrompts).length;
  const exampleRequestPrompt = responseBodyPrompts[Object.keys(responseBodyPrompts)[0]];

  const nResPrompts = Object.keys(requestBodyParameterPrompts).length;
  const exampleResponsePrompt = requestBodyParameterPrompts[Object.keys(requestBodyParameterPrompts)[0]];

  const nQueryPrompts = Object.keys(queryParameterPrompts).length;
  const exampleQueryPrompt = queryParameterPrompts[Object.keys(queryParameterPrompts)[0]];

  const endpointTokens = countTokens(endpointPrompt);
  const estimatedResponseTokens = countTokens(exampleResponsePrompt) * nResPrompts;
  const estimatedRequestTokens = countTokens(exampleRequestPrompt) * nReqPrompts;
  const estimatedQueryTokens = countTokens(exampleQueryPrompt) * nQueryPrompts;

  // console.log('ENDPOINT:', endpoint);

  // console.log("Query parameter prompts: ",Object.keys(queryParameterPrompts));
  // console.log("Response body prompts: ", Object.keys(responseBodyPrompts));
  // console.log("Request body parameter prompts: ", Object.keys(requestBodyParameterPrompts));

  // console.log("Endpoint tokens: ", endpointTokens);
  // console.log("Estimated response tokens: ", estimatedResponseTokens);
  // console.log("Estimated request tokens: ", estimatedRequestTokens);
  // console.log("Estimated query tokens: ", estimatedQueryTokens);

  // console.log('nReqPrompts: ', nReqPrompts);
  // console.log('nResPrompts: ', nResPrompts);
  // console.log('nQueryPrompts: ', nQueryPrompts);

  return endpointTokens + estimatedResponseTokens + estimatedRequestTokens + estimatedQueryTokens;
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
