import Link from 'next/link';
import NotFoundTracker from '@/components/NotFoundTracker';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col justify-center space-y-6">
      <NotFoundTracker />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Error 404</p>
        <h1 className="text-2xl font-semibold">Página no encontrada</h1>
        <p className="text-slate-600">
          La página que buscas no existe, ha cambiado de URL o no está disponible en este momento.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
        >
          Ir a la página principal
        </Link>
      </div>
    </div>
  );
}
