import { AdminAuthForm } from "@/components/admin/auth-form";
import { Logo } from "@/components/site-shell";

export const metadata = { title: "First-run admin setup" };

export default async function AdminSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-setup-heading">
        <Logo />
        <h1 id="admin-setup-heading">Create owner access</h1>
        <p>Enter the secure setup code, then choose a private username and a password with at least 12 characters. This page permanently closes after the first admin is created.</p>
        <AdminAuthForm endpoint="/admin/setup/submit" mode="setup" errorCode={params.error} />
        <p className="placeholder-note">Credentials are hashed before storage.</p>
      </section>
    </main>
  );
}
