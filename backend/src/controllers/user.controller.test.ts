import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../models/user.model.js", () => ({
  User: {
    findById: vi.fn(),
  },
}));

import { User } from "../models/user.model.js";
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
} from "./user.controller.js";

const mockUser = {
  _id: "user-123",
  id: "user-123",
  name: "Om Baisane",
  email: "om@example.com",
  role: "user",
  avatar: "",
  phone: "",
  address: {
    street: "Main Road",
    city: "Surat",
    state: "Gujarat",
    pincode: "395001",
  },
  createdAt: new Date("2026-01-01"),
  save: vi.fn(),
  comparePassword: vi.fn(),
};

const createResponse = () => {
  const res: any = {
    status: vi.fn(),
    json: vi.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
};

const createRequest = (body: Record<string, any> = {}) =>
  ({
    body,
    params: {},
    query: {},
    user: mockUser,
  }) as any;

const createNext = () => vi.fn();

describe("User controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserProfile", () => {
    it("returns the user's profile without password", async () => {
      vi.mocked(User.findById).mockResolvedValue(mockUser as never);

      const req = createRequest();
      const res = createResponse();
      const next = createNext();

      await getUserProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData.user).not.toHaveProperty("password");
    });

    it("returns 404 when user does not exist", async () => {
      vi.mocked(User.findById).mockResolvedValue(null as never);

      const req = createRequest();
      const res = createResponse();
      const next = createNext();

      await getUserProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updateUserProfile", () => {
    it("updates profile and merges address fields", async () => {
      const user = {
        ...mockUser,
        address: {
          street: "Old Street",
          city: "Surat",
          state: "Gujarat",
          pincode: "395001",
        },
        save: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(User.findById).mockResolvedValue(user as never);

      const req = createRequest({
        name: "Om Updated",
        address: {
          street: "New Street",
        },
      });
      const res = createResponse();
      const next = createNext();

      await updateUserProfile(req, res, next);

      expect(user.name).toBe("Om Updated");
      expect(user.address.street).toBe("New Street");
      expect(user.address.city).toBe("Surat");
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("rejects an empty update", async () => {
      const req = createRequest({});
      const res = createResponse();
      const next = createNext();

      await updateUserProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.findById).not.toHaveBeenCalled();
    });
  });

  describe("updateUserPassword", () => {
    it("rejects an incorrect current password", async () => {
      const user = {
        ...mockUser,
        comparePassword: vi.fn().mockResolvedValue(false),
        save: vi.fn(),
      };

      const select = vi.fn().mockResolvedValue(user);
      vi.mocked(User.findById).mockReturnValue({ select } as never);

      const req = createRequest({
        currentPassword: "wrongpassword",
        newPassword: "newpassword123",
      });
      const res = createResponse();
      const next = createNext();

      await updateUserPassword(req, res, next);

      expect(select).toHaveBeenCalledWith("+password");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(user.save).not.toHaveBeenCalled();
    });

    it("updates password after verifying current password", async () => {
      const user = {
        ...mockUser,
        password: "oldpassword123",
        comparePassword: vi.fn().mockResolvedValue(true),
        save: vi.fn().mockResolvedValue(undefined),
      };

      const select = vi.fn().mockResolvedValue(user);
      vi.mocked(User.findById).mockReturnValue({ select } as never);

      const req = createRequest({
        currentPassword: "oldpassword123",
        newPassword: "newpassword123",
      });
      const res = createResponse();
      const next = createNext();

      await updateUserPassword(req, res, next);

      expect(user.password).toBe("newpassword123");
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
