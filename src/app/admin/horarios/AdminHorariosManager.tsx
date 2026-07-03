'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { MONTH_LABELS } from '@/lib/horariosData';
import type { ScheduleRow } from '@/lib/horariosStore';

import type { ScheduleActionState } from './actions';

type AdminHorariosManagerProps = {
  rows: ScheduleRow[];
  totalRows: number;
  source: 'database' | 'static' | 'empty';
  staticCount: number;
  createScheduleEntry: (
    state: ScheduleActionState,
    formData: FormData
  ) => Promise<ScheduleActionState>;
  updateScheduleEntry: (
    state: ScheduleActionState,
    formData: FormData
  ) => Promise<ScheduleActionState>;
  deleteScheduleEntry: (
    state: ScheduleActionState,
    formData: FormData
  ) => Promise<ScheduleActionState>;
  importStaticHorarios: (
    state: ScheduleActionState,
    formData: FormData
  ) => Promise<ScheduleActionState>;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 12 }, (_, index) => currentYear + 5 - index);
const initialState: ScheduleActionState = {};

function Feedback({ state }: { state: ScheduleActionState }) {
  if (!state?.message) return null;

  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        state.ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700'
      }`}
    >
      {state.message}
    </div>
  );
}

function Button({
  idleLabel,
  pendingLabel,
  tone = 'dark',
}: {
  idleLabel: string;
  pendingLabel: string;
  tone?: 'dark' | 'rose' | 'amber' | 'neutral';
}) {
  const { pending } = useFormStatus();
  const toneClass =
    tone === 'rose'
      ? 'bg-rose-600 text-white'
      : tone === 'amber'
        ? 'bg-amber-700 text-white'
        : tone === 'neutral'
          ? 'bg-neutral-200 text-neutral-700'
          : 'bg-neutral-900 text-white';

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-w-[88px] items-center justify-center rounded-md px-3 py-1 text-xs font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

function CreateScheduleForm({
  createScheduleEntry,
}: {
  createScheduleEntry: AdminHorariosManagerProps['createScheduleEntry'];
}) {
  const [state, formAction] = useActionState(createScheduleEntry, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <div className="grid gap-3 md:grid-cols-[140px_180px_1fr_auto]">
        <select
          name="year"
          defaultValue={currentYear}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          name="month"
          defaultValue="ENE"
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          {Object.entries(MONTH_LABELS).map(([month, label]) => (
            <option key={month} value={month}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="url"
          name="url"
          placeholder="https://..."
          required
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <div className="flex items-center">
          <Button idleLabel="Añadir" pendingLabel="Guardando..." />
        </div>
      </div>
      <Feedback state={state} />
    </form>
  );
}

function ImportStaticForm({
  importStaticHorarios,
}: {
  importStaticHorarios: AdminHorariosManagerProps['importStaticHorarios'];
}) {
  const [state, formAction] = useActionState(importStaticHorarios, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <Button idleLabel="Importar catálogo actual" pendingLabel="Importando..." tone="amber" />
      <Feedback state={state} />
    </form>
  );
}

function UpdateScheduleForm({
  row,
  updateScheduleEntry,
  onCancel,
}: {
  row: ScheduleRow;
  updateScheduleEntry: AdminHorariosManagerProps['updateScheduleEntry'];
  onCancel: () => void;
}) {
  const [state, formAction] = useActionState(updateScheduleEntry, initialState);

  useEffect(() => {
    if (state.ok) {
      onCancel();
    }
  }, [onCancel, state.ok]);

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex min-w-[420px] gap-2">
        <input type="hidden" name="entryId" value={row.id} />
        <input type="hidden" name="year" value={row.year} />
        <input type="hidden" name="month" value={row.month} />
        <input type="hidden" name="version" value={row.version} />
        <input
          type="url"
          name="url"
          defaultValue={row.url}
          required
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <Button idleLabel="Guardar" pendingLabel="Guardando..." />
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-w-[88px] items-center justify-center rounded-md bg-neutral-200 px-3 py-1 text-xs font-semibold whitespace-nowrap text-neutral-700"
        >
          Cancelar
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

function DeleteScheduleForm({
  row,
  deleteScheduleEntry,
}: {
  row: ScheduleRow;
  deleteScheduleEntry: AdminHorariosManagerProps['deleteScheduleEntry'];
}) {
  const [state, formAction] = useActionState(deleteScheduleEntry, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const ok = window.confirm('¿Eliminar este horario?');
        if (!ok) event.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="entryId" value={row.id} />
      <Button idleLabel="Eliminar" pendingLabel="Eliminando..." tone="rose" />
      <Feedback state={state} />
    </form>
  );
}

export default function AdminHorariosManager({
  rows,
  totalRows,
  source,
  staticCount,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
  importStaticHorarios,
}: AdminHorariosManagerProps) {
  const isDatabaseSource = source === 'database';
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Nuevo horario</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Añade un PDF mensual sin tocar código. Si ese mes ya existe, se guardará como una
              nueva versión.
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

        <CreateScheduleForm createScheduleEntry={createScheduleEntry} />
      </section>

      {!isDatabaseSource && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900">Importar horarios actuales</h2>
          <p className="mt-1 text-sm text-amber-800">
            Ahora mismo la web está leyendo el catálogo legado del código. Importa esos{' '}
            {staticCount} registros a base de datos para poder editarlos desde este panel.
          </p>
          <ImportStaticForm importStaticHorarios={importStaticHorarios} />
        </section>
      )}

      <section className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-neutral-900">Horarios existentes</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {totalRows === 0
              ? 'Todavía no hay registros en base de datos.'
              : `Mostrando ${rows.length} de ${totalRows} registros.`}
          </p>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3">Mes</th>
              <th className="px-4 py-3">Versión</th>
              <th className="px-4 py-3">Enlace</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-sm text-neutral-500">
                  No hay horarios en la base de datos todavía.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100 align-top">
                  <td className="px-4 py-3 font-medium text-neutral-900">{row.year}</td>
                  <td className="px-4 py-3 text-neutral-700">{MONTH_LABELS[row.month]}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
                        v{row.version}
                      </span>
                      {row.isLatest ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Actual
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isDatabaseSource && editingId === row.id ? (
                      <UpdateScheduleForm
                        row={row}
                        updateScheduleEntry={updateScheduleEntry}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-2 text-[#1f4c57] underline underline-offset-2"
                      >
                        {row.url}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isDatabaseSource ? (
                      <div className="flex items-start gap-2">
                        {editingId === row.id ? null : (
                          <button
                            type="button"
                            onClick={() => setEditingId(row.id)}
                            className="inline-flex min-w-[88px] items-center justify-center rounded-md bg-neutral-900 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white"
                          >
                            Editar
                          </button>
                        )}
                        <DeleteScheduleForm
                          row={row}
                          deleteScheduleEntry={deleteScheduleEntry}
                        />
                      </div>
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
