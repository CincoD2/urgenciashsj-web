'use client';

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';
import {
  determineContingencyPhase,
  getContingencyTotals,
  type ContingencyState,
} from '@/clinical/contingenciaCamas';

const initialState: ContingencyState = {
  pendingLevel2: 0,
  occupiedLevel2: 0,
  pendingObservation: 0,
  occupiedObservation: 0,
  polyvalent: 0,
  ordinaryHours: true,
  forecastUnfavourable: false,
  bedsUnavailable: false,
  pendingDischarges: false,
  phase2Implemented: false,
  persistentBlock: false,
  noImmediateCapacity: false,
};

function BedIcon({ color, label }: { color: string; label: string }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7 sm:h-9 sm:w-9"
      aria-label={label}
      role="img"
    >
      <path
        d="M28 8C28 10.2091 26.2091 12 24 12C21.7909 12 20 10.2091 20 8C20 5.79086 21.7909 4 24 4C26.2091 4 28 5.79086 28 8Z"
        fill={color}
      />
      <path
        d="M18 18.8206C17.7833 19.3328 17.5909 20.0103 17.4363 20.815C17.0295 22.9313 17 25.273 17 26C17 27.1046 16.1046 28 15 28C13.8954 28 13 27.1046 13 26C13 25.227 13.026 22.5687 13.5082 20.06C13.7458 18.8236 14.1243 17.4534 14.773 16.3428C15.4241 15.2281 16.595 14 18.4444 14H29.5556C31.405 14 32.5759 15.2281 33.227 16.3428C33.8757 17.4534 34.2542 18.8236 34.4918 20.06C34.974 22.5687 35 25.227 35 26C35 27.1046 34.1046 28 33 28C31.8954 28 31 27.1046 31 26C31 25.273 30.9705 22.9313 30.5637 20.815C30.4091 20.0103 30.2167 19.3328 30 18.8206V42C30 43.0747 29.1507 43.9573 28.0768 43.9985C27.0028 44.0398 26.0883 43.2249 26.0059 42.1534L25.0059 29.1534C25.002 29.1022 25 29.051 25 29H23C23 29.051 22.998 29.1022 22.998 29.1534L21.9941 42.1534C21.9117 43.2249 20.9972 44.0398 19.9232 43.9985C18.8493 43.9573 18 43.0747 18 42V18.8206Z"
        fill={color}
      />
    </svg>
  );
}

function OccupancyGraphic({
  pendingLevel2,
  occupiedLevel2,
  pendingObservation,
  occupiedObservation,
}: Pick<
  ContingencyState,
  'pendingLevel2' | 'occupiedLevel2' | 'pendingObservation' | 'occupiedObservation'
>) {
  const level2 = pendingLevel2 + occupiedLevel2;
  const observation = pendingObservation + occupiedObservation;
  const totalOccupied = level2 + observation;
  const renderBeds = (
    total: number,
    occupied: number,
    occupiedColor: string,
    occupiedLabel: string
  ) =>
    Array.from({ length: total }, (_, index) => (
      <span
        key={index}
        className="-mx-1.5 inline-flex shrink-0 sm:-mx-2"
        title={index < occupied ? occupiedLabel : 'Cama libre'}
      >
        <BedIcon
          color={index < occupied ? occupiedColor : '#cbd5e1'}
          label={index < occupied ? occupiedLabel : 'Cama libre'}
        />
      </span>
    ));
  const percentage = (value: number, total: number) =>
    `${Math.round((value / total) * 1000) / 10}%`;

  return (
    <div
      className="mt-6 rounded-xl border border-[#dfe9eb] bg-slate-50/70 p-4"
      aria-label="Gráfico de ocupación por número de pacientes"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-[#2b5d68]">
          Ocupación por pacientes · {totalOccupied}/39 ({Math.round((totalOccupied / 39) * 1000) / 10}%)
        </h3>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#8f1717]" />
            Pendiente de ingreso
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ef9a9a]" />
            Ocupada urgencias
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#cbd5e1]" />
            Libre
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start">
          <div>
            <strong className="text-sm text-slate-700">Observación</strong>
            <span className="mt-1 block text-xs text-slate-600">
              {observation}/21 ({percentage(observation, 21)})
            </span>
          </div>
          <div>
            <div className="flex min-w-0 flex-nowrap gap-0 overflow-hidden">
              {renderBeds(
                pendingObservation,
                pendingObservation,
                '#8f1717',
                'Paciente pendiente de ingreso'
              )}
              {renderBeds(
                occupiedObservation,
                occupiedObservation,
                '#ef9a9a',
                'Paciente en Observación'
              )}
              {renderBeds(21 - observation, 0, '#cbd5e1', 'Cama libre de Observación')}
            </div>
          </div>
        </div>
        <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start">
          <div>
            <strong className="text-sm text-slate-700">Nivel 2</strong>
            <span className="mt-1 block text-xs text-slate-600">
              {level2}/18 ({percentage(level2, 18)})
            </span>
          </div>
          <div>
            <div className="flex min-w-0 flex-nowrap gap-0 overflow-hidden">
              {renderBeds(pendingLevel2, pendingLevel2, '#8f1717', 'Paciente pendiente de ingreso')}
              {renderBeds(occupiedLevel2, occupiedLevel2, '#ef9a9a', 'Cama ocupada de Nivel 2')}
              {renderBeds(18 - level2, 0, '#cbd5e1', 'Cama libre de Nivel 2')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContingenciaCamasApp() {
  const [state, setState] = useState(initialState);
  const result = useMemo(() => determineContingencyPhase(state), [state]);
  const totals = getContingencyTotals(state);
  const setNumber = (
    field: keyof Pick<
      ContingencyState,
      | 'pendingLevel2'
      | 'occupiedLevel2'
      | 'pendingObservation'
      | 'occupiedObservation'
      | 'polyvalent'
    >,
    value: string
  ) =>
    setState((current) => {
      if (field === 'polyvalent') {
        return { ...current, polyvalent: Math.min(4, Math.max(0, Number(value) || 0)) };
      }

      const isLevel2 = field === 'pendingLevel2' || field === 'occupiedLevel2';
      const capacity = isLevel2 ? 18 : 21;
      const nextValue = Math.min(capacity, Math.max(0, Number(value) || 0));
      const otherField =
        field === 'pendingLevel2'
          ? 'occupiedLevel2'
          : field === 'occupiedLevel2'
            ? 'pendingLevel2'
            : field === 'pendingObservation'
              ? 'occupiedObservation'
              : 'pendingObservation';
      const currentOtherValue = current[otherField];
      const currentValue = current[field];
      const currentTotal = currentValue + currentOtherValue;
      let nextOtherValue = currentOtherValue;

      if (nextValue > currentValue) {
        if (currentTotal >= capacity) {
          nextOtherValue = capacity - nextValue;
        } else {
          const overflow = Math.max(0, nextValue + currentOtherValue - capacity);
          nextOtherValue = Math.max(0, currentOtherValue - overflow);
        }
      }

      return { ...current, [field]: nextValue, [otherField]: nextOtherValue };
    });
  const phaseTone = [
    'bg-[#e8f4f6] text-[#275966]',
    'bg-[#fff5e7] text-[#7b4e1d]',
    'bg-[#fff2e8] text-[#8a4b26]',
    'bg-[#faedf1] text-[#7d3045]',
    'bg-[#7d3045] text-white',
  ][result.phase];

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <div>
        <h1 className="text-2xl font-semibold">Contingencia camas urgencias</h1>
        <p className="mt-2 text-sm text-slate-600">
          Asistente orientativo basado en el PLAN-HOSP-01 ante la falta de camas de hospitalización.
        </p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Importante:</strong> el resultado es orientativo, usa criterios acumulativos y debe
        ser validado por los responsables del plan. La activación no depende exclusivamente de la
        ocupación.
      </div>
      <section className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#2b5d68]">Situación asistencial</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <fieldset className="rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-[#2b5d68]">Nivel 2</legend>
            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">
                Pendientes de ingreso
                <input
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  type="number"
                  min="0"
              max={18}
                  value={state.pendingLevel2}
                  onChange={(e) => setNumber('pendingLevel2', e.target.value)}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Ocupadas Urgencias
                <input
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  type="number"
                  min="0"
              max={18}
                  value={state.occupiedLevel2}
                  onChange={(e) => setNumber('occupiedLevel2', e.target.value)}
                />
              </label>
              <p className="text-xs text-slate-500">
                Total Nivel 2: {totals.level2}/18 ({Math.round((totals.level2 / 18) * 1000) / 10}%)
              </p>
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-[#2b5d68]">Observación</legend>
            <div className="grid gap-3">
              <label className="text-sm font-medium text-slate-700">
                Pendientes de ingreso
                <input
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  type="number"
                  min="0"
              max={21}
                  value={state.pendingObservation}
                  onChange={(e) => setNumber('pendingObservation', e.target.value)}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Ocupadas Urgencias
                <input
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                  type="number"
                  min="0"
              max={21}
                  value={state.occupiedObservation}
                  onChange={(e) => setNumber('occupiedObservation', e.target.value)}
                />
              </label>
              <p className="text-xs text-slate-500">
                Total Observación: {totals.observation}/21 (
                {Math.round((totals.observation / 21) * 1000) / 10}%)
              </p>
            </div>
          </fieldset>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Área polivalente ocupada
            <input
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              type="number"
              min="0"
              max="4"
              value={state.polyvalent}
              onChange={(e) => setNumber('polyvalent', e.target.value)}
            />
            <span className="mt-1 block text-xs text-slate-500">
              {state.polyvalent}/4 ({Math.round((state.polyvalent / 4) * 1000) / 10}%)
            </span>
          </label>
        </div>
        <label className="mt-5 block text-sm font-medium text-slate-700">
          Momento organizativo
          <select
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            value={state.ordinaryHours ? 'ordinary' : 'out'}
            onChange={(e) =>
              setState((s) => ({ ...s, ordinaryHours: e.target.value === 'ordinary' }))
            }
          >
            <option value="ordinary">Horario ordinario</option>
            <option value="out">Tarde / noche / fin de semana / festivo</option>
          </select>
        </label>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(
            [
              [
                'forecastUnfavourable',
                'La previsión inmediata de ingresos es desfavorable / justifica activación anticipada.',
              ],
              [
                'bedsUnavailable',
                'La disponibilidad real de camas de hospitalización es insuficiente.',
              ],
              ['pendingDischarges', 'Existen altas hospitalarias pendientes relevantes.'],
              ['phase2Implemented', 'La Fase 2 está plenamente implantada.'],
              ['persistentBlock', 'Persiste el bloqueo pese a la aplicación de las fases previas.'],
              [
                'noImmediateCapacity',
                'No existe capacidad inmediata para absorber los ingresos pendientes.',
              ],
            ] as const
          ).map(([field, label]) => (
            <label
              key={field}
              className="flex gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={state[field]}
                onChange={(e) => setState((s) => ({ ...s, [field]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
        <OccupancyGraphic
          pendingLevel2={state.pendingLevel2}
          occupiedLevel2={state.occupiedLevel2}
          pendingObservation={state.pendingObservation}
          occupiedObservation={state.occupiedObservation}
        />
        <button
          type="button"
          className="mt-5 rounded-lg border border-[#3d7684] px-4 py-2 text-sm font-semibold text-[#2b5d68]"
          onClick={() => setState(initialState)}
        >
          Reiniciar
        </button>
      </section>
      <section className="space-y-5 rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#2b5d68]">Resultado</h2>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${phaseTone}`}>
            {result.anticipatedActivation
              ? `Posible activación anticipada de Fase ${result.phase}`
              : `Fase ${result.phase}`}
          </span>
        </div>
        <h3 className="text-xl font-semibold">
          Fase {result.phase} · {result.phaseName}
        </h3>
        <p className="text-sm text-slate-600">
          Nivel 2 {totals.level2}/18 ({Math.round((totals.level2 / 18) * 1000) / 10}%), Observación{' '}
          {totals.observation}/21 ({Math.round((totals.observation / 21) * 1000) / 10}%), área
          polivalente {state.polyvalent}/4 y {totals.pendingAdmissions} pendiente(s) de ingreso.
        </p>
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <strong>Justificación:</strong> {result.rationale}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <h4 className="font-semibold">Criterios cumplidos</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {result.criteriaMet.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Criterios pendientes</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {result.criteriaMissing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h4 className="font-semibold">Actuaciones</h4>
          <div className="mt-2 divide-y rounded-lg border border-slate-200">
            {result.actions.map((action) => (
              <div
                key={action.text}
                className="grid gap-1 p-3 text-sm sm:grid-cols-[1fr_auto] sm:gap-4"
              >
                <span>{action.text}</span>
                <span className="font-semibold text-[#3d7684]">{action.responsible}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 rounded-lg border border-[#dfe9eb] p-4 text-sm md:grid-cols-3">
          <div>
            <strong>Activación y dirección</strong>
            <p>{result.responsibilities.activation}</p>
          </div>
          <div>
            <strong>Gestión de camas</strong>
            <p>{result.responsibilities.beds}</p>
          </div>
          <div>
            <strong>Comunicación</strong>
            <p>{result.responsibilities.communication}</p>
          </div>
        </div>
        <InformeCopiable texto={result.reportText} />
      </section>
    </main>
  );
}
