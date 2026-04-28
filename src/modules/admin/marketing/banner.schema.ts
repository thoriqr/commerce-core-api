import { BANNER_PLACEMENT, BANNER_TARGET_TYPE } from "@/shared/banner/banner.constants";
import { z } from "zod";
import { ALLOWED_IMG_FORMAT, ALLOWED_TYPES, BANNER_IMAGE_MIN_SIZE, UPLOAD_FILE } from "./banner.constants";

const MAX_TITLE = 100;

const cropSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
});

const imageSchema = z.object({
  id: z.string().min(1),
  originalFileName: z.string().optional(),
  crop: z
    .preprocess((val) => {
      if (typeof val === "string") return JSON.parse(val);
      return val;
    }, cropSchema)
    .optional()
});

export const bannerUpsertSchema = z
  .object({
    image: imageSchema,
    title: z.string().min(1).max(MAX_TITLE),
    placement: z.enum([BANNER_PLACEMENT.HOMEPAGE_HERO]),
    targetType: z.enum([BANNER_TARGET_TYPE.COLLECTION, BANNER_TARGET_TYPE.CATEGORY]),
    targetId: z.coerce.number().min(1).positive().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"])
  })
  .refine((data) => data.targetId !== undefined, {
    message: "targetId is required for category / collection",
    path: ["targetId"]
  });

export const bannerIdParams = z.object({
  bannerId: z.coerce.number()
});

export const imageIdParams = z.object({
  imageId: z.coerce.number()
});

export const bannerReorderSchema = z
  .array(
    z.object({
      id: z.number().positive(),
      sortOrder: z.number().positive()
    })
  )
  .min(1);

export const bannerImagesQueryParams = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.enum(["created_at"]).default("created_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc")
});

export type BannerUpsertSchema = z.infer<typeof bannerUpsertSchema>;
export type BannerImageSchema = z.infer<typeof imageSchema>;
export type BannerReorderSchema = z.infer<typeof bannerReorderSchema>;

export type BannerImagesQueryParamsSchema = z.infer<typeof bannerImagesQueryParams>;

const bytesToMB = (bytes: number) => bytes / (1024 * 1024);

export const bannerUpsertRequestSchema = z.object({
  title: z.string().meta({
    description: "Example: `Summer Sale 50% Off`"
  }),

  placement: z.enum([BANNER_PLACEMENT.HOMEPAGE_HERO]).meta({
    description: "Example: `homepage_hero`"
  }),

  targetType: z.enum([BANNER_TARGET_TYPE.COLLECTION, BANNER_TARGET_TYPE.CATEGORY]).meta({
    description: "Example: `collection`"
  }),

  targetId: z.string().optional().meta({
    description: "Example: `6`"
  }),

  status: z.enum(["ACTIVE", "INACTIVE"]).meta({
    description: "Example: `ACTIVE`"
  }),

  image: imageSchema.meta({
    description: `
Image metadata.

This data is sent via form-data fields:

\`\`\`
image.id: img-12345
image.originalFileName: hero-banner.jpg
image.crop: {"x":0,"y":0,"width":1200,"height":400}
\`\`\`

Crop structure (pixel-based):

\`\`\`json
{
  "x": 0,
  "y": 0,
  "width": ${BANNER_IMAGE_MIN_SIZE.width},
  "height": ${BANNER_IMAGE_MIN_SIZE.height}
}
\`\`\`
`
  }),

  bannerImage: z
    .file()
    .max(UPLOAD_FILE.BANNER_FILE_SIZE)
    .mime([...ALLOWED_TYPES])
    .meta({
      description: `
Banner image file.

Supported formats: ${ALLOWED_IMG_FORMAT.join(", ")}
Max size: ${bytesToMB(UPLOAD_FILE.BANNER_FILE_SIZE)}MB

Example (form-data):

\`\`\`
bannerImage: banner-file.jpg
\`\`\`
`
    })
});
