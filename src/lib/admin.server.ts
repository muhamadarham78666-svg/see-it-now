import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Server-only admin helpers. The access code never leaves the server. */

const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function accessCode(): string {
  const code = process.env["ADMIN_ACCESS_CODE"];
  if (!code) throw new Error("Admin access code is not configured.");
  return code;
}

function equalSecret(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

function sign(payload: string): string {
  return createHmac("sha256", accessCode()).update(payload).digest("hex");
}

export function issueAdminToken(userId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function checkAdminCode(code: string): boolean {
  return equalSecret(code.trim(), accessCode());
}

export function verifyAdminToken(token: string | null | undefined, userId: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [tokenUser, expRaw, sig] = parts as [string, string, string];
  if (tokenUser !== userId) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = sign(`${tokenUser}.${expRaw}`);
  if (expected.length !== sig.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
