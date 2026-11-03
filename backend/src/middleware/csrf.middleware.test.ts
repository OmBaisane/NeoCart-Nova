import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

const mockEnv = vi.hoisted(() => ({
  ENV: {
    CLIENT_URL: "https://neocart-nova.vercel.app",
    NODE_ENV: "production",
  },
}));

vi.mock("../config/env.js", () => mockEnv);

import { csrfProtection } from "./csrf.middleware.js";

const createMocks = (method: string, headers: Record<string, string> = {}) => {
  const req = {
    method,
    headers,
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as unknown as NextFunction;

  return { req, res, next };
};

describe("CSRF protection middleware", () => {
  beforeEach(() => {
    mockEnv.ENV.CLIENT_URL = "https://neocart-nova.vercel.app";
    mockEnv.ENV.NODE_ENV = "production";
  });

  it.each(["GET", "HEAD", "OPTIONS"])(
    "allows safe %s requests without origin",
    (method) => {
      const { req, res, next } = createMocks(method);

      csrfProtection(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    },
  );

  it("allows POST requests from the configured client origin", () => {
    const { req, res, next } = createMocks("POST", {
      origin: "https://neocart-nova.vercel.app",
    });

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("normalizes configured and request origins", () => {
    mockEnv.ENV.CLIENT_URL = "https://neocart-nova.vercel.app/";

    const { req, res, next } = createMocks("POST", {
      origin: "https://neocart-nova.vercel.app/path",
    });

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("allows localhost development origins in production", () => {
    const { req, next } = createMocks("POST", {
      origin: "http://localhost:3000",
    });

    csrfProtection(req, {} as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("allows 127.0.0.1 development origin in production", () => {
    const { req, next } = createMocks("DELETE", {
      origin: "http://127.0.0.1:3000",
    });

    csrfProtection(req, {} as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects requests with an unauthorized origin", () => {
    const { req, res, next } = createMocks("POST", {
      origin: "https://malicious.example.com",
    });

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        "Cross-Site Request Forgery validation failed: Unauthorized request origin.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects production mutation requests without origin or referer", () => {
    const { req, res, next } = createMocks("POST");

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("uses referer when origin is absent", () => {
    const { req, res, next } = createMocks("PUT", {
      referer: "https://neocart-nova.vercel.app/products",
    });

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects an unauthorized referer", () => {
    const { req, res, next } = createMocks("PATCH", {
      referer: "https://malicious.example.com/page",
    });

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects malformed origin URLs", () => {
    const { req, res, next } = createMocks("POST", {
      origin: "not-a-valid-url",
    });

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Cross-Site Request Forgery validation failed: Invalid origin.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects malformed referer URLs when origin is absent", () => {
    const { req, res, next } = createMocks("POST", {
      referer: "not-a-valid-url",
    });

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns a server error for invalid configured client URL", () => {
    mockEnv.ENV.CLIENT_URL = "invalid-url";

    const { req, res, next } = createMocks("POST", {
      origin: "https://neocart-nova.vercel.app",
    });

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Server client URL configuration is invalid.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows mutation requests without origin in development", () => {
    mockEnv.ENV.NODE_ENV = "development";

    const { req, res, next } = createMocks("POST");

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects malformed origin even in development", () => {
    mockEnv.ENV.NODE_ENV = "development";

    const { req, res, next } = createMocks("POST", {
      origin: "invalid-url",
    });

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
