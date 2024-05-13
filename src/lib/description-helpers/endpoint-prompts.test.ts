import { it, expect, describe } from "vitest";
import { getEndpointPrompt } from "./endpoint-prompt.ts";
import { methodDetailsToString } from "./endpoint-parsers.ts";
import { endpoint } from "../__fixtures__/endpoint.ts";


describe("getEndpointPrompt", () => {
    it("basic", () => {
       const out = getEndpointPrompt(methodDetailsToString(endpoint.data.methods.POST, 'POST', 'api.example.com/users/:userId/orders'));
       expect(out).toEqual(`You are an expert programmer. Your task is to write an OpenAPI description for the API_ENDPOINT in 1 sentence and a maximum of 20 words. Follow the RULES.

RULES:
1. Focus on useful information for a programmer.
2. BE CONCISE
3. DO NOT repeat the API method, parameter names, parameter types or the website the API is hosted on

EXAMPLES:
"""
- Update a deal by id
- Retrieves page revisions and information about the page
- Search contacts by name or filter by attributes
"""

API_ENDPOINT:
"""
POST: api.example.com/users/:userId/orders

No query parameters

Example request body:
{"products":[{"productId":1,"quantity":2},"... (1 items not shown)"],"shippingAddress":{"street":"123 Main St","city":"Anytown","country":"USA"}}

Example response (status: 200):
{"id":1,"status":"pending","products":[{"productId":1,"quantity":2,"price":10.99},"... (1 items not shown)"]}
"""`);
    });
    it("with query parameters", () => {
        // Double JSON for deepcopy
        const localEndpoint = JSON.parse(JSON.stringify(endpoint));
        // TODO: Look into why it's nested inside queryParameters (not in OpenAPI format)
        localEndpoint.data.methods.POST.queryParameters = {
            parameters: {
                properties: {
                    userId: {type: "integer"},
                    q: {type: "string"},
                    ids: {type: "string"},
                    noExample: {type: "string"}
                }
                }, mostRecent: {
            userId: "1",
            q: "%7B%22item.id%22%3A%5B1561318380311%5D%7D",
                ids: "1561318380311,1561318380348,1561318380383,1561318380405,1561318380420,1561318380448,1561318380476,1561318380479,1561318380494,1561318380515,1561318380527,1561318380536,1561318380551,1561318380584,1561318380602,1561318380605,1561318380614,1561318380617,1561318380620,1561318380623,1561318380627,1561318380638,1561318380646,1561318380663,1561318380674,1561318380680,1561318380703,1561318380721,1561318380724,1561318380733,1561318380742,1561318380745,1561318380758,1561318380765,1561318380775,1561318380791,1561318380794,1561318380797,1561318380806,1561318380839,1561318380842,1561318380845,1561318380854,1561318380884,1561318380896,1561318380914,1561318380925,1561318380944,1561318380953,1561318380974,1561318380989,1561318380997,1561318381014,1561318381034,1561318381038,1561318381046,1561318381067,1561318381070,1561318381086,1561318381097,1561318381104,1561318381118,1561318381122,1561318381127,1561318381130,1561318381133,1561318381139,1561318381145,1561318381159,1561318381164,1561318381170,1561318381176,1561318381205,1561318381214,1561318381220,1561318381226,1561318381241,1561318381259,1561318381267,1561318381271,1561318381280,1561318381283,1561318381286,1561318381289,1561318381292,1561318381295,1561318381304,1561318381311,1561318381346,1561318381418,1561318381455,1561318381473,1561318381484,1561318381496,1561318381514,1561318381517,1561318381523,1561318381535,1561318381550,1561318381556"
            }};
       const out = getEndpointPrompt(methodDetailsToString(localEndpoint.data.methods.POST, 'POST', 'api.example.com/users/:userId/orders'));
       expect(out).toEqual(`You are an expert programmer. Your task is to write an OpenAPI description for the API_ENDPOINT in 1 sentence and a maximum of 20 words. Follow the RULES.

RULES:
1. Focus on useful information for a programmer.
2. BE CONCISE
3. DO NOT repeat the API method, parameter names, parameter types or the website the API is hosted on

EXAMPLES:
"""
- Update a deal by id
- Retrieves page revisions and information about the page
- Search contacts by name or filter by attributes
"""

API_ENDPOINT:
"""
POST: api.example.com/users/:userId/orders

Query Parameters (in TS format):
{
userId: integer // Example: 1
q: string // Example: {"item.id":[1561318380311]}
ids: string // Example: 1561318380311,1561318380348,1561318380383,1561318380405,1561318380420,1561318380448,156...
noExample: string
}

Example request body:
{"products":[{"productId":1,"quantity":2},"... (1 items not shown)"],"shippingAddress":{"street":"123 Main St","city":"Anytown","country":"USA"}}

Example response (status: 200):
{"id":1,"status":"pending","products":[{"productId":1,"quantity":2,"price":10.99},"... (1 items not shown)"]}
"""`);
    });
})