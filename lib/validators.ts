export interface SignupConfig {
  "username-len-min": number;
  "username-len-max": number;
  "password-len-min": number;
  "password-len-max": number;
}

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

const ALLOWED_CHARS = /^[a-zA-Z0-9_]+$/;

export function sanitize(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim();
}

export function validateUsername(raw: unknown, cfg: SignupConfig): ValidationResult {
  const name = sanitize(raw);
  if (name.length < cfg["username-len-min"]) {
    return { ok: false, message: `Name must be at least ${cfg["username-len-min"]} characters long.` };
  }
  if (name.length > cfg["username-len-max"]) {
    return { ok: false, message: `Name must be less than ${cfg["username-len-max"]} characters long.` };
  }
  if (!ALLOWED_CHARS.test(name)) {
    return { ok: false, message: "Name can only contain letters, numbers, and underscores." };
  }
  return { ok: true, value: name };
}

export function validatePassword(raw: unknown, cfg: SignupConfig): ValidationResult {
  const pass = sanitize(raw);
  if (pass.length < cfg["password-len-min"]) {
    return { ok: false, message: `Password must be at least ${cfg["password-len-min"]} characters long.` };
  }
  if (pass.length > cfg["password-len-max"]) {
    return { ok: false, message: `Password must be less than ${cfg["password-len-max"]} characters long.` };
  }
  if (!ALLOWED_CHARS.test(pass)) {
    return { ok: false, message: "Password can only contain letters, numbers, and underscores." };
  }
  return { ok: true, value: pass };
}
