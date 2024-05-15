import { Endpoint, PartType } from '../../utils/types';
import { ValueType } from 'genson-js';

export const endpoint: Endpoint = {
  host: 'api.example.com',
  pathname: '/users/:userId/orders',
  parts: [
    { part: 'users', type: PartType.Static },
    { part: 'userId', type: PartType.Dynamic },
    { part: 'orders', type: PartType.Static },
  ],
  data: {
    pathname: '/users/:userId/orders',
    methods: {
      POST: {
        request: {
          'application/json': {
            body: {
              type: 'object' as ValueType,
              properties: {
                products: {
                  type: 'array' as ValueType,
                  items: {
                    type: 'object' as ValueType,
                    properties: {
                      productId: { type: 'integer' as ValueType },
                      quantity: { type: 'integer' as ValueType },
                    },
                    required: ['productId', 'quantity'],
                  },
                },
                shippingAddress: {
                  type: 'object' as ValueType,
                  properties: {
                    street: { type: 'string' as ValueType },
                    city: { type: 'string' as ValueType },
                    country: { type: 'string' as ValueType },
                  },
                  required: ['street', 'city', 'country'],
                },
              },
              required: ['items', 'shippingAddress'],
            },
            mostRecent: {
              products: [
                { productId: 1, quantity: 2 },
                { productId: 2, quantity: 1 },
              ],
              shippingAddress: {
                street: '123 Main St',
                city: 'Anytown',
                country: 'USA',
              },
            },
          },
        },
        response: {
          '200': {
            'application/json': {
              body: {
                type: 'object' as ValueType,
                properties: {
                  id: { type: 'integer' as ValueType },
                  status: {
                    anyOf: [
                      { type: 'string' as ValueType },
                    ],
                  },
                  items: {
                    type: 'array' as ValueType,
                    items: {
                      type: 'object' as ValueType,
                      properties: {
                        products: {
                          type: 'array' as ValueType,
                          items: {
                            type: 'object' as ValueType,
                            properties: {
                              productId: { type: 'integer' as ValueType },
                              quantity: { type: 'integer' as ValueType },
                              price: { type: 'number' as ValueType },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              mostRecent: {
                id: 1,
                status: 'pending',
                products: [
                      { productId: 1, quantity: 2, price: 10.99 },
                      { productId: 2, quantity: 1, price: 5.99 },
                    ],
                },
              },
            },
          },
        },
      },
    },
    description: 'Create a new order for a user',
  }
;



