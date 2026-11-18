"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/app/admin/auth-actions";

type AuthFormProps = {
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  mode: "login" | "setup";
};

export function AdminAuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const setup = mode === "setup";

  return (
    <form className="admin-auth-form" action={formAction}>
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
      {state.error && <p className="admin-auth-error" role="alert">{state.error}</p>}
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Please wait…" : setup ? "Create admin" : "Sign in"}
      </button>
    </form>
  );
}
