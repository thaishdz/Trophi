// The config validates process.env when it is imported, so each test loads it again with its own env
jest.mock("dotenv", () => ({ config: jest.fn() }));

const VALID_ENV = {
  NODE_ENV: "test",
  PORT: "8000",
  DATABASE_URI: "mongodb://localhost:27017/test",
  STEAM_API_KEY: "test-key",
  FRONTEND_URL: "http://localhost:3000",
  BACKEND_URL: "http://localhost:8000",
  SESSION_SECRET: "test-secret",
};

describe("config", () => {
  const originalEnv = process.env;

  const loadConfig = () => {
    let config: unknown;
    jest.isolateModules(() => {
      config = require("./index").default;
    });
    return config;
  };

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns the validated variables", () => {
    process.env = { ...VALID_ENV };

    expect(loadConfig()).toMatchObject({ PORT: 8000, SESSION_SECRET: "test-secret" });
  });

  it("throws at startup when SESSION_SECRET is missing", () => {
    const { SESSION_SECRET: _omitted, ...env } = VALID_ENV;
    process.env = env;

    expect(loadConfig).toThrow("Missing key SESSION_SECRET in .env");
  });
});
