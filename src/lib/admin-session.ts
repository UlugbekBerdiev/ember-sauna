import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findAdminForSession, revokeAdminSession } from "@/lib/admin-account";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "@/lib/admin-auth";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required.");
  return secret;
}

export async function startAdminSession(adminId: string, sessionVersion: number) {
  const token = await createSessionToken(adminId, sessionVersion, getSessionSecret());
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function endAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    const payload = await verifySessionToken(token, getSessionSecret());
    if (payload) {
      await revokeAdminSession(payload.adminId, payload.sessionVersion);
    }
  }
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token, getSessionSecret());
  if (!payload) return null;
  return findAdminForSession(payload.adminId, payload.sessionVersion);
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
