"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";

const DEFAULT_IDLE_MINUTES = 5;
const DEFAULT_WARNING_SECONDS = 30;
const SESSION_STORAGE_KEY = "uhsj_tab_session";
const LOCAL_STORAGE_KEY = "uhsj_active_session";

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function IdleLogout() {
  const { status } = useSession();
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_WARNING_SECONDS);
  const [idleMinutes, setIdleMinutes] = useState(DEFAULT_IDLE_MINUTES);
  const [warningSeconds, setWarningSeconds] = useState(DEFAULT_WARNING_SECONDS);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    idleTimer.current = null;
    warnTimer.current = null;
    countdownTimer.current = null;
  };

  const scheduleTimers = () => {
    clearTimers();
    setWarningOpen(false);
    setSecondsLeft(warningSeconds);

    warnTimer.current = setTimeout(() => {
      setWarningOpen(true);
      setSecondsLeft(warningSeconds);
      countdownTimer.current = setInterval(() => {
        setSecondsLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            handleSignOut();
            return 0;
          }
          return next;
        });
      }, 1000);
    }, idleMinutes * 60 * 1000 - warningSeconds * 1000);

    idleTimer.current = setTimeout(() => {
      handleSignOut();
    }, idleMinutes * 60 * 1000);
  };

  const handleSignOut = () => {
    clearTimers();
    setWarningOpen(false);
    signOut({ redirect: false }).finally(() => {
      if (typeof window !== "undefined") {
        window.location.href = window.location.origin;
      }
    });
  };

  const handleStay = () => {
    scheduleTimers();
  };

  useEffect(() => {
    if (status !== "authenticated") {
      clearTimers();
      setWarningOpen(false);
      return;
    }

    if (typeof window === "undefined") return;

    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { idleMinutes?: number; warningSeconds?: number };
        if (!active) return;
        if (data.idleMinutes && data.idleMinutes > 0) setIdleMinutes(data.idleMinutes);
        if (data.warningSeconds && data.warningSeconds > 0) setWarningSeconds(data.warningSeconds);
      } catch {
        // ignore fetch errors and keep defaults
      }
    })();

    const localSession = localStorage.getItem(LOCAL_STORAGE_KEY);
    const tabSession = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (localSession && tabSession !== localSession) {
      handleSignOut();
      return;
    }

    if (!localSession) {
      const newId = generateSessionId();
      localStorage.setItem(LOCAL_STORAGE_KEY, newId);
      sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
    } else if (!tabSession) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, localSession);
    }

    const activityHandler = () => scheduleTimers();
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((event) => window.addEventListener(event, activityHandler, { passive: true }));
    scheduleTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, activityHandler));
      clearTimers();
      active = false;
    };
  }, [status, idleMinutes, warningSeconds]);

  if (!warningOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Sesión inactiva</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Se cerrará en {secondsLeft}s</h2>
        <p className="mt-2 text-sm text-slate-600">
          Por seguridad, tu sesión se cerrará por inactividad.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleStay}
            className="rounded-md bg-[#2b5d68] px-4 py-2 text-sm font-semibold text-white"
          >
            Mantener sesión
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
