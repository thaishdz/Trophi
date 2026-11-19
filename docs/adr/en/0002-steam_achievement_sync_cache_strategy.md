# Steam achievement sync: API key ownership and caching strategy

> **Decision**: Use only the application's own API key (never the user's) to sync achievements from public profiles, with a server-side cache and a 5-minute cooldown per `(user, game)`.
> **Date**: 2026-08-07
> **Status**: Active
> **Original**: [Spanish](../0002-steam_achievement_sync_cache_strategy.md)

---

## Context

- Trophi lets the user pick which games to track to see their achievements. The only data needed is what is already public on their Steam profile: their games and the unlock state of their achievements. There is no need to act on the user's behalf beyond reading that public data.
- The Steam Web API has a limit of roughly 100,000 requests/day, shared across **the whole application** (per API key), not per user. That budget covers the syncing of every user combined, so the sync strategy decides how many users/games the app can support before hitting the limit.
- Trophi is meant to be run by each person on their own instance with their own API key (in the server's `.env`), so the limit is only shared by the users of one instance, usually one.
- The original schema assumed the app would store each user's Steam API key (encrypted). That raised a secondary problem: storing it as a third-party secret (Steam API keys are personal and should not be handled lightly), with an encryption scheme and a master key kept separately.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| Store each user's API key (encrypted) | Fits the idea of "it's the user's key, let them provide it" | `GetOwnedGames` / `GetPlayerAchievements` work with the **application's own key** for any public profile: the user's key adds nothing, because the app never reads *private* data. Adds a security responsibility: encryption with a master key that must live outside the database. Does not solve the *rate limit*: heavy syncing would still be uncached |
| App API key, real-time sync (no cache) | Always up to date, no lag. Simple: no cooldown logic | Every profile update spends one of the 100k/day requests; a few active users refreshing often could exhaust it |
| ⭐ **App API key, server-side cache with cooldown** | Achievements are checked after a gaming session or at a given moment, not every few seconds. The cooldown is enforced on the server, so it cannot be bypassed by calling the endpoint directly | Slight lag (up to the cooldown) after a real unlock. Needs a `lastSyncedAt` field and a guard check on every sync request |

## Reasoning

Two separate questions were answered at once:

- **Whose key?** [Steam's own documentation](https://developer.valvesoftware.com/wiki/Steam_Web_API#GetOwnedGames_.28v0001.29) confirms that `GetOwnedGames` and `GetPlayerAchievements` work with the app's key for any public profile. The user's key would only be needed to read *their private data*, which is not needed. Once confirmed, storing, encrypting or managing any user key no longer made sense.
- **How often to sync?** Since the *rate limit* is shared by all the users of the instance, real-time sync without a cache means not controlling how many requests are spent: it would depend on how many people use the app and how often. With a server-side cache and a cooldown per `(user, game)`, I know the most I can spend.
- **The cooldown value (5 minutes)** was chosen based on the project's current number of users (just me). Increasing it means the user base has grown.

## Decision

**Chosen: the app's own API key + server-side cache, 5-minute cooldown per `(user, game)`.**

```typescript
const SYNC_COOLDOWN_MINUTES = 5;

async function syncGameProgress(userId: string, appId: number, steamId64: string) {
  const existing = await GameProgress.findOne({ userId, appId });

  if (existing) {
    const minutesSinceSync = (Date.now() - existing.lastSyncedAt.getTime()) / 60000;
    if (minutesSinceSync < SYNC_COOLDOWN_MINUTES) {
      return existing; // serves the cached copy, no call to Steam
    }
  }

  const achievements = await fetchAchievementsFromSteam(appId, steamId64); // the app's own key

  return GameProgress.findOneAndUpdate(
    { userId, appId },
    { achievements, lastSyncedAt: new Date() },
    { upsert: true, new: true }
  );
}
```

- No user's Steam API key is requested, stored or encrypted anywhere in the system.
- **Update:** [ADR 0011](0011-achievements_cache_and_manual_refresh.md) implements this cache, raises the progress cooldown to 30 minutes and adds an on-demand refresh button.

## When to revisit

- If `active_users × tracked_games × (24×60 / cooldown_minutes)` gets close to the 100k/day limit: the cooldown should be recalculated before Steam starts returning errors.
- If Steam changes its *rate limit* policy.

## Further reading

- [Steam Web API — GetOwnedGames (v0001)](https://developer.valvesoftware.com/wiki/Steam_Web_API#GetOwnedGames_.28v0001.29) — this endpoint works with the app's key as long as the profile is public
- [Steam Web API Terms of Use](https://steamcommunity.com/dev/apiterms) — the official limit of 100,000 daily requests per API key as of 2026
