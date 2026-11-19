import { Types } from "mongoose";
import { FollowedAchievements } from "@/models/FollowedAchievements";

class FollowService {
  async getFollowed(userId: Types.ObjectId, gameId: number): Promise<string[]> {
    const stored = await FollowedAchievements.findOne({ userId, gameId }).lean();
    return stored?.achievements ?? [];
  }

  // $addToSet keeps the call idempotent: following twice does not duplicate the achievement
  async follow(userId: Types.ObjectId, gameId: number, achievement: string): Promise<string[]> {
    const updated = await FollowedAchievements.findOneAndUpdate(
      { userId, gameId },
      { $addToSet: { achievements: achievement } },
      { upsert: true, new: true },
    ).lean();
    return updated?.achievements ?? [];
  }

  async unfollow(userId: Types.ObjectId, gameId: number, achievement: string): Promise<string[]> {
    const updated = await FollowedAchievements.findOneAndUpdate(
      { userId, gameId },
      { $pull: { achievements: achievement } },
      { new: true },
    ).lean();
    return updated?.achievements ?? [];
  }
}

export default FollowService;
