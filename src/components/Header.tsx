"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import SearchModal from "./SearchModal";
import { signOut, useSession } from "next-auth/react";
import { LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY } from "@/lib/sessionKeys";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const emailLabel = session?.user?.email?.split("@")[0];
  const userLabel = isAuthed ? emailLabel || "Cuenta" : "Acceso";
  const isAdmin = session?.user?.role === "ADMIN";
  const navItemClass = isAuthed
    ? "rounded px-2 py-1 !text-white hover:bg-white/10"
    : "rounded px-2 py-1 text-[#2b5d68] hover:bg-[#dfe9eb]/60";
  const toolsLinkClass = isAuthed
    ? "inline-flex items-center gap-1 rounded px-2 py-1 !text-white hover:bg-white/10"
    : "inline-flex items-center gap-1 rounded px-2 py-1 text-[#2b5d68] hover:bg-[#dfe9eb]/60";

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
      className={`border-b border-[#dfe9eb] sticky top-0 z-50 backdrop-blur-md border-white/40 ${
        isAuthed ? "bg-[#1f4c57]" : "bg-white/45"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-7xl items-center px-4 py-2 ${
          isAuthed ? "text-white" : "text-[#2b5d68]"
        }`}
      >
        <Link
          href="/"
          className={`flex items-center gap-3 ${isAuthed ? "!text-white" : "text-[#2b5d68]"}`}
        >
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
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md transition ${
              isAuthed ? "!text-white" : "text-[#2b5d68]"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-5-5" />
            </svg>
          </button>
          <div className="relative">
            {isAuthed ? (
              <>
                <button
                  type="button"
                  aria-label="Cuenta"
                  onClick={() => setUserOpen((v) => !v)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md transition !text-white"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c1.6-3.5 5-6 8-6s6.4 2.5 8 6" />
                  </svg>
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-md border border-white/40 bg-white/90 p-2 text-right text-sm shadow-lg backdrop-blur-lg">
                    <span className="block px-3 py-2 text-xs font-semibold text-slate-500">{userLabel}</span>
                    <Link
                      className="block rounded px-3 py-2 text-slate-800 hover:bg-slate-100"
                      href="/parte-jefatura"
                      onClick={() => setUserOpen(false)}
                    >
                      Parte de jefatura
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="my-1 h-px bg-[#dfe9eb]" />
                        <Link
                          className="block rounded px-3 py-2 text-slate-800 hover:bg-slate-100"
                          href="/admin/usuarios"
                          onClick={() => setUserOpen(false)}
                        >
                          Administración
                        </Link>
                      </>
                    )}
                    <div className="my-1 h-px bg-[#dfe9eb]" />
                    <button
                      type="button"
                      onClick={() => {
                        setUserOpen(false);
                        if (typeof window !== "undefined") {
                          localStorage.removeItem(LOCAL_STORAGE_KEY);
                          sessionStorage.removeItem(SESSION_STORAGE_KEY);
                        }
                        signOut({ redirect: false }).finally(() => {
                          window.location.href = window.location.origin;
                        });
                      }}
                      className="block w-full rounded px-3 py-2 text-right text-slate-700 hover:bg-slate-100"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                aria-label="Acceso"
                href="/login"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md transition text-[#2b5d68]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.6-3.5 5-6 8-6s6.4 2.5 8 6" />
                </svg>
              </Link>
            )}
          </div>
          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md transition ${
              isAuthed ? "!text-white" : "text-[#2b5d68]"
            }`}
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

        <div className="ml-auto hidden items-center gap-4 md:flex">
          <div
            className="relative"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <Link
              href="/escalas"
              className={toolsLinkClass}
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
          <Link className={navItemClass} href="/protocolos">
            Protocolos
          </Link>
          <Link className={navItemClass} href="/sesiones">
            Sesiones
          </Link>
          <Link className={navItemClass} href="/dietas">
            Dietas
          </Link>
          <Link className={navItemClass} href="/formacion">
            Formación
          </Link>
          <Link className={navItemClass} href="/eventos">
            Eventos
          </Link>
          <Link className={navItemClass} href="/novedades">
            Novedades
          </Link>
          <button
            type="button"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
              isAuthed ? "!text-white hover:bg-white/10" : "text-[#2b5d68] hover:bg-[#dfe9eb]/60"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-5-5" />
            </svg>
          </button>
          {isAuthed ? (
            <div
              className="relative"
              onMouseEnter={() => {
                if (userCloseTimer.current) {
                  clearTimeout(userCloseTimer.current);
                }
                setUserOpen(true);
              }}
              onMouseLeave={() => {
                userCloseTimer.current = setTimeout(() => setUserOpen(false), 120);
              }}
            >
              <button
                type="button"
                onClick={() => setUserOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-md px-2 py-1 !text-white hover:bg-white/10"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.6-3.5 5-6 8-6s6.4 2.5 8 6" />
                </svg>
                <span className="text-xs font-semibold">{userLabel}</span>
              </button>
              {userOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-white/40 bg-white/90 p-2 text-right text-sm shadow-lg backdrop-blur-lg"
                  onMouseEnter={() => {
                    if (userCloseTimer.current) {
                      clearTimeout(userCloseTimer.current);
                    }
                    setUserOpen(true);
                  }}
                  onMouseLeave={() => {
                    userCloseTimer.current = setTimeout(() => setUserOpen(false), 120);
                  }}
                >
                  <span className="block px-3 py-2 text-xs font-semibold text-slate-500">{userLabel}</span>
                  <Link
                    className="block rounded px-3 py-2 text-slate-800 hover:bg-slate-100"
                    href="/parte-jefatura"
                    onClick={() => setUserOpen(false)}
                  >
                    Parte de jefatura
                  </Link>
                  {isAdmin && (
                    <>
                      <div className="my-1 h-px bg-[#dfe9eb]" />
                      <Link
                        className="block rounded px-3 py-2 text-slate-800 hover:bg-slate-100"
                        href="/admin/usuarios"
                        onClick={() => setUserOpen(false)}
                      >
                        Administración
                      </Link>
                    </>
                  )}
                  <div className="my-1 h-px bg-[#dfe9eb]" />
                  <button
                    type="button"
                    onClick={() => {
                      setUserOpen(false);
                      if (typeof window !== "undefined") {
                        localStorage.removeItem(LOCAL_STORAGE_KEY);
                        sessionStorage.removeItem(SESSION_STORAGE_KEY);
                      }
                      signOut({ redirect: false }).finally(() => {
                        window.location.href = window.location.origin;
                      });
                    }}
                    className="block w-full rounded px-3 py-2 text-right text-slate-700 hover:bg-slate-100"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-[#2b5d68] hover:bg-[#dfe9eb]/60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c1.6-3.5 5-6 8-6s6.4 2.5 8 6" />
              </svg>
              <span className="text-xs font-semibold">{userLabel}</span>
            </Link>
          )}
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
