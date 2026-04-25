import { describe, expect, it } from "vitest";
import { appendTrackIdUnique } from "./playlistStore";

describe("appendTrackIdUnique", () => {
  it("appends when missing", () => {
    expect(appendTrackIdUnique(["a", "b"], "c")).toEqual(["a", "b", "c"]);
  });

  it("does not duplicate", () => {
    expect(appendTrackIdUnique(["a", "b"], "b")).toEqual(["a", "b"]);
  });
});
