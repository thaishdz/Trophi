export interface Cached<T> {
  value: T;
  syncedAt: Date;
}

interface ReadThroughOptions<T> {
  stored: Cached<T> | null;
  ttlMs: number;
  // The user asked for fresh data: skip the stored copy and do not hide a Steam failure behind it
  refresh?: boolean;
  fetch: () => Promise<T>;
  save: (value: T, syncedAt: Date) => Promise<unknown>;
}

/*
 ** Serves the stored copy while it is younger than ttlMs. Otherwise it fetches and saves
 ** a new one. If the fetch fails, it falls back to the stored copy, even if it is stale,
 ** unless the user explicitly asked for a refresh.
 */
export async function readThrough<T>({ stored, ttlMs, refresh = false, fetch, save }: ReadThroughOptions<T>): Promise<Cached<T>> {
  if (!refresh && stored && Date.now() - stored.syncedAt.getTime() < ttlMs) {
    return stored;
  }

  try {
    const value = await fetch();
    const syncedAt = new Date();
    await save(value, syncedAt);
    return { value, syncedAt };
  } catch (error) {
    if (stored && !refresh) return stored;
    throw error;
  }
}
