import { describe, it, expect } from "vitest";
import { compareOutputs, FLOAT_TOLERANCE } from "../lib/grading";

describe("compareOutputs — str", () => {
  it("matches exact string", () => {
    expect(compareOutputs("hello world", ["hello world"], "str")).toBe(true);
  });

  it("matches multi-line joined by newline", () => {
    expect(compareOutputs("line1\nline2", ["line1", "line2"], "str")).toBe(true);
  });

  it("trims trailing whitespace before compare", () => {
    expect(compareOutputs("hi\n\n  ", ["hi"], "str")).toBe(true);
  });

  it("rejects on mismatch", () => {
    expect(compareOutputs("hello", ["world"], "str")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(compareOutputs("Hello", ["hello"], "str")).toBe(false);
  });
});

describe("compareOutputs — int", () => {
  it("matches single int", () => {
    expect(compareOutputs("42", ["42"], "int")).toBe(true);
  });

  it("matches multi-line ints", () => {
    expect(compareOutputs("1\n2\n3", ["1", "2", "3"], "int")).toBe(true);
  });

  it("rejects mismatched int", () => {
    expect(compareOutputs("42", ["43"], "int")).toBe(false);
  });

  it("rejects non-numeric output", () => {
    expect(compareOutputs("not_a_num", ["42"], "int")).toBe(false);
  });

  it("rejects line-count mismatch", () => {
    expect(compareOutputs("1\n2", ["1", "2", "3"], "int")).toBe(false);
    expect(compareOutputs("1\n2\n3", ["1", "2"], "int")).toBe(false);
  });
});

describe("compareOutputs — float", () => {
  it("matches exact float", () => {
    expect(compareOutputs("3.14", ["3.14"], "float")).toBe(true);
  });

  it("matches within tolerance", () => {
    const eps = FLOAT_TOLERANCE / 2;
    expect(compareOutputs(`${1 + eps}`, ["1"], "float")).toBe(true);
  });

  it("rejects outside tolerance", () => {
    const big = FLOAT_TOLERANCE * 10;
    expect(compareOutputs(`${1 + big}`, ["1"], "float")).toBe(false);
  });

  it("matches multi-line floats", () => {
    expect(compareOutputs("1.0\n2.0", ["1.0", "2.0"], "float")).toBe(true);
  });

  it("rejects NaN inputs", () => {
    expect(compareOutputs("NaN", ["1.0"], "float")).toBe(false);
    expect(compareOutputs("not_a_float", ["1.0"], "float")).toBe(false);
  });

  it("rejects line-count mismatch", () => {
    expect(compareOutputs("1.0", ["1.0", "2.0"], "float")).toBe(false);
  });
});
