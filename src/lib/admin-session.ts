import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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

export async function startAdminSession(adminId: string) {
  const token = await createSessionToken(adminId, getSessionSecret());
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
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getCurrentAdmin() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token, getSessionSecret());
  if (!payload) return null;
  return prisma.adminUser.findUnique({
    where: { id: payload.adminId },
    select: { id: true, username: true, email: true },
  });
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
