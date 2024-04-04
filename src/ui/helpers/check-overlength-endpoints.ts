import { Endpoint } from "../../utils/types";

export function isEndpointOverLength(endpoint: Endpoint, maxLength: number): boolean {
  // Calculate the total length of pathname and parts
  const totalLength = endpoint.pathname.length + endpoint.parts.reduce((total, partObj) => total + partObj.part.length, 0);

  // Compare with maxLength
  return totalLength > maxLength;
}
