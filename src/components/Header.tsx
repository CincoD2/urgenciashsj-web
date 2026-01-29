"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const mobileMenuClass = `md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
    open ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
  }`;
  const toolsMenuClass = `ml-2 grid grid-cols-2 gap-1 text-sm overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
    toolsOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
  }`;

  return (
    <header
      className={`border-b border-[#dfe9eb] ${
        isHome
          ? "absolute inset-x-0 top-0 z-50 bg-white/45 backdrop-blur-md border-white/40"
          : "bg-white"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center px-4 py-2 text-[#2b5d68]">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logourg.png"
            alt="Urgencias HSJ"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            priority
          />
          <span className="font-semibold">UrgenciasHSJ</span>
        </Link>

        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#dfe9eb] text-[#2b5d68] transition md:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform duration-200 ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition-transform duration-200 ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>

        <div className="ml-auto hidden items-center gap-6 md:flex">
          <div className="relative group">
            <Link href="/escalas" className="inline-flex items-center gap-1">
              Herramientas
              <span aria-hidden className="text-xs">▾</span>
            </Link>
            <div className="absolute left-0 top-full z-50 hidden w-64 rounded-md border border-white/40 bg-white/80 p-2 shadow-lg backdrop-blur-md group-hover:block group-focus-within:block">
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/depuradorTtos">
                Depurador SIA
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/inhaladores">
                Inhaladores
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/anion-gap">
                Anion GAP
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/chads2vasc">
                CHA2DS2-VASc
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/curb65">
                CURB-65
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/glasgow">
                Glasgow
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/gradiente-aa-o2">
                Gradiente A-a O2
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/hasbled">
                HAS-BLED
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/hiperNa">
                Hipernatremia
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/hiponatremia">
                Hiponatremia
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/idsa">
                IDSA/ATS
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/pafi">
                PaFi
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/psi">
                PSI
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/qsofa">
                qSOFA
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/safi">
                SaFi
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/tam">
                TAm (PAM)
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/timi-scacest">
                TIMI SCACEST
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/timi-scasest">
                TIMI SCASEST
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/wells-tvp">
                Wells – TVP
              </Link>
            </div>
          </div>
          <Link href="/protocolos">Protocolos</Link>
          <Link href="/sesiones">Sesiones</Link>
          <Link href="/dietas">Dietas</Link>
          <Link href="/formacion">Formación</Link>
        </div>
      </nav>

      <div className={mobileMenuClass}>
        <div className="mx-auto max-w-7xl px-4 pb-4">
          <div className="rounded-md border border-white/40 bg-white/80 p-3 shadow-sm backdrop-blur-md">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setToolsOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded px-3 py-2 hover:bg-slate-100"
                aria-expanded={toolsOpen}
              >
                <span>Herramientas</span>
                <span aria-hidden className={`text-xs transition ${toolsOpen ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>

              <div className={toolsMenuClass}>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/depuradorTtos">
                  Depurador SIA
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/inhaladores">
                  Inhaladores
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/anion-gap">
                  Anion GAP
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/chads2vasc">
                  CHA2DS2-VASc
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/curb65">
                  CURB-65
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/glasgow">
                  Glasgow
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/gradiente-aa-o2">
                  Gradiente A-a O2
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/hasbled">
                  HAS-BLED
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/hiperNa">
                  Hipernatremia
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/hiponatremia">
                  Hiponatremia
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/idsa">
                  IDSA/ATS
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/pafi">
                  PaFi
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/psi">
                  PSI
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/qsofa">
                  qSOFA
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/safi">
                  SaFi
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/tam">
                  TAm (PAM)
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/timi-scacest">
                  TIMI SCACEST
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/timi-scasest">
                  TIMI SCASEST
                </Link>
                <Link className="rounded px-2 py-1 hover:bg-slate-100" href="/escalas/wells-tvp">
                  Wells – TVP
                </Link>
              </div>

              <div className="my-2 h-px bg-[#dfe9eb]" />
              <Link className="block rounded px-3 py-2 hover:bg-slate-100" href="/protocolos">
                Protocolos
              </Link>
              <Link className="block rounded px-3 py-2 hover:bg-slate-100" href="/sesiones">
                Sesiones
              </Link>
              <Link className="block rounded px-3 py-2 hover:bg-slate-100" href="/dietas">
                Dietas
              </Link>
              <Link className="block rounded px-3 py-2 hover:bg-slate-100" href="/formacion">
                Formación
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
