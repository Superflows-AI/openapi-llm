import { createContext } from "react";
import RequestStore from "../lib/RequestStore";
import { Endpoint, EndpointsByHost } from "../utils/types";
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
  selectedEndpoints: Set<string>; // Added state for selected endpoints
  setSelectedEndpoints: (selectedEndpoints: Set<string>) => void; // Function to update the selected endpoints
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
  selectedEndpoints: new Set(), // Initialize with an empty set
  setSelectedEndpoints: () => {}, // Placeholder function
};

const Context = createContext<ContextType>(defaultContextValue);

export default Context;
