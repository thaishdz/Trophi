import { readThrough } from "./readThrough";

const TTL = 60_000;
const stored = (ageMs: number) => ({ value: "stored", syncedAt: new Date(Date.now() - ageMs) });

describe("readThrough", () => {
  const fetch = jest.fn();
  const save = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue("fresh");
    save.mockResolvedValue(undefined);
  });

  it("serves a recent stored copy without fetching", async () => {
    const copy = stored(TTL - 1000);

    const result = await readThrough({ stored: copy, ttlMs: TTL, fetch, save });

    expect(result).toBe(copy);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches and saves when there is no stored copy", async () => {
    const result = await readThrough({ stored: null, ttlMs: TTL, fetch, save });

    expect(result.value).toBe("fresh");
    expect(save).toHaveBeenCalledWith("fresh", result.syncedAt);
  });

  it("fetches when the stored copy is stale", async () => {
    const result = await readThrough({ stored: stored(TTL + 1000), ttlMs: TTL, fetch, save });

    expect(result.value).toBe("fresh");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("fetches a recent copy again when a refresh is requested", async () => {
    const result = await readThrough({ stored: stored(1000), ttlMs: TTL, refresh: true, fetch, save });

    expect(result.value).toBe("fresh");
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("falls back to the stale copy if the fetch fails", async () => {
    const copy = stored(TTL + 1000);
    fetch.mockRejectedValue(new Error("Steam is down"));

    const result = await readThrough({ stored: copy, ttlMs: TTL, fetch, save });

    expect(result).toBe(copy);
    expect(save).not.toHaveBeenCalled();
  });

  it("throws if the fetch fails on a refresh, even with a stored copy", async () => {
    fetch.mockRejectedValue(new Error("Steam is down"));

    await expect(
      readThrough({ stored: stored(TTL + 1000), ttlMs: TTL, refresh: true, fetch, save }),
    ).rejects.toThrow("Steam is down");
  });

  it("throws if the fetch fails and there is no stored copy", async () => {
    fetch.mockRejectedValue(new Error("Steam is down"));

    await expect(readThrough({ stored: null, ttlMs: TTL, fetch, save })).rejects.toThrow("Steam is down");
  });
});
