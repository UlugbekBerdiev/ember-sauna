import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAuthForm } from "@/components/admin/auth-form";
import { Logo } from "@/components/site-shell";
import { loginAction } from "@/app/admin/auth-actions";
import { getCurrentAdmin } from "@/lib/admin-session";
import { countAdmins } from "@/lib/admin-account";

export const metadata = { title: "Admin access" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  let currentAdmin: Awaited<ReturnType<typeof getCurrentAdmin>> = null;
  let adminCount = 0;
  let params: { setup?: string };
  try {
    currentAdmin = await getCurrentAdmin();
    [adminCount, params] = await Promise.all([
      countAdmins(),
      searchParams,
    ]);
  } catch {
    return <AdminDatabaseError />;
  }
  if (currentAdmin) redirect("/admin");

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-login-heading">
        <Logo />
        <h1 id="admin-login-heading">Admin Access</h1>
        {params.setup === "complete" && <p className="admin-auth-success" role="status">Admin account created. Sign in to continue.</p>}
        <AdminAuthForm action={loginAction} mode="login" />
        {adminCount === 0 && (
          <Link className="admin-setup-link" href="/admin/setup">First time here? Create the owner account</Link>
        )}
        <p className="placeholder-note">Private staff access only</p>
      </section>
    </main>
  );
}

function AdminDatabaseError() {
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <Logo />
        <h1>Admin database unavailable</h1>
        <p>The account page could not reach its database. Reload this page. If it stays unavailable, the database setup did not finish.</p>
      </section>
    </main>
  );
}
