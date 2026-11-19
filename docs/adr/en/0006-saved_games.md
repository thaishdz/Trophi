# Saved games: name from the user's library and progress per tile

> **Decision**: Save games in MongoDB taking the name from the user's own library on the server, and request the progress of each saved game separately when the list opens.
> **Date**: 2026-11-18
> **Original**: [Spanish](../0006-juegos_guardados.md)

---

## Context

- Besides achievements, I want the user to be able to save a game to keep track of it.
- There are two decisions: where the saved game's name comes from, and where the progress shown on each tile comes from.

## Options for the game name

| Option | Pros | Cons |
|---|---|---|
| The client sends the name | The server does not need to look anything up | The name can be spoofed, and a game the user does not own could be saved |
| ⭐ **The server takes it from the user's library** | Only owned games can be saved and the name is the real one. The library is already in MongoDB ([ADR 0004](0004-games_library_cache_refresh.md)) | If the library has expired, saving may trigger a Steam call |

## Options for each tile's progress

| Option | Pros | Cons |
|---|---|---|
| Copy of the progress in MongoDB | The list loads without calling Steam | It can go stale and needs a refresh policy |
| ⭐ **One Steam request per game when the list opens** | Fresh data with no refresh logic | Two Steam calls per saved game, against the shared limit in [ADR 0002](0002-steam_achievement_sync_cache_strategy.md). Scales poorly with many games |

## Reasoning

- Taking the name from the user's library on the server gives me ownership validation at no extra cost.
- For progress I choose one Steam request per game for simplicity: with few saved games the cost is acceptable and I avoid designing a refresh policy. I note it as something to revisit.

## Decision

**I choose taking the name from the user's library on the server, and one Steam request per game for the progress.**

| Piece | Detail |
|---|---|
| Model and routes | `TrackedGame` with a unique `(userId, gameId)` index. Routes `GET /api/v1/tracked-games`, and `PUT` and `DELETE /api/v1/tracked-games/:gameId` |
| `PUT` | Idempotent; returns 404 if the game is not in the user's library |
| Naming | The API keeps the name `tracked-games`; the interface talks about "saving" |
| Progress | Each tile requests its progress with the same query the game page uses, which the browser keeps for 5 minutes |

## Consequences

- Opening the list with many games fires many requests at once. If usage grows, I move to a copy of the progress in MongoDB.
- When saving from a search, the game is always in the library just queried, so it adds no calls in the normal case.
