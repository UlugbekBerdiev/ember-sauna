import { redirect } from "next/navigation";
import { AdminAuthForm } from "@/components/admin/auth-form";
import { Logo } from "@/components/site-shell";
import { setupAction } from "@/app/admin/auth-actions";
import { ensureDatabase } from "@/lib/ensure-database";
import { prisma } from "@/lib/db";

export const metadata = { title: "First-run admin setup" };
export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  let adminCount = 0;
  try {
    await ensureDatabase();
    adminCount = await prisma.adminUser.count();
  } catch {
    return (
      <main className="admin-auth-page">
        <section className="admin-auth-card">
          <Logo />
          <h1>Admin database unavailable</h1>
          <p>Account setup could not reach its database. Reload this page. If it stays unavailable, the database setup did not finish.</p>
        </section>
      </main>
    );
  }
  if (adminCount > 0) redirect("/admin/login");

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-setup-heading">
        <Logo />
        <h1 id="admin-setup-heading">Create owner access</h1>
        <p>Enter the secure setup code, then choose a private username and a password with at least 12 characters. This page permanently closes after the first admin is created.</p>
        <AdminAuthForm action={setupAction} mode="setup" />
        <p className="placeholder-note">Credentials are hashed before storage.</p>
      </section>
    </main>
  );
}
