'use client';

import { useEffect, useMemo, useState } from 'react';

type Row = {
  especialidad: string;
  titulo: string;
  tags: string;
  link: string;
};

function parseGviz(text: string): any {
  // Google gviz devuelve: "/*O_o*/\ngoogle.visualization.Query.setResponse({...});"
  const json = text.substring(47).slice(0, -2);
  return JSON.parse(json);
}

function cellToString(cell: any): string {
  if (!cell) return '';
  return (cell.f ?? cell.v ?? '').toString();
}

export default function ProtocolosTabla({ sheetId, gid = '0' }: { sheetId: string; gid?: string }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

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

        const out: Row[] = (gviz?.table?.rows ?? []).map((r: any) => {
          const c = r?.c ?? [];
          // Asumo columnas: Especialidad | Título | Tags | Link (última)
          const especialidad = cellToString(c[0]);
          const titulo = cellToString(c[1]);
          const tags = cellToString(c[2]);
          const link = cellToString(c[c.length - 1]);
          return { especialidad, titulo, tags, link };
        });

        if (!cancelled) setRows(out);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Error cargando datos');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sheetId, gid]);

  const filtered = useMemo(() => {
    const f = q.trim().toUpperCase();
    if (!f) return rows;
    return rows.filter((r) => {
      return (
        r.especialidad.toUpperCase().includes(f) ||
        r.titulo.toUpperCase().includes(f) ||
        r.tags.toUpperCase().includes(f)
      );
    });
  }, [q, rows]);

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
              <th className="px-3 py-3 text-left w-[20%]">Especialidad</th>
              <th className="px-3 py-3 text-left w-[35%]">Título</th>
              <th className="px-3 py-3 text-left w-[40%] hidden sm:table-cell">Tags</th>
              <th className="px-3 py-3 text-center w-[5%] hidden sm:table-cell">Link</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r, idx) => (
              <tr
                key={`${r.titulo}-${idx}`}
                className="border-t border-[#dfe9eb] hover:bg-[#dfe9eb]/60 cursor-pointer"
                onClick={() => {
                  if (!r.link) return;
                  window.open(r.link, '_blank', 'noopener,noreferrer');
                }}
              >
                <td className="px-3 py-3">{r.especialidad}</td>
                <td className="px-3 py-3 font-semibold">{r.titulo}</td>
                <td className="px-3 py-3 italic hidden sm:table-cell">{r.tags}</td>
                <td className="px-3 py-3 text-center hidden sm:table-cell">{r.link ? '🔗' : ''}</td>
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

      <div className="text-xs text-slate-500">Fuente: Google Sheets (gid {gid})</div>
    </div>
  );
}
