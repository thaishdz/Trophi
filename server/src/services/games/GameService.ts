import Fuse, { FuseResult } from "fuse.js"; // mi santo grial para realizar las búsquedas
import SteamService from "../steam/SteamService";
import { GameData } from "../../shared/types/game";

import { ApiResponse } from "../../shared/types/apiResponse";
import { GameLibraryResponse } from "../../shared/types/game";
import { SteamApiError } from "../../exceptions/SteamApiError";
import { HTTP_RESPONSE_STATUS } from "../../common/http/constants";
import { GAME_LIBRARY_TTL_MS } from "../../config/constants";
import { GameLibrary } from "../../models/GameLibrary";

class GameService {
  /*
   ** Al usar inyección de dependencias (DI) no solo desacoplamos la fuente de datos,
   ** siendo vital en caso de que un día queramos sustituirla
   ** también facilita mockear en los tests
   */
  constructor(private steamService: SteamService) {}

  /*
   ** La biblioteca se guarda en BBDD y solo se vuelve a pedir a Steam cuando
   ** no existe o tiene más de GAME_LIBRARY_TTL_MS. Si Steam falla y hay una
   ** copia guardada (aunque esté caducada), se devuelve esa copia.
   */
  async getGamesLibrary(steamId: string): Promise<GameData[]> {
    const stored = await GameLibrary.findOne({ steamId }).lean();

    if (stored && Date.now() - stored.syncedAt.getTime() < GAME_LIBRARY_TTL_MS) {
      return stored.games;
    }

    try {
      const games = await this.fetchGamesLibrary(steamId);
      await GameLibrary.findOneAndUpdate(
        { steamId },
        { games, syncedAt: new Date() },
        { upsert: true },
      );
      return games;
    } catch (error) {
      if (stored) return stored.games;
      throw error;
    }
  }

  private async fetchGamesLibrary(steamId: string): Promise<GameData[]> {
    const { data }: ApiResponse<GameLibraryResponse[]> =
      await this.steamService.getOwnedGames(steamId);

    if (!Array.isArray(data)) {
      throw new SteamApiError(HTTP_RESPONSE_STATUS.BAD_REQUEST, "Invalid response: expected an array");
    }

    return data.map((game: GameLibraryResponse) => ({
      gameId: game.appid,
      gameName: game.name,
    }));
  }

  findGames(gameName: string, gamesLibrary: GameData[]): GameData[] {
    const options = {
      keys: ["gameName"], // La búsqueda es por la clave "gameName"
      isCaseSensitive: false,
      threshold: 0.2, // - Reducir para ser más exacto | + Aumentar para que se le vaya la bola
    };

    const fuse = new Fuse(gamesLibrary, options);

    const results: FuseResult<GameData>[] = fuse.search(gameName);
    const games: GameData[] = results.map((result) => result.item);

    return games;
  }
}

export default GameService;
