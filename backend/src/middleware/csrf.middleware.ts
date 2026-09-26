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

  // Extract originating URL
  const originHeader = req.headers["origin"];
  const refererHeader = req.headers["referer"];
  const requestOrigin =
    originHeader || (refererHeader ? new URL(refererHeader).origin : null);

  const allowedOrigins = [
    ENV.CLIENT_URL.trim(),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  // In production, require valid cross-origin header for state-changing calls
  if (ENV.NODE_ENV === "production") {
    if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
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
