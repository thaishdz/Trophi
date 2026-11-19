import session from "express-session";
import mongoose from "mongoose";
import { MongoStore } from "connect-mongo";
import config from "./";

// How long a login lasts without the user coming back
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Sessions are stored in MongoDB instead of the process memory, so a restart of the API
// (or a ts-node-dev respawn) no longer logs every user out.
// The store reuses Mongoose's client once server.ts has connected, instead of opening a second pool.
export const createSessionMiddleware = () =>
  session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: SESSION_MAX_AGE_MS },
    store: MongoStore.create({
      clientPromise: mongoose.connection.asPromise().then((connection) => connection.getClient()),
      collectionName: "sessions",
      ttl: SESSION_MAX_AGE_MS / 1000, // seconds; MongoDB deletes expired sessions with a TTL index
      touchAfter: 24 * 60 * 60, // seconds; refresh an unchanged session at most once a day
    }),
  });
