"use client";

import { useEffect, useState } from "react";

import { trackEvent } from "@/lib/analytics";

type Result = { type: string; title: string; url: string };

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const query = q.trim();
      if (!query) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!cancelled) setResults(data.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const t = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative mx-auto mt-20 w-[92%] max-w-2xl rounded-xl border border-white/40 bg-white/90 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-[#3d7684]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar en todo el sitio..."
            className="w-full bg-transparent py-1 text-sm outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-[#516f75] hover:bg-[#dfe9eb]/60"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-3 max-h-[45vh] overflow-auto">
          {loading && <div className="py-2 text-sm text-[#516f75]">Buscando…</div>}
          {!loading && results.length === 0 && q && (
            <div className="py-2 text-sm text-[#516f75]">Sin resultados</div>
          )}
          <ul className="divide-y divide-[#dfe9eb]">
            {results.map((r) => (
              <li key={`${r.type}-${r.url}`}>
                <a
                  href={r.url}
                  className="block rounded px-2 py-2 text-sm hover:bg-[#dfe9eb]/60 hover:text-[#3d7684]"
                  onClick={() => {
                    if (r.type === "protocolo") {
                      trackEvent("protocol_open", {
                        protocol_title: r.title,
                        protocol_url: r.url,
                        source: "search_modal",
                        page_path: window.location.pathname,
                      });
                    }
                    onClose();
                  }}
                >
                  <span className="mr-2 rounded bg-[#dfe9eb]/70 px-2 py-0.5 text-[10px] uppercase text-[#516f75]">
                    {r.type === "herramienta"
                      ? "Herramienta"
                      : r.type === "formacion"
                      ? "Formación"
                      : r.type}
                  </span>
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
