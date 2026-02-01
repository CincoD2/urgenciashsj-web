"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const res = await fetch("/api/auth/providers");
      const data = (await res.json()) as Record<string, ClientSafeProvider>;
      if (mounted) setProviders(data);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isLoading = status === "loading";
  const isAuthed = status === "authenticated";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[#4d7a86]">Acceso privado</p>
        <h1 className="text-3xl font-semibold text-slate-900">Iniciar sesión o registrarse</h1>
        <p className="text-sm text-slate-600">
          Usa tu cuenta para acceder al parte de jefatura. El alta queda pendiente de aprobación.
        </p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-[#dfe9eb] bg-white/90 p-6 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-slate-600">Comprobando sesión…</p>
        ) : isAuthed ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Conectado como <span className="font-semibold">{session?.user?.email ?? "usuario"}</span>.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md bg-[#2b5d68] px-4 py-2 text-sm font-semibold text-white"
              >
                Cerrar sesión
              </button>
              <a
                href="/parte-jefatura"
                className="rounded-md border border-[#2b5d68]/30 px-4 py-2 text-sm font-semibold text-[#2b5d68]"
              >
                Ir al parte de jefatura
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Selecciona un método para continuar:</p>
            <div className="flex flex-col gap-2">
              {providers && Object.values(providers).length > 0 ? (
                Object.values(providers).map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => signIn(provider.id, { callbackUrl: "/parte-jefatura" })}
                    className="rounded-md bg-[#2b5d68] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Continuar con {provider.name}
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/parte-jefatura" })}
                  className="rounded-md bg-[#2b5d68] px-4 py-2 text-sm font-semibold text-white"
                >
                  Continuar con Google
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
