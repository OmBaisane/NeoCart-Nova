import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { CookieOptions, Response } from "express";
import { ENV } from "../config/env.js";

export interface TokenPayload {
  userId: string;
  role: "user" | "admin";
}

export class InvalidTokenError extends Error {
  constructor(message = "Invalid or expired token.") {
    super(message);
    this.name = "InvalidTokenError";
  }
}

const JWT_EXPIRES_IN = "7d";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const isProduction = ENV.NODE_ENV === "production";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(token, ENV.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error: unknown) {
    if (error instanceof JsonWebTokenError) {
      throw new InvalidTokenError();
    }

    throw error;
  }

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string" ||
    !/^[a-f\d]{24}$/i.test(decoded.userId) ||
    (decoded.role !== "user" && decoded.role !== "admin")
  ) {
    throw new InvalidTokenError("Invalid token payload.");
  }

  return {
    userId: decoded.userId,
    role: decoded.role,
  };
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
