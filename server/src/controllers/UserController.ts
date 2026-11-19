import { Request, Response } from "express";
import { createApiResponse } from "@/common/http/responses";
import { HTTP_RESPONSE_STATUS } from "@/common/http/constants";
import { IUser } from "@/models/User";

// Returns the user of the current session. It sits behind ensureAuthenticated,
// so req.user always exists here (the client reads a 401 as "no session")
export const getMe = (req: Request, res: Response): void => {
  const { displayName, avatar } = req.user as IUser;
  res.json(createApiResponse(true, HTTP_RESPONSE_STATUS.OK, "", { displayName, avatar }));
};
