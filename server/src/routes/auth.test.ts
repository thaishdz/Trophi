import express from "express";
import request from "supertest";

const FRONTEND_URL = "https://app.example.com";

jest.mock("@/config", () => ({
  __esModule: true,
  default: { FRONTEND_URL: "https://app.example.com" },
}));

// Passport simulado: la autenticación siempre "tiene éxito" y pasa al siguiente handler
jest.mock("@/config/passport", () => ({
  passport: { authenticate: () => (_req: unknown, _res: unknown, next: () => void) => next() },
}));

import authRoutes from "./auth";

describe("Auth routes", () => {
  const app = express().use("/auth", authRoutes);

  it("redirige al dashboard del FRONTEND_URL configurado tras el login con Steam", async () => {
    const res = await request(app).get("/auth/steam/return");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${FRONTEND_URL}/dashboard`);
  });
});
