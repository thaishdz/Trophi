import { NextFunction, Request, Response } from 'express';
import { createApiResponse } from '@/common/http/responses';
import { HTTP_RESPONSE_STATUS } from "@/common/http/constants";


export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(HTTP_RESPONSE_STATUS.UNAUTHORIZED).json(createApiResponse(false, HTTP_RESPONSE_STATUS.UNAUTHORIZED, "Authentication Error", null, { type: req.method, url: req.originalUrl }))
};
