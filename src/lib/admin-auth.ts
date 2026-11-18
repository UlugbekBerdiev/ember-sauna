import { compare, hash } from "bcryptjs";

export const ADMIN_SESSION_COOKIE = "ember_admin_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;
export const MIN_PASSWORD_LENGTH = 12;

type SessionPayload = {
  adminId: string;
  expiresAt: number;
};

export async function hashAdminPassword(password: string) {
  assertValidPassword(password);
  return hash(password, 12);
}

export async function verifyAdminPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export function assertValidPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
}

export async function createSessionToken(
  adminId: string,
  secret: string,
  now = new Date(),
) {
  assertValidSessionSecret(secret);
  const payload: SessionPayload = {
    adminId,
    expiresAt: Math.floor(now.getTime() / 1000) + SESSION_DURATION_SECONDS,
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = await sign(encoded, secret);
  return `${encoded}.${signature}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
  now = new Date(),
): Promise<SessionPayload | null> {
  try {
    assertValidSessionSecret(secret);
    const [encoded, providedSignature, extra] = token.split(".");
    if (!encoded || !providedSignature || extra) return null;
    const expectedSignature = await sign(encoded, secret);
    if (!constantTimeEqual(providedSignature, expectedSignature)) return null;
    const payload = JSON.parse(decodeBase64Url(encoded)) as SessionPayload;
    if (
      typeof payload.adminId !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Math.floor(now.getTime() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getLockoutUntil(
  failedLoginAttempts: number,
  now = new Date(),
) {
  if (failedLoginAttempts < MAX_LOGIN_ATTEMPTS) return null;
  return new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
}

export function isLoginLocked(lockedUntil: Date | null, now = new Date()) {
  return Boolean(lockedUntil && lockedUntil > now);
}

function assertValidSessionSecret(secret: string) {
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function encodeBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
