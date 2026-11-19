import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import NoteService from "@/services/notes/NoteService";
import { createApiResponse } from "@/common/http/responses";
import { HTTP_RESPONSE_STATUS } from "@/common/http/constants";
import { HttpException } from "@/exceptions/HttpException";

const MAX_ACHIEVEMENT_LENGTH = 200;
export const MAX_NOTE_LENGTH = 5000;

export class NoteController {
  constructor(private noteService: NoteService) {}

  public get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const note = await this.noteService.getNote(this.userId(req), this.parseGameId(req), this.parseAchievement(req));
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", note));
    } catch (error) {
      next(error);
    }
  };

  public save = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const gameId = this.parseGameId(req);
      const achievement = this.parseAchievement(req);
      const note = await this.noteService.saveNote(this.userId(req), gameId, achievement, this.parseText(req));
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", note));
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

  private parseText(req: Request): string {
    const text = req.body?.text;
    if (typeof text !== "string" || text.length > MAX_NOTE_LENGTH) {
      throw new HttpException(HTTP_RESPONSE_STATUS.BAD_REQUEST, `The note must be a text of up to ${MAX_NOTE_LENGTH} characters`);
    }
    return text;
  }
}
