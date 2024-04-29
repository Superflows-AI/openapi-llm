import { Endpoint } from "../../utils/types";
import requestStore from "../../ui/helpers/request-store";
import { describeApiEndpoint, describeRequestBodySchemaParameters,describeQueryParameters, describeResponseBodySchemaParameters } from "../describe-endpoints"; // describeRequestHeaders

export function getEndpointIdentifier(endpoint: Endpoint): string {
  return `${endpoint.host}${endpoint.pathname}`;
}

export function mergeDescriptions(endpoints: Array<Endpoint>): Array<Endpoint> {
  const descriptions = requestStore.getEndpointDescriptions();
  const requestBodySchemaParamDescriptions = requestStore.requestBodySchemaParamDescriptions;
  const responseBodySchemaParamDescriptions = requestStore.responseBodySchemaParamDescriptions;
  const queryParamDescriptions = requestStore.queryParamDescriptions;

  const mergeParamDescriptions = (
      obj: Record<string, any>,
      paramDescriptions: Record<string, Record<string, string | null>>,
      logging: Boolean,
  ): Record<string, any> => {
      const mergedParams: Record<string, any> = JSON.parse(JSON.stringify(obj));

      if (logging) {
        console.log('Prev methods:', obj);
        console.log('Param descriptions:', paramDescriptions);
      }

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
                  if (logging) {
                    console.log('Current level:', currentLevel[paramName]);
                  }
                  
              }
          });
      });

      if (logging) {
        console.log('Merged params:', mergedParams);
      }
      
      return mergedParams;
  };

  return endpoints.map(endpoint => {
      const id = getEndpointIdentifier(endpoint);
      const description = descriptions[id] || "";

      if (description) {
          const mergedMethodsWithRequestBody = mergeParamDescriptions(
              endpoint.data.methods,
              requestBodySchemaParamDescriptions,
              false
          );

          const mergedMethodsWithResponseBody = mergeParamDescriptions(
              mergedMethodsWithRequestBody,
              responseBodySchemaParamDescriptions,
              false
          );

          const mergedMethodsWithQueryParams = mergeParamDescriptions(
            mergedMethodsWithResponseBody,
            queryParamDescriptions,
            true
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


export async function describeSelectedEndpoints(selectedEndpoints: Set<string>, endpoints: Endpoint[], requestStore: any, setSpecEndpoints: () => void): Promise<void> {
    const descriptions: Record<string, string> = {};
    const requestBodySchemaParams: Record<string, Record<string, string | null>> = {};
    const responseBodySchemaParams: Record<string, Record<string, string | null>> = {};
    const queryParams: Record<string, Record<string, string | null>> = {};

    for (const id of selectedEndpoints) {
        const endpoint = endpoints.find(ep => getEndpointIdentifier(ep) === id);
        if (endpoint) {
            const description = await describeApiEndpoint(endpoint, 'gpt-4');
            if (description !== null) {
                descriptions[id] = description;
            }
            requestBodySchemaParams[id] = await describeRequestBodySchemaParameters(endpoint, descriptions[id], 'gpt-4');
            responseBodySchemaParams[id] = await describeResponseBodySchemaParameters(endpoint, descriptions[id], 'gpt-4');
            queryParams[id] = await describeQueryParameters(endpoint, descriptions[id], 'gpt-4');
        }
    }

    requestStore.setEndpointDescriptions(descriptions);
    requestStore.setRequestBodySchemaParamDescriptions(requestBodySchemaParams);
    requestStore.setResponseBodySchemaParamDescriptions(responseBodySchemaParams);
    requestStore.setQueryParamDescriptions(queryParams);

    setSpecEndpoints();
}

