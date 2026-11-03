import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import type { Response } from "express";

vi.mock("../config/env.js", () => ({
  ENV: {
    NODE_ENV: "test",
    JWT_SECRET: "test_jwt_secret_key_123456789",
  },
}));

import {
  clearTokenCookie,
  InvalidTokenError,
  sendTokenCookie,
  signToken,
  verifyToken,
} from "./jwt.js";

const validPayload = {
  userId: "507f1f77bcf86cd799439011",
  role: "user" as const,
};

const secret = "test_jwt_secret_key_123456789";

describe("JWT utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("signToken", () => {
    it("creates a valid JWT", () => {
      const token = signToken(validPayload);

      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("signs tokens using the expected payload", () => {
      const token = signToken(validPayload);
      const decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
      });

      expect(decoded).toMatchObject(validPayload);
    });

    it("supports admin role", () => {
      const token = signToken({
        userId: validPayload.userId,
        role: "admin",
      });

      expect(verifyToken(token).role).toBe("admin");
    });
  });

  describe("verifyToken", () => {
    it("returns a valid user payload", () => {
      const token = signToken(validPayload);

      expect(verifyToken(token)).toEqual(validPayload);
    });

    it("returns a valid admin payload", () => {
      const payload = {
        userId: validPayload.userId,
        role: "admin" as const,
      };

      expect(verifyToken(signToken(payload))).toEqual(payload);
    });

    it("rejects an invalid token", () => {
      expect(() => verifyToken("invalid.token.value")).toThrow(
        InvalidTokenError,
      );
    });

    it("rejects a token signed with another secret", () => {
      const token = jwt.sign(validPayload, "another_secret_key_123456");

      expect(() => verifyToken(token)).toThrow(InvalidTokenError);
    });

    it("rejects an expired token", () => {
      const token = jwt.sign(
        {
          ...validPayload,
          exp: Math.floor(Date.now() / 1000) - 60,
        },
        secret,
        { algorithm: "HS256" },
      );

      expect(() => verifyToken(token)).toThrow(InvalidTokenError);
    });

    it("rejects a token with a non-ObjectId userId", () => {
      const token = jwt.sign(
        { userId: "invalid-user-id", role: "user" },
        secret,
      );

      expect(() => verifyToken(token)).toThrow("Invalid token payload.");
    });

    it("rejects a token with an invalid role", () => {
      const token = jwt.sign(
        { userId: validPayload.userId, role: "superadmin" },
        secret,
      );

      expect(() => verifyToken(token)).toThrow("Invalid token payload.");
    });

    it("rejects a token with a missing userId", () => {
      const token = jwt.sign({ role: "user" }, secret);

      expect(() => verifyToken(token)).toThrow("Invalid token payload.");
    });

    it("rejects a token with a missing role", () => {
      const token = jwt.sign({ userId: validPayload.userId }, secret);

      expect(() => verifyToken(token)).toThrow("Invalid token payload.");
    });

    it("rejects a token containing a string instead of an object payload", () => {
      const token = jwt.sign("plain-string-payload", secret);

      expect(() => verifyToken(token)).toThrow(InvalidTokenError);
    });
  });

  describe("InvalidTokenError", () => {
    it("uses the default message", () => {
      const error = new InvalidTokenError();

      expect(error.name).toBe("InvalidTokenError");
      expect(error.message).toBe("Invalid or expired token.");
    });

    it("supports a custom message", () => {
      const error = new InvalidTokenError("Custom token error");

      expect(error.message).toBe("Custom token error");
    });
  });

  describe("sendTokenCookie", () => {
    it("sets the token cookie and returns the signed token", () => {
      const cookie = vi.fn();
      const response = { cookie } as unknown as Response;

      const token = sendTokenCookie(response, validPayload);

      expect(cookie).toHaveBeenCalledOnce();
      expect(cookie).toHaveBeenCalledWith(
        "token",
        token,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );

      expect(verifyToken(token)).toEqual(validPayload);
    });
  });

  describe("clearTokenCookie", () => {
    it("clears the token cookie", () => {
      const cookie = vi.fn();
      const response = { cookie } as unknown as Response;

      clearTokenCookie(response);

      expect(cookie).toHaveBeenCalledOnce();

      const [name, value, options] = cookie.mock.calls[0];

      expect(name).toBe("token");
      expect(value).toBe("");
      expect(options).toMatchObject({
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });

      expect(options.expires).toBeInstanceOf(Date);
      expect(options.expires.getTime()).toBe(0);
    });
  });
});
