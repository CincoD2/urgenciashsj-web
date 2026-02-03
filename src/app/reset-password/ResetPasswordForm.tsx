"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "./actions";

type ResetPasswordFormProps = {
  token: string;
  email: string;
};

type ResetState = {
  ok?: boolean;
  message?: string;
};

const initialState: ResetState = {};

export default function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const [state, formAction] = useActionState(resetPassword, initialState);
  const router = useRouter();

  useEffect(() => {
    if (!state?.ok) return;
    const timer = setTimeout(() => {
      router.push("/login");
    }, 1200);
    return () => clearTimeout(timer);
  }, [router, state?.ok]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Nueva contraseña
        </label>
        <input
          name="password"
          type="password"
          minLength={8}
          required
          className="w-full rounded-md border border-[#dfe9eb] px-3 py-2 text-sm"
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Repite la contraseña
        </label>
        <input
          name="passwordConfirm"
          type="password"
          minLength={8}
          required
          className="w-full rounded-md border border-[#dfe9eb] px-3 py-2 text-sm"
          autoComplete="new-password"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-[#2b5d68] px-4 py-2 text-sm font-semibold text-white"
      >
        Guardar contraseña
      </button>

      {state?.message && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
          {state.ok && <div className="mt-1 text-xs">Redirigiendo a inicio de sesión…</div>}
        </div>
      )}
    </form>
  );
}
