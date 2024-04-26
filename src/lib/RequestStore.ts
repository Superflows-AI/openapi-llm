import { JSONType, RouterMap, LeafMap, Endpoint } from "../utils/types";
import {
  parameterise,
  insertLeafMap,
  upsert,
  persistOptions,
  leafMapToRouterMap,
  fastPathParameterIndices,
} from "./store-helpers";
import { omit, unset } from "lodash";
import leafMapToEndpoints from "./leafmap-to-endpoints";
import stringify from "json-stable-stringify";
import type { Entry } from "har-format";
import decodeUriComponent from "decode-uri-component";
import { isValidRequest, parseJSON } from "../utils/helpers";

export type Options = {
  // Includes additional data such as response samples
  enableMoreInfo: boolean;
};

/**
 * RequestStore handles routing to endpoints
 * Optimised for fast lookups & insertion via a Radix Tree
 */
export default class RequestStore {
  private store: RouterMap;
  private leafMap: LeafMap;
  private disabledHosts: Set<string>;
  public endpointDescriptions: Record<string, string>;
  public requestBodySchemaParamDescriptions: Record<string, Record<string, string | null>>;
  public responseBodySchemaParamDescriptions: Record<string, Record<string, string | null>>;
  public requestHeaderParamDescriptions: Record<string, Record<string, string | null>>;
  private storeOptions: Options;

  constructor(storeOptions = persistOptions.get()) {
    this.leafMap = {};
    this.store = {};
    this.disabledHosts = new Set();
    this.endpointDescriptions = {};
    this.requestBodySchemaParamDescriptions = {};
    this.responseBodySchemaParamDescriptions = {};
    this.requestHeaderParamDescriptions = {};
    this.storeOptions = storeOptions;
  }

  public options = (options?: Partial<Options>): Readonly<Options> => {
    if (!options) return this.storeOptions;
    this.storeOptions = { ...this.storeOptions, ...options };
    persistOptions.set(this.storeOptions);
    return Object.freeze(this.storeOptions);
  };

  public import(json: string): boolean {
    try {
      const { leafMap, disabledHosts, endpointDescriptions, requestBodySchemaParamDescriptions, responseBodySchemaParamDescriptions, requestHeaderParamDescriptions } = JSON.parse(json);
      this.disabledHosts = new Set(disabledHosts);
      this.endpointDescriptions = endpointDescriptions;
      this.requestBodySchemaParamDescriptions = requestBodySchemaParamDescriptions;
      this.responseBodySchemaParamDescriptions = responseBodySchemaParamDescriptions;
      this.requestHeaderParamDescriptions = requestHeaderParamDescriptions;
      this.store = leafMapToRouterMap(leafMap);
      this.leafMap = leafMap;
      return true;
    } catch {
      return false;
    }
  }

  public export = (): string => {
    return stringify({
      leafMap: this.leafMap,
      disabledHosts: Array.from(this.disabledHosts),
      endpointDescriptions: this.endpointDescriptions,
      requestBodySchemaParamDescriptions: this.requestBodySchemaParamDescriptions,
      responseBodySchemaParamDescriptions: this.responseBodySchemaParamDescriptions,
      requestHeaderParamDescriptions: this.requestHeaderParamDescriptions,
    }).trim();
  };

  public clear(): void {
    this.store = {};
    this.leafMap = {};
    this.disabledHosts = new Set();
  }

  public endpoints(): Array<Endpoint> {
    const withoutDisabled = omit(
      this.leafMap,
      Array.from(this.disabledHosts)
    ) as Readonly<typeof this.leafMap>;
  
    // Get the endpoint descriptions
    const descriptions = this.endpointDescriptions;
  
    // Map the leafMap to an array of endpoints, including descriptions
    return leafMapToEndpoints(withoutDisabled).map(endpoint => {
      const id = `${endpoint.host}${endpoint.pathname}`;
      const description = descriptions[id];
      return {
        ...endpoint,
        description,
      };
    });
  }

  public get(): Readonly<RouterMap> {
    return omit(this.store, Array.from(this.disabledHosts)) as Readonly<
      typeof this.store
    >;
  }

  public hosts(): Array<string> {
    return Object.keys(this.store);
  }

  public insert(harRequest: Entry, content: string): boolean {
    if (!isValidRequest(harRequest, content)) return false;
    harRequest.request.url = decodeUriComponent(harRequest.request.url);
    const responseBody: JSONType = parseJSON(content);
    const result = upsert({
      harRequest,
      responseBody,
      store: this.store,
      options: this.storeOptions,
    });
    if (!result) return false;
    const { insertedPath, insertedLeaf, insertedHost } = result;
  
    // Get the existing description for the inserted path
    const description = this.endpointDescriptions[`${insertedHost}${insertedPath}`];
  
    insertLeafMap({
      leafMap: this.leafMap,
      host: insertedHost,
      leaf: { ...insertedLeaf, description },
      path: insertedPath,
    });
  
    let pathname = insertedPath;
    for (const idx of fastPathParameterIndices(pathname)) {
      const newPathname = this.parameterise(idx, pathname, insertedHost);
      if (newPathname) pathname = newPathname;
    }
    return true;
  }

  public parameterise(
    index: number,
    path: string,
    host: string
  ): string | null {
    const result = parameterise({ store: this.store, index, path, host });
    if (!result) return null;
    const { removedPaths, insertedPath, insertedLeaf } = result;
    const unsetLeafMap = (path: string) => unset(this.leafMap[host], path);
    removedPaths.concat([path]).forEach(unsetLeafMap);
  
    // Update the endpointDescriptions object with the description for the inserted path
    const oldDescription = this.endpointDescriptions[`${host}${path}`];
    if (oldDescription) {
      this.endpointDescriptions[`${host}${insertedPath}`] = oldDescription;
      delete this.endpointDescriptions[`${host}${path}`];
    }
  
    insertLeafMap({
      leafMap: this.leafMap,
      host,
      leaf: insertedLeaf,
      path: insertedPath,
    });
  
    return insertedPath;
  }

  public setEndpointDescriptions(endpointDescriptions: Record<string, string>): void {
    this.endpointDescriptions = endpointDescriptions;
  }

  public getEndpointDescriptions(): Record<string, string> {
    return this.endpointDescriptions;
  }

  public setDisabledHosts(disabledHosts: Set<string>): void {
    this.disabledHosts = disabledHosts;
  }

  public setRequestBodySchemaParamDescriptions(descriptions: Record<string, Record<string, string | null>>): void {
    this.requestBodySchemaParamDescriptions = descriptions;
  }

  public getRequestBodySchemaParamDescriptions(): Record<string, Record<string, string | null>> {
    return this.requestBodySchemaParamDescriptions;
  }
  
  public setResponseBodySchemaParamDescriptions(descriptions: Record<string, Record<string, string | null>>): void {
    this.responseBodySchemaParamDescriptions = descriptions;
  }

  public getResponseBodySchemaParamDescriptions(): Record<string, Record<string, string | null>> {
    return this.responseBodySchemaParamDescriptions;
  }

  public setRequestHeaderParamDescriptions(descriptions: Record<string, Record<string, string | null>>): void {
    this.requestHeaderParamDescriptions = descriptions;
  }

  public getRequestHeaderParamDescriptions(): Record<string, Record<string, string | null>> {
    return this.requestHeaderParamDescriptions;
  }

}
