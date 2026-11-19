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
const mockGetLibrary = jest.fn();
const mockFindGames = jest.fn();
const mockGetLocked = jest.fn();
jest.mock("../services/steam/SteamService", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../services/games/GameService", () => ({
  __esModule: true,
  default: jest.fn(() => ({ getGamesLibrary: mockGetGamesLibrary, getLibrary: mockGetLibrary, findGames: mockFindGames })),
}));
jest.mock("../services/achievements/AchievementsService", () => ({
  __esModule: true,
  default: jest.fn(() => ({ getLockedAchievementsDataForPlayer: mockGetLocked })),
}));
jest.mock("../controllers/UserController", () => ({ getMe: jest.fn() }));

const mockListTracked = jest.fn();
const mockTrack = jest.fn();
const mockUntrack = jest.fn();
jest.mock("../services/tracked/TrackedGamesService", () => ({
  __esModule: true,
  default: jest.fn(() => ({ list: mockListTracked, track: mockTrack, untrack: mockUntrack })),
}));

const mockGetFollowed = jest.fn();
const mockFollow = jest.fn();
const mockUnfollow = jest.fn();
jest.mock("../services/follows/FollowService", () => ({
  __esModule: true,
  default: jest.fn(() => ({ getFollowed: mockGetFollowed, follow: mockFollow, unfollow: mockUnfollow })),
}));

const mockGetNote = jest.fn();
const mockSaveNote = jest.fn();
jest.mock("../services/notes/NoteService", () => ({
  __esModule: true,
  default: jest.fn(() => ({ getNote: mockGetNote, saveNote: mockSaveNote })),
}));

const mockListLinks = jest.fn();
const mockAddLink = jest.fn();
const mockRemoveLink = jest.fn();
jest.mock("../services/links/LinkService", () => ({
  __esModule: true,
  default: jest.fn(() => ({ list: mockListLinks, add: mockAddLink, remove: mockRemoveLink })),
}));

import router from "./index";
import errorMiddleware from "../middlewares/error";
import { SteamApiError } from "../exceptions/SteamApiError";

const STEAM_ID = "76561198000000000";
const USER_ID = "665f1c2e8a1b2c3d4e5f6a7b";
const lockedData = { gameName: "Hades", totalGameAchievements: 49, achievements: [] };

describe("API routes", () => {
  // app.ts parses JSON before the routes, so the test app does too
  const app = express().use(express.json()).use("/api/v1", router).use(errorMiddleware);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockAuth.mockImplementation((req, _res, next) => {
      req.user = { _id: USER_ID };
      next();
    });
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
      expect(mockGetLocked).toHaveBeenCalledWith(1145360, STEAM_ID, { refresh: false });
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

  describe("POST /gameAchievements/:gameId/refresh", () => {
    it("asks Steam again for the player's progress, skipping the cache", async () => {
      const syncedAt = new Date("2026-11-19T10:00:00Z");
      mockGetLocked.mockResolvedValue({ ...lockedData, syncedAt });

      const res = await request(app).post("/api/v1/gameAchievements/1145360/refresh");

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ gameId: 1145360, gameName: "Hades", syncedAt: syncedAt.toISOString() });
      expect(mockGetLocked).toHaveBeenCalledWith(1145360, STEAM_ID, { refresh: true });
    });

    it("returns 500 when Steam fails", async () => {
      mockGetLocked.mockRejectedValue(new SteamApiError(500, "Steam is down"));

      const res = await request(app).post("/api/v1/gameAchievements/1145360/refresh");

      expect(res.status).toBe(500);
    });
  });

  describe("library", () => {
    const syncedAt = new Date("2026-11-19T10:00:00Z");

    beforeEach(() => {
      mockGetLibrary.mockResolvedValue({ value: [{ gameId: 1145360, gameName: "Hades" }], syncedAt });
    });

    it("returns when the library was last synced and its size", async () => {
      const res = await request(app).get("/api/v1/library");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ total: 1, syncedAt: syncedAt.toISOString() });
      expect(mockGetLibrary).toHaveBeenCalledWith(STEAM_ID);
    });

    it("refreshes the library on demand", async () => {
      const res = await request(app).post("/api/v1/library/refresh");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ total: 1, syncedAt: syncedAt.toISOString() });
      expect(mockGetLibrary).toHaveBeenCalledWith(STEAM_ID, { refresh: true });
    });

    it("returns 401 when there is no session", async () => {
      mockAuth.mockImplementation((_req, res) => res.status(401).json({ success: false }));

      const res = await request(app).post("/api/v1/library/refresh");

      expect(res.status).toBe(401);
      expect(mockGetLibrary).not.toHaveBeenCalled();
    });
  });

  describe("followed achievements", () => {
    it("lists the followed achievements of a game for the session user", async () => {
      mockGetFollowed.mockResolvedValue(["ACH_1"]);

      const res = await request(app).get("/api/v1/follows/1145360");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ achievements: ["ACH_1"] });
      expect(mockGetFollowed).toHaveBeenCalledWith(USER_ID, 1145360);
    });

    it("follows an achievement", async () => {
      mockFollow.mockResolvedValue(["ACH_1"]);

      const res = await request(app).put("/api/v1/follows/1145360/ACH_1");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ achievements: ["ACH_1"] });
      expect(mockFollow).toHaveBeenCalledWith(USER_ID, 1145360, "ACH_1");
    });

    it("unfollows an achievement", async () => {
      mockUnfollow.mockResolvedValue([]);

      const res = await request(app).delete("/api/v1/follows/1145360/ACH_1");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ achievements: [] });
      expect(mockUnfollow).toHaveBeenCalledWith(USER_ID, 1145360, "ACH_1");
    });

    it("returns 400 when the game id is not a positive integer", async () => {
      const res = await request(app).put("/api/v1/follows/abc/ACH_1");

      expect(res.status).toBe(400);
      expect(mockFollow).not.toHaveBeenCalled();
    });

    it("returns 401 when there is no session", async () => {
      mockAuth.mockImplementation((_req, res) => res.status(401).json({ success: false }));

      const res = await request(app).get("/api/v1/follows/1145360");

      expect(res.status).toBe(401);
      expect(mockGetFollowed).not.toHaveBeenCalled();
    });
  });

  describe("achievement notes", () => {
    const updatedAt = new Date("2026-11-19T10:00:00Z");

    it("returns the note of an achievement for the session user", async () => {
      mockGetNote.mockResolvedValue({ text: "Use the shield", updatedAt });

      const res = await request(app).get("/api/v1/notes/1145360/ACH_1");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ text: "Use the shield", updatedAt: updatedAt.toISOString() });
      expect(mockGetNote).toHaveBeenCalledWith(USER_ID, 1145360, "ACH_1");
    });

    it("saves the note", async () => {
      mockSaveNote.mockResolvedValue({ text: "Use the shield", updatedAt });

      const res = await request(app).put("/api/v1/notes/1145360/ACH_1").send({ text: "Use the shield" });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ text: "Use the shield", updatedAt: updatedAt.toISOString() });
      expect(mockSaveNote).toHaveBeenCalledWith(USER_ID, 1145360, "ACH_1", "Use the shield");
    });

    it("returns 400 when the text is missing", async () => {
      const res = await request(app).put("/api/v1/notes/1145360/ACH_1").send({});

      expect(res.status).toBe(400);
      expect(mockSaveNote).not.toHaveBeenCalled();
    });

    it("returns 400 when the note is too long", async () => {
      const res = await request(app).put("/api/v1/notes/1145360/ACH_1").send({ text: "a".repeat(5001) });

      expect(res.status).toBe(400);
      expect(mockSaveNote).not.toHaveBeenCalled();
    });

    it("returns 400 when the game id is not a positive integer", async () => {
      const res = await request(app).get("/api/v1/notes/abc/ACH_1");

      expect(res.status).toBe(400);
      expect(mockGetNote).not.toHaveBeenCalled();
    });

    it("returns 401 when there is no session", async () => {
      mockAuth.mockImplementation((_req, res) => res.status(401).json({ success: false }));

      const res = await request(app).put("/api/v1/notes/1145360/ACH_1").send({ text: "x" });

      expect(res.status).toBe(401);
      expect(mockSaveNote).not.toHaveBeenCalled();
    });
  });

  // Guides and videos share the controller and the service; only the kind changes
  describe.each([
    { path: "guides", kind: "guide" },
    { path: "videos", kind: "video" },
  ])("achievement $path", ({ path, kind }) => {
    const LINK_ID = "665f1c2e8a1b2c3d4e5f6a7c";
    const link = { id: LINK_ID, title: "Walkthrough", url: "https://example.com/walkthrough" };
    const scope = { userId: USER_ID, gameId: 1145360, achievement: "ACH_1", kind };
    const base = `/api/v1/${path}/1145360/ACH_1`;

    it("lists the links of the session user", async () => {
      mockListLinks.mockResolvedValue([link]);

      const res = await request(app).get(base);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ links: [link] });
      expect(mockListLinks).toHaveBeenCalledWith(scope);
    });

    it("adds a link", async () => {
      mockAddLink.mockResolvedValue(link);

      const res = await request(app).post(base).send({ title: " Walkthrough ", url: "https://example.com/walkthrough" });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(link);
      expect(mockAddLink).toHaveBeenCalledWith(scope, { title: "Walkthrough", url: "https://example.com/walkthrough" });
    });

    it("names a link without title after its site", async () => {
      mockAddLink.mockResolvedValue(link);

      await request(app).post(base).send({ url: "https://www.example.com/walkthrough" });

      expect(mockAddLink).toHaveBeenCalledWith(scope, { title: "example.com", url: "https://www.example.com/walkthrough" });
    });

    it.each(["not a url", "javascript:alert(1)", "ftp://example.com/file"])("returns 400 for the URL %s", async (url) => {
      const res = await request(app).post(base).send({ url });

      expect(res.status).toBe(400);
      expect(mockAddLink).not.toHaveBeenCalled();
    });

    it("removes a link", async () => {
      mockRemoveLink.mockResolvedValue(undefined);

      const res = await request(app).delete(`${base}/${LINK_ID}`);

      expect(res.status).toBe(200);
      expect(mockRemoveLink).toHaveBeenCalledWith(scope, LINK_ID);
    });

    it("returns 400 when the link id is not valid", async () => {
      const res = await request(app).delete(`${base}/abc`);

      expect(res.status).toBe(400);
      expect(mockRemoveLink).not.toHaveBeenCalled();
    });

    it("returns 401 when there is no session", async () => {
      mockAuth.mockImplementation((_req, res) => res.status(401).json({ success: false }));

      const res = await request(app).post(base).send({ url: "https://example.com" });

      expect(res.status).toBe(401);
      expect(mockAddLink).not.toHaveBeenCalled();
    });
  });

  describe("tracked games", () => {
    const hades = { gameId: 1145360, gameName: "Hades", cover: "c.jpg", coverFallback: "h.jpg" };

    it("lists the tracked games of the session user", async () => {
      mockListTracked.mockResolvedValue([hades]);

      const res = await request(app).get("/api/v1/tracked-games");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([hades]);
      expect(mockListTracked).toHaveBeenCalledWith(USER_ID);
    });

    it("tracks a game after resolving the steamId", async () => {
      mockTrack.mockResolvedValue(hades);

      const res = await request(app).put("/api/v1/tracked-games/1145360");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(hades);
      expect(mockSteamId).toHaveBeenCalled();
      expect(mockTrack).toHaveBeenCalledWith(USER_ID, STEAM_ID, 1145360);
    });

    it("untracks a game", async () => {
      mockUntrack.mockResolvedValue(undefined);

      const res = await request(app).delete("/api/v1/tracked-games/1145360");

      expect(res.status).toBe(200);
      expect(mockUntrack).toHaveBeenCalledWith(USER_ID, 1145360);
    });

    it("returns 400 when the game id is not a positive integer", async () => {
      const res = await request(app).put("/api/v1/tracked-games/abc");

      expect(res.status).toBe(400);
      expect(mockTrack).not.toHaveBeenCalled();
    });

    it("returns 401 when there is no session", async () => {
      mockAuth.mockImplementation((_req, res) => res.status(401).json({ success: false }));

      const res = await request(app).get("/api/v1/tracked-games");

      expect(res.status).toBe(401);
      expect(mockListTracked).not.toHaveBeenCalled();
    });
  });
});
