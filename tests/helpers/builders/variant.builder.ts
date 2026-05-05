export function buildVariant(overrides: Partial<any> = {}) {
  return {
    clientId: "v1",
    price: 10000,
    stock: 10,
    weight: 100,
    status: "ACTIVE",
    isPrimary: true,
    options: [],
    ...overrides
  };
}
