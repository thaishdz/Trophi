import { STEAM_CDN_URL } from "../../config/constants";

/*
 ** Las portadas se sirven desde el CDN de Steam y se deducen del appid:
 ** no hace falta clave ni gastar cuota de la Web API (ADR 0002).
 ** No todos los juegos tienen portada vertical, por eso se devuelve también
 ** la cabecera como respaldo; si ninguna existe, el cliente muestra un marcador.
 */
export const getCoverUrls = (gameId: number): { cover: string; coverFallback: string } => ({
  cover: `${STEAM_CDN_URL}/${gameId}/library_600x900.jpg`,
  coverFallback: `${STEAM_CDN_URL}/${gameId}/header.jpg`,
});
