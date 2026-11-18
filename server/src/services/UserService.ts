import { HydratedDocument} from 'mongoose';
import { AuthMethod } from "../models/AuthMethod";
import { HttpException } from '../exceptions/HttpException';
import { HTTP_RESPONSE_STATUS } from "../common/http/constants";
import { IUser } from '../models/User';




export class UserService {

  async getSteamId(user: HydratedDocument<IUser>) {
    const authMethodDocument = await AuthMethod.findOne({
      userId: user._id
    })
    if (!authMethodDocument?.steamId) {
      throw new HttpException(HTTP_RESPONSE_STATUS.NOT_FOUND, "Authmethod not found")
    }
    return authMethodDocument.steamId;
  }
}
