# 🏆 TrophyLogger (v0)

All your Steam achievements in one place. Sign in with Steam, search your library and see which achievements you still have locked in each game.

![TrophyLogger dashboard](docs/screenshots/2026-11-18.png)

*Screenshot with mocked data: made-up progress and achievements on top of real game covers.*

> **Status:** early development (v0). Steam login, library search and locked achievements work. There is no login button in the UI yet, so you sign in by visiting `/auth/steam`.

**Stack:** React 19, Vite, Tailwind 4 and TanStack Query on the client; Express, TypeScript and MongoDB on the server. Everything runs with Docker Compose.

## Run it locally

**Requirements:** [Docker](https://docs.docker.com/get-docker/) with Compose v2 and a [Steam Web API key](https://steamcommunity.com/dev/apikey).

1. Clone the repo:

   ```sh
   git clone git@github.com:thaishdz/TrophyLogger.git
   cd TrophyLogger
   ```

2. Create `server/src/config/.env`:

   ```sh
   NODE_ENV=development
   PORT=8000
   DATABASE_URI=mongodb://database:27017/<db-name>?replicaSet=rs0
   STEAM_API_KEY=<your-steam-api-key>
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:8000
   SESSION_SECRET=<any-random-string>
   ```

3. Create `client/.env`:

   ```sh
   VITE_API_URL=http://localhost:8000/api/v1/
   ```

4. Start everything:

   ```sh
   docker compose up
   ```

5. Open [http://localhost:8000/auth/steam](http://localhost:8000/auth/steam) to sign in, then use the app at [http://localhost:3000](http://localhost:3000).

Stop it with `docker compose down`.

## Screenshot history

Older screenshots are kept in [`docs/screenshots/`](docs/screenshots/), named by date:

- [2026-11-18](docs/screenshots/2026-11-18.png): the dashboard (mocked data).
- [2025-05-06](docs/screenshots/2025-05-06.jpg): the first version, the Games Library page.

## Docs

Architecture decisions are in [`docs/adr/`](docs/adr/) and the login flow is in [`docs/flows/steam-auth-flow.md`](docs/flows/steam-auth-flow.md).
