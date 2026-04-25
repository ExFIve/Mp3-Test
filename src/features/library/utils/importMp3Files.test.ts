import { describe, expect, it } from "vitest";
import { isMp3File } from "./importMp3Files";

describe("isMp3File", () => {
  it("accepts audio/mpeg type", () => {
    expect(isMp3File(new File([], "x.bin", { type: "audio/mpeg" }))).toBe(true);
  });

  it("accepts .mp3 extension case-insensitively", () => {
    expect(isMp3File(new File([], "Song.MP3", { type: "" }))).toBe(true);
    expect(isMp3File(new File([], "track.mp3", { type: "application/octet-stream" }))).toBe(true);
  });

  it("rejects non-mp3 files", () => {
    expect(isMp3File(new File([], "readme.txt", { type: "text/plain" }))).toBe(false);
    expect(isMp3File(new File([], "song.wav", { type: "audio/wav" }))).toBe(false);
  });
});
