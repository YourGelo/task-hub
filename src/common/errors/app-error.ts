export type ErrorDetail = {
  field?: string;
  message: string;
};

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details: ErrorDetail[] = []
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details: ErrorDetail[] = []) {
    super(400, "BAD_REQUEST", message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = "Business rule violation", details: ErrorDetail[] = []) {
    super(422, "UNPROCESSABLE_ENTITY", message, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", details: ErrorDetail[] = []) {
    super(503, "SERVICE_UNAVAILABLE", message, details);
  }
}
