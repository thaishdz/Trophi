import axios from "axios";
import { HTTP_RESPONSE_STATUS } from "../../common/http/constants";
import { SteamApiError } from "../../exceptions/SteamApiError";
import ApiHandlerService from "./SteamService";


jest.mock("axios");

// The real config throws when the .env file is missing, so the tests use a fixed one
jest.mock("../../config", () => ({
  __esModule: true,
  default: { STEAM_API_KEY: "test-key" },
}));

const STEAM_API_KEY = "test-key";
const STEAM_ID = "76561198000000000";

// Necesitamos testear que nuestra App interactua bien con la API
describe("Make requests to the Steam API", () => {
  let apiHandlerService: ApiHandlerService;
  const mockedAxios = axios as jest.Mocked<typeof axios>; // mockeamos la llamada axios (no hará la solicitud real)
  beforeEach(() => {
    // INFO:
    /**
     * Al hacer esto primero, conseguimos aislar cada test
     * evitando contaminar la instancia de clase con residuos
     * de mocks anteriores
     */
    jest.clearAllMocks(); // Limpia los mocks antes de cada test
    apiHandlerService = new ApiHandlerService();
  });

  it("should fetch and return the players owned games", async () => {
    const apiMockResponse = {
      data: {
        response: {
          games: [
            { appid: 1, name: "Game 1" },
            { appid: 2, name: "Game 2" },
          ],
        },
      },
    };

    // INFO:
    /**
     * “Hey, cuando alguien llame a .get,
     * finge que hiciste la solicitud
     * y devuelve este objeto apiMockResponse como respuesta (promesa resuelta).”
     */
    mockedAxios.get.mockResolvedValue(apiMockResponse);

    const result = await apiHandlerService.getOwnedGames(STEAM_ID);

    // Verifica que axios haya sido llamado con un 1 argumento, sin importar su valor exacto.
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.anything());

    // Obtenemos la URL que se pasó en la llamada mockeada
    const url = mockedAxios.get.mock.calls[0][0];

    // Verificamos que la URL contenga los parámetros esperados
    expect(url).toContain("key=" + STEAM_API_KEY);
    expect(url).toContain("steamid=" + STEAM_ID);
    expect(url).toContain("include_appinfo=" + true);
    expect(url).toContain("include_played_free_games=" + true);

    // Comparamos objetos ya transformados
    expect(result).toEqual({
      data: [
        { appid: 1, name: "Game 1" },
        { appid: 2, name: "Game 2" },
      ],
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1); // se ha llamado 1 vez a la API
  });

  it("should throw an fetch error if the API request fails", async () => {
    /**
     * 	“Cuando se llame a axios.get, en vez de resolver la promesa,
     *  recházala y lanza este error.”
     */
    mockedAxios.get.mockRejectedValue({ response: { status: HTTP_RESPONSE_STATUS.SERVER_ERROR } });

    const result = apiHandlerService.getOwnedGames(STEAM_ID);

    await expect(result).rejects.toThrow(SteamApiError);
    await expect(result).rejects.toMatchObject({
      status: HTTP_RESPONSE_STATUS.SERVER_ERROR,
      message: "Failed fetching games from Steam API",
    });

    // Verifica que la API fue llamada
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("should fetch and return player achievements", async () => {
    const apiMockResponse = {
      data: {
        playerstats: {
          steamID: "11111111111111111",
          gameName: "Horizon Zero Dawn™ Complete Edition",
          achievements: [
            {
              apiname: "NEW_ACHIEVEMENT_4_21",
              achieved: 1,
              unlocktime: 11111111,
            },
            {
              apiname: "NEW_ACHIEVEMENT_5_10",
              achieved: 1,
              unlocktime: 11111111,
            },
          ],
        },
      },
    };
    // 1. Configuración del mock antes de la llamada
    mockedAxios.get.mockResolvedValue(apiMockResponse);

    // 2. Llamada a la función que internamente usará el mock
    const result = await apiHandlerService.getPlayerAchievements(1, STEAM_ID);

    // 3. Verificaciones de la llamada
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.anything());

    // Obtenemos la URL que se pasó en la llamada mockeada
    const url = mockedAxios.get.mock.calls[0][0];

    // Verificamos que la URL contenga los parámetros esperados
    expect(url).toContain("key=" + STEAM_API_KEY);
    expect(url).toContain("steamid=" + STEAM_ID);

    // The service keeps the player stats and adds the total number of achievements
    const resultExpected = {
      data: {
        steamID: "11111111111111111",
        gameName: "Horizon Zero Dawn™ Complete Edition",
        achievements: [
          {
            apiname: "NEW_ACHIEVEMENT_4_21",
            achieved: 1,
            unlocktime: 11111111,
          },
          {
            apiname: "NEW_ACHIEVEMENT_5_10",
            achieved: 1,
            unlocktime: 11111111,
          },
        ],
        totalGameAchievements: 2,
      },
    };

    expect(result).toEqual(resultExpected);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("should throw an fetch error if the Achievements request fails", async () => {
    mockedAxios.get.mockRejectedValue({ response: { status: HTTP_RESPONSE_STATUS.SERVER_ERROR } });

    const result = apiHandlerService.getPlayerAchievements(1, STEAM_ID);

    await expect(result).rejects.toThrow(SteamApiError);
    await expect(result).rejects.toMatchObject({
      status: HTTP_RESPONSE_STATUS.SERVER_ERROR,
      message: "Failed fetching achievements from SteamAPI",
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("should return the achievement details.", async () => {
    const apiMockResponse = {
      data: {
        game: {
          availableGameStats: {
            achievements: [
              {
                name: "NEW_ACHIEVEMENT",
                defaultvalue: 0,
                displayName: "All achievements obtained",
                hidden: 0,
                description: "Obtained all Horizon Zero Dawn achievements.",
                icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/1151640/90105bcb9db3651e3830bf56a45834eab69ac01d.jpg",
                icongray:
                  "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/1151640/7ec4a9bed1bc7d1edbf73ddde28120c221169873.jpg",
              },
            ],
          },
        },
      },
    };

    mockedAxios.get.mockResolvedValue(apiMockResponse);

    const result = await apiHandlerService.getAchievementsDetails(1151640);

    expect(mockedAxios.get).toHaveBeenCalledWith(expect.anything());

    // Obtenemos la URL que se pasó en la llamada mockeada
    const url = mockedAxios.get.mock.calls[0][0];

    // Verificamos que la URL contenga los parámetros esperados
    expect(url).toContain("key=" + STEAM_API_KEY);

    const resultExpected = {
      data: [
        {
          name: "NEW_ACHIEVEMENT",
          defaultvalue: 0,
          displayName: "All achievements obtained",
          hidden: 0,
          description: "Obtained all Horizon Zero Dawn achievements.",
          icon: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/1151640/90105bcb9db3651e3830bf56a45834eab69ac01d.jpg",
          icongray:
            "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/1151640/7ec4a9bed1bc7d1edbf73ddde28120c221169873.jpg",
        },
      ],
    };

    expect(result).toEqual(resultExpected);

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("should throw a 403 error if the library is private", async () => {
    // Steam answers 200 with an empty response when the profile's game details are private
    mockedAxios.get.mockResolvedValue({ data: { response: {} } });

    await expect(apiHandlerService.getOwnedGames(STEAM_ID)).rejects.toMatchObject({
      status: HTTP_RESPONSE_STATUS.FORBIDDEN,
      message: "Cannot access this user's library",
    });
  });

  it("should throw an fetch error if the achievement details request fails", async () => {
    mockedAxios.get.mockRejectedValue({ response: { status: HTTP_RESPONSE_STATUS.SERVER_ERROR } });

    const result = apiHandlerService.getAchievementsDetails(1151640);

    await expect(result).rejects.toThrow(SteamApiError);
    await expect(result).rejects.toMatchObject({
      status: HTTP_RESPONSE_STATUS.SERVER_ERROR,
      message: "Failed fetching SchemaForGame from SteamAPI",
    });
  });
});
