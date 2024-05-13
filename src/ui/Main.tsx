import { useState, useCallback, useEffect } from "react";
import { OpenAPIObject } from "openapi3-ts/oas31";
import { RedocStandalone } from "redoc";
import type RequestStore from "../lib/RequestStore";
import requestStore from "./helpers/request-store";
import { safelyGetURLHost } from "../utils/helpers";
import { EndpointsByHost, Endpoint, Status, TokenCounts, DescriptionStatus} from "../utils/types"; 
import Context from "./context";
import Control from "./Control";
import Start from "./Start";
import classes from "./main.module.css";
import endpointsToOAI31 from "../lib/endpoints-to-oai31";
import { sortEndpoints } from './helpers/endpoints-by-host';
import {  isEmpty } from "lodash"; //get,
import estimateEndpointTokens from "./helpers/count-tokens";
import { getEndpointIdentifier, mergeDescriptions } from "../lib/description-helpers/description-handlers";
import { describeApiEndpoint, describeRequestBodyParameters, describeResponseBodyParameters, describeQueryParameters } from "../lib/describe-endpoints"; // describeRequestHeaders,


function Main() {
  const [spec, setSpec] = useState<OpenAPIObject | null>(null);
  const [endpoints, setEndpoints] = useState<Array<Endpoint>>([]);

  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [endpointTokenCounts, setEndpointTokenCounts] = useState<TokenCounts>({});
  const [endpointsByHost, setEndpointsByHost] = useState<EndpointsByHost>([]);

  const [endpointDescriptions, setEndpointDescriptions] = useState<Record<string, string>>({});

  const [descriptionsLoading, setDescriptionsLoading] = useState<DescriptionStatus>(DescriptionStatus.INACTIVE);
  
  const [requestBodySchemaParamDescriptions, setRequestBodySchemaParamDescriptions] = useState<Record<string, Record<string, string | null>>>({});
  const [responseBodySchemaParamDescriptions, setResponseBodySchemaParamDescriptions] = useState<Record<string, Record<string, string | null>>>({});
  const [queryParamDescriptions, setQueryParamDescriptions] = useState<Record<string, Record<string, string | null>>>({});

  const [allHosts, setAllHosts] = useState<Set<string>>(new Set());
  const [disabledHosts, setDisabledHosts] = useState<Set<string>>(new Set());
  const initialStatus = isEmpty(requestStore.get())
    ? Status.INIT
    : Status.RECORDING;
  const [status, setStatus] = useState(initialStatus);

  const requestFinishedHandler = useCallback(
    (harRequest: chrome.devtools.network.Request) => {
      async function getCurrentTab() {
        try {
          harRequest.getContent((content) => {
            try {
              const contentStr = content || '';
              const wasInserted = requestStore.insert(harRequest, contentStr);
              if (!wasInserted) return;
              const host = safelyGetURLHost(harRequest.request.url);
              const path = new URL(harRequest.request.url).pathname;
              const id = `${host}${path}`;

              if (!requestStore.getEndpointDescriptions()[id]) {
                setSpecEndpoints();
              }
              if (host && !allHosts.has(host)) {
                setAllHosts((prev) => new Set(prev).add(host));
              }
            } catch {
              return;
            }
          });
        } catch {
          return;
        }
      }
  
      getCurrentTab();
    },
    []
  );

  useEffect(() => {
    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(
        requestFinishedHandler
      );
    };
  }, []);

  const fetchTokenCounts = async (endpoint: Endpoint) => {
      
      const newTokenCounts = requestStore.getEndpointTokenCounts();
      const identifier = getEndpointIdentifier(endpoint);
      const tokenCost = await estimateEndpointTokens(endpoint);
      // const tokenCount = 1000;

      newTokenCounts[identifier] = tokenCost;
    
    setEndpointTokenCounts(newTokenCounts);
    requestStore.setEndpointTokenCounts(newTokenCounts);
  };

  const setSpecEndpoints = useCallback(async () => {
    const nextEndpoints = requestStore.endpoints();
    const updatedEndpoints = mergeDescriptions(nextEndpoints);
    const currentTokenCounts = requestStore.getEndpointTokenCounts();

    for (const endpoint of nextEndpoints) {
      const identifier = getEndpointIdentifier(endpoint);

      if (!currentTokenCounts[identifier]) {
        fetchTokenCounts(endpoint);
      }
    }
    setEndpoints(sortEndpoints(updatedEndpoints));

    setSpec(
      endpointsToOAI31(
        updatedEndpoints,
        requestStore.options(),
      ).getSpec()
    );
  }, []);


  useEffect(() => {
    requestStore.setDisabledHosts(disabledHosts);
    setEndpointDescriptions(endpointDescriptions)
    requestStore.setEndpointDescriptions(endpointDescriptions);
    mergeDescriptions(endpoints);
    setSpecEndpoints();
  }, [disabledHosts, endpointDescriptions]);

  useEffect(() => {
    switch (status) {
      case Status.INIT:
        chrome.devtools.network.onRequestFinished.removeListener(
          requestFinishedHandler
        );
        requestStore.clear();
        setSpec(null);
        setAllHosts(new Set());
        setDisabledHosts(new Set());
        
        break;
      case Status.STOPPED:
        chrome.devtools.network.onRequestFinished.removeListener(
          requestFinishedHandler
        );
        break;
      case Status.RECORDING:
        chrome.devtools.network.onRequestFinished.removeListener(
          requestFinishedHandler
        );
        chrome.devtools.network.onRequestFinished.addListener(
          requestFinishedHandler
        );
        break;
    }
  }, [status]);

  const parameterise = useCallback<typeof RequestStore.prototype.parameterise>(
    (index, path, host) => {
      requestStore.parameterise(index, path, host);
      setSpecEndpoints();
      return null;
    },
    []
  );

  const start = useCallback(() => {
    setStatus(Status.RECORDING);
  }, []);

  const stop = useCallback(() => {
    setStatus(Status.STOPPED);
  }, []);

  const clear = useCallback(() => {
    setStatus(Status.INIT);
  }, []);

  const importFn = useCallback((json: string) => {
    const result = requestStore.import(json);

    setSpecEndpoints();
    setAllHosts(new Set(requestStore.hosts()));
    return result;
  }, []);


  const describeSelectedEndpoints = async (selectedEndpoints: Set<string>) => {

    const descriptions = requestStore.getEndpointDescriptions();
    const requestBodySchemaParams = requestStore.requestBodySchemaParamDescriptions;
    const responseBodySchemaParams = requestStore.responseBodySchemaParamDescriptions;
    const queryParams = requestStore.queryParamDescriptions;

    setDescriptionsLoading(DescriptionStatus.ACTIVE);

    for (const id of selectedEndpoints) {
      const endpoint = endpoints.find(ep => getEndpointIdentifier(ep) === id);
      if (endpoint) {
        const description = await describeApiEndpoint(endpoint, 'gpt-4');
        if (description !== null) {
          descriptions[id] = description;
        }

        const [requestBodySchemaDescription, responseBodySchemaDescription, queryParamDescription] = await Promise.all([
          describeRequestBodyParameters(endpoint, descriptions[id], 'gpt-4'),
          describeResponseBodyParameters(endpoint, descriptions[id], 'gpt-3.5-turbo'),
          describeQueryParameters(endpoint, descriptions[id], 'gpt-3.5-turbo')
        ]);

        requestBodySchemaParams[id] = requestBodySchemaDescription;
        responseBodySchemaParams[id] = responseBodySchemaDescription;
        queryParams[id] = queryParamDescription;
      }
    }
    requestStore.setEndpointDescriptions(descriptions);
    requestStore.setRequestBodySchemaParamDescriptions(requestBodySchemaParams);
    requestStore.setResponseBodySchemaParamDescriptions(responseBodySchemaParams);
    requestStore.setQueryParamDescriptions(queryParams);

    setSpecEndpoints();
    setDescriptionsLoading(DescriptionStatus.COMPLETED);
    await delay(5000);
    setDescriptionsLoading(DescriptionStatus.INACTIVE);
  };

  function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
  useEffect(() => {
    const updatedEndpoints = mergeDescriptions(
      endpoints)
    setSpec(
      endpointsToOAI31(
        updatedEndpoints,
        requestStore.options(),
      ).getSpec()
    );
  }, [endpoints]);

  if (status === Status.INIT) {
    return <Start start={start} />;
  }

  return (
    <Context.Provider
      value={{
        allHosts,
        setAllHosts,
        endpointsByHost,
        setEndpointsByHost,
        disabledHosts,
        setDisabledHosts,
        parameterise,
        endpoints,
        export: requestStore.export,
        import: importFn,
        options: requestStore.options,
        selectedEndpoints, 
        setSelectedEndpoints,
        endpointTokenCounts,
        describeSelectedEndpoints,
        endpointDescriptions,
        requestBodySchemaParamDescriptions,
        setRequestBodySchemaParamDescriptions,
        responseBodySchemaParamDescriptions,
        setResponseBodySchemaParamDescriptions,
        queryParamDescriptions,
        setQueryParamDescriptions,
        descriptionsLoading
      }}
    >
      <div className={classes.wrapper}>
        <Control start={start} stop={stop} clear={clear} status={status} />
        <RedocStandalone
          spec= {spec || {}}
          options={{
            hideHostname: true,
            sortEnumValuesAlphabetically: true,
            sortOperationsAlphabetically: true,
            sortPropsAlphabetically: true,
            hideLoading: true,
            nativeScrollbars: true,
            downloadFileName: 'openapi-devtools-spec.json',
            expandDefaultServerVariables: false,
            expandSingleSchemaField: false,

          }}
        />
      </div>
    </Context.Provider>
  );
}

export default Main;

