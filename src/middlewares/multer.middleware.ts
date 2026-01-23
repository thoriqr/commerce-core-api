import { RequestHandler } from "express";

export const withMulter =
  (middleware: RequestHandler): RequestHandler =>
  (req, res, next) => {
    middleware(req, res, (err) => {
      if (!err) return next();
      return next(err);
    });
  };
