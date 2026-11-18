import { redirectTo, isNextRedirect, rejectsCrossSitePost } from "@/lib/form-post";

const SETUP_CODES: Record<string, string> = {
  "Invalid setup code.": "code",
  "Admin setup is no longer available.": "closed",
  "Choose a username with 3–32 letters, numbers, underscores, or dashes.": "username",
  "Passwords do not match.": "mismatch",
  "Too many setup attempts. Try again later.": "rate",
  "Unable to create the admin account. Review the fields and try again.": "failed",
  "The admin database is unavailable. Reload and try again.": "database",
};

export async function POST(request: Request) {
  if (rejectsCrossSitePost(request)) {
    return redirectTo(request, "/admin/setup", { error: "retry" });
  }

  try {
    const { setupAction } = await import("@/app/admin/auth-actions");
    const result = await setupAction({}, await request.formData());
    const message = result.error ?? "";
    const code = message.startsWith("Password must be at least ")
      ? "password"
      : SETUP_CODES[message] ?? "failed";
    return redirectTo(request, "/admin/setup", { error: code });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return redirectTo(request, "/admin/setup", { error: "database" });
  }
}
