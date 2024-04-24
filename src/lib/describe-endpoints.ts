import { Endpoint } from "../utils/types"; //, Leaf, PartType }
import { methodDetailsToString } from "../ui/helpers/endpoint-parsers"
import callOpenAI from "./callOpenAI";

export async function describeApiEndpoint(endpoint: Endpoint, model: string) {

  // const partsString = endpoint.parts.map(part => `${part.part} (type: ${part.type})`).join(', ');

  const methodsString = Object.entries(endpoint.data.methods).map(([method, details]) => {
        return `${method.toUpperCase()}: ` + methodDetailsToString(details);  
        }).join('\n');

  let endpointPrompt = `Concisely describe the functionality of this API endpoint. Here is an example request and response: ${methodsString}.`;
  
  console.log('Endpoint Prompt', endpointPrompt, model); //

  const endpointDescription = await callOpenAI(endpointPrompt, model); 

  return endpointDescription.choices[0].message.content;
}


