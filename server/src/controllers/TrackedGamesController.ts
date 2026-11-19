import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import TrackedGamesService from "@/services/tracked/TrackedGamesService";
import { createApiResponse } from "@/common/http/responses";
import { HTTP_RESPONSE_STATUS } from "@/common/http/constants";
import { HttpException } from "@/exceptions/HttpException";

export class TrackedGamesController {
  constructor(private trackedGamesService: TrackedGamesService) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const games = await this.trackedGamesService.list(this.userId(req));
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", games));
    } catch (error) {
      next(error);
    }
  };

  public track = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const gameId = this.parseGameId(req);
      if (!req.steamId) throw new HttpException(HTTP_RESPONSE_STATUS.UNAUTHORIZED, "SteamId not available");
      const game = await this.trackedGamesService.track(this.userId(req), req.steamId, gameId);
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", game));
    } catch (error) {
      next(error);
    }
  };

  public untrack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const gameId = this.parseGameId(req);
      await this.trackedGamesService.untrack(this.userId(req), gameId);
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", null));
    } catch (error) {
      next(error);
    }
  };

  // The routes sit behind ensureAuthenticated, so req.user always exists here
  private userId(req: Request): Types.ObjectId {
    return (req.user as unknown as { _id: Types.ObjectId })._id;
  }

  private parseGameId(req: Request): number {
    const gameId = Number(req.params.gameId);
    if (!Number.isInteger(gameId) || gameId <= 0) {
      throw new HttpException(HTTP_RESPONSE_STATUS.BAD_REQUEST, "Invalid game id");
    }
    return gameId;
  }
}
