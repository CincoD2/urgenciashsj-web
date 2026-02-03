"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");
    }, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[#4d7a86]">Zona privada</p>
      <h1 className="text-2xl font-semibold text-slate-900">Se ha cerrado la sesión. ¡Hasta la próxima!</h1>
      <p className="text-sm text-slate-600">Redirigiendo al inicio…</p>
    </div>
  );
}
