import { z } from "zod";

export const SuccessResponseSchema = z.object({
  success: z.literal(true)
});

export const successResponse = <T extends z.ZodTypeAny | undefined = undefined, M extends z.ZodTypeAny | undefined = undefined>(params?: {
  data?: T;
  meta?: M;
  message?: string;
  includeMessage?: boolean;
  dataExample?: T extends z.ZodTypeAny ? z.infer<T> : unknown;
  metaExample?: M extends z.ZodTypeAny ? z.infer<M> : unknown;
}) => {
  const { data, meta, message, includeMessage, dataExample, metaExample } = params || {};

  const shouldIncludeMessage = includeMessage ?? !!message;

  return SuccessResponseSchema.extend({
    ...(shouldIncludeMessage && {
      message: z.string().meta({
        example: message ?? "Success"
      })
    }),

    ...(data && {
      data: data.optional().meta({
        example: dataExample
      })
    }),

    ...(meta && {
      meta: meta.optional().meta({
        example: metaExample
      })
    })
  });
};
