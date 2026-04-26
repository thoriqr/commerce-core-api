import { Request, Response } from "express";

type StoreResponseOptions<T, M = unknown> = {
  req: Request;
  res: Response;
  data: T;
  etag: string;
  maxAge?: number;
  meta?: M;
};

export function sendStoreResponse<T, M = unknown>({ req, res, data, etag, maxAge = 60, meta }: StoreResponseOptions<T, M>) {
  const clientETag = req.headers["if-none-match"];

  if (clientETag && clientETag === etag) {
    return res.status(304).end();
  }

  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", `public, max-age=${maxAge}, must-revalidate`);

  return res.status(200).json({
    success: true,
    data,
    ...(meta !== undefined ? { meta } : {})
  });
}
