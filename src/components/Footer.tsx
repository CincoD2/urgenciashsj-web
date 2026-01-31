'use client';

import { useState } from 'react';

import AboutModal from '@/components/AboutModal';

export default function Footer() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <footer className="border-t border-[#dfe9eb] mt-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-[#516f75] space-y-2">
        <div>
          <b>Aviso legal</b>: Contenido dirigido exclusivamente a profesionales sanitarios con fines
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span>© {new Date().getFullYear()} urgenciashsj.es</span>
            <span className="text-[#dfe9eb]">•</span>
          </div>
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className="inline-flex items-center gap-2 underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#3d7684]"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-semibold leading-none">
              i
            </span>
            <b>Acerca de esta web</b>
          </button>
        </div>
      </div>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </footer>
  );
}
