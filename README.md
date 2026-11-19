# Trophi

[Español](README.es.md) | **English**

All your Steam achievements in one place. Sign in with Steam, search your library and see which achievements you still have locked in each game.

![Trophi dashboard](docs/screenshots/2026-11-18.png)

> **Status:** early development. You can sign in with Steam, search your library, follow locked achievements and save games.

## About the code

**Stack:** React 19, Vite, Tailwind 4 and TanStack Query on the client; Express, TypeScript and MongoDB on the server. Everything runs with Docker Compose.

Roughly half of the current code, most of the client and a large part of the tests, was written with Claude Code. The architecture, the product decisions, the reviews and the ADRs are the author's.

## Key decisions

Each decision is recorded as an ADR; the [ADR index](docs/adr/en/README.md) groups them by topic. The ADRs are written in Spanish, with [English translations](docs/adr/en/).

- **Steam API budget and caching.** Each instance uses its own Steam API key, and data is cached in MongoDB by how often it changes: the library for 8 hours, achievement progress for 30 minutes and each game's achievement list until the progress reveals a new one. Users can refresh on demand. ([0002](docs/adr/en/0002-steam_achievement_sync_cache_strategy.md), [0004](docs/adr/en/0004-games_library_cache_refresh.md), [0011](docs/adr/en/0011-achievements_cache_and_manual_refresh.md))
- **Identity.** Login methods live in their own collection so the database, not the code, guarantees that a Steam account belongs to one user, and the Steam ID is resolved once per request in a middleware. ([0001](docs/adr/en/0001-auth_method_separate_collection.md), [0003](docs/adr/en/0003-steamid_middleware.md))
- **User data.** Saved games and followed achievements are stored in MongoDB, and the server takes game names from the user's own library so they cannot be spoofed. ([0006](docs/adr/en/0006-saved_games.md), [0007](docs/adr/en/0007-followed_achievements_in_mongodb.md))
- **Interface.** Covers come from Steam's image CDN with no extra API key, every screen is tinted with the current game's colours, and search results open in a native `<dialog>`. ([0005](docs/adr/en/0005-game_covers_steam_cdn.md), [0008](docs/adr/en/0008-dark_visual_direction_and_game_tint.md), [0009](docs/adr/en/0009-search_results_in_dialog_modal.md))
- **Architecture.** Services are wired by hand with constructor injection; an IoC container was considered and left out until it solves a real problem. ([0010](docs/adr/en/0010-inversion_of_control_discarded.md))

## Run it locally

**Requirements:** [Docker](https://docs.docker.com/get-docker/) with Compose v2 and a [Steam Web API key](https://steamcommunity.com/dev/apikey).

1. Clone the repo:

   ```sh
   git clone git@github.com:thaishdz/Trophi.git
   cd Trophi
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

## Docs

Architecture decisions are in [`docs/adr/en/`](docs/adr/en/README.md) (Spanish originals in [`docs/adr/`](docs/adr/README.md)) and the login flow is in [`docs/flows/steam-auth-flow.md`](docs/flows/steam-auth-flow.md).
