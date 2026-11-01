import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env.js";

/**
 * Validates request Origin and Referer against allowed client origins
 * on mutating state requests (POST, PUT, PATCH, DELETE) to protect against CSRF attacks.
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  const originHeader = req.headers["origin"];
  const refererHeader = req.headers["referer"];

  let requestOrigin: string | null = null;

  try {
    requestOrigin = originHeader
      ? new URL(originHeader).origin
      : refererHeader
        ? new URL(refererHeader).origin
        : null;
  } catch {
    res.status(403).json({
      success: false,
      message: "Cross-Site Request Forgery validation failed: Invalid origin.",
    });
    return;
  }

  let configuredClientOrigin: string;

  try {
    configuredClientOrigin = new URL(ENV.CLIENT_URL.trim()).origin;
  } catch {
    res.status(500).json({
      success: false,
      message: "Server client URL configuration is invalid.",
    });
    return;
  }

  const allowedOrigins = new Set([
    configuredClientOrigin,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  if (ENV.NODE_ENV === "production") {
    if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
      res.status(403).json({
        success: false,
        message:
          "Cross-Site Request Forgery validation failed: Unauthorized request origin.",
      });
      return;
    }
  }

  next();
};
