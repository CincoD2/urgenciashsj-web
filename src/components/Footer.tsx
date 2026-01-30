export default function Footer() {
  return (
    <footer className="border-t border-[#dfe9eb] mt-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-[#516f75] space-y-2">
        <div>
          Aviso legal: Contenido dirigido exclusivamente a profesionales sanitarios con fines
          informativos y educativos. No sustituye el juicio clínico ni la valoración individual del
          paciente. El uso de la información es responsabilidad exclusiva del usuario.{' '}
          <a
            href="/disclaimer"
            className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#3d7684]"
          >
            Leer más
          </a>
          .
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span>© {new Date().getFullYear()} urgenciashsj.es</span>
          <span className="text-[#dfe9eb]">•</span>
        </div>
      </div>
    </footer>
  );
}
