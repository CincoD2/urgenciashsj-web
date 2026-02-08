'use client';

import { useEffect, useId, useRef, useState } from 'react';

const HIGHLIGHTED_COUNTRIES: Record<string, { high: number }> = {
  AO: { high: 1 }, // Angola
  BJ: { high: 1 }, // Benin
  BW: { high: 1 }, // Botswana
  BF: { high: 1 }, // Burkina Faso
  BI: { high: 1 }, // Burundi
  CM: { high: 1 }, // Cameroon
  TD: { high: 1 }, // Chad
  CD: { high: 1 }, // R.D. Congo
  CI: { high: 1 }, // Costa de Marfil
  ET: { high: 1 }, // Etiopía
  GQ: { high: 1 }, // Guinea Ecuatorial
  GA: { high: 1 }, // Gabón
  GM: { high: 1 }, // Gambia
  GH: { high: 1 }, // Ghana
  GN: { high: 1 }, // Guinea
  GW: { high: 1 }, // Guinea-Bissau
  KE: { high: 1 }, // Kenia
  LS: { high: 1 }, // Lesoto
  MW: { high: 1 }, // Malawi
  ML: { high: 1 }, // Mali
  MR: { high: 1 }, // Mauritania
  MZ: { high: 1 }, // Mozambique
  NA: { high: 1 }, // Namibia
  NG: { high: 1 }, // Nigeria
  CF: { high: 1 }, // República Centroafricana
  TZ: { high: 1 }, // Tanzania
  RW: { high: 1 }, // Ruanda
  SL: { high: 1 }, // Sierra Leona
  ZA: { high: 1 }, // Sudáfrica
  SS: { high: 1 }, // Sudán del Sur
  SZ: { high: 1 }, // Suazilandia (Eswatini)
  TG: { high: 1 }, // Togo
  UG: { high: 1 }, // Uganda
  ZM: { high: 1 }, // Zambia
  ZW: { high: 1 }, // Zimbabue
  EE: { high: 1 }, // Estonia
  TH: { high: 1 }, // Tailandia
  DJ: { high: 1 }, // Djibuti
  BS: { high: 1 }, // Bahamas
  HT: { high: 1 }, // Haití
  JM: { high: 1 }, // Jamaica
  TT: { high: 1 }, // Trinidad y Tobago
  BZ: { high: 1 }, // Belice
  GY: { high: 1 }, // Guyana
};

type Props = {
  label?: string;
};

const REGIONS: Array<{ title: string; countries: string[] }> = [
  {
    title: 'África subsahariana',
    countries: [
      'Angola',
      'Benín',
      'Botsuana',
      'Burkina Faso',
      'Burundi',
      'Camerún',
      'Chad',
      'R. D. del Congo',
      'Costa de Marfil',
      'Etiopía',
      'Guinea Ecuatorial',
      'Gabón',
      'Gambia',
      'Ghana',
      'Guinea',
      'Guinea-Bissau',
      'Kenia',
      'Lesoto',
      'Malawi',
      'Mali',
      'Mauritania',
      'Mozambique',
      'Namibia',
      'Nigeria',
      'República Centroafricana',
      'Tanzania',
      'Ruanda',
      'Sierra Leona',
      'Sudáfrica',
      'Sudán del Sur',
      'Suazilandia',
      'Togo',
      'Uganda',
      'Zambia',
      'Zimbabue',
    ],
  },
  { title: 'Europa Central y del Este', countries: ['Estonia'] },
  { title: 'Sur y sudeste asiático', countries: ['Tailandia'] },
  { title: 'Oriente Medio y Norte de África', countries: ['Djibuti'] },
  { title: 'Caribe', countries: ['Bahamas', 'Haití', 'Jamaica', 'Trinidad y Tobago'] },
  { title: 'Latinoamérica', countries: ['Belice', 'Guyana'] },
];

export default function WorldMapPopup({ label = 'Países ↑ Prevalencia' }: Props) {
  const [open, setOpen] = useState(false);
  const mapId = useId().replace(/:/g, '');
  const initialized = useRef(false);

  useEffect(() => {
    if (!open || initialized.current) return;
    initialized.current = true;

    const container = document.getElementById(`svgmap-${mapId}`);
    if (!container) return;

    fetch('/img/cribavih/world.svg')
      .then((res) => res.text())
      .then((raw) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(raw, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        if (!svg) return;

        const rawWidth = svg.getAttribute('width') || '1000';
        const rawHeight = svg.getAttribute('height') || '600';
        const width = parseFloat(rawWidth);
        const height = parseFloat(rawHeight);

        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.maxWidth = '100%';
        svg.style.height = '100%';

        const allPaths = svg.querySelectorAll('path[id]');
        allPaths.forEach((path) => {
          const id = path.getAttribute('id')?.toUpperCase();
          if (!id) return;
          if (HIGHLIGHTED_COUNTRIES[id]) {
            path.setAttribute('fill', '#3d7684');
            path.setAttribute('stroke', '#2b5d68');
            path.setAttribute('stroke-width', '0.6');
          } else {
            path.setAttribute('fill', '#dfe9eb');
            path.setAttribute('stroke', '#b6c8cc');
            path.setAttribute('stroke-width', '0.3');
          }
        });

        container.innerHTML = '';
        container.appendChild(svg);
      })
      .catch(() => {
        container.innerHTML =
          '<div class="text-sm text-slate-600">No se pudo cargar el mapa.</div>';
      });
  }, [open, mapId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[var(--primary-dark)] font-semibold underline decoration-slate-300 underline-offset-4 hover:text-[var(--primary-dark)]"
      >
        {label}
        <span aria-hidden className="text-xs text-slate-500">
          (mapa)
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative mx-4 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/40 bg-white/95 px-6 pb-6 pt-0 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Países con alta prevalencia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 mt-4 text-xs text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Países incluidos
                </div>
                <div className="text-slate-700">
                  {REGIONS.map((region, idx) => (
                    <span key={region.title}>
                      <span className="font-semibold text-slate-900">{region.title}</span>:{' '}
                      <span className="font-normal text-slate-700">
                        {region.countries.join(', ')}
                      </span>
                      {idx < REGIONS.length - 1 ? '; ' : '.'}
                    </span>
                  ))}
                </div>
              </div>
              <div
                id={`svgmap-${mapId}`}
                className="w-full rounded-lg border bg-white p-2"
                style={{ aspectRatio: '16 / 9' }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
