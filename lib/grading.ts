export type CaseType = "int" | "float" | "str";

export const FLOAT_TOLERANCE = 8.38e-8;

export function compareOutputs(
  actual: string,
  expected: string[],
  type: CaseType
): boolean {
  if (type === "str") {
    return actual.trim() === expected.join("\n");
  }

  const lines = actual.trim().split("\n");
  if (lines.length !== expected.length) return false;

  for (let i = 0; i < lines.length; i++) {
    if (type === "int") {
      const a = parseInt(lines[i]);
      const b = parseInt(expected[i]);
      if (Number.isNaN(a) || Number.isNaN(b) || a !== b) return false;
    } else if (type === "float") {
      const a = parseFloat(lines[i]);
      const b = parseFloat(expected[i]);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      if (Math.abs(a - b) >= FLOAT_TOLERANCE) return false;
    }
  }
  return true;
}
