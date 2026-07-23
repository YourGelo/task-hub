import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../errors/app-error.js";

function isJsonSyntaxError(error: unknown): error is SyntaxError {
  return error instanceof SyntaxError && "body" in error;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const requestId = typeof res.locals.requestId === "string"
    ? res.locals.requestId
    : undefined;

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request data is invalid",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        })),
        request_id: requestId
      }
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        request_id: requestId
      }
    });
    return;
  }

  if (isJsonSyntaxError(error)) {
    res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON",
        details: [],
        request_id: requestId
      }
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected server error",
      details: [],
      request_id: requestId
    }
  });
};
