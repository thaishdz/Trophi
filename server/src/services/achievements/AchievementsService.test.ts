import { HTTP_RESPONSE_STATUS } from "../../common/http/constants";
import { SteamApiError } from "../../exceptions/SteamApiError";
import SteamService from "../steam/SteamService";
import AchievementsService from "./AchievementsService";
import { PlayerAchievements } from "../../models/PlayerAchievements";
import { GameAchievementSchema } from "../../models/GameAchievementSchema";
import { PLAYER_ACHIEVEMENTS_TTL_MS } from "../../config/constants";

import {
  gameAchieveResponseMock,
  achievementDetailsResponseMock,
  mockAchievementsDetails,
} from "./__fixtures__/dataMock";

jest.mock("../../services/steam/SteamService");
jest.mock("../../models/PlayerAchievements");
jest.mock("../../models/GameAchievementSchema");

const progressFindOne = PlayerAchievements.findOne as unknown as jest.Mock;
const progressSave = PlayerAchievements.findOneAndUpdate as unknown as jest.Mock;
const schemaFindOne = GameAchievementSchema.findOne as unknown as jest.Mock;
const schemaSave = GameAchievementSchema.findOneAndUpdate as unknown as jest.Mock;

// findOne(...).lean() resolves to the stored document, or null when there is none
const mockStored = (findOne: jest.Mock, doc: unknown) =>
  findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(doc) });

describe("AchievementsService --- Steam API", () => {
  let steamServiceMock: jest.Mocked<SteamService>;
  let achievementsService: AchievementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    steamServiceMock = new SteamService() as jest.Mocked<SteamService>;
    achievementsService = new AchievementsService(steamServiceMock);
    mockStored(progressFindOne, null);
    mockStored(schemaFindOne, null);
    progressSave.mockResolvedValue(null);
    schemaSave.mockResolvedValue(null);
  });

  it("should combine unachieved stats and achievement details into locked achievements data", async () => {
    const gameId = 1;
    const steamId = "76561198000000000";
    steamServiceMock.getPlayerAchievements.mockResolvedValue(
      gameAchieveResponseMock,
    );
    const spyAchievementsDetails = jest
      .spyOn(achievementsService, "getAchievementsDetails")
      .mockResolvedValue(mockAchievementsDetails);

    // Solo ACHIEVEMENT_56 está sin desbloquear; ACHIEVEMENT_3 ya está conseguido y se descarta
    const expectResult = {
      gameName: "Horizon Zero Dawn",
      totalGameAchievements: 2,
      syncedAt: expect.any(Date),
      achievements: [
        {
          name: "You're the best",
          value: "ACHIEVEMENT_56",
          description: "Beat the game on hard difficulty",
          icon: "https://icon-gray.png",
          achieved: 0,
        },
      ],
    };

    const result = await achievementsService.getLockedAchievementsDataForPlayer(
      gameId,
      steamId,
    );

    expect(result).toEqual(expectResult);
    expect(steamServiceMock.getPlayerAchievements).toHaveBeenCalledWith(
      gameId,
      steamId,
    );
    expect(spyAchievementsDetails).toHaveBeenCalledWith(gameId, ["ACHIEVEMENT_56", "ACHIEVEMENT_3"]);
  });

  it("should return the details of each achievement", async () => {
    const gameId = 1;
    steamServiceMock.getAchievementsDetails.mockResolvedValue(
      achievementDetailsResponseMock,
    );

    const result = await achievementsService.getAchievementsDetails(gameId);

    const expectResult = [
      {
        name: "You're the best",
        value: "ACHIEVEMENT_56",
        description: "Beat the game on hard difficulty",
        icon: "https://icon-gray.png",
      },
      {
        name: "Killed 15 Scorchers",
        value: "ACHIEVEMENT_3",
        description: "Killed 15 Scorchers machines",
        icon: "https://icon-gray.png",
      },
    ];
    expect(result).toEqual(expectResult);
  });

  it("should return an error if there are no achievement details", async () => {
    const apiError = new SteamApiError(HTTP_RESPONSE_STATUS.SERVER_ERROR, "Error fetching achievements details");

    steamServiceMock.getAchievementsDetails.mockRejectedValue(apiError);

    const result = achievementsService.getAchievementsDetails(6);

    await expect(result).rejects.toThrow(SteamApiError);

    expect(steamServiceMock.getAchievementsDetails).toHaveBeenCalledTimes(1);
  });
});

describe("AchievementsService --- cache", () => {
  const gameId = 1;
  const steamId = "76561198000000000";
  let steamServiceMock: jest.Mocked<SteamService>;
  let achievementsService: AchievementsService;

  const storedProgress = (ageMs: number) => ({
    steamId,
    gameId,
    gameName: "Horizon Zero Dawn",
    totalGameAchievements: 2,
    achievements: gameAchieveResponseMock.data.achievements,
    syncedAt: new Date(Date.now() - ageMs),
  });

  const storedSchema = (ageMs: number) => ({
    gameId,
    achievements: mockAchievementsDetails,
    syncedAt: new Date(Date.now() - ageMs),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    steamServiceMock = new SteamService() as jest.Mocked<SteamService>;
    achievementsService = new AchievementsService(steamServiceMock);
    steamServiceMock.getPlayerAchievements.mockResolvedValue(gameAchieveResponseMock);
    steamServiceMock.getAchievementsDetails.mockResolvedValue(achievementDetailsResponseMock);
    progressSave.mockResolvedValue(null);
    schemaSave.mockResolvedValue(null);
  });

  it("serves recent progress and schema without calling Steam", async () => {
    const progress = storedProgress(PLAYER_ACHIEVEMENTS_TTL_MS - 60_000);
    mockStored(progressFindOne, progress);
    mockStored(schemaFindOne, storedSchema(1000));

    const result = await achievementsService.getLockedAchievementsDataForPlayer(gameId, steamId);

    expect(result.achievements.map((a) => a.value)).toEqual(["ACHIEVEMENT_56"]);
    expect(result.syncedAt).toEqual(progress.syncedAt);
    expect(steamServiceMock.getPlayerAchievements).not.toHaveBeenCalled();
    expect(steamServiceMock.getAchievementsDetails).not.toHaveBeenCalled();
  });

  it("asks Steam for stale progress and saves it", async () => {
    mockStored(progressFindOne, storedProgress(PLAYER_ACHIEVEMENTS_TTL_MS + 60_000));
    mockStored(schemaFindOne, storedSchema(1000));

    await achievementsService.getLockedAchievementsDataForPlayer(gameId, steamId);

    expect(steamServiceMock.getPlayerAchievements).toHaveBeenCalledWith(gameId, steamId);
    expect(progressSave).toHaveBeenCalledWith(
      { steamId, gameId },
      expect.objectContaining({ gameName: "Horizon Zero Dawn", syncedAt: expect.any(Date) }),
      { upsert: true },
    );
  });

  it("on refresh asks Steam for recent progress but keeps the cached schema", async () => {
    mockStored(progressFindOne, storedProgress(1000));
    mockStored(schemaFindOne, storedSchema(1000));

    await achievementsService.getLockedAchievementsDataForPlayer(gameId, steamId, { refresh: true });

    expect(steamServiceMock.getPlayerAchievements).toHaveBeenCalledTimes(1);
    expect(steamServiceMock.getAchievementsDetails).not.toHaveBeenCalled();
  });

  it("falls back to stale progress if Steam fails", async () => {
    const progress = storedProgress(PLAYER_ACHIEVEMENTS_TTL_MS + 60_000);
    mockStored(progressFindOne, progress);
    mockStored(schemaFindOne, storedSchema(1000));
    steamServiceMock.getPlayerAchievements.mockRejectedValue(new SteamApiError(500, "Steam is down"));

    const result = await achievementsService.getLockedAchievementsDataForPlayer(gameId, steamId);

    expect(result.syncedAt).toEqual(progress.syncedAt);
    expect(progressSave).not.toHaveBeenCalled();
  });

  it("fails a refresh if Steam fails, even with stored progress", async () => {
    mockStored(progressFindOne, storedProgress(1000));
    mockStored(schemaFindOne, storedSchema(1000));
    steamServiceMock.getPlayerAchievements.mockRejectedValue(new SteamApiError(500, "Steam is down"));

    await expect(
      achievementsService.getLockedAchievementsDataForPlayer(gameId, steamId, { refresh: true }),
    ).rejects.toThrow(SteamApiError);
  });

  it("never expires the stored schema by age", async () => {
    mockStored(schemaFindOne, storedSchema(365 * 24 * 60 * 60 * 1000));

    const result = await achievementsService.getAchievementsDetails(gameId, ["ACHIEVEMENT_56", "ACHIEVEMENT_3"]);

    expect(result).toEqual(mockAchievementsDetails);
    expect(steamServiceMock.getAchievementsDetails).not.toHaveBeenCalled();
  });

  it("asks Steam for the schema again when the progress lists an unknown achievement", async () => {
    mockStored(schemaFindOne, storedSchema(1000));

    await achievementsService.getAchievementsDetails(gameId, ["ACHIEVEMENT_56", "NEW_DLC_ACHIEVEMENT"]);

    expect(steamServiceMock.getAchievementsDetails).toHaveBeenCalledWith(gameId);
    expect(schemaSave).toHaveBeenCalledTimes(1);
  });

  it("keeps serving the outdated schema if Steam fails", async () => {
    mockStored(schemaFindOne, storedSchema(1000));
    steamServiceMock.getAchievementsDetails.mockRejectedValue(new SteamApiError(500, "Steam is down"));

    const result = await achievementsService.getAchievementsDetails(gameId, ["NEW_DLC_ACHIEVEMENT"]);

    expect(result).toEqual(mockAchievementsDetails);
    expect(schemaSave).not.toHaveBeenCalled();
  });

  it("asks Steam for the schema and saves it per game when there is no copy", async () => {
    mockStored(schemaFindOne, null);

    const result = await achievementsService.getAchievementsDetails(gameId);

    expect(result).toEqual(mockAchievementsDetails);
    expect(steamServiceMock.getAchievementsDetails).toHaveBeenCalledWith(gameId);
    expect(schemaSave).toHaveBeenCalledWith(
      { gameId },
      expect.objectContaining({ achievements: mockAchievementsDetails, syncedAt: expect.any(Date) }),
      { upsert: true },
    );
  });
});
