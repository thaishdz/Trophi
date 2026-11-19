import { Types } from "mongoose";
import TrackedGamesService from "./TrackedGamesService";
import { TrackedGame } from "@/models/TrackedGame";
import GameService from "@/services/games/GameService";

jest.mock("@/models/TrackedGame", () => ({
  TrackedGame: { find: jest.fn(), findOneAndUpdate: jest.fn(), deleteOne: jest.fn() },
}));

const mockedModel = TrackedGame as jest.Mocked<typeof TrackedGame>;

describe("TrackedGamesService", () => {
  const userId = new Types.ObjectId();
  const steamId = "76561198000000000";
  const getGamesLibrary = jest.fn();
  let service: TrackedGamesService;

  beforeEach(() => {
    jest.clearAllMocks();
    getGamesLibrary.mockResolvedValue([
      { gameId: 1145360, gameName: "Hades" },
      { gameId: 292030, gameName: "The Witcher 3" },
    ]);
    service = new TrackedGamesService({ getGamesLibrary } as unknown as GameService);
  });

  it("lists the tracked games, most recent first, with their covers", async () => {
    const lean = jest.fn().mockResolvedValue([{ gameId: 1145360, gameName: "Hades" }]);
    const sort = jest.fn().mockReturnValue({ lean });
    mockedModel.find.mockReturnValue({ sort } as never);

    const result = await service.list(userId);

    expect(mockedModel.find).toHaveBeenCalledWith({ userId });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual([
      expect.objectContaining({ gameId: 1145360, gameName: "Hades", cover: expect.stringContaining("1145360") }),
    ]);
  });

  it("tracks a game of the user's library using the name stored there", async () => {
    mockedModel.findOneAndUpdate.mockResolvedValue(null as never);

    const result = await service.track(userId, steamId, 1145360);

    expect(getGamesLibrary).toHaveBeenCalledWith(steamId);
    expect(mockedModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId, gameId: 1145360 },
      { gameName: "Hades" },
      { upsert: true },
    );
    expect(result).toMatchObject({ gameId: 1145360, gameName: "Hades" });
  });

  it("does not track a game that is not in the user's library", async () => {
    await expect(service.track(userId, steamId, 999)).rejects.toMatchObject({
      status: 404,
      message: "Game does not exist",
    });
    expect(mockedModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("untracks a game", async () => {
    mockedModel.deleteOne.mockResolvedValue({ deletedCount: 1 } as never);

    await service.untrack(userId, 1145360);

    expect(mockedModel.deleteOne).toHaveBeenCalledWith({ userId, gameId: 1145360 });
  });
});
