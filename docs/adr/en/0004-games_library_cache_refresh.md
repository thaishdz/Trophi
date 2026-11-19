# Steam games library: persisted in MongoDB and refreshed in the same request

> **Decision**: Store each user's games library in a `GameLibrary` collection (keyed by `steamId`) and refresh it from Steam, within the same request, when it is older than 5 minutes. If Steam fails and a stored copy exists, return that copy.
> **Date**: 2026-11-17
> **Original**: [Spanish](../0004-games_library_cache_refresh.md)

---

## Context

- Every search (`GET /search`) called Steam's `GetOwnedGames` to get the whole library and filter it with Fuse.js.
- That is one Steam request per search, and the Web API budget (~100,000 requests/day) is shared by every user of the app ([ADR 0002](0002-steam_achievement_sync_cache_strategy.md)).
- The library rarely changes, only when the user buys or adds a game: requesting it on every search is wasteful.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| Don't persist (previous state) | No new code and the data is always up to date | One Steam call per search: spends shared budget and adds latency to every search. If Steam fails, search fails |
| ⭐ **Persist and refresh in the same request when it expires** | Only the first search after the copy expires waits for Steam; the rest come from the database. Easy to reason about and test: the response always comes from data validated in that request. Can return an expired copy if Steam fails | The refreshing request is slower. Two simultaneous searches with an expired copy both refresh, with two Steam calls (same result) |
| Persist and refresh in the background (stale-while-revalidate) | No request waits for Steam if there is a copy | More complexity: async refresh and error handling outside the request. Can show stale data right after buying a game |

## Reasoning

- With refresh in the same request, the wait affects one search out of several and, overall, is lower than before, when every search waited.
- That first search is already slow for another reason: after filtering, the achievements of each matched game are requested, one Steam call per game.
- Background refresh would save that wait at the cost of complexity the current traffic does not justify.

## Decision

**Chosen: persist and refresh in the same request.**

| Piece | Detail |
|---|---|
| Model | `GameLibrary`: `steamId` (unique), `games: [{ gameId, gameName }]` and `syncedAt`. The key is `steamId` rather than `userId` because that is what `GameService.getGamesLibrary` already receives |
| Expiry | `GAME_LIBRARY_TTL_MS` = 5 minutes, same as the achievements cooldown in [ADR 0002](0002-steam_achievement_sync_cache_strategy.md). **Update:** [ADR 0011](0011-achievements_cache_and_manual_refresh.md) raises the expiry to 8 hours and adds a button for the user to refresh the library at any time |
| If Steam fails | If a copy exists, even an expired one, it is returned. Without a copy, the error is propagated as before |
| Interface | While searching, `SearchBox` shows "Buscando…" ("Searching…") and disables the button. No modal |

## When to revisit

- If search latency with an expired copy is noticeable in real use, consider background refresh (stale-while-revalidate).
- If several simultaneous users appear and duplicate Steam calls show up, consider a lock per `steamId`.
- If the library grows close to MongoDB's document size limit (16 MB), move to one document per game.

## What is not verified

- The decision was tested with unit tests (with mocks) and a manual visual check. I did not measure the real latency of `GetOwnedGames`, nor with very large libraries.
