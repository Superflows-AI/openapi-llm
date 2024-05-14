import { Endpoint, Method } from "../../utils/types";
import requestStore from "../../ui/helpers/request-store";

export function getEndpointMethodIdentifier(endpoint: Endpoint, method: string): string {
  return `${endpoint.host}${endpoint.pathname}/${method}`;
}
export function getEndpointIdentifier(endpoint: Endpoint): string {
    return `${endpoint.host}${endpoint.pathname}`;
  }

export function getAllEndpointMethodIdentifiers(endpoint: Endpoint): Array<string> {
const endpointMethodIdentifiers = Object.keys(endpoint.data.methods);

return endpointMethodIdentifiers.map(method => getEndpointMethodIdentifier(endpoint, method));
}

export function mergeDescriptions(endpoints: Array<Endpoint>, selectedEndpoints: Set<string>): Array<Endpoint> {
    const descriptions = requestStore.getEndpointDescriptions();
    const requestBodySchemaParamDescriptions = requestStore.requestBodySchemaParamDescriptions;
    const responseBodySchemaParamDescriptions = requestStore.responseBodySchemaParamDescriptions;
    const queryParamDescriptions = requestStore.getQueryParamDescriptions();

    return endpoints.map(endpoint => {
        const ids = getAllEndpointMethodIdentifiers(endpoint);
        let shouldReturnOriginal = true;

        for (const id of ids) {
            if (selectedEndpoints.has(id)) {
                shouldReturnOriginal = false;
                const description = descriptions[id] || "";
                if (description) {
                    const mergedMethodsWithRequestBody = mergeParamDescriptions(
                        endpoint.data.methods,
                        requestBodySchemaParamDescriptions,
                        id
                    );
            
                    const mergedMethodsWithResponseBody = mergeParamDescriptions(
                        mergedMethodsWithRequestBody,
                        responseBodySchemaParamDescriptions,
                        id
                    );
            
                    const mergedMethodsWithQueryParams = mergeParamDescriptions(
                        mergedMethodsWithResponseBody,
                        queryParamDescriptions,
                        id
                    );
            
                    return {
                        ...endpoint,
                        description,
                        data: {
                            ...endpoint.data,
                            methods: mergedMethodsWithQueryParams
                        }
                    };
                }
            }
        }

        // If no selected endpoint modifies this endpoint, return it unchanged
        return shouldReturnOriginal ? endpoint : undefined;
    }).filter(endpoint => endpoint !== undefined) as Endpoint[]; // Filter out any undefined elements to satisfy TypeScript's type checking
}

  
function mergeParamDescriptions(
    obj: Method,
    paramDescriptions: Record<string, Record<string, string | null>>,
    endpointId: string
): Method {

    const mergedParams = JSON.parse(JSON.stringify(obj));

    // Extract the endpoint ID from the obj parameter

    // Check if paramDescriptions contains the extracted endpointId
    if (!paramDescriptions[endpointId]) {
        return mergedParams; // Return the original method object if no descriptions for this endpoint
    }

    // Iterate through the parameter descriptions for the specific endpoint
    Object.keys(paramDescriptions[endpointId]).forEach(paramPath => {
        const pathParts = paramPath.split('|');
        const methodType = pathParts[0].toUpperCase();
        if (mergedParams[methodType]) {
            let currentLevel = mergedParams[methodType];

            for (let i = 1; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                if (!currentLevel[part]) {
                    currentLevel[part] = {};
                }
                currentLevel = currentLevel[part];
            }
            const paramName = pathParts[pathParts.length - 1];

            if (currentLevel[paramName]) {
                currentLevel[paramName] = {
                    ...currentLevel[paramName],
                    description: paramDescriptions[endpointId][paramPath]
                };
            }
        }
    });

    return mergedParams as Method;
}
