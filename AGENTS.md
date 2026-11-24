# AGENTS.md

## Project overview

Trophi centralizes a user's Steam achievements. Monorepo: `server/` (Express + TypeScript + MongoDB) and `client/` (React 19 + Vite + Tailwind 4 + TanStack Query).

- **Server.** `app.ts` → session in MongoDB → Passport (Steam OpenID) → `/api/v1` and `/auth` → error middleware. `routes/index.ts` wires the services by hand (ADR 0010); `SteamService` holds every Steam call.
- **Steam cache.** One API key per instance. Steam data is cached in MongoDB through `services/cache/readThrough.ts` (ADR 0011): library 8 h, progress 30 min, achievement schema with no expiry. Keep Steam calls to a minimum.
- **Client.** No router: `lib/route.ts` maps the path to a view. Data goes through `hooks/`, with cache defaults in `config/queryClient.ts`.
- **Decisions** are in `docs/adr/`. Read the relevant ADR before changing a design.

## Build and test commands

Services run in Docker from the root (API `:8000`, frontend `:3000`, MongoDB `:27017`); tests and checks run on the host.

```sh
docker compose up -d                 # start everything (hot reload)
docker compose up -d --build -V api  # after a dependency change (same for frontend)

# server/
npm test                             # jest
npx tsc --noEmit                     # type-check

# client/
npm test                             # vitest
npm run lint
npm run build
```

## Code style guidelines

- Comments and error messages in English. ADRs and docs in Spanish, with an English translation in `docs/adr/en/`.
- Server: double quotes and semicolons. Imports use the `@/` alias for `src/`, never `../`.
- Client: single quotes and no semicolons (enforced by ESLint).
- API responses use `createApiResponse`; errors are `HttpException` / `SteamApiError`.
- Conventional Commits, one line.

## Testing instructions

- Server: Jest, next to the code (`*.test.ts`), with fixtures in `__fixtures__/`. Mock `SteamService`, never the real Steam API.
- Client: Vitest + React Testing Library. Hook tests mock `../config` and `fetch` and use `test/queryWrapper.tsx`.
- Every change keeps `npm test` green in both packages, plus `tsc --noEmit` (server) and `lint` (client).

## Security considerations

- Never commit `.env` files. `server/src/config/.env` holds `STEAM_API_KEY` and `SESSION_SECRET`.
- The Steam ID comes from the session (`getSteamId`), never from the request body or query.
- The server takes game names from the user's own library, never from the client (ADR 0006).
- CORS only allows `FRONTEND_URL`, with credentials.
- Keep the custom axios client in `config/passport.ts`: Steam sometimes sends JSON with a wrong `Content-Type`.
