# Storing authentication methods: separate collection vs. embedded array

> **Decision**: Store authentication methods (Steam, email) in a separate `AuthMethod` collection that references `User` through `userId`, instead of an array embedded in the `User` document.
> **Date**: 2026-08-07
> **Original**: [Spanish](../0001-auth_method_separate_collection.md)

---

## Context

- Trophi supports several authentication methods per user (Steam OpenID now, email/password later).
- The original schema embedded the auth methods as an array inside the `User` document:

  ```typescript
  authMethods: {
    type: [authMethodSchema] // steamId, email, passwordHash per entry
  }
  ```

- Steam login has to find "which user has this **steamId**" without knowing who it is beforehand. That is the main access pattern the schema must support, and it must guarantee that a `steamId` or `email` never belongs to two different users.
- It is a personal project for now (I generate all the traffic), but the decision touches **identity/authentication**. I want to get it right now, so I don't have to migrate a model already in production if the project grows to real users.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| Array embedded in `User` | No extra queries or joins: everything about the user is in one document. Easy to read the whole profile at once | Mongoose's `unique: true` on a field of an array subdocument does **not** guarantee uniqueness across the collection: it only prevents duplicates *within the same array*, not across `User` documents. Real uniqueness would need manual checks in code, which are open to *race conditions* (two concurrent sign-ups with the same `steamId`) |
| ⭐ **Separate `AuthMethod` collection (referenced by `userId`)** | A database-level unique index on `steamId` / `email` across the whole collection: the database, not the code, guarantees there are no duplicate identities. *"Find the user for this steamId"* becomes an indexed query on `AuthMethod` instead of a search inside a nested array | One extra query (or a `populate`) to go from `AuthMethod` to `User`. Creating a user for the first time means writing to two collections |

## Reasoning

- The deciding factor was **where the uniqueness guarantee lives**.
- Embedding keeps reads convenient, but moves the duty of checking duplicate identities to the code, on every write, even under concurrent requests.
- A separate collection with a unique index moves that guarantee to the database, which always enforces it, without relying on the code getting every case right.

## Decision

**Chosen: separate `AuthMethod` collection.**

```typescript
const authMethodSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['steam', 'email'], required: true },
  steamId: { type: String, sparse: true },
  email: { type: String, sparse: true },
  passwordHash: String
});

authMethodSchema.index({ steamId: 1 }, { unique: true, sparse: true });
authMethodSchema.index({ email: 1 }, { unique: true, sparse: true });
```

## When to revisit

- If the extra query becomes a performance bottleneck (unlikely at the current scale, but worth watching with many concurrent users).
- If more authentication providers are added and the `AuthMethod` schema can no longer represent them.

## Further reading

- [Multikey Indexes](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-multikey/) — how MongoDB indexes array fields and the uniqueness rules on them
- [Create an Index on an Array Field](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-multikey/create-multikey-index-basic/) — creating a multikey index step by step
- [Mongoose Unique values in nested array of objects](https://codemia.io/knowledge-hub/path/mongoose_unique_values_in_nested_array_of_objects) — why `unique: true` on an array subdocument is not enough and manual validation is needed
- [mongoose-unique-validator (ladjs fork)](https://github.com/ladjs/mongoose-unique-validator) — plugin that turns MongoDB E11000 errors into Mongoose validation errors
