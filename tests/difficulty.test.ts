import { describe, it, expect } from "vitest";
import { difficultyLabel, type DifficultyConfig } from "../lib/difficulty";

// Preset difficulty config for testing-- does not follow cfg file
const cfg: DifficultyConfig = {
  "difficulty-easy": 1,
  "difficulty-medium": 2,
  "difficulty-hard": 3,
};

describe("difficultyLabel", () => {
  it("Easy at and below easy threshold", () => {
    expect(difficultyLabel(0, cfg)).toBe("Easy");
    expect(difficultyLabel(1, cfg)).toBe("Easy");
  });

  it("Medium just above easy through medium threshold", () => {
    expect(difficultyLabel(1.5, cfg)).toBe("Medium");
    expect(difficultyLabel(2, cfg)).toBe("Medium");
  });

  it("Hard above medium through hard threshold", () => {
    expect(difficultyLabel(2.5, cfg)).toBe("Hard");
    expect(difficultyLabel(3, cfg)).toBe("Hard");
  });

  it("Insane above hard threshold", () => {
    expect(difficultyLabel(4, cfg)).toBe("Insane");
    expect(difficultyLabel(100, cfg)).toBe("Insane");
  });

  it("negative values clamp to Easy", () => {
    expect(difficultyLabel(-5, cfg)).toBe("Easy");
  });
});
