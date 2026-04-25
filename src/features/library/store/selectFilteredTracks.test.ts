import { describe, expect, it } from "vitest";
import type { Track } from "../../../shared/types/music";
import { selectFilteredTracks, type LibraryState } from "./libraryStore";

const noop = async (): Promise<void> => {};

function state(tracks: Track[], searchText: string): LibraryState {
  return {
    tracks,
    searchText,
    fileByTrackId: {},
    isLoading: false,
    error: undefined,
    loadTracks: noop,
    addImportedTracks: noop,
    setSearchText: () => {},
  };
}

const base: Omit<Track, "id" | "title" | "artist" | "album"> = {
  fileName: "x.mp3",
  durationSec: 1,
  fileSize: 1,
  fileType: "audio/mpeg",
  addedAt: "",
};

describe("selectFilteredTracks", () => {
  const tracks: Track[] = [
    { ...base, id: "1", title: "Apple Pie", artist: "Zed", album: "Food" },
    { ...base, id: "2", title: "Banana", artist: "Yam", album: "Fruit" },
  ];

  it("returns all tracks when search is empty or whitespace", () => {
    expect(selectFilteredTracks(state(tracks, ""))).toEqual(tracks);
    expect(selectFilteredTracks(state(tracks, "   "))).toEqual(tracks);
  });

  it("filters case-insensitively across title, artist, and album", () => {
    expect(selectFilteredTracks(state(tracks, "apple"))).toHaveLength(1);
    expect(selectFilteredTracks(state(tracks, "YAM"))).toHaveLength(1);
    expect(selectFilteredTracks(state(tracks, "fruit"))).toHaveLength(1);
  });

  it("returns empty when nothing matches", () => {
    expect(selectFilteredTracks(state(tracks, "zzzzz"))).toEqual([]);
  });
});
