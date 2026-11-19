# Followed achievements: MongoDB per user and game vs. localStorage

> **Decision**: Persist the achievements each user follows in MongoDB, with one document per user and game holding the list of `apiname`s, and show them in their own section of the game page.
> **Date**: 2026-11-18
> **Original**: [Spanish](../0007-seguimiento_de_logros_en_mongodb.md)

---

## Context

- The "Follow" button on each locked achievement only existed in the interface: the state lived in memory and was lost on reload.
- I had to decide where to store it and what following an achievement does.
- The search history already uses `localStorage`, so there was a precedent on the client.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| localStorage | The fastest to build and does not touch the server | Lost when changing browser or device. The server cannot list or sort what is followed |
| ⭐ **MongoDB per user and game** (one document per user and game with the list of followed achievements) | Kept across devices and fits with the rest of the user's data. Following and unfollowing are atomic and idempotent operations (`$addToSet` and `$pull`), with a unique `(userId, gameId)` index. The list's insertion order gives the last achievement followed in a game | Does not store when each achievement was followed, so I cannot tell the latest one across all games |
| MongoDB per followed achievement (one document per achievement) | A timestamp per achievement would allow the latest followed across all games | More documents and more queries per game than I need today |

## Reasoning

- I want following to survive a device change, which rules out **localStorage**.
- Between the two MongoDB options, **MongoDB per user and game** covers what I show today with a single query per game. **MongoDB per followed achievement** only pays off if I need the latest achievement across all games, and I don't yet.
- An achievement is identified by its `apiname` (`Achievement.value`), not by its display name, which is neither unique nor stable.

## Decision

**I choose MongoDB per user and game.**

| Piece | Detail |
|---|---|
| Routes | Under `/api/v1/follows`: `GET /:gameId`, and `PUT` and `DELETE /:gameId/:achievement`, all behind `ensureAuthenticated` |
| Interface | The game page has a "Siguiendo" ("Following") section above the locked achievements. The dashboard hero shows the last achievement followed in the current game |
| Client | Updates the button instantly and rolls back if the request fails |

## Consequences

- "Last followed achievement" is per game. For a global one I would have to move to **MongoDB per followed achievement** or add timestamps.
- The dashboard only requests the game from Steam if something is followed, to save quota ([ADR 0002](0002-steam_achievement_sync_cache_strategy.md)).
- A followed achievement that is unlocked later stays stored but is no longer shown, because only the ones still locked count.
