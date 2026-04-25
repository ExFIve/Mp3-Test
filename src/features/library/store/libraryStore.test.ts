import { describe, expect, it } from "vitest";
import { buildAlbumSummaries, buildArtistSummaries } from "./libraryStore";
import type { Track } from "../../../shared/types/music";

const baseTrack: Omit<Track, "id" | "title" | "artist" | "album"> = {
  fileName: "song.mp3",
  durationSec: 120,
  fileSize: 1234,
  fileType: "audio/mpeg",
  addedAt: new Date().toISOString(),
};

describe("library summaries", () => {
  const tracks: Track[] = [
    { ...baseTrack, id: "1", title: "One", artist: "A", album: "X" },
    { ...baseTrack, id: "2", title: "Two", artist: "A", album: "Y" },
    { ...baseTrack, id: "3", title: "Three", artist: "B", album: "Y" },
  ];

  it("builds artist summaries", () => {
    const result = buildArtistSummaries(tracks);
    expect(result).toEqual([
      { name: "A", trackCount: 2, albums: ["X", "Y"] },
      { name: "B", trackCount: 1, albums: ["Y"] },
    ]);
  });

  it("builds album summaries", () => {
    const result = buildAlbumSummaries(tracks);
    expect(result).toEqual([
      { artist: "A", album: "X", trackCount: 1 },
      { artist: "A", album: "Y", trackCount: 1 },
      { artist: "B", album: "Y", trackCount: 1 },
    ]);
  });
});
