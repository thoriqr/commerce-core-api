import { ROUTES } from "@/constants/routes";
import { badRequestError, notFoundError, unauthorizedError } from "@/docs/swagger/helpers/error.helper";
import { addressIdParamsSchema, updateProfileSchema, upsertAddressSchema } from "./user.schema";
import { successResponse } from "@/docs/swagger/helpers/success.helper";

const USER_BASE = `${ROUTES.USER}`;

export const userSwagger = {
  tags: [
    {
      name: "User Profile",
      description: "Authenticated user profile and account information"
    },
    {
      name: "User Addresses",
      description: "User address management"
    }
  ],

  paths: {
    [`${USER_BASE}/profile`]: {
      get: {
        tags: ["User Profile"],
        summary: "Get user profile",
        description: `
Retrieve the currently authenticated user's profile information.

Includes account details, default address, and linked authentication providers.
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
                        id: { type: "number", example: 1 },
                        email: {
                          type: "string",
                          example: "user@example.com"
                        },
                        displayName: {
                          type: "string",
                          example: "John Doe"
                        },
                        role: {
                          type: "string",
                          example: "USER"
                        },
                        status: {
                          type: "string",
                          example: "ACTIVE"
                        },
                        hasPassword: {
                          type: "boolean",
                          example: true
                        },

                        defaultAddress: {
                          type: "object",
                          nullable: true,
                          properties: {
                            id: { type: "number", example: 10 },
                            label: {
                              type: "string",
                              example: "Home"
                            },
                            recipientName: {
                              type: "string",
                              example: "John Doe"
                            },
                            phone: {
                              type: "string",
                              example: "081234567890"
                            },
                            addressLine: {
                              type: "string",
                              example: "Jl. Contoh No. 123"
                            },
                            cityName: {
                              type: "string",
                              example: "SURABAYA"
                            },
                            provinceName: {
                              type: "string",
                              example: "JAWA TIMUR"
                            },
                            districtName: {
                              type: "string",
                              example: "TEGALSARI"
                            },
                            postalCode: {
                              type: "string",
                              example: "60262"
                            }
                          }
                        },

                        providers: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              provider: {
                                type: "string",
                                example: "GOOGLE"
                              },
                              providerEmail: {
                                type: "string",
                                example: "user@gmail.com"
                              },
                              providerDisplayName: {
                                type: "string",
                                example: "John"
                              },
                              providerAvatarUrl: {
                                type: "string",
                                example: "https://example.com/avatar.jpg"
                              }
                            }
                          },
                          example: [
                            {
                              provider: "GOOGLE",
                              providerEmail: "user@gmail.com",
                              providerDisplayName: "John",
                              providerAvatarUrl: "https://example.com/avatar.jpg"
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError()
        }
      },

      put: {
        tags: ["User Profile"],
        summary: "Update user profile",
        description: `
Update the authenticated user's profile information.

Currently supports updating display name.
Additional fields may be added in the future.
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
              schema: updateProfileSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Profile updated"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError()
        }
      }
    },

    [`${USER_BASE}/addresses`]: {
      get: {
        tags: ["User Addresses"],
        summary: "Get user addresses",
        description: `
Retrieve all saved addresses for the authenticated user.

Includes a limit value to indicate the maximum number of addresses allowed.
This can be used by the frontend to control address creation (e.g. disable add button).
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
                        addresses: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "number", example: 1 },
                              label: {
                                type: "string",
                                example: "Home"
                              },
                              recipientName: {
                                type: "string",
                                example: "John Doe"
                              },
                              phone: {
                                type: "string",
                                example: "081234567890"
                              },
                              addressLine: {
                                type: "string",
                                example: "Jl. Contoh No. 123"
                              },
                              provinceName: {
                                type: "string",
                                example: "JAWA TIMUR"
                              },
                              cityName: {
                                type: "string",
                                example: "SURABAYA"
                              },
                              districtName: {
                                type: "string",
                                example: "TEGALSARI"
                              },
                              postalCode: {
                                type: "string",
                                example: "60262"
                              },
                              isDefault: {
                                type: "boolean",
                                example: true
                              }
                            }
                          },
                          example: [
                            {
                              id: 1,
                              label: "Home",
                              recipientName: "John Doe",
                              phone: "081234567890",
                              addressLine: "Jl. Contoh No. 123",
                              provinceName: "JAWA TIMUR",
                              cityName: "SURABAYA",
                              districtName: "TEGALSARI",
                              postalCode: "60262",
                              isDefault: true
                            },
                            {
                              id: 2,
                              label: "Office",
                              recipientName: "John Doe",
                              phone: "081234567890",
                              addressLine: "Jl. Kantor No. 45",
                              provinceName: "DKI JAKARTA",
                              cityName: "JAKARTA SELATAN",
                              districtName: "KEBAYORAN BARU",
                              postalCode: "12130",
                              isDefault: false
                            }
                          ]
                        },

                        limit: {
                          type: "number",
                          example: 5,
                          description: "Maximum number of addresses allowed"
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError()
        }
      },

      post: {
        tags: ["User Addresses"],
        summary: "Create address",
        description: `
Create a new address for the authenticated user.

Used for storing shipping addresses.

Note:
- Address count may be limited based on system configuration.
- Default address handling may be managed separately.
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
              schema: upsertAddressSchema
            }
          }
        },

        responses: {
          201: {
            description: "Created",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Address created"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError()
        }
      }
    },

    [`${USER_BASE}/addresses/{addressId}`]: {
      get: {
        tags: ["User Addresses"],
        summary: "Get address detail",
        description: `
Retrieve a specific address for the authenticated user.

This endpoint is typically used to populate address forms for editing.
Returns location identifiers (province, city, district) instead of display names.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: addressIdParamsSchema
        },

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
                        recipientName: {
                          type: "string",
                          example: "John Doe"
                        },
                        label: {
                          type: "string",
                          example: "Home"
                        },
                        phone: {
                          type: "string",
                          example: "081234567890"
                        },
                        addressLine: {
                          type: "string",
                          example: "Jl. Contoh No. 123"
                        },
                        postalCode: {
                          type: "string",
                          example: "60262"
                        },
                        shippingProvinceId: {
                          type: "string",
                          example: "18"
                        },
                        shippingCityId: {
                          type: "string",
                          example: "577"
                        },
                        shippingDistrictId: {
                          type: "string",
                          example: "5874"
                        }
                      }
                    }
                  }
                }
              }
            }
          },

          401: unauthorizedError(),
          404: notFoundError("Address not found")
        }
      },

      put: {
        tags: ["User Addresses"],
        summary: "Update address",
        description: `
Update an existing address for the authenticated user.

All fields follow the same structure as create address.

Note:
- Default address handling may be managed separately.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: addressIdParamsSchema
        },

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: upsertAddressSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Address updated"
                })
              }
            }
          },

          400: badRequestError("Invalid request payload"),
          401: unauthorizedError(),
          404: notFoundError("Address not found")
        }
      },

      delete: {
        tags: ["User Addresses"],
        summary: "Delete address",
        description: `
Delete an address for the authenticated user.

This operation permanently removes the address from the user's address list.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: addressIdParamsSchema
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Address deleted"
                })
              }
            }
          },

          401: unauthorizedError(),
          404: notFoundError("Address not found")
        }
      }
    },

    [`${USER_BASE}/addresses/{addressId}/default`]: {
      patch: {
        tags: ["User Addresses"],
        summary: "Set default address",
        description: `
Set an address as the default for the authenticated user.

Only one address can be marked as default at a time.
Any previously set default address will be automatically unset.
`,

        security: [
          {
            cookieAuth: []
          }
        ],

        requestParams: {
          path: addressIdParamsSchema
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "Default address set"
                })
              }
            }
          },

          401: unauthorizedError(),
          404: notFoundError("Address not found")
        }
      }
    }
  }
};
