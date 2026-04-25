import { describe, expect, it } from "vitest";
import { formatDuration } from "./time";

describe("formatDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(0)).toBe("0:00");
  });

  it("handles invalid values safely", () => {
    expect(formatDuration(Number.NaN)).toBe("0:00");
    expect(formatDuration(-1)).toBe("0:00");
  });
});
