import { Request, Response, NextFunction } from "express";
import { HydratedDocument } from "mongoose";
import { UserService } from "@/services/UserService";
import { IUser } from "@/models/User";
import { HttpException } from "@/exceptions/HttpException";
import { HTTP_RESPONSE_STATUS } from "@/common/http/constants";

const userService = new UserService();


export const getSteamId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpException(HTTP_RESPONSE_STATUS.UNAUTHORIZED, "Authentication Error")
    req.steamId = await userService.getSteamId(req.user as HydratedDocument<IUser>)
    return next();
  } catch (error) {
    next(error);
  }
}

