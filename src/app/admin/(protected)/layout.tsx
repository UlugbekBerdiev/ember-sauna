import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return <AdminShell username={admin.username}>{children}</AdminShell>;
}
