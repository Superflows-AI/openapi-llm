import { createContext } from "react";
import RequestStore from "../lib/RequestStore";
import { Endpoint, EndpointsByHost, OverlengthEndpoints, TokenCounts } from "../utils/types";
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
  overlengthEndpoints: OverlengthEndpoints;
  setOverlengthEndpoints: (overlengthEndpoints: OverlengthEndpoints) => void;
  endpointTokenCounts: TokenCounts
  describeSelectedEndpoints: (selectedEndpoints: Set<string>) => void;
  endpointDescriptions: { [endpointId: string]: string }
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
  overlengthEndpoints: [],
  setOverlengthEndpoints: () => {},
  endpointTokenCounts: {},
  describeSelectedEndpoints: () => {},
  endpointDescriptions: {}
};

const Context = createContext<ContextType>(defaultContextValue);

export default Context;
