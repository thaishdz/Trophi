# CLAUDE.md

Trophi centralizes a user's Steam achievements. Monorepo: `server/` (Express + TypeScript + MongoDB) and `client/` (React 19 + Vite + Tailwind 4 + TanStack Query). Code comments and error messages in English; ADRs and docs in Spanish, translated to English.

## Commands

Services run with Docker Compose from the root (API `:8000`, frontend `:3000`, MongoDB `:27017`). Tests and checks run on the host:

```sh
docker compose up -d                 # start everything (hot reload)
docker compose up -d --build -V api  # after a dependency change (same for frontend)

# server/
npm test                             # jest; npx jest <file> or -t "<name>" for one
npx tsc --noEmit                     # type-check (dev uses --transpile-only)

# client/
npm test                             # vitest
npm run lint
npm run build                        # tsc -b && vite build
```

## Environment

- `server/src/config/.env`: `config/index.ts` fails at startup if `NODE_ENV`, `PORT`, `DATABASE_URI`, `STEAM_API_KEY`, `FRONTEND_URL`, `BACKEND_URL` (used for the OpenID `returnURL`) or `SESSION_SECRET` is missing.
- `client/.env`: `VITE_API_URL`.
- MongoDB is a replica set (`rs0`, set up by the `database-init` service) because the first login creates `User` and `AuthMethod` in a transaction.

## Architecture

**Server.** `app.ts`: CORS with credentials → JSON → morgan/Winston → `express-session` stored in MongoDB (`config/session.ts`, ADR 0012) → Passport → `/api/v1` and `/auth` → `middlewares/error.ts`. Responses use `createApiResponse`; errors are `HttpException` / `SteamApiError`.

**Auth.** Steam OpenID via Passport (`config/passport.ts`), redirecting back to `/dashboard`. Login methods live in `AuthMethod`, apart from `User` (ADR 0001). Routes use `ensureAuthenticated`; those that call Steam add `getSteamId`, which sets `req.steamId` (ADR 0003).

**Services.** `routes/index.ts` wires everything by hand (ADR 0010). `SteamService` holds every Steam call and feeds `GameService` and `AchievementsService`. Follows, tracked games, notes and links (guides and videos) have their own service and controller.

**Steam cache.** One API key per instance (ADR 0002). Steam data is cached in MongoDB with `services/cache/readThrough.ts` (ADR 0011): library 8 h, player progress 30 min, achievement schema with no expiry (renewed when the progress lists an unknown achievement). Refresh buttons skip the cache; normal loads fall back to a stale copy if Steam fails. Keep Steam calls to a minimum.

**Client.** No router: `lib/route.ts` maps the path to a view (`/dashboard`, `/library`, `/library/:id`, `/library/:id/achievements/:apiname`, `/profile`). Data goes through the hooks in `hooks/`, with cache defaults in `config/queryClient.ts`. Dark theme tokens in `styles.css`; `TintedPage` tints each screen with the game's cover colours (ADR 0008). Hook tests mock `../config` and `fetch` and use `test/queryWrapper.tsx`.

## Gotchas

- `passport.ts` uses a custom axios client that always `JSON.parse`s, because Steam sometimes sends JSON with a wrong `Content-Type`. Keep it.
- `node_modules` lives in an anonymous volume per container: dependency changes need `--build -V`.
- The compose project is fixed as `trophi` so every git worktree shares the containers and the database.
- Vite uses polling and a fixed HMR port for Docker.
