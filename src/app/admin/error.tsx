"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <h1>Admin page unavailable</h1>
        <p>This admin page hit a server error. Reload it. If it stays unavailable, the admin service did not finish starting.</p>
        <button className="button" type="button" onClick={() => reset()}>Reload</button>
      </section>
    </main>
  );
}
