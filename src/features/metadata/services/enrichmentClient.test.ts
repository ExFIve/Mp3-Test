import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Track } from "../../../shared/types/music";
import { enrichTrackMetadata } from "./enrichmentClient";

function sampleTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: "t1",
    fileName: "song.mp3",
    title: "Hello",
    artist: "World",
    album: "Album",
    durationSec: 60,
    fileSize: 100,
    fileType: "audio/mpeg",
    addedAt: "2020-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("enrichTrackMetadata", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns cached value without calling fetch when cache is fresh", async () => {
    const query = "Hello World Album".toLowerCase();
    const cached = {
      query: "Hello World Album",
      generatedAt: "2020-01-01T00:00:00.000Z",
      artist: [{ title: "Cached", description: "d", source: "iTunes" }],
      album: [],
      song: [],
      _cachedAt: Date.now(),
    };
    localStorage.setItem(`metadata-enrichment:${query}`, JSON.stringify(cached));

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await enrichTrackMetadata(sampleTrack());

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.artist[0]?.title).toBe("Cached");
  });

  it("calls iTunes search on cache miss and stores result", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (!url.includes("itunes.apple.com")) {
        return { ok: false, status: 404 } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          results: [
            {
              trackName: "Hit",
              artistName: "World",
              collectionName: "Album",
              primaryGenreName: "Pop",
              releaseDate: "2021-06-15T00:00:00Z",
              trackViewUrl: "https://example.com/track",
            },
          ],
        }),
      } as Response;
    });

    const result = await enrichTrackMetadata(sampleTrack());
    expect(result.song.length).toBeGreaterThan(0);
    expect(result.song[0].title).toBe("Hit");
    expect(localStorage.length).toBeGreaterThan(0);
  });
});
