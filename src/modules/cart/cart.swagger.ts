import { ROUTES } from "@/constants/routes";
import { successResponse } from "@/docs/swagger/helpers/success.helper";
import { addItemSchema, deleteCartItemSchema, updateCartItemSchema } from "./cart.schema";
import { badRequestError } from "@/docs/swagger/helpers/error.helper";

const CART_BASE = `${ROUTES.CART}`;

export const cartSwagger = {
  tags: [
    {
      name: "Cart",
      description: "Shopping cart management for guest and authenticated users"
    }
  ],

  paths: {
    [`${CART_BASE}`]: {
      get: {
        tags: ["Cart"],
        summary: "Get cart",
        description: `
Retrieve the current cart.

This endpoint supports both guest and authenticated users:  

If authenticated, the cart is linked to the user.  
If not authenticated, a guest cart is managed using a cookie (\`cart_id\`).  
When a guest logs in, the cart will be merged automatically.

Note:  

This endpoint always returns a cart and does not return an error.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              variantId: { type: "number", example: 101 },
                              productId: { type: "number", example: 10 },
                              name: {
                                type: "string",
                                example: "Basic Backpack"
                              },
                              slug: {
                                type: "string",
                                example: "basic-backpack"
                              },
                              price: {
                                type: "number",
                                example: 250000
                              },
                              quantity: {
                                type: "number",
                                example: 1
                              },
                              stock: {
                                type: "number",
                                example: 5
                              },
                              imageKey: {
                                type: "string",
                                example: "products/example-image.webp"
                              },
                              options: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    value: {
                                      type: "string",
                                      example: "Black"
                                    },
                                    dimension: {
                                      type: "string",
                                      example: "Color"
                                    }
                                  }
                                }
                              },
                              isAvailable: {
                                type: "boolean",
                                example: true
                              },
                              warning: {
                                type: "string",
                                nullable: true,
                                example: "LOW_STOCK"
                              }
                            }
                          },
                          example: [
                            {
                              variantId: 101,
                              productId: 10,
                              name: "Basic Backpack",
                              slug: "basic-backpack",
                              price: 250000,
                              quantity: 1,
                              stock: 2,
                              imageKey: "products/example-image.webp",
                              options: [{ value: "Black", dimension: "Color" }],
                              isAvailable: true,
                              warning: "LOW_STOCK"
                            },
                            {
                              variantId: 202,
                              productId: 20,
                              name: "Plain T-Shirt",
                              slug: "plain-t-shirt",
                              price: 120000,
                              quantity: 2,
                              stock: 10,
                              imageKey: "products/example-shirt.webp",
                              options: [],
                              isAvailable: true,
                              warning: null
                            }
                          ]
                        },

                        summary: {
                          type: "object",
                          properties: {
                            totalItems: {
                              type: "number",
                              example: 3
                            },
                            subtotal: {
                              type: "number",
                              example: 490000
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    [`${CART_BASE}/items`]: {
      post: {
        tags: ["Cart"],
        summary: "Add item to cart",
        description: `
Add a product variant to the cart.

This endpoint supports both guest and authenticated users.  
A cart will be created automatically if none exists.  
If the same variant already exists in the cart, the quantity will be updated.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: addItemSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Item added to cart"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload")
        }
      }
    },

    [`${CART_BASE}/items/{variantId}`]: {
      patch: {
        tags: ["Cart"],
        summary: "Update cart item",
        description: `
Update the quantity of a cart item.

This endpoint supports both guest and authenticated users.  
A cart will be created automatically if none exists.

Note:  

Setting quantity to 0 will remove the item from the cart.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: updateCartItemSchema.pick({ variantId: true })
        },

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: updateCartItemSchema.pick({ quantity: true })
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Cart updated"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload")
        }
      },

      delete: {
        tags: ["Cart"],
        summary: "Remove item from cart",
        description: `
Remove a specific item from the cart.

This endpoint supports both guest and authenticated users.  
A cart will be created automatically if none exists.

Note:  

This is equivalent to setting the item quantity to 0 using the update endpoint.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: deleteCartItemSchema
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Item removed from cart"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload")
        }
      }
    }
  }
};
