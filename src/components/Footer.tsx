'use client';

import { useState } from 'react';

import AboutModal from '@/components/AboutModal';

export default function Footer() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showLegal, setShowLegal] = useState(true);

  return (
    <footer className="border-t border-[#dfe9eb] mt-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-[#516f75] space-y-2">
        <div className="flex flex-col items-end gap-2">
          {showLegal ? (
            <button
              type="button"
              onClick={() => setShowLegal(false)}
              className="inline-flex items-center underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#3d7684] shrink-0"
              aria-label="Ocultar aviso legal"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="currentColor"
              >
                <path d="M5.2 7.3a1 1 0 0 1 1.4 0L10 10.7l3.4-3.4a1 1 0 1 1 1.4 1.4l-4.1 4.1a1 1 0 0 1-1.4 0L5.2 8.7a1 1 0 0 1 0-1.4Z" />
              </svg>
            </button>
          ) : null}
          <div
            className={`self-start overflow-hidden transition-all duration-300 ${
              showLegal ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <span>
              <b>Aviso legal</b>: Contenido dirigido exclusivamente a profesionales sanitarios con
              fines informativos y educativos. No sustituye el juicio clínico ni la valoración
              individual del paciente. El uso de la información es responsabilidad exclusiva del
              usuario.{' '}
              <a
                href="/disclaimer"
                className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#3d7684]"
              >
                Leer más
              </a>
              .
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span>© {new Date().getFullYear()} urgenciashsj.es</span>
            <span className="text-[#dfe9eb]">•</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
            {!showLegal ? (
              <button
                type="button"
                onClick={() => setShowLegal(true)}
                className="underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#3d7684]"
              >
                Aviso legal
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </footer>
  );
}
