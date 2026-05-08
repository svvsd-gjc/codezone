export interface DifficultyConfig {
  "difficulty-easy": number;
  "difficulty-medium": number;
  "difficulty-hard": number;
}

export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Insane";

export function difficultyLabel(value: number, cfg: DifficultyConfig): DifficultyLevel {
    if (value <= cfg["difficulty-easy"]) {return "Easy";}
    if (value <= cfg["difficulty-medium"]) {return "Medium";}
    if (value <= cfg["difficulty-hard"]) {return "Hard";}
    return "Insane";
}
