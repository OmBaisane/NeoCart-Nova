import jwt from "jsonwebtoken";
import { Response } from "express";
import { ENV } from "../config/env.js";

export interface TokenPayload {
  userId: string;
  role: "user" | "admin";
}

const JWT_EXPIRES_IN = "7d";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

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
    httpOnly: true,
    secure: ENV.NODE_ENV === "production",
    sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });

  return token;
};

export const clearTokenCookie = (res: Response): void => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
};
