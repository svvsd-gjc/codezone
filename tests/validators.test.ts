import { describe, it, expect } from "vitest";
import {
  sanitize,
  validateUsername,
  validatePassword,
  type SignupConfig,
} from "../lib/validators";

const cfg: SignupConfig = {
  "username-len-min": 3,
  "username-len-max": 16,
  "password-len-min": 6,
  "password-len-max": 32,
};

describe("sanitize", () => {
  it("trims whitespace", () => {
    expect(sanitize("  hello  ")).toBe("hello");
  });

  it("returns empty string for non-strings", () => {
    expect(sanitize(undefined)).toBe("");
    expect(sanitize(null)).toBe("");
    expect(sanitize(123)).toBe("");
    expect(sanitize({})).toBe("");
  });
});

describe("validateUsername", () => {
  it("accepts valid name", () => {
    const r = validateUsername("alice_42", cfg);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("alice_42");
  });

  it("trims before validating", () => {
    const r = validateUsername("  bob  ", cfg);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("bob");
  });

  it("rejects below min length", () => {
    const r = validateUsername("ab", cfg);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("at least 3");
  });

  it("rejects above max length", () => {
    const r = validateUsername("a".repeat(17), cfg);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("less than 16");
  });

  it("rejects illegal chars", () => {
    for (const bad of ["alice!", "bob-smith", "foo bar", "user@host", "x.y"]) {
      const r = validateUsername(bad, cfg);
      expect(r.ok).toBe(false);
    }
  });

  it("accepts edge — exact min length", () => {
    const r = validateUsername("abc", cfg);
    expect(r.ok).toBe(true);
  });

  it("accepts edge — exact max length", () => {
    const r = validateUsername("a".repeat(16), cfg);
    expect(r.ok).toBe(true);
  });

  it("rejects empty / whitespace-only", () => {
    expect(validateUsername("", cfg).ok).toBe(false);
    expect(validateUsername("   ", cfg).ok).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(validateUsername(undefined, cfg).ok).toBe(false);
    expect(validateUsername(null, cfg).ok).toBe(false);
  });
});

describe("validatePassword", () => {
  it("accepts valid password", () => {
    const r = validatePassword("secret123", cfg);
    expect(r.ok).toBe(true);
  });

  it("rejects below min length", () => {
    const r = validatePassword("abc", cfg);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("at least 6");
  });

  it("rejects above max length", () => {
    const r = validatePassword("a".repeat(33), cfg);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("less than 32");
  });

  it("rejects illegal chars", () => {
    const r = validatePassword("pa$$word", cfg);
    expect(r.ok).toBe(false);
  });

  it("uses password-len bounds, not username-len", () => {
    const shortPass = "a".repeat(cfg["username-len-min"]);
    const r = validatePassword(shortPass, cfg);
    expect(r.ok).toBe(false);
  });
});
