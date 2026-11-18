import express from "express";
import request from "supertest";

// The router wiring is what is under test, so auth, the steamId lookup and every
// service are replaced: no Steam, no MongoDB, no session.
jest.mock("../config", () => ({
  __esModule: true,
  default: { STEAM_API_KEY: "test-key" },
}));

const mockAuth = jest.fn();
const mockSteamId = jest.fn();
jest.mock("../middlewares/auth", () => ({
  ensureAuthenticated: (req: unknown, res: unknown, next: () => void) => mockAuth(req, res, next),
}));
jest.mock("../middlewares/steamId", () => ({
  getSteamId: (req: unknown, res: unknown, next: () => void) => mockSteamId(req, res, next),
}));

const mockGetGamesLibrary = jest.fn();
const mockFindGames = jest.fn();
const mockGetLocked = jest.fn();
jest.mock("../services/steam/SteamService", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../services/games/GameService", () => ({
  __esModule: true,
  default: jest.fn(() => ({ getGamesLibrary: mockGetGamesLibrary, findGames: mockFindGames })),
}));
jest.mock("../services/achievements/AchievementsService", () => ({
  __esModule: true,
  default: jest.fn(() => ({ getLockedAchievementsDataForPlayer: mockGetLocked })),
}));
jest.mock("../controllers/UserController", () => ({ getMe: jest.fn() }));

import router from "./index";
import errorMiddleware from "../middlewares/error";
import { SteamApiError } from "../exceptions/SteamApiError";

const STEAM_ID = "76561198000000000";
const lockedData = { gameName: "Hades", totalGameAchievements: 49, achievements: [] };

describe("API routes", () => {
  const app = express().use("/api/v1", router).use(errorMiddleware);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockAuth.mockImplementation((_req, _res, next) => next());
    mockSteamId.mockImplementation((req, _res, next) => {
      req.steamId = STEAM_ID;
      next();
    });
    mockGetGamesLibrary.mockResolvedValue([{ gameId: 1145360, gameName: "Hades" }]);
    mockFindGames.mockReturnValue([{ gameId: 1145360, gameName: "Hades" }]);
    mockGetLocked.mockResolvedValue(lockedData);
  });

  afterEach(() => jest.restoreAllMocks());

  describe("GET /search", () => {
    it("returns the matched games with their achievements", async () => {
      const res = await request(app).get("/api/v1/search?game=hades");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({ gameId: 1145360, gameName: "Hades", totalGameAchievements: 49 });
      expect(mockGetGamesLibrary).toHaveBeenCalledWith(STEAM_ID);
    });
  });

  describe("GET /gameAchievements/:gameId", () => {
    it("resolves the steamId and returns the game achievements", async () => {
      const res = await request(app).get("/api/v1/gameAchievements/1145360");

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ gameId: 1145360, gameName: "Hades" });
      expect(mockSteamId).toHaveBeenCalled(); // regression: the route used to skip getSteamId and answer 401
      expect(mockGetLocked).toHaveBeenCalledWith(1145360, STEAM_ID);
    });

    it("returns 401 when there is no session", async () => {
      mockAuth.mockImplementation((_req, res) => res.status(401).json({ success: false }));

      const res = await request(app).get("/api/v1/gameAchievements/1145360");

      expect(res.status).toBe(401);
      expect(mockGetLocked).not.toHaveBeenCalled();
    });

    it("returns 500 when Steam fails", async () => {
      mockGetLocked.mockRejectedValue(new SteamApiError(500, "Steam is down"));

      const res = await request(app).get("/api/v1/gameAchievements/1");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
