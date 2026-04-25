import { describe, expect, it } from "vitest";
import { collectMp3FilesFromDataTransfer } from "./collectDropFiles";

describe("collectMp3FilesFromDataTransfer", () => {
  it("collects mp3 files from DataTransfer.files when items have no webkit entry API", async () => {
    const mp3 = new File(["x"], "a.mp3", { type: "audio/mpeg" });
    const txt = new File(["x"], "b.txt", { type: "text/plain" });
    const dt = new DataTransfer();
    dt.items.add(mp3);
    dt.items.add(txt);

    const out = await collectMp3FilesFromDataTransfer(dt);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("a.mp3");
  });

  it("returns empty array when no mp3 files", async () => {
    const dt = new DataTransfer();
    dt.items.add(new File(["x"], "note.txt", { type: "text/plain" }));
    expect(await collectMp3FilesFromDataTransfer(dt)).toEqual([]);
  });
});
