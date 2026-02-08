'use client';

import { useEffect, useMemo, useState } from 'react';

import { trackEvent } from '@/lib/analytics';

type Row = {
  especialidad: string;
  titulo: string;
  tags: string;
  link: string;
};
type SortKey = 'especialidad' | 'titulo';
type SortDir = 'asc' | 'desc';

type GvizCell = { v?: unknown; f?: unknown } | null;
type GvizRow = { c?: GvizCell[] } | null;
type GvizResponse = { table?: { rows?: GvizRow[] } } | null;

function IntranetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.696-3.534c.63 0 1.332-.288 2.196-1.458l.911-1.22a.334.334 0 0 0-.074-.472.38.38 0 0 0-.505.06l-1.475 1.679a.241.241 0 0 1-.279.061.211.211 0 0 1-.12-.244l1.858-7.446a.499.499 0 0 0-.575-.613l-3.35.613a.35.35 0 0 0-.276.258l-.086.334a.25.25 0 0 0 .243.312h1.73l-1.476 5.922c-.054.234-.144.63-.144.918 0 .666.396 1.296 1.422 1.296zm1.83-10.536c.702 0 1.242-.414 1.386-1.044.036-.144.054-.306.054-.414 0-.504-.396-.972-1.134-.972-.702 0-1.242.414-1.386 1.044a1.868 1.868 0 0 0-.054.414c0 .504.396.972 1.134.972z" />
    </svg>
  );
}

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

export default function ProtocolosTabla({ sheetId, gid = '0' }: { sheetId: string; gid?: string }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('especialidad');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

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
          // Asumo columnas: Especialidad | Título | Tags | Link (última)
          const especialidad = cellToString(c[0]);
          const titulo = cellToString(c[1]);
          const tags = cellToString(c[2]);
          const link = cellToString(c[c.length - 1]);
          return { especialidad, titulo, tags, link };
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
            r.especialidad.toUpperCase().includes(f) ||
            r.titulo.toUpperCase().includes(f) ||
            r.tags.toUpperCase().includes(f)
          );
        });

    return [...base].sort((a, b) => {
      const primaryA = sortKey === 'especialidad' ? a.especialidad : a.titulo;
      const primaryB = sortKey === 'especialidad' ? b.especialidad : b.titulo;
      const secondaryA = sortKey === 'especialidad' ? a.titulo : a.especialidad;
      const secondaryB = sortKey === 'especialidad' ? b.titulo : b.especialidad;

      const primary = primaryA.localeCompare(primaryB, 'es', {
        sensitivity: 'base',
        numeric: true,
      });
      if (primary !== 0) return sortDir === 'asc' ? primary : -primary;

      const secondary = secondaryA.localeCompare(secondaryB, 'es', {
        sensitivity: 'base',
        numeric: true,
      });
      return sortDir === 'asc' ? secondary : -secondary;
    });
  }, [q, rows, sortDir, sortKey]);

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
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
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#3d7684] text-white">
              <th className="px-3 py-3 text-left w-[20%]">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 font-semibold"
                  onClick={() => toggleSort('especialidad')}
                  aria-label={`Ordenar por Especialidad ${sortKey === 'especialidad' && sortDir === 'asc' ? 'descendente' : 'ascendente'}`}
                >
                  Especialidad
                  <span aria-hidden className="text-xs opacity-90">
                    {sortIcon('especialidad')}
                  </span>
                </button>
              </th>
              <th className="px-3 py-3 text-left w-[35%]">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 font-semibold"
                  onClick={() => toggleSort('titulo')}
                  aria-label={`Ordenar por Título ${sortKey === 'titulo' && sortDir === 'asc' ? 'descendente' : 'ascendente'}`}
                >
                  Título
                  <span aria-hidden className="text-xs opacity-90">
                    {sortIcon('titulo')}
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
                  r.link && isInternalLink(r.link) ? 'fila-interna' : ''
                }`}
                onClick={() => {
                  if (!r.link) return;
                  trackEvent('protocol_open', {
                    protocol_title: r.titulo,
                    protocol_specialty: r.especialidad,
                    protocol_tags: r.tags,
                    protocol_url: r.link,
                    source: 'protocolos_table',
                    page_path: window.location.pathname,
                  });
                  window.open(r.link, '_blank', 'noopener,noreferrer');
                }}
              >
                <td className="px-3 py-3">{r.especialidad}</td>
                <td className="px-3 py-3 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    {r.titulo}
                    {r.link && isIntranetLink(r.link) ? (
                      <span
                        className="inline-flex items-center justify-center text-[#6b7f83] sm:hidden"
                        title="accesible solo intranet"
                        aria-label="accesible solo intranet"
                      >
                        <IntranetIcon />
                      </span>
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

      <div className="text-xs text-slate-500">Fuente: Archivos Intranet</div>
    </div>
  );
}
