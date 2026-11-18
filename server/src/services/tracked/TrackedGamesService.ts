import { Types } from "mongoose";
import GameService from "../games/GameService";
import { getCoverUrls } from "../steam/covers";
import { TrackedGame } from "../../models/TrackedGame";
import { HttpException } from "../../exceptions/HttpException";
import { HTTP_RESPONSE_STATUS, APP_ERROR_MESSAGE } from "../../common/http/constants";

export interface TrackedGameData {
  gameId: number;
  gameName: string;
  cover: string;
  coverFallback: string;
}

const toData = (game: { gameId: number; gameName: string }): TrackedGameData => ({
  gameId: game.gameId,
  gameName: game.gameName,
  ...getCoverUrls(game.gameId),
});

class TrackedGamesService {
  constructor(private gameService: GameService) {}

  // Most recently tracked first
  async list(userId: Types.ObjectId): Promise<TrackedGameData[]> {
    const tracked = await TrackedGame.find({ userId }).sort({ createdAt: -1 }).lean();
    return tracked.map(toData);
  }

  // The name comes from the user's own library, so it cannot be spoofed and a game
  // that the user does not own cannot be tracked. The upsert keeps the call idempotent.
  async track(userId: Types.ObjectId, steamId: string, gameId: number): Promise<TrackedGameData> {
    const library = await this.gameService.getGamesLibrary(steamId);
    const game = library.find((owned) => owned.gameId === gameId);
    if (!game) {
      throw new HttpException(HTTP_RESPONSE_STATUS.NOT_FOUND, APP_ERROR_MESSAGE.GAME_DOES_NOT_EXIST);
    }

    await TrackedGame.findOneAndUpdate(
      { userId, gameId },
      { gameName: game.gameName },
      { upsert: true },
    );
    return toData(game);
  }

  async untrack(userId: Types.ObjectId, gameId: number): Promise<void> {
    await TrackedGame.deleteOne({ userId, gameId });
  }
}

export default TrackedGamesService;
