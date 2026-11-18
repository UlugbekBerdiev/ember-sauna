import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  hashAdminPassword,
  verifyAdminPassword,
  verifySessionToken,
  verifySetupToken,
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
    const token = await createSessionToken("admin_test", 3, testSecret, issuedAt);
    await expect(verifySessionToken(token, testSecret, issuedAt)).resolves.toMatchObject({
      adminId: "admin_test",
      sessionVersion: 3,
    });
    await expect(
      verifySessionToken(token, testSecret, new Date("2026-11-19T12:00:01Z")),
    ).resolves.toBeNull();
  });

  it("rejects tampered tokens and incorrect secrets", async () => {
    const token = await createSessionToken("admin_test", 0, testSecret);
    await expect(verifySessionToken(`${token}x`, testSecret)).resolves.toBeNull();
    await expect(verifySessionToken(token, "q".repeat(48))).resolves.toBeNull();
  });

  it("checks the first-run setup token without exposing it", async () => {
    const setupToken = "t".repeat(48);
    await expect(verifySetupToken(setupToken, setupToken)).resolves.toBe(true);
    await expect(verifySetupToken("wrong", setupToken)).resolves.toBe(false);
    await expect(verifySetupToken(setupToken, "")).resolves.toBe(false);
  });
});
