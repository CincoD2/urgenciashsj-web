'use client';

import { MONTHS, MONTH_LABELS, type MonthKey } from '@/lib/horariosData';
import type { ScheduleRow } from '@/lib/horariosStore';

type AdminHorariosManagerProps = {
  rows: ScheduleRow[];
  source: 'database' | 'static' | 'empty';
  staticCount: number;
  createScheduleEntry: (formData: FormData) => void;
  updateScheduleEntry: (formData: FormData) => void;
  deleteScheduleEntry: (formData: FormData) => void;
  importStaticHorarios: () => void;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 12 }, (_, index) => currentYear + 5 - index);

function MonthSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: MonthKey;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? MONTHS[0]}
      className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
    >
      {MONTHS.map((month) => (
        <option key={month} value={month}>
          {MONTH_LABELS[month]}
        </option>
      ))}
    </select>
  );
}

function YearSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: number;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? currentYear}
      className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
    >
      {yearOptions.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
}

export default function AdminHorariosManager({
  rows,
  source,
  staticCount,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
  importStaticHorarios,
}: AdminHorariosManagerProps) {
  const isDatabaseSource = source === 'database';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Nuevo horario</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Añade un PDF mensual sin tocar código. El enlace se puede editar abajo; si necesitas
            cambiar año o mes, elimina el registro y créalo de nuevo.
          </p>
          </div>
          <div
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
              isDatabaseSource
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            Fuente: {isDatabaseSource ? 'Base de datos' : 'Catálogo legado'}
          </div>
        </div>

        <form action={createScheduleEntry} className="mt-4 grid gap-3 md:grid-cols-[140px_180px_1fr_auto]">
          <YearSelect name="year" />
          <MonthSelect name="month" />
          <input
            type="url"
            name="url"
            placeholder="https://..."
            required
            className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
            Añadir
          </button>
        </form>
      </section>

      {!isDatabaseSource && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900">Importar horarios actuales</h2>
          <p className="mt-1 text-sm text-amber-800">
            Ahora mismo la web está leyendo el catálogo legado del código. Importa esos{' '}
            {staticCount} registros a base de datos para poder editarlos desde este panel.
          </p>
          <form action={importStaticHorarios} className="mt-4">
            <button className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white">
              Importar catálogo actual
            </button>
          </form>
        </section>
      )}

      <section className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-neutral-900">Horarios existentes</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {rows.length === 0
              ? 'Todavía no hay registros en base de datos.'
              : `Hay ${rows.length} registros cargados.`}
          </p>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3">Mes</th>
              <th className="px-4 py-3">Enlace</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-sm text-neutral-500">
                  No hay horarios en la base de datos todavía.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100 align-top">
                  <td className="px-4 py-3">
                    {isDatabaseSource ? (
                      <span className="font-medium text-neutral-900">{row.year}</span>
                    ) : (
                      <span className="font-medium text-neutral-900">{row.year}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isDatabaseSource ? (
                      <span className="text-neutral-700">{MONTH_LABELS[row.month]}</span>
                    ) : (
                      <span className="text-neutral-700">{MONTH_LABELS[row.month]}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isDatabaseSource ? (
                      <form action={updateScheduleEntry} className="flex min-w-[420px] gap-2">
                        <input type="hidden" name="entryId" value={row.id} />
                        <input type="hidden" name="year" value={row.year} />
                        <input type="hidden" name="month" value={row.month} />
                        <input
                          type="url"
                          name="url"
                          defaultValue={row.url}
                          required
                          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                        />
                        <button className="rounded-md bg-neutral-900 px-3 py-2 text-xs font-semibold text-white">
                          Guardar
                        </button>
                      </form>
                    ) : (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1f4c57] underline underline-offset-2"
                      >
                        Abrir enlace
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isDatabaseSource ? (
                      <form
                        action={deleteScheduleEntry}
                        onSubmit={(event) => {
                          const ok = window.confirm('¿Eliminar este horario?');
                          if (!ok) event.preventDefault();
                        }}
                      >
                        <input type="hidden" name="entryId" value={row.id} />
                        <button className="rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white">
                          Eliminar
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-neutral-500">Importa primero para editar</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
