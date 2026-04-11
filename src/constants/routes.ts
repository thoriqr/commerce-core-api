export const API_PREFIX = "/api";

export const PREFIX = {
  SUPER: "/super",
  ADMIN: "/admin",
  STORE: "/store",
  AUTH: "/auth",
  USER: "/user",
  SHIPPING: "/shipping",
  PAYMENT: "/payments",
  CART: "/cart"
} as const;

export const ROUTES = {
  ADMIN: `${API_PREFIX}${PREFIX.ADMIN}`,
  SUPER: `${API_PREFIX}${PREFIX.SUPER}`,
  STORE: `${API_PREFIX}${PREFIX.STORE}`,
  AUTH: `${API_PREFIX}${PREFIX.AUTH}`,
  USER: `${API_PREFIX}${PREFIX.USER}`,
  SHIPPING: `${API_PREFIX}${PREFIX.SHIPPING}`,
  PAYMENT: `${API_PREFIX}${PREFIX.PAYMENT}`,
  CART: `${API_PREFIX}${PREFIX.CART}`
} as const;
