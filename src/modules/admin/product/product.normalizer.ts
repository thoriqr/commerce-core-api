export const normalizeName = (input: string) => input.trim().toLowerCase().replace(/\s+/g, "_");

export const displayName = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const normalizeValue = (input: string) => input.trim().toLowerCase();

export const displayValue = (input: string) => input.trim();

export const normalizeSku = (sku?: string) => {
  if (typeof sku !== "string") return null;

  const trimmed = sku.trim();
  return trimmed === "" ? null : trimmed;
};
