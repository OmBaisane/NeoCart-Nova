import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env.js";

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000 && err.keyValue) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value entered for ${field}. Please use another value.`;
  }

  // Mongoose validation errors
  if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // Mongoose invalid ObjectId cast error
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Requested resource not found (Invalid ID formatting).";
  }

  // Hide internal server details in production to prevent information disclosure
  if (statusCode === 500 && ENV.NODE_ENV === "production") {
    message = "An unexpected server error occurred. Please try again later.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
