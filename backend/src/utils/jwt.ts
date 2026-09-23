import jwt from "jsonwebtoken";
import { CookieOptions, Response } from "express";
import { ENV } from "../config/env.js";

export interface TokenPayload {
  userId: string;
  role: "user" | "admin";
}

const JWT_EXPIRES_IN = "7d";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const isProduction = ENV.NODE_ENV === "production";

// Shared production-aware cookie configuration
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
};

export const sendTokenCookie = (
  res: Response,
  payload: TokenPayload,
): string => {
  const token = signToken(payload);

  res.cookie("token", token, {
    ...baseCookieOptions,
    maxAge: COOKIE_MAX_AGE_MS,
  });

  return token;
};

export const clearTokenCookie = (res: Response): void => {
  res.cookie("token", "", {
    ...baseCookieOptions,
    expires: new Date(0),
  });
};
