import { requireAdmin } from "@/lib/admin-session";
import { isNextRedirect, redirectTo, rejectsCrossSitePost } from "@/lib/form-post";
import { retirePromoCode } from "@/lib/promo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (rejectsCrossSitePost(request)) return redirectTo(request, "/admin/promo", { error: "retry" });
  await requireAdmin();
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  try {
    const retired = /^[0-9a-f-]{36}$/i.test(id) && await retirePromoCode(id);
    return redirectTo(request, "/admin/promo", retired ? { retired: "1" } : { error: "code" });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    return redirectTo(request, "/admin/promo", { error: "database" });
  }
}
