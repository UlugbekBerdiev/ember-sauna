import { compare, hash } from "bcryptjs";

export {
  ADMIN_SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  verifySessionToken,
  verifySetupToken,
} from "./session-token";

export const MIN_PASSWORD_LENGTH = 12;

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
