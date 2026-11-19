import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import LinkService, { LinkScope } from "@/services/links/LinkService";
import { LinkKind } from "@/models/AchievementLink";
import { createApiResponse } from "@/common/http/responses";
import { HTTP_RESPONSE_STATUS } from "@/common/http/constants";
import { HttpException } from "@/exceptions/HttpException";

const MAX_ACHIEVEMENT_LENGTH = 200;
const MAX_TITLE_LENGTH = 200;
const MAX_URL_LENGTH = 2000;

// One instance per kind of link: the guides routes use a "guide" controller and the videos routes a "video" one
export class LinkController {
  constructor(private linkService: LinkService, private kind: LinkKind) {}

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const links = await this.linkService.list(this.scope(req));
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", { links }));
    } catch (error) {
      next(error);
    }
  };

  public add = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scope = this.scope(req);
      const link = await this.linkService.add(scope, this.parseLink(req));
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", link));
    } catch (error) {
      next(error);
    }
  };

  public remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const scope = this.scope(req);
      const linkId = String(req.params.linkId);
      if (!Types.ObjectId.isValid(linkId)) {
        throw new HttpException(HTTP_RESPONSE_STATUS.BAD_REQUEST, "Invalid link id");
      }
      await this.linkService.remove(scope, linkId);
      res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", null));
    } catch (error) {
      next(error);
    }
  };

  private scope(req: Request): LinkScope {
    return { userId: this.userId(req), gameId: this.parseGameId(req), achievement: this.parseAchievement(req), kind: this.kind };
  }

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

  // Only http(s) links, so a saved link can never run a javascript: URL when clicked.
  // Without a title, the link is named after the site it points to.
  private parseLink(req: Request): { title: string; url: string } {
    const rawUrl = typeof req.body?.url === "string" ? req.body.url.trim() : "";
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new HttpException(HTTP_RESPONSE_STATUS.BAD_REQUEST, "Invalid URL");
    }
    if (!["http:", "https:"].includes(url.protocol) || rawUrl.length > MAX_URL_LENGTH) {
      throw new HttpException(HTTP_RESPONSE_STATUS.BAD_REQUEST, "Invalid URL");
    }

    const rawTitle = req.body?.title;
    if (rawTitle !== undefined && typeof rawTitle !== "string") {
      throw new HttpException(HTTP_RESPONSE_STATUS.BAD_REQUEST, "Invalid title");
    }
    const title = (rawTitle ?? "").trim() || url.hostname.replace(/^www\./, "");
    if (title.length > MAX_TITLE_LENGTH) {
      throw new HttpException(HTTP_RESPONSE_STATUS.BAD_REQUEST, `The title must be up to ${MAX_TITLE_LENGTH} characters`);
    }
    return { title, url: url.href };
  }
}
