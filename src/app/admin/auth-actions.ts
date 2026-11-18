"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { countAdmins, createAdmin, findAdminByUsername } from "@/lib/admin-account";
import {
  MIN_PASSWORD_LENGTH,
  hashAdminPassword,
  verifyAdminPassword,
  verifySetupToken,
} from "@/lib/admin-auth";
import { endAdminSession } from "@/lib/admin-session";

export type AuthActionState = {
  error?: string;
  session?: {
    adminId: string;
    sessionVersion: number;
  };
};

type AttemptWindow = { count: number; resetAt: number };

const loginAttempts = new Map<string, AttemptWindow>();
const setupAttempts = new Map<string, AttemptWindow>();
const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const SETUP_ATTEMPT_LIMIT = 5;
const SETUP_WINDOW_MS = 15 * 60 * 1000;

const DATABASE_ERROR = "The admin database is unavailable. Reload and try again.";

function isNextRedirect(error: unknown) {
  return typeof error === "object"
    && error !== null
    && "digest" in error
    && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

export async function loginAction(
  previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    return await runLogin(previousState, formData);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: DATABASE_ERROR };
  }
}

async function runLogin(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const genericError = { error: "Invalid username or password." };
  if (!username || !password) return genericError;

  const clientKey = await getClientKey();
  if (!consumeAttempt(loginAttempts, clientKey, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS)) {
    return { error: "Too many sign-in attempts. Try again later." };
  }

  const admin = await findAdminByUsername(username);
  if (!admin) return genericError;

  const valid = await verifyAdminPassword(password, admin.passwordHash);
  if (!valid) return genericError;

  loginAttempts.delete(clientKey);
  return {
    session: {
      adminId: admin.id,
      sessionVersion: admin.sessionVersion,
    },
  };
}

export async function setupAction(
  previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    return await runSetup(previousState, formData);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return { error: DATABASE_ERROR };
  }
}

async function runSetup(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const clientKey = await getClientKey();
  if (!consumeAttempt(setupAttempts, clientKey, SETUP_ATTEMPT_LIMIT, SETUP_WINDOW_MS)) {
    return { error: "Too many setup attempts. Try again later." };
  }

  const setupToken = String(formData.get("setupToken") ?? "");
  if (!await verifySetupToken(setupToken, process.env.ADMIN_SETUP_CODE ?? "")) {
    return { error: "Invalid setup code." };
  }

  if ((await countAdmins()) > 0) {
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
    await createAdmin(username, passwordHash);
  } catch {
    return { error: DATABASE_ERROR };
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
