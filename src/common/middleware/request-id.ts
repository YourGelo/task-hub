import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestIdHeader = req.header("X-Request-Id");
  const requestId = requestIdHeader && requestIdHeader.trim().length > 0
    ? requestIdHeader
    : randomUUID();

  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
}
