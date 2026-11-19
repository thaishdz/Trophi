# Game covers: Steam CDN by appid vs. IGDB and other APIs

> **Decision**: Get covers from Steam's image CDN, deriving the URL from the `appid`: `library_600x900.jpg` as the cover and `header.jpg` as the fallback. I drop IGDB, which was the initial idea.
> **Date**: 2026-11-17
> **Original**: [Spanish](../0005-game_covers_steam_cdn.md)

---

## Context

- The original card proposed getting each game's cover from IGDB.
- `SteamService.getCoverGame` existed but nothing called it: it used the Steam store search and returned a tiny thumbnail.
- Before implementing, I ran a spike on the alternatives.
- I already have each game's `appid`, and the name-based alternatives had already been imprecise when searching games.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| IGDB | Quality data and art, mapped through Steam's external identifier | Needs Twitch credentials (`client_id` and `client_secret`) and renewing a token that expires. I did not verify the details of its API |
| ⭐ **Steam image CDN by `appid`** | No key, no account, no token. Does not use the Web API, so it does not spend the [ADR 0002](0002-steam_achievement_sync_cache_strategy.md) quota. The URL is derived from the `appid`. Verified with real requests: Hades returns 200 `image/jpeg` for both images | Not every game has a vertical cover. I did not verify Valve's terms of use for these images |
| Steam Store `appdetails` (`header_image`) | No key. Verified: returns 200 with the game's JSON | One network request per game, with its own rate limit. Only provides the header |
| SteamGridDB | Community art, accepts Steam's `appid` | Needs a key. I found neither its terms of use nor a numeric limit |
| RAWG | — | Name-based search. The free plan is non-commercial only, with 20,000 requests a month, and requires attribution with a live link (according to third-party summaries, not its official docs) |
| TheGamesDB | — | Name-based search and a monthly quota per key. I did not confirm the current limit or its PC coverage |
| MobyGames | — | Name-based search. The free API is for non-profit use only (according to its documentation page) |

## Reasoning

- The **Steam CDN** is the only option that adds no key, token or external dependency with a quota, and does not force guessing the game by name.
- **RAWG**, **TheGamesDB** and **MobyGames** search by name and restrict non-commercial use.
- **SteamGridDB** has better art, but adds a key and unverified terms, so it stays as a possible later improvement.
- **IGDB** requires Twitch credentials for something the `appid` itself already solves.
- Coverage measured with the test library (162 games): 156 with a vertical cover (96%), 3 with only a header and 3 with no image at all (404 on both).

## Decision

**Chosen: Steam image CDN by `appid`.**

| Piece | Detail |
|---|---|
| URLs | `getCoverUrls(gameId)` (`services/steam/covers.ts`) returns `cover` and `coverFallback` with no network calls |
| API | `GameController` includes them in every game returned by `/search` and `/gameAchievements/:gameId` |
| Client | Decides what to show: `cover`, then `coverFallback` if it fails, then an image-less placeholder if that fails too. This is pending (card "GameCard visual style with cover") |
| Cleanup | I remove `SteamService.getCoverGame`, which was unused |

## When to revisit

- If coverage drops noticeably with other libraries, consider SteamGridDB as a complement.
- If Valve changes the CDN path or its terms.
- If I want art that does not exist on Steam (games from other stores), consider IGDB.

## What is not verified

- Valve's terms of use for the CDN images.
- Coverage with libraries other than the test one.
- SteamGridDB, RAWG, TheGamesDB and MobyGames were researched only through web search, without calling their APIs.
