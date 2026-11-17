import SteamService from "../steam/SteamService";
import GameService from "./GameService";
import { GameData } from "../../shared/types/game";
import { GameLibrary } from "../../models/GameLibrary";
import { GAME_LIBRARY_TTL_MS } from "../../config/constants";
import { SteamApiError } from "../../exceptions/SteamApiError";

// Simulo el comportamiento de las dependencias, no me enfoco en la llamada HTTP ni en la BBDD
jest.mock("../../services/steam/SteamService");
jest.mock("../../models/GameLibrary");

const STEAM_ID = "76561198000000000";

describe("GameService --- biblioteca de juegos", () => {
  let gameService: GameService;
  let apiServiceMock: jest.Mocked<SteamService>;
  const findOneMock = GameLibrary.findOne as unknown as jest.Mock;
  const findOneAndUpdateMock = GameLibrary.findOneAndUpdate as unknown as jest.Mock;

  const steamResponse = {
    data: [
      { appid: 1, name: "Game 1" },
      { appid: 2, name: "Game 2" },
    ],
  } as Awaited<ReturnType<SteamService["getOwnedGames"]>>;

  const expectedGames: GameData[] = [
    { gameId: 1, gameName: "Game 1" },
    { gameId: 2, gameName: "Game 2" },
  ];

  const stored = (ageMs: number) => ({
    steamId: STEAM_ID,
    games: [{ gameId: 99, gameName: "Guardado" }],
    syncedAt: new Date(Date.now() - ageMs),
  });

  const mockStored = (doc: ReturnType<typeof stored> | null) =>
    findOneMock.mockReturnValue({ lean: jest.fn().mockResolvedValue(doc) });

  beforeEach(() => {
    jest.clearAllMocks();
    apiServiceMock = new SteamService() as jest.Mocked<SteamService>;
    gameService = new GameService(apiServiceMock);
    findOneAndUpdateMock.mockResolvedValue(null);
  });

  it("pide la biblioteca a Steam y la guarda cuando no hay copia", async () => {
    mockStored(null);
    apiServiceMock.getOwnedGames.mockResolvedValue(steamResponse);

    const result = await gameService.getGamesLibrary(STEAM_ID);

    expect(result).toEqual(expectedGames);
    expect(apiServiceMock.getOwnedGames).toHaveBeenCalledTimes(1);
    expect(apiServiceMock.getOwnedGames).toHaveBeenCalledWith(STEAM_ID);
    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { steamId: STEAM_ID },
      expect.objectContaining({ games: expectedGames, syncedAt: expect.any(Date) }),
      { upsert: true },
    );
  });

  it("devuelve la copia guardada sin llamar a Steam si es reciente", async () => {
    const doc = stored(GAME_LIBRARY_TTL_MS - 60_000);
    mockStored(doc);

    const result = await gameService.getGamesLibrary(STEAM_ID);

    expect(result).toEqual(doc.games);
    expect(apiServiceMock.getOwnedGames).not.toHaveBeenCalled();
    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
  });

  it("refresca desde Steam y actualiza la copia cuando está caducada", async () => {
    mockStored(stored(GAME_LIBRARY_TTL_MS + 60_000));
    apiServiceMock.getOwnedGames.mockResolvedValue(steamResponse);

    const result = await gameService.getGamesLibrary(STEAM_ID);

    expect(result).toEqual(expectedGames);
    expect(apiServiceMock.getOwnedGames).toHaveBeenCalledTimes(1);
    expect(findOneAndUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("devuelve la copia caducada si Steam falla", async () => {
    const doc = stored(GAME_LIBRARY_TTL_MS + 60_000);
    mockStored(doc);
    apiServiceMock.getOwnedGames.mockRejectedValue(new SteamApiError(500, "Steam caído"));

    const result = await gameService.getGamesLibrary(STEAM_ID);

    expect(result).toEqual(doc.games);
    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
  });

  it("propaga el error de Steam si no hay copia guardada", async () => {
    mockStored(null);
    apiServiceMock.getOwnedGames.mockRejectedValue(new SteamApiError(403, "Biblioteca privada"));

    await expect(gameService.getGamesLibrary(STEAM_ID)).rejects.toThrow("Biblioteca privada");
    expect(findOneAndUpdateMock).not.toHaveBeenCalled();
  });
});

describe("GameService --- búsqueda", () => {
  it("devuelve los juegos encontrados", () => {
    const gameService = new GameService(new SteamService());
    const gamesLibraryMock: GameData[] = [
      { gameId: 1, gameName: "The Witcher 3", cover: "" },
      { gameId: 2, gameName: "Cuphead", cover: "" },
      { gameId: 3, gameName: "Horizon Zero Dawn", cover: "" },
    ];

    const result = gameService.findGames("zero", gamesLibraryMock);

    expect(result).toEqual([{ gameId: 3, gameName: "Horizon Zero Dawn", cover: "" }]);
  });
});
