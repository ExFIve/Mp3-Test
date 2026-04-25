import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { useLibraryStore } from "../features/library/store/libraryStore";
import { usePlaylistStore } from "../features/library/store/playlistStore";
import { usePlayerStore } from "../features/player/store/playerStore";

vi.mock("../features/library/store/libraryDb", () => ({
  upsertTracks: vi.fn(() => Promise.resolve(0)),
  listTracks: vi.fn(() => Promise.resolve([])),
  listPlaylists: vi.fn(() => Promise.resolve([])),
  putPlaylist: vi.fn(() => Promise.resolve()),
  deletePlaylistById: vi.fn(() => Promise.resolve()),
}));

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response);

    useLibraryStore.setState({
      tracks: [],
      fileByTrackId: {},
      searchText: "",
      isLoading: false,
      error: undefined,
    });
    usePlaylistStore.setState({
      playlists: [],
      selectedPlaylistId: undefined,
      isLoading: false,
      error: undefined,
    });
    usePlayerStore.setState({
      queue: [],
      currentTrackId: undefined,
      isPlaying: false,
      currentTimeSec: 0,
      durationSec: 0,
      volume: 0.8,
      repeatMode: "off",
      shuffle: false,
      shuffledOrder: [],
    });
  });

  it("renders the app shell and import section", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: /local mp3 web app/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /import mp3 files/i })).toBeInTheDocument();
  });
});
