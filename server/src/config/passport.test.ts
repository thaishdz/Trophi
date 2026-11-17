const strategyOptions: { returnURL?: string }[] = [];

jest.mock("passport-steam-openid", () => ({
  // Captura las opciones con las que se construye la estrategia
  SteamOpenIdStrategy: jest.fn().mockImplementation(function (options: { returnURL?: string }) {
    strategyOptions.push(options);
    return { name: "steam-openid", authenticate: jest.fn() };
  }),
}));

jest.mock("./index", () => ({
  __esModule: true,
  default: { STEAM_API_KEY: "key", BACKEND_URL: "https://api.example.com" },
}));
jest.mock("../models/User");
jest.mock("../services/steam/SteamAuthService");

describe("Passport --- estrategia de Steam", () => {
  it("usa BACKEND_URL para construir la returnURL del callback", async () => {
    await import("./passport");

    expect(strategyOptions).toHaveLength(1);
    expect(strategyOptions[0].returnURL).toBe("https://api.example.com/auth/steam/return");
  });
});
