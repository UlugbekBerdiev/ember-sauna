import { describe, expect, it } from "vitest";
import {
  MAX_LOGIN_ATTEMPTS,
  createSessionToken,
  getLockoutUntil,
  hashAdminPassword,
  isLoginLocked,
  verifyAdminPassword,
  verifySessionToken,
} from "./admin-auth";

const testSecret = "s".repeat(48);

describe("admin authentication helpers", () => {
  it("hashes and verifies a password without retaining plaintext", async () => {
    const candidate = "x".repeat(14);
    const hashed = await hashAdminPassword(candidate);
    expect(hashed).not.toContain(candidate);
    expect(await verifyAdminPassword(candidate, hashed)).toBe(true);
    expect(await verifyAdminPassword(`${candidate}!`, hashed)).toBe(false);
  });

  it("signs, verifies, and expires session tokens", async () => {
    const issuedAt = new Date("2026-11-18T12:00:00Z");
    const token = await createSessionToken("admin_test", testSecret, issuedAt);
    await expect(verifySessionToken(token, testSecret, issuedAt)).resolves.toMatchObject({
      adminId: "admin_test",
    });
    await expect(
      verifySessionToken(token, testSecret, new Date("2026-11-19T12:00:01Z")),
    ).resolves.toBeNull();
  });

  it("rejects tampered tokens and incorrect secrets", async () => {
    const token = await createSessionToken("admin_test", testSecret);
    await expect(verifySessionToken(`${token}x`, testSecret)).resolves.toBeNull();
    await expect(verifySessionToken(token, "q".repeat(48))).resolves.toBeNull();
  });

  it("locks an account after the configured failed-attempt threshold", () => {
    const now = new Date("2026-11-18T12:00:00Z");
    expect(getLockoutUntil(MAX_LOGIN_ATTEMPTS - 1, now)).toBeNull();
    const lockedUntil = getLockoutUntil(MAX_LOGIN_ATTEMPTS, now);
    expect(lockedUntil).not.toBeNull();
    expect(isLoginLocked(lockedUntil, now)).toBe(true);
    expect(isLoginLocked(lockedUntil, new Date("2026-11-18T12:16:00Z"))).toBe(false);
  });
});
