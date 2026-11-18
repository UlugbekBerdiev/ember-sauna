import { redirectTo, isNextRedirect, rejectsCrossSitePost } from "@/lib/form-post";

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
    const code = LOGIN_CODES[result.error ?? ""] ?? "database";
    return redirectTo(request, "/admin/login", { error: code });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return redirectTo(request, "/admin/login", { error: "database" });
  }
}
