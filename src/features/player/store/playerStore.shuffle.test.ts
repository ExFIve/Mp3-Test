import { beforeEach, describe, expect, it } from "vitest";
import type { Track } from "../../../shared/types/music";
import { usePlayerStore } from "./playerStore";

function track(id: string): Track {
  return {
    id,
    fileName: `${id}.mp3`,
    title: id,
    artist: "Artist",
    album: "Album",
    durationSec: 60,
    fileSize: 100,
    fileType: "audio/mpeg",
    addedAt: "2020-01-01T00:00:00.000Z",
  };
}

describe("shuffle playNext", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      queue: [track("t1"), track("t2"), track("t3")],
      shuffle: true,
      shuffledOrder: ["t2", "t3", "t1"],
      currentTrackId: "t2",
      repeatMode: "off",
      isPlaying: true,
    });
  });

  it("advances along shuffled order without picking the same track again", () => {
    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentTrackId).toBe("t3");
    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentTrackId).toBe("t1");
  });

  it("stops at end of shuffled cycle when repeat is off", () => {
    usePlayerStore.setState({ currentTrackId: "t1" });
    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(usePlayerStore.getState().currentTrackId).toBe("t1");
  });

  it("wraps to start of shuffled order when repeat all", () => {
    usePlayerStore.setState({ currentTrackId: "t1", repeatMode: "all" });
    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentTrackId).toBe("t2");
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });
});

describe("playPrevious isPlaying", () => {
  it("sets isPlaying true at linear queue start (same as other prev targets)", () => {
    usePlayerStore.setState({
      queue: [track("a"), track("b")],
      shuffle: false,
      shuffledOrder: [],
      currentTrackId: "a",
      isPlaying: false,
    });
    usePlayerStore.getState().playPrevious();
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlayerStore.getState().currentTrackId).toBe("a");
  });

  it("sets isPlaying true at shuffle order start", () => {
    usePlayerStore.setState({
      queue: [track("t1"), track("t2")],
      shuffle: true,
      shuffledOrder: ["t2", "t1"],
      currentTrackId: "t2",
      isPlaying: false,
    });
    usePlayerStore.getState().playPrevious();
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    expect(usePlayerStore.getState().currentTrackId).toBe("t2");
  });
});
