import { requireAdmin } from "@/lib/admin-session";
import { isNextRedirect, redirectTo, rejectsCrossSitePost } from "@/lib/form-post";
import { PromoError, createPromoCode } from "@/lib/promo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (rejectsCrossSitePost(request)) return redirectTo(request, "/admin/promo", { error: "retry" });
  await requireAdmin();
  const form = await request.formData();
  try {
    const code = await createPromoCode({
      code: String(form.get("code") ?? ""),
      percentOff: Number(form.get("percent")),
    });
    return redirectTo(request, "/admin/promo", { created: code });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const code = error instanceof PromoError ? error.code : "database";
    return redirectTo(request, "/admin/promo", { error: code === "percent" || code === "code" ? code : "database" });
  }
}
