import { it, expect, describe } from "vitest";
import {  getParameterPaths, getExample } from "./endpoint-parsers"; //getResponseParameterExample,
import { endpoint } from "../__fixtures__/endpoint";

describe('getParameterPaths', () => {
  it('should return the correct parameter paths and example paths for the endpoint', () => {
    const expectedPaths = [
        "POST|request|application/json|body|properties|products|items|properties|productId",
        "POST|request|application/json|body|properties|products|items|properties|quantity",
        'POST|request|application/json|body|properties|shippingAddress|properties|street',
        'POST|request|application/json|body|properties|shippingAddress|properties|city',
        'POST|request|application/json|body|properties|shippingAddress|properties|country',
        'POST|response|200|application/json|body|properties|id',
        'POST|response|200|application/json|body|properties|status',
        'POST|response|200|application/json|body|properties|items|items|properties|products|items|properties|productId',
        'POST|response|200|application/json|body|properties|items|items|properties|products|items|properties|quantity',
        'POST|response|200|application/json|body|properties|items|items|properties|products|items|properties|price',
    ];

    const parameterPaths = getParameterPaths(endpoint);
    expect(parameterPaths).toEqual(expectedPaths);
  });
});

describe('getExample', () => {
  it('should return the correct example value for a given parameter path', () => {
    const testCases = [
      {
        parameterPath: 'POST|request|application/json|body|properties|items|products|properties|productId',
        expectedExample: 1,
      },
      {
        parameterPath: 'POST|request|application/json|body|properties|products|items|properties|quantity',
        expectedExample: 2,
      },
      {
        parameterPath: 'POST|request|application/json|body|properties|shippingAddress|properties|city',
        expectedExample: 'Anytown',
      },
      {
        parameterPath: 'POST|response|200|application/json|body|properties|items|products|properties|price',
        expectedExample: 10.99,
      },
    ];

    testCases.forEach(({ parameterPath, expectedExample }) => {
      const example = getExample(endpoint, parameterPath);
      expect(example).toEqual(expectedExample);
    });
  });

  it('should return the correct example value when the parameter is in an array of objects', () => {
    const parameterPath = 'POST|request|application/json|body|properties|items|products|properties|quantity';
    const expectedExample = 2;

    const example = getExample(endpoint, parameterPath);
    expect(example).toEqual(expectedExample);
  });

  it('should return undefined if the parameter path does not exist', () => {
    const nonExistentPath = 'POST|request|application/json|body|properties|nonExistent|properties|path';
    const example = getExample(endpoint, nonExistentPath);
    expect(example).toBeUndefined();
  });
});