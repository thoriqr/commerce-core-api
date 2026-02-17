import { Request, Response } from "express";

type StoreResponseOptions<T> = {
  req: Request;
  res: Response;
  data: T;
  etag: string;
};

export function sendStoreResponse<T>({ req, res, data, etag, maxAge = 60 }: StoreResponseOptions<T> & { maxAge?: number }) {
  const clientETag = req.headers["if-none-match"];

  if (clientETag && clientETag === etag) {
    return res.status(304).end();
  }

  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", `public, max-age=${maxAge}, must-revalidate`);

  return res.status(200).json({
    success: true,
    data
  });
}
