import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

const mockEnv = vi.hoisted(() => ({
  ENV: {
    NODE_ENV: "development",
    CLIENT_URL: "http://localhost:3000",
  },
}));

vi.mock("../config/env.js", () => mockEnv);

import { errorHandler } from "./errorHandler.js";

interface TestError extends Error {
  statusCode?: number;
  status?: number;
  code?: number | string;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
  type?: string;
}

const createError = (
  message: string,
  properties: Partial<TestError> = {},
): TestError => {
  return Object.assign(new Error(message), properties);
};

const createMocks = (headersSent = false) => {
  const req = {} as Request;

  const res = {
    headersSent,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as unknown as NextFunction;

  return { req, res, next };
};

describe("Error handler middleware", () => {
  beforeEach(() => {
    mockEnv.ENV.NODE_ENV = "development";
  });

  it("does nothing when response headers have already been sent", () => {
    const { req, res, next } = createMocks(true);

    errorHandler(createError("Something failed"), req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("handles duplicate MongoDB key errors", () => {
    const error = createError("Duplicate key", {
      code: 11000,
      keyValue: { email: "om@example.com" },
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Duplicate value entered for email. Please use another value.",
      }),
    );
  });

  it("uses a fallback field for duplicate key errors without keyValue fields", () => {
    const error = createError("Duplicate key", {
      code: 11000,
      keyValue: {},
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Duplicate value entered for field. Please use another value.",
      }),
    );
  });

  it("handles Mongoose validation errors", () => {
    const error = createError("Validation failed", {
      name: "ValidationError",
      errors: {
        name: { message: "Name is required" },
        email: { message: "Email is invalid" },
      },
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Name is required, Email is invalid",
      }),
    );
  });

  it("handles invalid MongoDB ObjectId errors", () => {
    const error = createError("Cast failed", {
      name: "CastError",
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid resource ID.",
      }),
    );
  });

  it("handles malformed JSON request bodies", () => {
    const error = createError("Unexpected token", {
      type: "entity.parse.failed",
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid JSON request body.",
      }),
    );
  });

  it("handles oversized request bodies", () => {
    const error = createError("Payload too large", {
      type: "entity.too.large",
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Request body is too large.",
      }),
    );
  });

  it("handles CORS rejection errors", () => {
    const error = createError("CORS blocked", {
      code: "CORS_ORIGIN_BLOCKED",
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Request origin is not allowed.",
      }),
    );
  });

  it("uses custom messages for known client errors", () => {
    const error = createError("Invalid request data", {
      statusCode: 422,
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid request data",
      }),
    );
  });

  it("uses status when statusCode is unavailable", () => {
    const error = createError("Not found", {
      status: 404,
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Not found",
      }),
    );
  });

  it("uses a generic message for unknown client errors without a message", () => {
    const error = createError("", {
      statusCode: 400,
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "The request could not be processed.",
      }),
    );
  });

  it("replaces invalid status codes with 500", () => {
    const error = createError("Invalid status", {
      statusCode: 200,
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("replaces status codes above 599 with 500", () => {
    const error = createError("Invalid status", {
      statusCode: 600,
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("uses unexpected error messages in development", () => {
    mockEnv.ENV.NODE_ENV = "development";

    const error = createError("Database connection failed");

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Database connection failed",
        stack: expect.any(String),
      }),
    );
  });

  it("hides unexpected internal errors in production", () => {
    mockEnv.ENV.NODE_ENV = "production";

    const error = createError("Sensitive database details");

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An unexpected server error occurred. Please try again later.",
    });
  });

  it("hides unexpected errors with a 500 status in production", () => {
    mockEnv.ENV.NODE_ENV = "production";

    const error = createError("Sensitive internal message", {
      statusCode: 503,
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An unexpected server error occurred. Please try again later.",
    });
  });

  it("includes stack traces in development responses", () => {
    const error = createError("Client error", {
      statusCode: 400,
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: expect.any(String),
      }),
    );
  });

  it("does not expose stack traces in production responses", () => {
    mockEnv.ENV.NODE_ENV = "production";

    const error = createError("Invalid input", {
      statusCode: 400,
    });

    const { req, res, next } = createMocks();

    errorHandler(error, req, res, next);

    const response = vi.mocked(res.json).mock.calls[0][0];

    expect(response).not.toHaveProperty("stack");
  });
});
