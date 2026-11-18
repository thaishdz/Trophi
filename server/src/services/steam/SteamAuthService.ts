import mongoose from 'mongoose';
import { AuthMethod } from "../../models/AuthMethod";
import { User } from '../../models/User';

export class SteamAuthService {

  async findOrCreateSteamUser(steamId: string, displayName: string, avatar?: string){
    const authMethodDocument = await AuthMethod.findOne({
      provider: 'steam',
      steamId: steamId
    }).populate('userId')

    if (authMethodDocument) {
      const userDocument = authMethodDocument.userId
      // The avatar can change on Steam, and users created before it was stored have none
      if (avatar) {
        return User.findByIdAndUpdate(userDocument._id, { avatar }, { new: true })
      }
      return userDocument
    } else {
      let newUser;
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          [newUser] = await User.create([{ displayName: displayName, avatar }], { session });
          await AuthMethod.create([{
            userId: newUser._id,
            provider: 'steam',
            steamId: steamId
          }], { session });
        });
      } finally {
        session.endSession()
      }
      return newUser;
    }
  }
}
