"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ensureDatabase } from "@/lib/ensure-database";
import { prisma } from "@/lib/db";
import {
  MIN_PASSWORD_LENGTH,
  hashAdminPassword,
  verifyAdminPassword,
  verifySetupToken,
} from "@/lib/admin-auth";
import { endAdminSession, startAdminSession } from "@/lib/admin-session";

export type AuthActionState = {
  error?: string;
};

type AttemptWindow = { count: number; resetAt: number };

const loginAttempts = new Map<string, AttemptWindow>();
const setupAttempts = new Map<string, AttemptWindow>();
const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const SETUP_ATTEMPT_LIMIT = 5;
const SETUP_WINDOW_MS = 15 * 60 * 1000;

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const genericError = { error: "Invalid username or password." };
  if (!username || !password) return genericError;
  await ensureDatabase();

  const clientKey = await getClientKey();
  if (!consumeAttempt(loginAttempts, clientKey, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS)) {
    return { error: "Too many sign-in attempts. Try again later." };
  }

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) return genericError;

  const valid = await verifyAdminPassword(password, admin.passwordHash);
  if (!valid) return genericError;

  loginAttempts.delete(clientKey);
  await startAdminSession(admin.id, admin.sessionVersion);
  redirect("/admin");
}

export async function setupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  await ensureDatabase();
  const clientKey = await getClientKey();
  if (!consumeAttempt(setupAttempts, clientKey, SETUP_ATTEMPT_LIMIT, SETUP_WINDOW_MS)) {
    return { error: "Too many setup attempts. Try again later." };
  }

  const setupToken = String(formData.get("setupToken") ?? "");
  if (!await verifySetupToken(setupToken, process.env.ADMIN_SETUP_CODE ?? "")) {
    return { error: "Invalid setup code." };
  }

  if ((await prisma.adminUser.count()) > 0) {
    return { error: "Admin setup is no longer available." };
  }

  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");

  if (!username || !/^[a-z0-9_-]{3,32}$/.test(username)) {
    return { error: "Choose a username with 3–32 letters, numbers, underscores, or dashes." };
  }
  if (password !== confirmation) {
    return { error: "Passwords do not match." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  try {
    const passwordHash = await hashAdminPassword(password);
    await prisma.adminUser.create({
      data: { username, passwordHash },
    });
  } catch {
    return { error: "Unable to create the admin account. Review the fields and try again." };
  }

  redirect("/admin/login?setup=complete");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

function normalizeUsername(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

async function getClientKey() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    "local"
  );
}

function consumeAttempt(
  attempts: Map<string, AttemptWindow>,
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
