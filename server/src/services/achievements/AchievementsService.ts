import SteamService from "../steam/SteamService";
import { ApiResponse } from "../../shared/types/apiResponse";
import { SteamApiError } from "../../exceptions/SteamApiError";
import { HTTP_RESPONSE_STATUS } from "../../common/http/constants";
import { PLAYER_ACHIEVEMENTS_TTL_MS } from "../../config/constants";
import { GameAchievementSchema } from "../../models/GameAchievementSchema";
import { PlayerAchievements } from "../../models/PlayerAchievements";
import { Cached, readThrough } from "../cache/readThrough";

import {
  AchievementDetails,
  GameAchievementsResponse,
  AchievementDetailsResponse,
  AchievementPlayerAchievedStats,
  AchievementPlayerData,
  AchievementsLockedData,
} from "../../shared/types/achievement";

class AchievementsService {
  constructor(
    private steamService: SteamService
  ) {}

  // With refresh, only the player's progress is asked again: the game schema keeps its own long cache
  public async getLockedAchievementsDataForPlayer(
    gameId: number,
    steamId: string,
    { refresh = false } = {}
  ): Promise<AchievementPlayerData & { syncedAt: Date }> {
    try {
      const progress = await this.getPlayerProgress(gameId, steamId, refresh);

      const { gameName, totalGameAchievements, achievements } = progress.value;

      const achievementsDetails: AchievementDetails[] =
        await this.getAchievementsDetails(gameId, achievements.map((achievement) => achievement.apiname));

      const playerLockedAchievementsData: AchievementsLockedData[] =
        this.getLockedAchievementsData(achievements, achievementsDetails);

      return {
        gameName,
        totalGameAchievements,
        achievements: playerLockedAchievementsData,
        syncedAt: progress.syncedAt,
      };
    } catch (error) {
      throw new SteamApiError(HTTP_RESPONSE_STATUS.SERVER_ERROR, "Error fetching player locked achievements data");
    }
  }

  private async getPlayerProgress(
    gameId: number,
    steamId: string,
    refresh: boolean,
  ): Promise<Cached<GameAchievementsResponse>> {
    const stored = await PlayerAchievements.findOne({ steamId, gameId }).lean();

    return readThrough<GameAchievementsResponse>({
      stored: stored && {
        value: {
          gameName: stored.gameName,
          totalGameAchievements: stored.totalGameAchievements,
          achievements: stored.achievements,
        },
        syncedAt: stored.syncedAt,
      },
      ttlMs: PLAYER_ACHIEVEMENTS_TTL_MS,
      refresh,
      fetch: async () => {
        const { data }: ApiResponse<GameAchievementsResponse> =
          await this.steamService.getPlayerAchievements(gameId, steamId);
        return {
          gameName: data.gameName,
          totalGameAchievements: data.totalGameAchievements,
          achievements: data.achievements.map(({ apiname, achieved, unlocktime }) => ({ apiname, achieved, unlocktime })),
        };
      },
      save: (progress, syncedAt) => PlayerAchievements.findOneAndUpdate(
        { steamId, gameId },
        { ...progress, syncedAt },
        { upsert: true },
      ),
    });
  }

  private getLockedAchievementsData(
    achievementPlayerAchievedStats: AchievementPlayerAchievedStats[],
    achievementsDetails: AchievementDetails[],
  ): AchievementsLockedData[] {
    const unachievedsFiltered: AchievementPlayerAchievedStats[] =
      achievementPlayerAchievedStats.filter(
        (achievement: AchievementPlayerAchievedStats) =>
          achievement.achieved === 0,
      );

    const achievementsLockedData: AchievementsLockedData[] = achievementsDetails
      .map((achievementDetail: AchievementDetails) => {
        const matchingUnachieved: AchievementPlayerAchievedStats | undefined =
          unachievedsFiltered.find(
            (unachieved: AchievementPlayerAchievedStats) =>
              unachieved.apiname === achievementDetail.value,
          );

        return matchingUnachieved
          ? {
              ...achievementDetail,
              achieved: matchingUnachieved.achieved,
            }
          : undefined;
      })

      .filter(
        (
          lockedAchievementData,
        ): lockedAchievementData is AchievementsLockedData =>
          lockedAchievementData !== undefined,
      );

    return achievementsLockedData;
  }

  /*
   ** The schema is the same for every user and the developer rarely changes it once the game
   ** is out, so it is asked to Steam once per game and never expires. The only exception is
   ** when the player's progress lists an achievement (apiname) the stored schema does not
   ** have, which means the game added achievements: then the schema is asked again.
   */
  public async getAchievementsDetails(
    gameId: number,
    progressApinames: string[] = [],
  ): Promise<AchievementDetails[]> {
    try {
      const stored = await GameAchievementSchema.findOne({ gameId }).lean();
      const known = new Set(stored?.achievements.map((achievement) => achievement.value));
      const outdated = progressApinames.some((apiname) => !known.has(apiname));

      const { value } = await readThrough<AchievementDetails[]>({
        stored: stored && { value: stored.achievements, syncedAt: stored.syncedAt },
        // An outdated copy is asked again, but it is still served if Steam fails
        ttlMs: outdated ? 0 : Infinity,
        fetch: () => this.fetchAchievementsDetails(gameId),
        save: (achievements, syncedAt) => GameAchievementSchema.findOneAndUpdate(
          { gameId },
          { achievements, syncedAt },
          { upsert: true },
        ),
      });

      return value;
    } catch (error) {
      throw new SteamApiError(HTTP_RESPONSE_STATUS.SERVER_ERROR, "Error fetching achievements details");
    }
  }

  private async fetchAchievementsDetails(gameId: number): Promise<AchievementDetails[]> {
    const { data }: ApiResponse<AchievementDetailsResponse[]> =
      await this.steamService.getAchievementsDetails(gameId);

    return data.map(
      (achievement: AchievementDetailsResponse): AchievementDetails => ({
        name: achievement.displayName,
        value: achievement.name,
        description: achievement.description,
        icon: achievement.icongray,
      }),
    );
  }
}

export default AchievementsService;
