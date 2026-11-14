"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";
import { Alert } from "@/components/ui";
import { LockIcon } from "@/components/icons";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {
    error: initialError,
  });

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <div>
        <label className="label" htmlFor="identitas">
          Username / NIS
        </label>
        <input
          id="identitas"
          name="identitas"
          autoComplete="username"
          inputMode="text"
          autoCapitalize="none"
          spellCheck={false}
          required
          className="input"
          placeholder="Username admin atau NIS PIC"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={4}
          className="input"
          placeholder="Masukkan password"
        />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Memeriksa…
          </>
        ) : (
          <>
            <LockIcon size={18} /> Masuk
          </>
        )}
      </button>
    </form>
  );
}
