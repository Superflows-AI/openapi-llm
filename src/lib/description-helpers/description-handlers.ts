import { Endpoint, Method } from "../../utils/types";
import requestStore from "../../ui/helpers/request-store";

export function getEndpointIdentifier(endpoint: Endpoint): string {
  return `${endpoint.host}${endpoint.pathname}`;
}

export function mergeDescriptions(endpoints: Array<Endpoint>): Array<Endpoint> {
    const descriptions = requestStore.getEndpointDescriptions();
    const requestBodySchemaParamDescriptions = requestStore.requestBodySchemaParamDescriptions;
    const responseBodySchemaParamDescriptions = requestStore.responseBodySchemaParamDescriptions;
    const queryParamDescriptions = requestStore.queryParamDescriptions;
  
    return endpoints.map(endpoint => {
        const id = getEndpointIdentifier(endpoint);
        const description = descriptions[id] || "";
  
        if (description) {
            const mergedMethodsWithRequestBody = mergeParamDescriptions(
                endpoint.data.methods,
                requestBodySchemaParamDescriptions,
            );
  
            const mergedMethodsWithResponseBody = mergeParamDescriptions(
                mergedMethodsWithRequestBody,
                responseBodySchemaParamDescriptions,
            );
  
            const mergedMethodsWithQueryParams = mergeParamDescriptions(
              mergedMethodsWithResponseBody,
              queryParamDescriptions,
            )
  
            return {
                ...endpoint,
                description,
                data: {
                    ...endpoint.data,
                    methods: mergedMethodsWithQueryParams
                }
            };
        } else { 
            return endpoint;
        }
    });
  }
  
  
function mergeParamDescriptions (
    obj: Method,
    paramDescriptions: Record<string, Record<string, string | null>>,
): Method {

    const mergedParams = JSON.parse(JSON.stringify(obj));

    Object.keys(paramDescriptions).forEach(endpointId => {
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
                currentLevel[paramName] = {
                    ...currentLevel[paramName],
                    description: paramDescriptions[endpointId][paramPath]
                };
            }
        });
    });
    return mergedParams as Method;
}
