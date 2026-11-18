import { redirectTo, rejectsCrossSitePost } from "@/lib/form-post";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  createSessionToken,
} from "@/lib/session-token";

const LOGIN_CODES: Record<string, string> = {
  "Invalid username or password.": "invalid",
  "Too many sign-in attempts. Try again later.": "rate",
  "The admin database is unavailable. Reload and try again.": "database",
};

export async function POST(request: Request) {
  if (rejectsCrossSitePost(request)) {
    return redirectTo(request, "/admin/login", { error: "retry" });
  }

  try {
    const { loginAction } = await import("@/app/admin/auth-actions");
    const result = await loginAction({}, await request.formData());
    if (result.session) {
      return startSession(request, result.session.adminId, result.session.sessionVersion);
    }
    const code = LOGIN_CODES[result.error ?? ""] ?? "database";
    return redirectTo(request, "/admin/login", { error: code });
  } catch {
    return redirectTo(request, "/admin/login", { error: "database" });
  }
}

async function startSession(request: Request, adminId: string, sessionVersion: number) {
  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < 32) {
    return redirectTo(request, "/admin/login", { error: "session" });
  }
  const token = await createSessionToken(adminId, sessionVersion, secret);
  const response = redirectTo(request, "/admin");
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}
