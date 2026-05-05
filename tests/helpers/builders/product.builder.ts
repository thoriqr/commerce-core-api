export function buildProductPayload(overrides: Partial<any> = {}) {
  return {
    name: "Test Product",
    description: "Valid product description",
    status: "ACTIVE",
    categoryId: 1,
    collectionIds: [1],
    images: [
      {
        sortOrder: 0,
        originalFileName: "test-image.png"
      }
    ],
    variantDimension: [
      {
        id: "color",
        name: "Color",
        options: [
          { id: "red", value: "Red" },
          { id: "blue", value: "Blue" }
        ]
      }
    ],
    variants: [
      {
        clientId: "v1",
        price: 10000,
        stock: 10,
        weight: 100,
        status: "ACTIVE",
        isPrimary: true,
        options: [{ dimensionId: "color", optionId: "red" }]
      },
      {
        clientId: "v2",
        price: 10000,
        stock: 5,
        weight: 100,
        status: "ACTIVE",
        isPrimary: false,
        options: [{ dimensionId: "color", optionId: "blue" }]
      }
    ],
    ...overrides
  };
}
