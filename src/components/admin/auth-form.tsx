"use client";

import { useState } from "react";

type AuthFormProps = {
  endpoint: string;
  mode: "login" | "setup";
  errorCode?: string;
  notice?: string;
};

const LOGIN_ERRORS: Record<string, string> = {
  invalid: "Invalid username or password.",
  rate: "Too many sign-in attempts. Try again later.",
  database: "The admin database is unavailable. Reload and try again.",
  retry: "Reload this page and try again.",
};

const SETUP_ERRORS: Record<string, string> = {
  code: "Invalid setup code.",
  closed: "Admin setup is no longer available.",
  username: "Choose a username with 3–32 letters, numbers, underscores, or dashes.",
  mismatch: "Passwords do not match.",
  password: "Password must be at least 12 characters.",
  rate: "Too many setup attempts. Try again later.",
  failed: "Unable to create the admin account. Review the fields and try again.",
  database: "The admin database is unavailable. Reload and try again.",
  retry: "Reload this page and try again.",
};

export function AdminAuthForm({ endpoint, mode, errorCode, notice }: AuthFormProps) {
  const setup = mode === "setup";
  const messages = setup ? SETUP_ERRORS : LOGIN_ERRORS;
  const error = errorCode ? messages[errorCode] ?? messages.database : null;
  const [pending, setPending] = useState(false);

  return (
    <form className="admin-auth-form" action={endpoint} method="post" onSubmit={() => setPending(true)}>
      {notice && <p className="admin-auth-success" role="status">{notice}</p>}
      {setup && (
        <div className="field">
          <label className="sr-only" htmlFor="setupToken">Setup code</label>
          <input className="input" id="setupToken" name="setupToken" type="password" autoComplete="off" placeholder="Setup code" required />
        </div>
      )}
      <div className="field">
        <label className="sr-only" htmlFor="username">Username</label>
        <input className="input" id="username" name="username" autoComplete="username" placeholder="Username" minLength={3} maxLength={32} required />
      </div>
      <div className="field">
        <label className="sr-only" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete={setup ? "new-password" : "current-password"} placeholder="Password" minLength={setup ? 12 : undefined} required />
      </div>
      {setup && (
        <div className="field">
          <label className="sr-only" htmlFor="confirmPassword">Confirm password</label>
          <input className="input" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Confirm password" minLength={12} required />
        </div>
      )}
      {error && <p className="admin-auth-error" role="alert">{error}</p>}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Please wait…" : setup ? "Create admin" : "Sign in"}
      </button>
    </form>
  );
}
