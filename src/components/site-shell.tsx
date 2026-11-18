"use client";

import Link from "next/link";
import { useState } from "react";

const navigation = [
  ["Sauna", "/sauna"],
  ["Pricing", "/pricing"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"],
];

export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="Ember Sauna Co. home">
      <span aria-hidden="true" className="flame">♨</span>
      <span><strong>EMBER</strong><small>SAUNA CO.</small></span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span aria-hidden="true">☰</span>
        </button>
        <nav id="primary-navigation" aria-label="Primary" className={open ? "nav open" : "nav"}>
          {navigation.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link className="button button-small" href="/book" onClick={() => setOpen(false)}>Book now</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>Mobile sauna experiences near Damascus, Maryland.</p>
        </div>
        <nav aria-label="Footer">
          {navigation.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div>
          <p className="eyebrow">Flexible check-in</p>
          <p>Hourly from 8:00 AM–10:00 PM</p>
          <p className="placeholder-note">Policies and legal terms will be added after owner and legal approval.</p>
        </div>
      </div>
    </footer>
  );
}

export function PhotoPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`photo-placeholder ${className}`} role="img" aria-label={`${label}. Local placeholder image.`}>
      <span>EMBER</span>
      <small>Local photography placeholder · {label}</small>
    </div>
  );
}
