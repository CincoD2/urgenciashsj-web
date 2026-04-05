'use client';

import { useEffect, useMemo, useState } from 'react';

import { InternalSiteIcon, IntranetIcon } from '@/components/LinkIndicators';

type Row = {
  tipo: string;
  titulo: string;
  tags: string;
  link: string;
};
type SortDir = 'asc' | 'desc';

type GvizCell = { v?: unknown; f?: unknown } | null;
type GvizRow = { c?: GvizCell[] } | null;
type GvizResponse = { table?: { rows?: GvizRow[] } } | null;

function isIntranetLink(link: string): boolean {
  if (!link) return false;
  if (!link.startsWith('http://') && !link.startsWith('https://')) return false;
  try {
    const { hostname } = new URL(link);
    if (typeof window !== 'undefined') {
      const currentHost = window.location.hostname;
      if (hostname === currentHost) return false;
    }
    return hostname === '10.192.176.110' || hostname === 'vvd17cloud.cs.san.gva.es';
  } catch {
    return false;
  }
}

function isInternalLink(link: string): boolean {
  if (!link) return false;
  if (link.startsWith('/')) return true;
  if (!link.startsWith('http://') && !link.startsWith('https://')) return false;
  try {
    const { hostname } = new URL(link);
    if (typeof window === 'undefined') return false;
    return hostname === window.location.hostname;
  } catch {
    return false;
  }
}

function parseGviz(text: string): GvizResponse {
  // Google gviz devuelve: "/*O_o*/\ngoogle.visualization.Query.setResponse({...});"
  const json = text.substring(47).slice(0, -2);
  return JSON.parse(json) as GvizResponse;
}

function cellToString(cell: GvizCell): string {
  if (!cell) return '';
  return (cell.f ?? cell.v ?? '').toString();
}

export default function SesionesTabla({ sheetId, gid = '0' }: { sheetId: string; gid?: string }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${gid}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const gviz = parseGviz(text);

        const out: Row[] = (gviz?.table?.rows ?? []).map((r) => {
          const c = r?.c ?? [];
          // Asumo columnas: Tipo | Título | Tags | Link (última)
          const tipo = cellToString(c[0]);
          const titulo = cellToString(c[1]);
          const tags = cellToString(c[2]);
          const link = cellToString(c[c.length - 1]);
          return { tipo, titulo, tags, link };
        });

        if (!cancelled) setRows(out);
      } catch (e: unknown) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : 'Error cargando datos';
        setError(message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sheetId, gid]);

  const filtered = useMemo(() => {
    const f = q.trim().toUpperCase();
    const base = !f
      ? rows
      : rows.filter((r) => {
          return (
            r.tipo.toUpperCase().includes(f) ||
            r.titulo.toUpperCase().includes(f) ||
            r.tags.toUpperCase().includes(f)
          );
        });

    return [...base].sort((a, b) => {
      const primary = a.titulo.localeCompare(b.titulo, 'es', {
        sensitivity: 'base',
        numeric: true,
      });
      if (primary !== 0) return sortDir === 'asc' ? primary : -primary;
      const secondary = a.tipo.localeCompare(b.tipo, 'es', {
        sensitivity: 'base',
        numeric: true,
      });
      return sortDir === 'asc' ? secondary : -secondary;
    });
  }, [q, rows, sortDir]);

  const toggleSort = () => {
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="space-y-3">
      <div className="buscador-wrapper">
        <span className="buscador-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca palabras clave..."
          className="buscador-input"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ('')}
            className="buscador-clear"
            aria-label="Borrar búsqueda"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
          Error: {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-[#dfe9eb]">
        <table className="w-full border-collapse text-sm table-fixed">
          <thead>
            <tr className="bg-[#3d7684] text-white">
              <th className="px-3 py-3 text-left w-[20%]">Tipo</th>
              <th className="px-3 py-3 text-left w-[35%]">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 font-semibold"
                  onClick={toggleSort}
                  aria-label={`Ordenar por Título ${
                    sortDir === 'asc' ? 'descendente' : 'ascendente'
                  }`}
                >
                  Título - Autor - Fecha
                  <span aria-hidden className="text-xs opacity-90">
                    {sortDir === 'asc' ? '↑' : '↓'}
                  </span>
                </button>
              </th>
              <th className="px-3 py-3 text-left w-[40%] hidden sm:table-cell">Tags</th>
              <th className="px-3 py-3 text-center w-[5%] hidden sm:table-cell">Link</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r, idx) => (
              <tr
                key={`${r.titulo}-${idx}`}
                className={`border-t border-[#dfe9eb] hover:bg-[#dfe9eb]/60 cursor-pointer ${
                  r.link && isInternalLink(r.link) ? 'bg-[#f1f6f7]' : ''
                }`}
                onClick={() => {
                  if (!r.link) return;
                  window.open(r.link, '_blank', 'noopener,noreferrer');
                }}
              >
                <td className="px-3 py-3">{r.tipo}</td>
                <td className="px-3 py-3 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    {r.titulo}
                    {r.link ? (
                      isIntranetLink(r.link) ? (
                        <span
                          className="inline-flex items-center justify-center text-[#6b7f83] sm:hidden"
                          title="accesible solo intranet"
                          aria-label="accesible solo intranet"
                        >
                          <IntranetIcon />
                        </span>
                      ) : isInternalLink(r.link) ? (
                        <span
                          className="inline-flex items-center justify-center text-[#6b7f83] sm:hidden"
                          title="contenido en esta web"
                          aria-label="contenido en esta web"
                        >
                          <InternalSiteIcon />
                        </span>
                      ) : null
                    ) : null}
                  </span>
                </td>
                <td className="px-3 py-3 italic hidden sm:table-cell">{r.tags}</td>
                <td className="px-3 py-3 text-center hidden sm:table-cell">
                  {r.link ? (
                    isIntranetLink(r.link) ? (
                      <span
                        className="inline-flex items-center justify-center text-[#6b7f83]"
                        title="accesible solo intranet"
                        aria-label="accesible solo intranet"
                      >
                        <IntranetIcon />
                      </span>
                    ) : isInternalLink(r.link) ? (
                      <span
                        className="inline-flex items-center justify-center text-[#6b7f83]"
                        title="contenido en esta web"
                        aria-label="contenido en esta web"
                      >
                        <InternalSiteIcon />
                      </span>
                    ) : (
                      '🔗'
                    )
                  ) : (
                    ''
                  )}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-sm text-slate-500" colSpan={4}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">Fuente: Recopilación propia y archivos Intranet</div>
    </div>
  );
}
