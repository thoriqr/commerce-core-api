import { Request, Response, NextFunction } from "express";

export function attachClient(req: Request, _res: Response, next: NextFunction) {
  const client = req.header("x-client") === "admin" ? "admin" : "store";

  req.client = client;

  next();
}
