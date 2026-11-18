import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAuthForm } from "@/components/admin/auth-form";
import { Logo } from "@/components/site-shell";
import { loginAction } from "@/app/admin/auth-actions";
import { getCurrentAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

export const metadata = { title: "Admin access" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  if (await getCurrentAdmin()) redirect("/admin");
  const [adminCount, params] = await Promise.all([
    prisma.adminUser.count(),
    searchParams,
  ]);

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-login-heading">
        <Logo />
        <h1 id="admin-login-heading">Admin Access</h1>
        {params.setup === "complete" && <p className="admin-auth-success" role="status">Admin account created. Sign in to continue.</p>}
        <AdminAuthForm action={loginAction} mode="login" />
        {adminCount === 0 && (process.env.ADMIN_SETUP_CODE?.length ?? 0) >= 32 && (
          <Link className="admin-setup-link" href="/admin/setup">First time here? Create the owner account</Link>
        )}
        <p className="placeholder-note">Private staff access only</p>
      </section>
    </main>
  );
}
