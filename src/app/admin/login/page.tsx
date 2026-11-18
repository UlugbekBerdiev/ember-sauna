import Link from "next/link";
import { AdminAuthForm } from "@/components/admin/auth-form";
import { Logo } from "@/components/site-shell";

export const metadata = { title: "Admin access" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; setup?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-login-heading">
        <Logo />
        <h1 id="admin-login-heading">Admin Access</h1>
        <AdminAuthForm
          endpoint="/admin/login/submit"
          mode="login"
          errorCode={params.error}
          notice={params.setup === "complete" ? "Admin account created. Sign in to continue." : undefined}
        />
        <Link className="admin-setup-link" href="/admin/setup">First time here? Create the owner account</Link>
        <p className="placeholder-note">Private staff access only</p>
      </section>
    </main>
  );
}
