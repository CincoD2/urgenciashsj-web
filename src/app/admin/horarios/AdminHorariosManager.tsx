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

function getUrlSummary(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'Enlace externo';
  }
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M18.437,20.948H5.563a2.372,2.372,0,0,1-2.5-2.21v-11a2.372,2.372,0,0,1,2.5-2.211h.462a.5.5,0,0,1,0,1H5.563a1.38,1.38,0,0,0-1.5,1.211v11a1.38,1.38,0,0,0,1.5,1.21H18.437a1.38,1.38,0,0,0,1.5-1.21v-11a1.38,1.38,0,0,0-1.5-1.211h-.462a.5.5,0,0,1,0-1h.462a2.372,2.372,0,0,1,2.5,2.211v11A2.372,2.372,0,0,1,18.437,20.948Z" />
      <path d="M15.355,10.592l-3,3a.5.5,0,0,1-.35.15.508.508,0,0,1-.36-.15l-3-3a.5.5,0,0,1,.71-.71l2.14,2.139V3.552a.508.508,0,0,1,.5-.5.5.5,0,0,1,.5.5v8.49l2.15-2.16a.5.5,0,0,1,.71.71Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M18.437,20.937H5.563a2.5,2.5,0,0,1-2.5-2.5V5.563a2.5,2.5,0,0,1,2.5-2.5H18.437a2.5,2.5,0,0,1,2.5,2.5V18.437A2.5,2.5,0,0,1,18.437,20.937ZM5.563,4.063a1.5,1.5,0,0,0-1.5,1.5V18.437a1.5,1.5,0,0,0,1.5,1.5H18.437a1.5,1.5,0,0,0,1.5-1.5V5.563a1.5,1.5,0,0,0-1.5-1.5Z" />
      <path d="M13.767,14.477a.5.5,0,0,0,.71-.71L12.707,12l1.77-1.77a.5.5,0,0,0-.71-.7L12,11.3l-1.77-1.77a.5.5,0,0,0-.7.7c.59.59,1.17,1.18,1.77,1.77l-1.77,1.77c-.46.45.25,1.16.7.71L12,12.707Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.04 3.02001L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96001C22.34 6.60001 22.98 5.02001 20.98 3.02001C18.98 1.02001 17.4 1.66001 16.04 3.02001Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.91 4.1499C15.58 6.5399 17.45 8.4099 19.85 9.0899"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  label,
  pendingLabel,
  icon,
  tone = 'dark',
}: {
  label: string;
  pendingLabel: string;
  icon: React.ReactNode;
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
      aria-label={pending ? pendingLabel : label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
    >
      {icon}
      <span className="sr-only">{pending ? pendingLabel : label}</span>
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
          <Button label="Añadir horario" pendingLabel="Guardando..." icon={<SaveIcon />} />
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
      <button
        type="submit"
        className="rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white"
      >
        Importar catálogo actual
      </button>
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
        <Button label="Guardar cambios" pendingLabel="Guardando..." icon={<SaveIcon />} />
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 px-3 items-center justify-center rounded-md bg-neutral-200 text-xs font-semibold whitespace-nowrap text-neutral-700"
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
      <Button
        label="Eliminar horario"
        pendingLabel="Eliminando..."
        tone="rose"
        icon={<DeleteIcon />}
      />
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

        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="w-[90px] px-4 py-3">Año</th>
              <th className="w-[120px] px-4 py-3">Mes</th>
              <th className="w-[120px] px-4 py-3">Versión</th>
              <th className="px-4 py-3">Enlace</th>
              <th className="w-[210px] px-4 py-3">Acciones</th>
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
                      <div className="space-y-1">
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-md border border-[#c9dadd] bg-[#f6f9fa] px-3 py-1 text-xs font-semibold text-[#1f4c57] transition hover:border-[#1f4c57]/40 hover:bg-[#e7f0f2]"
                        >
                          Abrir PDF
                        </a>
                        <p className="truncate text-xs text-neutral-500">
                          {getUrlSummary(row.url)}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isDatabaseSource ? (
                      <div className="flex items-start gap-2">
                        {editingId === row.id ? null : (
                          <button
                            type="button"
                            onClick={() => setEditingId(row.id)}
                            aria-label="Editar horario"
                            title="Editar horario"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-neutral-900 text-white"
                          >
                            <EditIcon />
                            <span className="sr-only">Editar horario</span>
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
