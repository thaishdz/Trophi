


export const STEAM_API_URL = 'https://api.steampowered.com';
export const STEAM_CDN_URL = 'https://cdn.cloudflare.steamstatic.com/steam/apps';

// Tiempo que se considera fresca la biblioteca guardada antes de volver a pedirla a Steam (ADR 0002)
// The library only changes when the user buys a game, and they can refresh it on demand (ADR 0011)
export const GAME_LIBRARY_TTL_MS = 8 * 60 * 60 * 1000;

// Achievement progress of a player in a game. Many achievements take hours, and the user can refresh on demand (ADR 0011)
export const PLAYER_ACHIEVEMENTS_TTL_MS = 30 * 60 * 1000;
