# Login sessions stored in MongoDB

> **Decision**: Store the `express-session` sessions in MongoDB with `connect-mongo`, lasting 30 days, instead of in memory. JWT is ruled out.
> **Date**: 2026-11-19
> **Original**: [Spanish](../0012-sesiones_en_mongodb.md)

---

## Context

- It looked as if the user was not being registered. In fact, `User` and `AuthMethod` were saved in MongoDB: what was lost was **the session**.
- `express-session` had no `store` configured, so it used the default store, **in the process memory**. Every API restart logged every user out, and in development `ts-node-dev` restarts the API whenever a server file changes.
- The browser kept the cookie, but the server no longer recognised it: `/me` answered 401 and the app went back to the login screen.
- The cookie had no `maxAge`, so it expired when the browser was closed.
- `SESSION_SECRET` was read from `process.env` without being validated at startup.

## Options for storing the session

| Option | For | Against |
|---|---|---|
| Memory (default) | Needs nothing | Lost on every restart or deploy. Not shared between instances. `express-session` warns it is not meant for production |
| ⭐ **MongoDB with `connect-mongo`** | Uses the database I already have, with no new services. Survives restarts. MongoDB deletes expired sessions with a TTL index. Logging out is deleting a document | One MongoDB read per request |
| Redis | Faster than MongoDB for sessions | One more service in Docker Compose and in the deploy, for a number of users that does not need it |
| JWT | The server keeps no state. Convenient for mobile apps or APIs used by third parties | There is no real logout (see below). Changes the login, the middlewares and the controllers. More home-made security code |

## Reasoning

- **Logging out with JWT:** a signed token is valid until it expires, even if the user clicks "Log out". The client can delete it, but if someone copied it, it keeps working. Revoking it for real takes one of two paths:
  - a **list of revoked tokens** (by their `jti`) that the server checks on every request;
  - **short access tokens** (5-15 minutes) plus a ***refresh token*** stored on the server, which is what gets revoked on logout. The access token stays valid until it expires, a few minutes later.

  Both paths bring back state on the server, which was precisely JWT's advantage. With sessions in MongoDB, logging out is deleting a document and takes effect at once.
- **What JWT solves does not apply to me:** Trophi has a single web frontend and a single API sharing a database. There is no mobile app and no external consumers, and several API instances would already share sessions through MongoDB.
- **Cost of JWT:** a minimal version (token in a cookie, 30 days, no *refresh token*) is about 150-250 lines and around a day. The version with a *refresh token* and revocation is 2-3 days. It would touch `passport.ts`, the `/auth` routes, `ensureAuthenticated`, `getSteamId` ([ADR 0003](0003-steamid_middleware.md)), the controllers that read `req.user` and their tests.
- **Risk of the secret:** with sessions, `SESSION_SECRET` only signs the session id, and impersonating someone also requires their id, which is random. With JWT, whoever gets the secret can forge valid tokens for any user.
- **Redis:** it would be the natural choice if sessions were a bottleneck. At Trophi's volume, one MongoDB read per request is not.
- **`express-session` stays:** it is the middleware that reads the cookie and hands the session to Passport. `connect-mongo` only changes where it is stored.

## Decision

**`express-session` sessions in MongoDB with `connect-mongo`, lasting 30 days. JWT ruled out while there are no clients other than the web frontend.**

| Piece | Detail |
|---|---|
| Store | `sessions` collection, reusing Mongoose's client (`clientPromise`) instead of opening another connection |
| Duration | Cookie with a 30-day `maxAge` and stored session with the same `ttl`. MongoDB deletes expired ones with a TTL index |
| Writes | `touchAfter` of 24 h: an unchanged session is renewed at most once a day |
| Configuration | `SESSION_SECRET` is validated at startup along with the other variables. The middleware lives in `config/session.ts` |

## Consequences

- Restarting or deploying the API no longer logs anyone out.
- The login lasts 30 days even if the browser is closed.
- Logging out, once the button exists, will delete the session and take effect at once.
- Every authenticated request still reads the session and the user from MongoDB.
- The cookie uses the default settings (`sameSite` unset and no `secure`). It works locally because the frontend and the API are both on `localhost`; for the demo it still has to be adjusted, along with a long random `SESSION_SECRET`.
- If a mobile app or external API consumers appear, this decision has to be revisited.
