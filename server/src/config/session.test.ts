jest.mock("./", () => ({ __esModule: true, default: { SESSION_SECRET: "test-secret" } }));

const mockSession = jest.fn((_options: unknown) => "session-middleware");
jest.mock("express-session", () => ({ __esModule: true, default: (options: unknown) => mockSession(options) }));

const mockCreate = jest.fn((_options: unknown) => "mongo-store");
jest.mock("connect-mongo", () => ({ MongoStore: { create: (options: unknown) => mockCreate(options) } }));

const mockClient = { name: "mongo-client" };
jest.mock("mongoose", () => ({
  __esModule: true,
  default: { connection: { asPromise: () => Promise.resolve({ getClient: () => mockClient }) } },
}));

import { createSessionMiddleware, SESSION_MAX_AGE_MS } from "./session";

describe("createSessionMiddleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it("stores the sessions in MongoDB instead of the process memory", async () => {
    expect(createSessionMiddleware()).toBe("session-middleware");

    expect(mockSession).toHaveBeenCalledWith(expect.objectContaining({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      store: "mongo-store",
    }));

    const storeOptions = mockCreate.mock.calls[0][0] as { clientPromise: Promise<unknown>; collectionName: string };
    expect(storeOptions.collectionName).toBe("sessions");
    await expect(storeOptions.clientPromise).resolves.toBe(mockClient); // reuses Mongoose's client
  });

  it("keeps the cookie and the stored session for the same time", () => {
    createSessionMiddleware();

    expect(mockSession).toHaveBeenCalledWith(expect.objectContaining({ cookie: { maxAge: SESSION_MAX_AGE_MS } }));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ ttl: SESSION_MAX_AGE_MS / 1000 }));
  });
});
