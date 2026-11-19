# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Trophi centralizes a user's Steam achievements. Monorepo: `server/` (Express + TypeScript + MongoDB) and `client/` (React 19 + Vite + Tailwind 4 + TanStack Query). Code comments and error messages are written in English; ADRs and docs are written in Spanish.

## Commands

Everything runs via Docker Compose from the repo root (API on `:8000`, frontend on `:3000`, MongoDB on `:27017`):

```sh
docker compose up      # start all services (bind-mounted, hot reload)
docker compose down
```

Without Docker, run from each directory:

```sh
# server/
npm run dev            # ts-node-dev --respawn --transpile-only src/server.ts
npm test               # jest (ts-jest); tests live next to the code as *.test.ts under src/
npx jest src/services/games/GameService.test.ts       # single file
npx jest -t "name of test"                            # single test by name

# client/
npm run dev
npm run build          # tsc -b && vite build
npm run lint
npm test               # vitest (jsdom); tests live next to the code as *.test.ts(x) under src/
```

The server has no lint or build script, and `dev` uses `--transpile-only`, so type errors are not caught at runtime. Run `npx tsc --noEmit` in `server/` to type-check.

## Environment

- Server env file: `server/src/config/.env` (git-ignored). `config/index.ts` throws at startup if any of `NODE_ENV`, `PORT`, `DATABASE_URI`, `STEAM_API_KEY`, `FRONTEND_URL`, `BACKEND_URL`, `SESSION_SECRET` is missing (`BACKEND_URL` is the API's public URL, used for the Steam OpenID `returnURL`).
- Client env file: `client/.env`, with `VITE_API_URL`.
- MongoDB must run as a **replica set** (`rs0`); `scripts/init-replica-set.js` initializes it through the `database-init` compose service, and the API waits for it.

## Architecture

**Request flow (server).** `server.ts` connects Mongoose, then starts `app.ts`: CORS (origin `FRONTEND_URL`, credentials on, since the session travels in a cookie) → JSON → morgan piped into Winston → `express-session` (stored in MongoDB's `sessions` collection through `connect-mongo`, see `config/session.ts`, so logins survive API restarts) → Passport → `/api/v1` routes and `/auth` routes → `middlewares/error.ts` as global error handler. API responses are wrapped with `createApiResponse` (`common/http/responses.ts`); errors are thrown as `HttpException` / `SteamApiError`.

**Auth.** Steam OpenID through Passport (`config/passport.ts`). `/auth/steam` redirects to Steam, `/auth/steam/return` handles the callback and redirects to the frontend dashboard. Login methods live in a separate `AuthMethod` collection referencing `User` by `userId`, not embedded in `User` (ADR 0001), so lookups by `steamId` stay unique and email login can be added later. Flow diagram: `docs/flows/steam-auth-flow.md`. API routes are protected by `ensureAuthenticated`.

**Steam ID per request.** `getSteamId` middleware resolves the authenticated user's `steamId` once and puts it on `req.steamId` (typed in `shared/types/express.d.ts`), instead of each service resolving it (ADR 0003). Routes that call Steam need it in the middleware chain: `ensureAuthenticated` → `getSteamId` → controller.

**Services.** `routes/index.ts` wires services by hand: `SteamService` (all Steam Web API calls, URLs in constants) is injected into `GameService` and `AchievementsService`, which are injected into `GameController`. Tests mock `SteamService` and use `__fixtures__/dataMock.ts` next to each service.

**Steam API budget.** Each person runs their own instance with their own `STEAM_API_KEY` in the server `.env`; the app never stores keys of its users (ADR 0002). The rate limit (~100k requests/day) is per key, so it is only shared by the users of one instance, usually one. Data from Steam is still cached in MongoDB by how often it changes (ADR 0011): the library in `GameLibrary` (per `steamId`, `GAME_LIBRARY_TTL_MS`, 8 h), the player's progress in `PlayerAchievements` (per `(steamId, game)`, `PLAYER_ACHIEVEMENTS_TTL_MS`, 30 min) and each game's achievement schema in `GameAchievementSchema` (shared, no expiry, renewed when the progress brings an unknown achievement). The Refresh buttons bypass the cache with no cooldown. If Steam fails, a stale copy is returned. Keep calls to Steam to a minimum.

**Client.** `App.tsx` → `Layout` (`Sidebar`) → `GamesLibrary` / `SearchBox` / `GameStatusTabs` / `GameCard`. Data fetching goes through TanStack Query against `API_URL` (`client/src/config`). There is no router: `lib/route.ts` turns the path into a view. Hook tests mock `../config` and `fetch`, and wrap the hook with `test/queryWrapper.tsx`. Styling is neo-brutalist Tailwind in `styles.css`.

## Gotchas

- Steam sometimes returns a wrong `Content-Type` with a valid JSON body, so `passport.ts` uses a custom axios client that always tries `JSON.parse`. Don't replace it with the default axios.
- Vite is configured with polling and fixed HMR host/port for use inside Docker.
