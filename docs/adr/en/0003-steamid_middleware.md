# Steam ID per request: dedicated middleware vs. resolving it in every method

> **Decision**: Resolve the authenticated user's `steamId` once, in a dedicated middleware (`getSteamId`), instead of letting every method that needs it resolve it on its own.
> **Date**: 2026-08-13
> **Original**: [Spanish](../0003-steamid_middleware.md)

---

## Context

- The Steam ID is needed to request the games library and the achievements of each game.
- I wanted to look it up only once and have it available on every call to the Steam API.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| Each method resolves its own `steamId` when it needs it | No need to touch the `Request` object or add a middleware | `gameAchievements` runs once per game found: if it resolved the steamId, it would repeat the same `AuthMethod` query for the same user several times in one request |
| ⭐ **Dedicated middleware: resolved once per request** | A single `AuthMethod` query per request, no matter how many internal methods need the steamId afterwards. The controller is simpler: it reads `req.steamId` instead of asking `UserService` | The middleware has to be mounted on every route that needs it |

## Reasoning

- The goal was to avoid repeating the same `AuthMethod` query several times in one request.
- `gameAchievements` runs once per game found: resolving the `steamId` inside it would have meant as many MongoDB queries as games in the search results, always for the same value.

## Decision

**Chosen: dedicated `getSteamId` middleware.**

```ts
import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/UserService";

const userService = new UserService();


export const getSteamId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.steamId = await userService.getSteamId(req.user)
    return next();
  } catch (error) {
    next(error);
  }
}
```

It runs after `ensureAuthenticated` on the routes that need the `steamId`:

```ts
router.get(
  `/search`,
  ensureAuthenticated,
  getSteamId,
  gamesController.searchGame.bind(gamesController),
);
```

## When to revisit

- If more user-derived data shows up that several controllers need to resolve in a similar way: then look into a design or architecture pattern instead of one new middleware per value.
- If the number of protected routes grows too much: then consider grouping middlewares by default.
