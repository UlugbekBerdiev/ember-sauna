"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/admin/auth-actions";

const navigation = [
  ["Dashboard", "/admin"],
  ["Bookings", "/admin/bookings"],
  ["Calendar", "/admin/calendar"],
  ["Customers", "/admin/customers"],
  ["Payments", "/admin/payments"],
  ["Promo codes", "/admin/promo"],
  ["Settings", "/admin/settings"],
];

export function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className={open ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="admin-brand"><span>♦</span><strong>EMBER</strong><small>SAUNA CO.</small></div>
        <nav aria-label="Admin">
          {navigation.map(([label, href]) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return <Link className={active ? "active" : ""} href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>;
          })}
        </nav>
        <form action={logoutAction}>
          <p>Signed in as <strong>{username}</strong></p>
          <button type="submit">Log out</button>
        </form>
      </aside>
      <div className="admin-content-wrap">
        <header className="admin-mobile-header">
          <button type="button" aria-expanded={open} aria-label="Toggle admin navigation" onClick={() => setOpen(!open)}>☰</button>
          <strong>♦ Dashboard</strong>
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
