import { createContext } from "react";
import RequestStore from "../lib/RequestStore";
import { Endpoint, EndpointsByHost, TokenCounts } from "../utils/types";
import { defaultOptions } from "../lib/store-helpers/persist-options";

type ContextType = {
  endpoints: Endpoint[];
  endpointsByHost: EndpointsByHost;
  setEndpointsByHost: (endpointsByHost: EndpointsByHost) => void;
  allHosts: Set<string>;
  setAllHosts: (hosts: Set<string>) => void;
  disabledHosts: Set<string>;
  setDisabledHosts: (hosts: Set<string>) => void;
  parameterise: typeof RequestStore.prototype.parameterise;
  import: typeof RequestStore.prototype.import;
  export: typeof RequestStore.prototype.export;
  options: typeof RequestStore.prototype.options;
  selectedEndpoints: Set<string>;
  setSelectedEndpoints: (selectedEndpoints: Set<string>) => void;
  endpointTokenCounts: TokenCounts;
  describeSelectedEndpoints: (selectedEndpoints: Set<string>) => void;
  endpointDescriptions: { [endpointId: string]: string };
  requestBodySchemaParamDescriptions: Record<string, Record<string, string | null>>;
  setRequestBodySchemaParamDescriptions: (requestBodySchemaParamDescriptions: Record<string, Record<string, string | null>>) => void;
  responseBodySchemaParamDescriptions: Record<string, Record<string, string | null>>;
  setResponseBodySchemaParamDescriptions: (responseBodySchemaParamDescriptions: Record<string, Record<string, string | null>>) => void;
  requestHeaderParamDescriptions: Record<string, Record<string, string | null>>;
  setRequestHeaderParamDescriptions: (requestHeaderParamDescriptions: Record<string, Record<string, string | null>>) => void;
};

const defaultContextValue: ContextType = {
  endpoints: [],
  endpointsByHost: [],
  setEndpointsByHost: () => {},
  allHosts: new Set(),
  setAllHosts: () => {},
  disabledHosts: new Set(),
  setDisabledHosts: () => {},
  parameterise: () => null,
  import: () => false,
  export: () => "",
  options: () => defaultOptions,
  selectedEndpoints: new Set(),
  setSelectedEndpoints: () => {},
  endpointTokenCounts: {},
  describeSelectedEndpoints: () => {},
  endpointDescriptions: {},
  requestBodySchemaParamDescriptions: {},
  setRequestBodySchemaParamDescriptions: () => {},
  responseBodySchemaParamDescriptions: {},
  setResponseBodySchemaParamDescriptions: () => {},
  requestHeaderParamDescriptions: {},
  setRequestHeaderParamDescriptions: () => {},
};
const Context = createContext<ContextType>(defaultContextValue);

export default Context;
