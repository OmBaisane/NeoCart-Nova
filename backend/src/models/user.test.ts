import { describe, expect, it } from "vitest";
import { User } from "./user.model";
import bcrypt from "bcryptjs";

describe("User model", () => {
  it("requires name, email and password", async () => {
    const user = new User({});

    await expect(user.validate()).rejects.toThrow();
  });

  it("normalizes name and email", async () => {
    const user = new User({
      name: "  Om Baisane  ",
      email: " OM@EXAMPLE.COM ",
      password: "password123",
    });

    await user.validate();

    expect(user.name).toBe("Om Baisane");
    expect(user.email).toBe("om@example.com");
  });

  it("rejects invalid email addresses", async () => {
    const user = new User({
      name: "Om Baisane",
      email: "invalid-email",
      password: "password123",
    });

    await expect(user.validate()).rejects.toThrow();
  });

  it("rejects passwords shorter than eight characters", async () => {
    const user = new User({
      name: "Om Baisane",
      email: "om@example.com",
      password: "short",
    });

    await expect(user.validate()).rejects.toThrow();
  });

  it("defaults role to user", () => {
    const user = new User({
      name: "Om Baisane",
      email: "om@example.com",
      password: "password123",
    });

    expect(user.role).toBe("user");
  });

  it("rejects roles other than user and admin", async () => {
    const user = new User({
      name: "Om Baisane",
      email: "om@example.com",
      password: "password123",
      role: "superadmin",
    });

    await expect(user.validate()).rejects.toThrow();
  });

  it("does not select password by default", () => {
    expect(User.schema.path("password").options.select).toBe(false);
  });

  it("hashes passwords through the pre-save hook", async () => {
    const user = new User({
      name: "Om Baisane",
      email: "om@example.com",
      password: "password123",
    });

    const originalPassword = user.password;

    const schema = user.schema as unknown as {
      s: {
        hooks: {
          execPre: (
            name: string,
            context: unknown,
            args: unknown[],
          ) => Promise<void>;
        };
      };
    };

    await schema.s.hooks.execPre("save", user, []);

    expect(user.password).not.toBe(originalPassword);
    expect(user.password).toMatch(/^\$2[aby]\$/);

    await expect(bcrypt.compare("password123", user.password!)).resolves.toBe(
      true,
    );

    await expect(
      bcrypt.compare("wrong-password", user.password!),
    ).resolves.toBe(false);
  });

  it("returns false when no password is available", async () => {
    const user = new User({
      name: "Om Baisane",
      email: "om@example.com",
    });

    await expect(user.comparePassword("password123")).resolves.toBe(false);
  });
});
