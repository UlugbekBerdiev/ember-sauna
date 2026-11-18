"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  MIN_PASSWORD_LENGTH,
  getLockoutUntil,
  hashAdminPassword,
  isLoginLocked,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { endAdminSession, startAdminSession } from "@/lib/admin-session";

export type AuthActionState = {
  error?: string;
};

const setupAttempts = new Map<string, { count: number; resetAt: number }>();
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

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin || isLoginLocked(admin.lockedUntil)) return genericError;

  const valid = await verifyAdminPassword(password, admin.passwordHash);
  if (!valid) {
    const attempts = admin.failedLoginAttempts + 1;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: getLockoutUntil(attempts),
      },
    });
    return genericError;
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
  await startAdminSession(admin.id);
  redirect("/admin");
}

export async function setupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if ((await prisma.adminUser.count()) > 0) {
    return { error: "Admin setup is no longer available." };
  }

  const requestHeaders = await headers();
  const clientKey =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    "local";
  if (!consumeSetupAttempt(clientKey)) {
    return { error: "Too many setup attempts. Try again later." };
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

function consumeSetupAttempt(key: string, now = Date.now()) {
  const current = setupAttempts.get(key);
  if (!current || current.resetAt <= now) {
    setupAttempts.set(key, { count: 1, resetAt: now + SETUP_WINDOW_MS });
    return true;
  }
  if (current.count >= SETUP_ATTEMPT_LIMIT) return false;
  current.count += 1;
  return true;
}
