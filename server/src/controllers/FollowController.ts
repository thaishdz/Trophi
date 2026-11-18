import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import FollowService from "../services/follows/FollowService";
import { createApiResponse } from "../common/http/responses";
import { HTTP_RESPONSE_STATUS } from "../common/http/constants";
import { HttpException } from "../exceptions/HttpException";

const MAX_ACHIEVEMENT_LENGTH = 200;

export class FollowController {
  constructor(private followService: FollowService) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const gameId = this.parseGameId(req);
      const achievements = await this.followService.getFollowed(this.userId(req), gameId);
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", { achievements }));
    } catch (error) {
      next(error);
    }
  };

  public follow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const gameId = this.parseGameId(req);
      const achievements = await this.followService.follow(this.userId(req), gameId, this.parseAchievement(req));
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", { achievements }));
    } catch (error) {
      next(error);
    }
  };

  public unfollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const gameId = this.parseGameId(req);
      const achievements = await this.followService.unfollow(this.userId(req), gameId, this.parseAchievement(req));
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", { achievements }));
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

  private parseAchievement(req: Request): string {
    const achievement = String(req.params.achievement ?? "").trim();
    if (!achievement || achievement.length > MAX_ACHIEVEMENT_LENGTH) {
      throw new HttpException(HTTP_RESPONSE_STATUS.BAD_REQUEST, "Invalid achievement");
    }
    return achievement;
  }
}
