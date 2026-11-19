import { Request, Response, NextFunction } from "express";

import GameService from "@/services/games/GameService";
import AchievementsService from "@/services/achievements/AchievementsService";

import { GameData } from "@/shared/types/game";
import { AchievementPlayerData } from "@/shared/types/achievement";
import { getCoverUrls } from "@/services/steam/covers";
import { createApiResponse } from "@/common/http/responses";
import { HTTP_RESPONSE_STATUS } from "@/common/http/constants";
import { SteamApiError } from "@/exceptions/SteamApiError";
import { HttpException } from "@/exceptions/HttpException";


export class GameController {
  constructor(
    private gameService: GameService,
    private achievementService: AchievementsService
  ) {}

  public searchGame = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const gameName = String(req.query.game);
      if (!req.steamId) throw new HttpException(HTTP_RESPONSE_STATUS.UNAUTHORIZED, "SteamId not available");
      const steamId = req.steamId;
      const gamesLibrary: GameData[] = await this.gameService.getGamesLibrary(steamId);
      const matchedGames = this.gameService.findGames(gameName, gamesLibrary);
      const settledAchievements = await Promise.allSettled(matchedGames.map(game => this.gameAchievements(game.gameId, steamId)));
      const gamesWithAchievements = settledAchievements
        .filter((result): result is PromiseFulfilledResult<GameData> => result.status === "fulfilled")
        .map((result) => result.value);

      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, '', gamesWithAchievements));

    } catch (error) {
      next(error);
    }
  };

  public getGameAchievements = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.steamId) throw new HttpException(HTTP_RESPONSE_STATUS.UNAUTHORIZED, "SteamId not available");
      const steamId = req.steamId;
      const achievementsData = await this.gameAchievements(Number(req.params.gameId), steamId);
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, '', achievementsData));
    } catch (error) {
      next(error)
    }
  }

  // The user asks Steam again for their progress in a game, skipping the cache
  public refreshGameAchievements = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.steamId) throw new HttpException(HTTP_RESPONSE_STATUS.UNAUTHORIZED, "SteamId not available");
      const achievementsData = await this.gameAchievements(Number(req.params.gameId), req.steamId, { refresh: true });
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, '', achievementsData));
    } catch (error) {
      next(error)
    }
  }

  // When the library was last synced with Steam and how many games it has
  public getLibraryStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.steamId) throw new HttpException(HTTP_RESPONSE_STATUS.UNAUTHORIZED, "SteamId not available");
      const { value, syncedAt } = await this.gameService.getLibrary(req.steamId);
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, '', { total: value.length, syncedAt }));
    } catch (error) {
      next(error)
    }
  }

  public refreshLibrary = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.steamId) throw new HttpException(HTTP_RESPONSE_STATUS.UNAUTHORIZED, "SteamId not available");
      const { value, syncedAt } = await this.gameService.getLibrary(req.steamId, { refresh: true });
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, '', { total: value.length, syncedAt }));
    } catch (error) {
      next(error)
    }
  }

  private async gameAchievements(gameId: number, steamId: string, { refresh = false } = {}): Promise<GameData> {
    try {
      const playerDataAchievements: AchievementPlayerData & { syncedAt: Date } =
        await this.achievementService.getLockedAchievementsDataForPlayer(
          gameId,
          steamId,
          { refresh }
        );
      const gameAchievements: GameData = {
        gameId,
        ...getCoverUrls(gameId),
        ...playerDataAchievements,
      };

      return gameAchievements;

    } catch (error) {
      throw new SteamApiError(HTTP_RESPONSE_STATUS.SERVER_ERROR, `An error occurred while fetching achievements for gameID ${gameId}`);
    }
  };
}
