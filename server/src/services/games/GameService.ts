import Fuse, { FuseResult } from "fuse.js"; // mi santo grial para realizar las búsquedas
import SteamService from "@/services/steam/SteamService";
import { GameData } from "@/shared/types/game";

import { ApiResponse } from "@/shared/types/apiResponse";
import { GameLibraryResponse } from "@/shared/types/game";
import { SteamApiError } from "@/exceptions/SteamApiError";
import { HTTP_RESPONSE_STATUS } from "@/common/http/constants";
import { GAME_LIBRARY_TTL_MS } from "@/config/constants";
import { GameLibrary } from "@/models/GameLibrary";
import { Cached, readThrough } from "@/services/cache/readThrough";

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
    const { value } = await this.getLibrary(steamId);
    return value;
  }

  // With refresh, the user asks for the library again even if the stored copy is recent
  async getLibrary(steamId: string, { refresh = false } = {}): Promise<Cached<GameData[]>> {
    const stored = await GameLibrary.findOne({ steamId }).lean();

    return readThrough<GameData[]>({
      stored: stored && { value: stored.games, syncedAt: stored.syncedAt },
      ttlMs: GAME_LIBRARY_TTL_MS,
      refresh,
      fetch: () => this.fetchGamesLibrary(steamId),
      save: (games, syncedAt) => GameLibrary.findOneAndUpdate(
        { steamId },
        { games, syncedAt },
        { upsert: true },
      ),
    });
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
