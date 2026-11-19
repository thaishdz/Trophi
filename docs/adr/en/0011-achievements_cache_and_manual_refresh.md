# Server-side achievements cache and on-demand refresh by the user

> **Decision**: Store in MongoDB each game's achievement schema (no expiry, renewed only if the progress lists an unknown achievement) and each player's progress (30 minutes), and add a "Refresh" button with no cooldown.
> **Date**: 2026-11-19
> **Original**: [Spanish](../0011-cache_de_logros_y_refresco_manual.md)

---

## Context

- A game page made **two Steam calls on every visit**: `GetPlayerAchievements` (progress) and `GetSchemaForGame` (name, description and icon of each achievement). Search repeated them for every game found.
- The cache from [ADR 0002](0002-steam_achievement_sync_cache_strategy.md) only existed for the library ([ADR 0004](0004-games_library_cache_refresh.md)).
- With a cache, the user does not immediately see a just-unlocked achievement or a just-bought game.
- Each person runs their own instance with their own API key ([ADR 0002](0002-steam_achievement_sync_cache_strategy.md)): the Steam quota is not shared.

## Options for the achievement schema

| Option | Pros | Cons |
|---|---|---|
| No cache | No code needed | One Steam call per visit for data that almost never changes |
| Cache per game with expiry (7 days) | One copy per game serves every user | Arbitrary expiry: almost every renewal is wasted, and new achievements take up to 7 days to show up |
| ⭐ **Cache per game with no expiry, renewed by the progress** | In practice, a single call per game. New achievements show up as soon as the progress is updated | Fixes to texts or icons are not picked up |

How an outdated schema is detected: `GetPlayerAchievements` returns every achievement of the game with its `apiname`. If one is missing from the stored schema, the game has added achievements and the schema is requested again.

## Options for refreshing

| Option | Pros | Cons |
|---|---|---|
| Automatic cache only | The user does nothing | After playing or buying, they wait until the copy expires without knowing why it does not show up |
| Button with cooldown | Protects a shared quota | With one instance per person, it only limits the quota's owner |
| ⭐ **Automatic cache + button with no cooldown** | The user decides when they want fresh data and sees when it was last updated | Pressing it a lot spends requests (the button is disabled while refreshing) |
| Stale-while-revalidate (renew in the background) | Never waits for Steam if there is a copy | Right after playing it shows the previous progress. Errors happen outside the request. The client already does this with TanStack Query |

## Reasoning

- **Schema:** a time-based expiry adds nothing for data the developer defines once. The case that matters, new achievements, is detected by the progress itself. Fixes to texts or icons are cosmetic and very rare; if ever needed, deleting the game's document in `GameAchievementSchema` is enough.
- **30 minutes for progress:** many achievements take hours of play, so progress rarely changes within 5 minutes. To see a just-unlocked achievement right away there is the "Refresh" button.
- **8 hours for the library:** it only changes when I buy a game. I go from the 5 minutes of [ADR 0004](0004-games_library_cache_refresh.md) to 8 hours, and for a just-bought game there is the library's "Refresh" button.
- **Cooldown:** it only makes sense with an API key shared by many users, which is not the case.
- **Stale-while-revalidate:** Trophi is for keeping track of the achievements I still have to unlock, and the key moment is opening it right after playing. This option would show me the previous progress exactly then, to save one wait every 30 minutes.
- **If Steam fails:** on a normal load I serve the stored copy (as in [ADR 0004](0004-games_library_cache_refresh.md)). If the user presses "Refresh", I return the error: they asked for fresh data, and an old copy would make them think it was updated.

## Decision

**Schema: cache per game with no expiry, renewed by the progress. Progress: 30-minute automatic cache. Library: 8-hour automatic cache. Both with a "Refresh" button with no cooldown.**

| Piece | Detail |
|---|---|
| Models | `GameAchievementSchema` (unique `gameId`, no expiry) and `PlayerAchievements` (unique per `(steamId, gameId)`, `PLAYER_ACHIEVEMENTS_TTL_MS` = 30 min). The library stays in `GameLibrary`, with `GAME_LIBRARY_TTL_MS` = 8 h |
| Shared logic | `readThrough` (`services/cache/readThrough.ts`), used by the library, the schema and the progress |
| New routes | `POST /gameAchievements/:gameId/refresh`, `GET /library`, `POST /library/refresh` (with `syncedAt`) |
| Interface | "Actualizar" ("Refresh") button and "Actualizado hace X" ("Updated X ago") on the game page and in the library |

## Consequences

- An already visited game does not call Steam for 30 minutes, and search benefits from the same cache.
- If Steam fails when renewing an outdated schema, the stored copy is served and the new achievements show up on the next attempt.
- Fixes to texts or icons of existing achievements are not picked up on their own.
- If Trophi ends up with many users on a single API key, the button needs a cooldown.
