import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { protect, optionalProtect, adminOnly } from "./auth.middleware.js";
import { User } from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";

const USER_ID = "507f1f77bcf86cd799439011";

const mockUser = {
  _id: USER_ID,
  name: "Om Baisane",
  email: "om@example.com",
  role: "user",
};

const mockAdmin = {
  ...mockUser,
  role: "admin",
};

const createMocks = (options?: {
  token?: string;
  authorization?: string;
  user?: unknown;
}) => {
  const req = {
    cookies: options?.token ? { token: options.token } : {},
    headers: options?.authorization
      ? { authorization: options.authorization }
      : {},
    user: options?.user,
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as unknown as NextFunction;

  return { req, res, next };
};

describe("Authentication middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("protect", () => {
    it("rejects requests without a token", async () => {
      const { req, res, next } = createMocks();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized. Please log in to access this resource.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("authenticates using a valid cookie token", async () => {
      const token = signToken({ userId: USER_ID, role: "user" });

      vi.spyOn(User, "findById").mockResolvedValue(mockUser as never);

      const { req, res, next } = createMocks({ token });

      await protect(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(USER_ID);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("authenticates using a valid Bearer token", async () => {
      const token = signToken({ userId: USER_ID, role: "user" });

      vi.spyOn(User, "findById").mockResolvedValue(mockUser as never);

      const { req, res, next } = createMocks({
        authorization: `Bearer ${token}`,
      });

      await protect(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(USER_ID);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledOnce();
    });

    it("prefers cookie token when both cookie and Bearer token exist", async () => {
      const cookieToken = signToken({
        userId: USER_ID,
        role: "user",
      });

      const bearerToken = signToken({
        userId: "507f1f77bcf86cd799439012",
        role: "user",
      });

      vi.spyOn(User, "findById").mockResolvedValue(mockUser as never);

      const { req, next } = createMocks({
        token: cookieToken,
        authorization: `Bearer ${bearerToken}`,
      });

      await protect(req, {} as Response, next);

      expect(User.findById).toHaveBeenCalledWith(USER_ID);
      expect(next).toHaveBeenCalledOnce();
    });

    it("rejects invalid tokens", async () => {
      const { req, res, next } = createMocks({
        token: "invalid-token",
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired session. Please log in again.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects tokens belonging to deleted users", async () => {
      const token = signToken({ userId: USER_ID, role: "user" });

      vi.spyOn(User, "findById").mockResolvedValue(null);

      const { req, res, next } = createMocks({ token });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "The user belonging to this token no longer exists.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("passes unexpected database errors to next", async () => {
      const token = signToken({ userId: USER_ID, role: "user" });
      const error = new Error("Database connection failed");

      vi.spyOn(User, "findById").mockRejectedValue(error);

      const { req, res, next } = createMocks({ token });

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("optionalProtect", () => {
    it("allows anonymous visitors without a token", async () => {
      const findByIdSpy = vi.spyOn(User, "findById");
      const { req, next } = createMocks();

      await optionalProtect(req, {} as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledOnce();
      expect(findByIdSpy).not.toHaveBeenCalled();
    });

    it("attaches the user when a valid token is provided", async () => {
      const token = signToken({ userId: USER_ID, role: "user" });

      vi.spyOn(User, "findById").mockResolvedValue(mockUser as never);

      const { req, next } = createMocks({ token });

      await optionalProtect(req, {} as Response, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledOnce();
    });

    it("allows anonymous access when the token is invalid", async () => {
      const { req, next } = createMocks({
        token: "invalid-token",
      });

      await optionalProtect(req, {} as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith();
    });

    it("allows anonymous access when the token user no longer exists", async () => {
      const token = signToken({ userId: USER_ID, role: "user" });

      vi.spyOn(User, "findById").mockResolvedValue(null);

      const { req, next } = createMocks({ token });

      await optionalProtect(req, {} as Response, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledOnce();
    });

    it("passes unexpected database errors to next", async () => {
      const token = signToken({ userId: USER_ID, role: "user" });
      const error = new Error("Database connection failed");

      vi.spyOn(User, "findById").mockRejectedValue(error);

      const { req, next } = createMocks({ token });

      await optionalProtect(req, {} as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("adminOnly", () => {
    it("rejects requests without an authenticated user", () => {
      const { req, res, next } = createMocks();

      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          "Forbidden. Admin privileges required to access this resource.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects regular users", () => {
      const { req, res, next } = createMocks({
        user: mockUser,
      });

      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("allows authenticated administrators", () => {
      const { req, res, next } = createMocks({
        user: mockAdmin,
      });

      adminOnly(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
