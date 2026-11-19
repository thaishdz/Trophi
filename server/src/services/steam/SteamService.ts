import axios from "axios";

import config from "@/config";

import { HTTP_RESPONSE_STATUS } from "@/common/http/constants";
import { SteamApiError } from "@/exceptions/SteamApiError";
import { ApiResponse } from "@/shared/types/apiResponse";
import { GameLibraryResponse } from "@/shared/types/game";
import { STEAM_API_URL } from "@/config/constants";

class SteamService {
  private STEAM_API_KEY: string;

  constructor() {
    this.STEAM_API_KEY = config.STEAM_API_KEY;
  }

  async getOwnedGames(steamId: string): Promise<ApiResponse<GameLibraryResponse[]>> {
    const baseUrl = `${STEAM_API_URL}/IPlayerService/GetOwnedGames/v1/`
    const params = new URLSearchParams({
      key: this.STEAM_API_KEY,
      steamid: steamId,
      include_appinfo: 'true', // URLSearchParams expects strings, not booleans
      include_played_free_games: 'true'
    });

    const url = `${baseUrl}?${params.toString()}`;

    try {
      const response = await axios.get(url); // lanzará AxiosError
      const gamesLibrary = response.data.response;

      if (!('games' in gamesLibrary)) {
        throw new SteamApiError(HTTP_RESPONSE_STATUS.FORBIDDEN, "Cannot access this user's library")
      }
      return { data: gamesLibrary.games};
    } catch (error: any) {
      if (error instanceof SteamApiError) throw error; // 403
      throw new SteamApiError( // AxiosError
        error.response?.status || HTTP_RESPONSE_STATUS.SERVER_ERROR,
        "Failed fetching games from Steam API",
        {error}
      );
    }
  }

  async getPlayerAchievements<T>(gameId: number, steamId: string): Promise<ApiResponse<T>> {
    try {
      const baseUrl = `${STEAM_API_URL}/ISteamUserStats/GetPlayerAchievements/v1/`;
      const params = new URLSearchParams({
        appid: gameId.toString(),
        key: this.STEAM_API_KEY,
        steamid: steamId
      });
      const url = `${baseUrl}?${params.toString()}`;

      const response = await axios.get(url);
      const playerAchievementsData = response.data.playerstats;

      const totalAchievements = playerAchievementsData.achievements.length;

      return {
        data: {
          ...playerAchievementsData,
          totalGameAchievements: totalAchievements
        }
      }

    } catch (error: any) {
      throw new SteamApiError(
          error.response?.status || HTTP_RESPONSE_STATUS.SERVER_ERROR,
          "Failed fetching achievements from SteamAPI",
        {error}
      );
    }
  }

  async getAchievementsDetails<T>(appId: number): Promise<ApiResponse<T>> {
    try {

      const baseUrl = `${STEAM_API_URL}/ISteamUserStats/GetSchemaForGame/v2/`;
      const params = new URLSearchParams({
        key: this.STEAM_API_KEY,
        appid: appId.toString(),
      });

      const url = `${baseUrl}?${params.toString()}`;

      const response = await axios.get(url);
      const achievementsDetails: T = response.data.game.availableGameStats.achievements;

      return { data: achievementsDetails };
    } catch (error: any) {
        throw new SteamApiError(
          error.response?.status || HTTP_RESPONSE_STATUS.SERVER_ERROR,
          "Failed fetching SchemaForGame from SteamAPI"
        );
    }
  }
}

export default SteamService;
