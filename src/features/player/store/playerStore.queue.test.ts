import { beforeEach, describe, expect, it } from "vitest";
import type { Track } from "../../../shared/types/music";
import { usePlayerStore } from "./playerStore";

function track(id: string): Track {
  return {
    id,
    fileName: `${id}.mp3`,
    title: id,
    artist: "A",
    album: "B",
    durationSec: 1,
    fileSize: 1,
    fileType: "audio/mpeg",
    addedAt: "",
  };
}

describe("setQueue", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      queue: [track("a"), track("b")],
      currentTrackId: "b",
      shuffle: false,
      shuffledOrder: [],
      isPlaying: true,
    });
  });

  it("drops current track when it is not in the new queue", () => {
    usePlayerStore.getState().setQueue([track("c"), track("d")]);
    const s = usePlayerStore.getState();
    expect(s.currentTrackId).toBe("c");
    expect(s.queue.map((t) => t.id)).toEqual(["c", "d"]);
  });

  it("keeps current track when it exists in the new queue", () => {
    usePlayerStore.getState().setQueue([track("a"), track("b"), track("c")]);
    expect(usePlayerStore.getState().currentTrackId).toBe("b");
  });
});
