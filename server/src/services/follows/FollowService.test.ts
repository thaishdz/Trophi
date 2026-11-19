import { Types } from "mongoose";
import FollowService from "./FollowService";
import { FollowedAchievements } from "@/models/FollowedAchievements";

jest.mock("@/models/FollowedAchievements", () => ({
  FollowedAchievements: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
}));

const mockedModel = FollowedAchievements as jest.Mocked<typeof FollowedAchievements>;
// The service chains .lean() after each query
const resolves = (value: unknown) => ({ lean: () => Promise.resolve(value) }) as never;

describe("FollowService", () => {
  const userId = new Types.ObjectId();
  const gameId = 1145360;
  let service: FollowService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FollowService();
  });

  it("returns the followed achievements of a game", async () => {
    mockedModel.findOne.mockReturnValue(resolves({ achievements: ["ACH_1", "ACH_2"] }));

    await expect(service.getFollowed(userId, gameId)).resolves.toEqual(["ACH_1", "ACH_2"]);
    expect(mockedModel.findOne).toHaveBeenCalledWith({ userId, gameId });
  });

  it("returns an empty list when nothing is followed yet", async () => {
    mockedModel.findOne.mockReturnValue(resolves(null));

    await expect(service.getFollowed(userId, gameId)).resolves.toEqual([]);
  });

  it("follows an achievement with an idempotent upsert", async () => {
    mockedModel.findOneAndUpdate.mockReturnValue(resolves({ achievements: ["ACH_1"] }));

    await expect(service.follow(userId, gameId, "ACH_1")).resolves.toEqual(["ACH_1"]);
    expect(mockedModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId, gameId },
      { $addToSet: { achievements: "ACH_1" } },
      { upsert: true, new: true },
    );
  });

  it("unfollows an achievement", async () => {
    mockedModel.findOneAndUpdate.mockReturnValue(resolves({ achievements: ["ACH_2"] }));

    await expect(service.unfollow(userId, gameId, "ACH_1")).resolves.toEqual(["ACH_2"]);
    expect(mockedModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId, gameId },
      { $pull: { achievements: "ACH_1" } },
      { new: true },
    );
  });

  it("returns an empty list when unfollowing in a game that has no document", async () => {
    mockedModel.findOneAndUpdate.mockReturnValue(resolves(null));

    await expect(service.unfollow(userId, gameId, "ACH_1")).resolves.toEqual([]);
  });
});
