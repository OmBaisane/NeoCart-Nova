import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env.js";

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
  code?: number | string;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
  type?: string;
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (res.headersSent) {
    return;
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = "An unexpected server error occurred.";

  // Duplicate MongoDB key error
  if (err.code === 11000 && err.keyValue) {
    statusCode = 409;

    const field = Object.keys(err.keyValue)[0] || "field";

    message = `Duplicate value entered for ${field}. Please use another value.`;
  }

  // Mongoose validation errors
  else if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;

    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // Invalid MongoDB ObjectId
  else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID.";
  }

  // Malformed JSON request body
  else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON request body.";
  }

  // Request body too large
  else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large.";
  }

  // CORS rejection
  else if (err.code === "CORS_ORIGIN_BLOCKED") {
    statusCode = 403;
    message = "Request origin is not allowed.";
  }

  // Safe messages for known client errors
  else if (statusCode >= 400 && statusCode < 500) {
    message = err.message || "The request could not be processed.";
  }

  // Prevent invalid status codes
  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  // Never expose unexpected internal server errors in production
  if (statusCode >= 500) {
    message =
      ENV.NODE_ENV === "production"
        ? "An unexpected server error occurred. Please try again later."
        : err.message || "Internal Server Error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
};
