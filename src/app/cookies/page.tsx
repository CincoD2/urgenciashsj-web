export const metadata = {
  title: 'Política de cookies | urgenciashsj.es',
  description: 'Información sobre el uso de cookies en urgenciashsj.es',
};

export default function CookiesPage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Política de cookies</h1>
        <p className="text-sm text-slate-600">
          Esta información describe el uso de cookies y tecnologías similares en urgenciashsj.es.
        </p>
      </header>

      <div className="space-y-4 text-sm text-slate-700">
        <p>
          Utilizamos cookies técnicas imprescindibles para el funcionamiento básico del sitio. Estas cookies no
          requieren consentimiento.
        </p>
        <p>
          Solo si lo aceptas, utilizamos cookies analíticas para medir el uso del sitio y mejorar la experiencia. Si
          decides rechazarlas, el sitio seguirá funcionando con normalidad.
        </p>
        <p>
          Puedes cambiar tu elección en cualquier momento borrando el almacenamiento del navegador para este sitio.
        </p>
      </div>
    </section>
  );
}
