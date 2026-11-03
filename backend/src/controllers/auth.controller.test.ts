import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../models/user.model.js", () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../utils/jwt.js", () => ({
  sendTokenCookie: vi.fn(),
  clearTokenCookie: vi.fn(),
}));

import { User } from "../models/user.model.js";
import { sendTokenCookie, clearTokenCookie } from "../utils/jwt.js";
import { register, login, logout, getMe } from "./auth.controller.js";

const mockUser = {
  _id: "user-123",
  id: "user-123",
  name: "Om Baisane",
  email: "om@example.com",
  role: "user",
  avatar: "",
  phone: "",
  address: {},
  createdAt: new Date("2026-01-01"),
  comparePassword: vi.fn(),
};

const createResponse = () => {
  const res: any = {
    status: vi.fn(),
    json: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
};

const createRequest = (overrides: Record<string, any> = {}) =>
  ({
    body: {},
    params: {},
    query: {},
    user: mockUser,
    ...overrides,
  }) as any;

const createNext = () => vi.fn();

describe("Auth controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("rejects invalid registration data", async () => {
      const req = createRequest({
        body: {
          name: "A",
          email: "invalid",
          password: "123",
        },
      });
      const res = createResponse();
      const next = createNext();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.create).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects an already registered email", async () => {
      vi.mocked(User.findOne).mockResolvedValue(mockUser as never);

      const req = createRequest({
        body: {
          name: "Om Baisane",
          email: "om@example.com",
          password: "password123",
        },
      });
      const res = createResponse();
      const next = createNext();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(User.create).not.toHaveBeenCalled();
    });

    it("creates a user and returns safe user data", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null as never);
      vi.mocked(User.create).mockResolvedValue(mockUser as never);

      const req = createRequest({
        body: {
          name: "Om Baisane",
          email: "OM@EXAMPLE.COM",
          password: "password123",
        },
      });
      const res = createResponse();
      const next = createNext();

      await register(req, res, next);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Om Baisane",
          email: "om@example.com",
          password: "password123",
        }),
      );
      expect(sendTokenCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.user).not.toHaveProperty("password");
    });
  });

  describe("login", () => {
    it("rejects invalid login data", async () => {
      const req = createRequest({
        body: { email: "invalid", password: "" },
      });
      const res = createResponse();
      const next = createNext();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("rejects incorrect credentials", async () => {
      const select = vi.fn().mockResolvedValue({
        ...mockUser,
        comparePassword: vi.fn().mockResolvedValue(false),
      });

      vi.mocked(User.findOne).mockReturnValue({ select } as never);

      const req = createRequest({
        body: {
          email: "om@example.com",
          password: "wrongpassword",
        },
      });
      const res = createResponse();
      const next = createNext();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(sendTokenCookie).not.toHaveBeenCalled();
    });

    it("logs in successfully without exposing the password", async () => {
      const user = {
        ...mockUser,
        comparePassword: vi.fn().mockResolvedValue(true),
      };

      const select = vi.fn().mockResolvedValue(user);
      vi.mocked(User.findOne).mockReturnValue({ select } as never);

      const req = createRequest({
        body: {
          email: "OM@EXAMPLE.COM",
          password: "password123",
        },
      });
      const res = createResponse();
      const next = createNext();

      await login(req, res, next);

      expect(select).toHaveBeenCalledWith("+password");
      expect(sendTokenCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.user).not.toHaveProperty("password");
    });
  });

  describe("logout", () => {
    it("clears the authentication cookie", async () => {
      const req = createRequest();
      const res = createResponse();
      const next = createNext();

      await logout(req, res);

      expect(clearTokenCookie).toHaveBeenCalledWith(res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getMe", () => {
    it("returns the authenticated user's safe data", async () => {
      const req = createRequest();
      const res = createResponse();
      const next = createNext();

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.user).toMatchObject({
        id: "user-123",
        name: "Om Baisane",
        email: "om@example.com",
      });
      expect(responseData.user).not.toHaveProperty("password");
    });
  });
});
