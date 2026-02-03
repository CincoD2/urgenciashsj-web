import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';
import ResetPasswordQuery from './ResetPasswordQuery';

type ResetSearchParams = {
  token?: string;
  email?: string;
};

export default function ResetPasswordPage({ searchParams }: { searchParams: ResetSearchParams }) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[#4d7a86]">Zona privada</p>
        <h1 className="text-3xl font-semibold text-slate-900">Restablecer contraseña</h1>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-[#dfe9eb] bg-white/90 p-6 text-left shadow-sm">
        <Suspense fallback={<div className="text-sm text-slate-600">Cargando…</div>}>
          <ResetPasswordQuery searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
