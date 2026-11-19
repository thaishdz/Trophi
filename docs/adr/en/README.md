# Architecture decisions

[Español](../README.md) | **English**

The ADRs grouped by topic. Each ADR records one decision on its date, with the options that were weighed; this index explains what was decided and how the decisions fit together.

## Steam: quota and caching

The Steam Web API has a daily limit per API key, so almost every server decision is about spending few requests without showing stale data.

| ADR | Decision |
|---|---|
| [0002](0002-steam_achievement_sync_cache_strategy.md) | Use the instance's API key, never the user's, and cache on the server with a cooldown per `(user, game)` |
| [0004](0004-games_library_cache_refresh.md) | Store the library in MongoDB, refresh it in the same request when it expires and serve the copy if Steam fails |
| [0011](0011-achievements_cache_and_manual_refresh.md) | Expiry based on how each piece of data changes: library 8 h, progress 30 min and achievement schema with no expiry (renewed if the progress lists an unknown achievement). On-demand "Refresh" button |

**Together:** a cache in MongoDB, a single function (`readThrough`) for all Steam data, and the user decides when they want fresh data.

## Identity and authentication

| ADR | Decision |
|---|---|
| [0001](0001-auth_method_separate_collection.md) | Login methods in a separate `AuthMethod` collection with unique indexes: the database guarantees that a `steamId` or an email never belongs to two users |
| [0003](0003-steamid_middleware.md) | Resolve the `steamId` once per request in a middleware, instead of in every method |
| [0012](0012-sessions_in_mongodb.md) | Login sessions in MongoDB with `connect-mongo` (30 days), so they survive API restarts. JWT ruled out: it cannot really log out without storing state again |

**Together:** identity is validated by the database and resolved only once, ready for email login. The session lives in MongoDB too.

## User data

| ADR | Decision |
|---|---|
| [0006](0006-saved_games.md) | Saved games in MongoDB, with the name taken from the user's library on the server, so it cannot be spoofed and a game the user does not own cannot be saved |
| [0007](0007-followed_achievements_in_mongodb.md) | Followed achievements in MongoDB, one document per user and game, with atomic and idempotent operations |

**Together:** what the user decides (what they save and what they follow) lives on the server and survives a device change.

## Interface

| ADR | Decision |
|---|---|
| [0005](0005-game_covers_steam_cdn.md) | Covers from Steam's image CDN based on the `appid`, with no key or quota. IGDB and other APIs ruled out |
| [0008](0008-dark_visual_direction_and_game_tint.md) | Dark style with covers in the lead and the background tinted with the current game's colours |
| [0009](0009-search_results_in_dialog_modal.md) | Search results in a native `<dialog>` with one row per game, without tabs |

**Together:** the game's cover is the centre of the interface, built on what the browser and Steam already provide.

## Architecture

| ADR | Decision |
|---|---|
| [0010](0010-inversion_of_control_discarded.md) | Manual constructor dependency injection. An IoC container is ruled out until it solves a real problem |
