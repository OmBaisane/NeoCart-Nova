import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("dotenv", () => ({
  default: {
    config: vi.fn(),
  },
}));

const originalEnv = { ...process.env };

async function loadEnv(overrides: Record<string, string | undefined> = {}) {
  vi.resetModules();

  const keys = [
    "PORT",
    "NODE_ENV",
    "MONGO_URI",
    "MONGODB_URI",
    "JWT_SECRET",
    "CLIENT_URL",
  ];

  for (const key of keys) {
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return import("./env.js");
}

function validEnvironment(overrides: Record<string, string> = {}) {
  return {
    NODE_ENV: "test",
    MONGO_URI: "mongodb://127.0.0.1:27017/neocart_test",
    JWT_SECRET: "test_jwt_secret_key_123456",
    CLIENT_URL: "http://localhost:3000",
    ...overrides,
  };
}

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("Environment configuration", () => {
  it("loads valid environment variables", async () => {
    const { ENV } = await loadEnv(validEnvironment());

    expect(ENV.NODE_ENV).toBe("test");
    expect(ENV.MONGO_URI).toBe("mongodb://127.0.0.1:27017/neocart_test");
    expect(ENV.JWT_SECRET).toBe("test_jwt_secret_key_123456");
    expect(ENV.CLIENT_URL).toBe("http://localhost:3000");
  });

  it("uses the default PORT when it is not provided", async () => {
    const { ENV } = await loadEnv(validEnvironment());

    expect(ENV.PORT).toBe(5000);
  });

  it("accepts a valid custom PORT", async () => {
    const { ENV } = await loadEnv({
      ...validEnvironment(),
      PORT: "4000",
    });

    expect(ENV.PORT).toBe(4000);
  });

  it("accepts the minimum valid PORT", async () => {
    const { ENV } = await loadEnv({
      ...validEnvironment(),
      PORT: "1",
    });

    expect(ENV.PORT).toBe(1);
  });

  it("accepts the maximum valid PORT", async () => {
    const { ENV } = await loadEnv({
      ...validEnvironment(),
      PORT: "65535",
    });

    expect(ENV.PORT).toBe(65535);
  });

  it.each(["0", "65536", "-1", "1.5", "invalid"])(
    "rejects invalid PORT value: %s",
    async (PORT) => {
      const exit = vi.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("process.exit called");
      }) as never);

      const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        loadEnv({
          ...validEnvironment(),
          PORT,
        }),
      ).rejects.toThrow("process.exit called");

      expect(exit).toHaveBeenCalledWith(1);
      expect(errorLog).toHaveBeenCalled();
    },
  );

  it.each(["development", "test", "production"])(
    "accepts NODE_ENV=%s when other production requirements are met",
    async (NODE_ENV) => {
      const productionValues: Record<string, string> =
        NODE_ENV === "production"
          ? {
              JWT_SECRET: "a".repeat(40),
              MONGO_URI: "mongodb+srv://example.com/neocart",
              CLIENT_URL: "https://example.com",
            }
          : {};

      const { ENV } = await loadEnv({
        ...validEnvironment(productionValues),
        NODE_ENV,
      });

      expect(ENV.NODE_ENV).toBe(NODE_ENV);
    },
  );

  it("rejects an unsupported NODE_ENV", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      loadEnv({
        ...validEnvironment(),
        NODE_ENV: "staging",
      }),
    ).rejects.toThrow("process.exit called");

    expect(exit).toHaveBeenCalledWith(1);
  });

  it("supports MONGODB_URI as a fallback for MONGO_URI", async () => {
    const { ENV } = await loadEnv({
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://127.0.0.1:27017/fallback",
      JWT_SECRET: "test_jwt_secret_key_123456",
      CLIENT_URL: "http://localhost:3000",
    });

    expect(ENV.MONGO_URI).toBe("mongodb://127.0.0.1:27017/fallback");
  });

  it("uses the local MongoDB fallback when both MongoDB variables are missing", async () => {
    const { ENV } = await loadEnv({
      NODE_ENV: "test",
      JWT_SECRET: "test_jwt_secret_key_123456",
      CLIENT_URL: "http://localhost:3000",
    });

    expect(ENV.MONGO_URI).toBe("mongodb://127.0.0.1:27017/neocart_nova");
  });

  it("rejects a short JWT_SECRET", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      loadEnv({
        ...validEnvironment(),
        JWT_SECRET: "short",
      }),
    ).rejects.toThrow("process.exit called");

    expect(exit).toHaveBeenCalledWith(1);
  });

  it("rejects an invalid CLIENT_URL", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      loadEnv({
        ...validEnvironment(),
        CLIENT_URL: "not-a-url",
      }),
    ).rejects.toThrow("process.exit called");

    expect(exit).toHaveBeenCalledWith(1);
  });

  it("rejects a production JWT secret shorter than 32 characters", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      loadEnv({
        NODE_ENV: "production",
        MONGO_URI: "mongodb+srv://example.com/neocart",
        JWT_SECRET: "short_production_secret",
        CLIENT_URL: "https://example.com",
      }),
    ).rejects.toThrow("process.exit called");

    expect(exit).toHaveBeenCalledWith(1);
  });

  it("rejects the default development secret in production", async () => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      loadEnv({
        NODE_ENV: "production",
        MONGO_URI: "mongodb+srv://example.com/neocart",
        JWT_SECRET: "dev_jwt_secret_key_12345",
        CLIENT_URL: "https://example.com",
      }),
    ).rejects.toThrow("process.exit called");

    expect(exit).toHaveBeenCalledWith(1);
  });

  it.each([
    "mongodb://localhost:27017/neocart",
    "mongodb://127.0.0.1:27017/neocart",
    "mongodb://[::1]:27017/neocart",
  ])("rejects local MongoDB URI in production: %s", async (MONGO_URI) => {
    const exit = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit called");
    }) as never);

    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      loadEnv({
        NODE_ENV: "production",
        MONGO_URI,
        JWT_SECRET: "a".repeat(40),
        CLIENT_URL: "https://example.com",
      }),
    ).rejects.toThrow("process.exit called");

    expect(exit).toHaveBeenCalledWith(1);
  });

  it.each([
    "http://example.com",
    "http://localhost:3000",
    "https://localhost:3000",
    "https://127.0.0.1",
    "https://[::1]",
  ])(
    "rejects insecure/local CLIENT_URL in production: %s",
    async (CLIENT_URL) => {
      const exit = vi.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("process.exit called");
      }) as never);

      vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        loadEnv({
          NODE_ENV: "production",
          MONGO_URI: "mongodb+srv://example.com/neocart",
          JWT_SECRET: "a".repeat(40),
          CLIENT_URL,
        }),
      ).rejects.toThrow("process.exit called");

      expect(exit).toHaveBeenCalledWith(1);
    },
  );

  it("accepts a valid HTTPS production configuration", async () => {
    const { ENV } = await loadEnv({
      NODE_ENV: "production",
      MONGO_URI: "mongodb+srv://example.com/neocart",
      JWT_SECRET: "a".repeat(40),
      CLIENT_URL: "https://neocart.example.com",
    });

    expect(ENV.NODE_ENV).toBe("production");
    expect(ENV.CLIENT_URL).toBe("https://neocart.example.com");
  });
});
