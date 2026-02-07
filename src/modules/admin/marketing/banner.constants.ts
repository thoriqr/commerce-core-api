export const UPLOAD_FILE = {
  BANNER_FIELD: "bannerImage"
};

export const BANNER_PLACEMENT = {
  HOMEPAGE_HERO: "homepage_hero"
} as const;

export const BANNER_TARGET_TYPE = {
  COLLECTION: "collection",
  CATEGORY: "category"
  // QUERY: "query"
} as const;

export const BANNER_PLACEMENT_OPTIONS = Object.values(BANNER_PLACEMENT).map((value) => ({
  value,
  label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}));

export const BANNER_TARGET_TYPE_OPTIONS = Object.values(BANNER_TARGET_TYPE).map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1)
}));

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_IMG_FORMAT = ["jpeg", "png", "webp"] as const;

export const BANNER_IMAGE_MAX_SIZE = {
  width: 2560,
  height: 1440
} as const;

export const BANNER_IMAGE_MIN_SIZE = {
  width: 1200,
  height: 400
} as const;
