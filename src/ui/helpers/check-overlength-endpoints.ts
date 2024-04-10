import { Endpoint } from "../../utils/types";
import countTokens from './count-tokens';

export function isEndpointOverLength(endpoint: Endpoint, maxLength: number): boolean {
  const combinedString = endpoint.pathname + endpoint.parts.map(partObj => partObj.part).join('');

  // Use the countTokens function from the JavaScript file
  const tokenCount = countTokens(combinedString);

  return tokenCount > maxLength;
}