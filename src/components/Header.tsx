"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import SearchModal from "./SearchModal";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const mobileMenuClass = `md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
    open ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
  }`;
  const toolsMenuClass = `ml-2 grid grid-cols-2 gap-1 text-sm overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
    toolsOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
  }`;
  const closeMenus = () => {
    setToolsOpen(false);
    setOpen(false);
  };

  const closeMenusAndScrollTop = () => {
    closeMenus();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  return (
    <header
      className={`border-b border-[#dfe9eb] sticky top-0 z-50 bg-white/45 backdrop-blur-md border-white/40`}
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

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#2b5d68] transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-5-5" />
            </svg>
          </button>
          <Link
            href="/login"
            aria-label="Iniciar sesión o registrarse"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#2b5d68] transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.6-3.5 5-6 8-6s6.4 2.5 8 6" />
            </svg>
          </Link>
          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#2b5d68] transition"
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
        </div>

        <div className="ml-auto hidden items-center gap-6 md:flex">
          <div
            className="relative"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <Link
              href="/escalas"
              className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-[#dfe9eb]/60"
              onClick={closeMenus}
            >
              Herramientas
              <span aria-hidden className="text-xs">▾</span>
            </Link>
            <div
              className={`absolute left-0 top-full z-50 w-64 rounded-md border border-white/40 bg-white/85 p-2 shadow-lg backdrop-blur-lg ${
                toolsOpen ? "block" : "hidden"
              }`}
            >
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/depuradorTtos" onClick={closeMenus}>
                Depurador SIA
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/inhaladores" onClick={closeMenus}>
                Inhaladores
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/anion-gap" onClick={closeMenus}>
                Anion GAP
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/chads2vasc" onClick={closeMenus}>
                CHA2DS2-VASc
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/curb65" onClick={closeMenus}>
                CURB-65
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/glasgow" onClick={closeMenus}>
                Glasgow
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/gradiente-aa-o2" onClick={closeMenus}>
                Gradiente A-a O2
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/hasbled" onClick={closeMenus}>
                HAS-BLED
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/hiperNa" onClick={closeMenus}>
                Hipernatremia
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/hiponatremia" onClick={closeMenus}>
                Hiponatremia
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/idsa" onClick={closeMenus}>
                IDSA/ATS
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/pafi" onClick={closeMenus}>
                PaFi
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/psi" onClick={closeMenus}>
                PSI
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/qsofa" onClick={closeMenus}>
                qSOFA
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/safi" onClick={closeMenus}>
                SaFi
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/tam" onClick={closeMenus}>
                TAm (PAM)
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/timi-scacest" onClick={closeMenus}>
                TIMI SCACEST
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/timi-scasest" onClick={closeMenus}>
                TIMI SCASEST
              </Link>
              <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href="/escalas/wells-tvp" onClick={closeMenus}>
                Wells – TVP
              </Link>
            </div>
          </div>
          <Link className="rounded px-2 py-1 hover:bg-[#dfe9eb]/60" href="/protocolos">
            Protocolos
          </Link>
          <Link className="rounded px-2 py-1 hover:bg-[#dfe9eb]/60" href="/sesiones">
            Sesiones
          </Link>
          <Link className="rounded px-2 py-1 hover:bg-[#dfe9eb]/60" href="/dietas">
            Dietas
          </Link>
          <Link className="rounded px-2 py-1 hover:bg-[#dfe9eb]/60" href="/formacion">
            Formación
          </Link>
          <Link className="rounded px-2 py-1 hover:bg-[#dfe9eb]/60" href="/eventos">
            Eventos
          </Link>
          <Link className="rounded px-2 py-1 hover:bg-[#dfe9eb]/60" href="/novedades">
            Novedades
          </Link>
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#2b5d68] hover:bg-[#dfe9eb]/60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-5-5" />
            </svg>
          </button>
          <Link
            href="/login"
            aria-label="Iniciar sesión o registrarse"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#2b5d68] hover:bg-[#dfe9eb]/60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.6-3.5 5-6 8-6s6.4 2.5 8 6" />
            </svg>
          </Link>
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
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/depuradorTtos"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  Depurador SIA
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/inhaladores"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  Inhaladores
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/anion-gap"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  Anion GAP
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/chads2vasc"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  CHA2DS2-VASc
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/curb65"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  CURB-65
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/glasgow"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  Glasgow
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/gradiente-aa-o2"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  Gradiente A-a O2
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/hasbled"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  HAS-BLED
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/hiperNa"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  Hipernatremia
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/hiponatremia"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  Hiponatremia
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/idsa"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  IDSA/ATS
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/pafi"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  PaFi
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/psi"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  PSI
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/qsofa"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  qSOFA
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/safi"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  SaFi
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/tam"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  TAm (PAM)
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/timi-scacest"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  TIMI SCACEST
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/timi-scasest"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  TIMI SCASEST
                </Link>
                <Link
                  className="rounded px-2 py-1 hover:bg-slate-100"
                  href="/escalas/wells-tvp"
                  onClick={() => {
                    setToolsOpen(false);
                    closeMenusAndScrollTop();
                  }}
                >
                  Wells – TVP
                </Link>
              </div>

              <div className="my-2 h-px bg-[#dfe9eb]" />
              <Link className="block rounded px-3 py-2 hover:bg-slate-100" href="/protocolos" onClick={closeMenusAndScrollTop}>
                Protocolos
              </Link>
              <Link className="block rounded px-3 py-2 hover:bg-slate-100" href="/sesiones" onClick={closeMenusAndScrollTop}>
                Sesiones
              </Link>
              <Link className="block rounded px-3 py-2 hover:bg-slate-100" href="/dietas" onClick={closeMenusAndScrollTop}>
                Dietas
              </Link>
              <Link className="block rounded px-3 py-2 hover:bg-slate-100" href="/formacion" onClick={closeMenusAndScrollTop}>
                Formación
              </Link>
              <Link className="block rounded px-3 py-2 hover:bg-slate-100" href="/eventos" onClick={closeMenusAndScrollTop}>
                Eventos
              </Link>
              <Link className="block rounded px-3 py-2 hover:bg-slate-100" href="/novedades" onClick={closeMenusAndScrollTop}>
                Novedades
              </Link>
            </div>
          </div>
        </div>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
