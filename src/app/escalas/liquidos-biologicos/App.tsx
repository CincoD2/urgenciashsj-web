'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';

import {
  PROCEDURE_INFO,
  createDefaultBiologicalFluidInputs,
  evaluateBiologicalFluidProcedure,
  type ArthrocentesisInput,
  type BiologicalFluidInputs,
  type LumbarPunctureInput,
  type ParacentesisInput,
  type ProcedureId,
  type ThoracentesisInput,
} from '@/clinical/biologicalFluids';

import CopyableReport from './components/CopyableReport';

const RUNYON_TOOLTIP_CONTENT = (
  <>
    Proteínas totales {`>`} 1 g/dl, glucosa {`<`} 50 mg/dl y LDH en líquido ascítico por
    encima del límite alto sérico normal. Si se cumplen 2 o más, sospechar peritonitis
    bacteriana secundaria.
  </>
);

function InfoTooltip({
  label,
  content,
  tone = 'default',
}: {
  label: ReactNode;
  content: ReactNode;
  tone?: 'default' | 'muted';
}) {
  const textTone = tone === 'muted' ? 'text-slate-500' : 'text-slate-700';
  const badgeTone =
    tone === 'muted'
      ? 'border-slate-300 bg-white text-slate-600'
      : 'border-sky-200 bg-sky-50 text-sky-700';

  return (
    <span
      tabIndex={0}
      className={`group/tooltip relative inline-flex max-w-full cursor-help items-center gap-1.5 align-top outline-none ${textTone}`}
    >
      <span className="underline decoration-dotted decoration-2 underline-offset-2">{label}</span>
      <span
        aria-hidden="true"
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${badgeTone}`}
      >
        i
      </span>
      <span className="pointer-events-none invisible absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-200 bg-white p-3 text-xs font-normal leading-5 text-slate-700 opacity-0 shadow-lg transition duration-150 group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-visible/tooltip:visible group-focus-visible/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100">
        {content}
      </span>
    </span>
  );
}

function RunyonHelp() {
  return <InfoTooltip label="Criterios de Runyon" content={RUNYON_TOOLTIP_CONTENT} />;
}

function RunyonHint() {
  return (
    <InfoTooltip
      label="Necesario para aplicar con precisión los criterios de Runyon."
      content={RUNYON_TOOLTIP_CONTENT}
      tone="muted"
    />
  );
}

const PARACENTESIS_REFERENCE_ROWS: ReactNode[][] = [
  ['Recuento celular del LA', 'Valorar idealmente en la primera hora tras la paracentesis.'],
  ['PMN >= 250/mm³', 'Pensar primero en infección peritoneal.'],
  ['GASA = albúmina sérica - albúmina ascítica', 'Gradiente seroascítico de albúmina.'],
  [
    <RunyonHelp key="runyon-hover" />,
    'Si se cumplen 2 o más, sospechar peritonitis bacteriana secundaria.',
  ],
  ['GASA >= 1,1', 'Orienta a ascitis por hipertensión portal.'],
  ['GASA < 1,1', 'Orienta a ascitis no portal; ampliar etiología según contexto.'],
  ['Amilasa > 100 UI/l', 'Ascitis pancreática.'],
  ['Lechoso', 'Purulenta o quilosa; triglicéridos >= 200 mg/dl apoyan ascitis quilosa.'],
  ['Hemático', 'Corregir 1 leucocito/750 hematíes y 1 PMN/250 hematíes.'],
];

const ARTHROCENTESIS_REFERENCE_ROWS = [
  ['Viscosidad', 'Alta', 'Alta', 'Baja', 'Variable', 'Variable'],
  ['Claridad', 'Transparente', 'Transparente', 'Translúcido', 'Opaco', 'Sanguinolento'],
  ['Color', 'Claro', 'Amarillento', 'Amarillo intenso', 'Purulento', 'Rojo'],
  ['Leucocitos/mm³', '< 200', '50-1.000', '1.000-75.000', '> 100.000', '200-2.000'],
  ['Cultivo', 'Negativo', 'Negativo', 'Negativo', 'Positivo', 'Negativo'],
];

const LP_REFERENCE_ROWS = [
  ['Presión apertura', 'Normal (< 20)', 'Elevada', 'Normal o elevada', 'Elevada'],
  ['Aspecto', 'Claro', 'Turbio', 'Claro', 'Claro o turbio'],
  ['Leucocitos/mm³', '< 5', '1.000-5.000', '5-1.000', '50-500'],
  ['Celularidad', 'MN', 'PMN', 'MN', 'Variable (habitualmente MN)'],
  ['Glucorraquia (% glucemia)', '60-80', '< 40', '> 60', '< 60'],
  ['Proteinorraquia (mg/dl)', '30-50', 'Variable, normalmente > 100', 'Normal o discretamente elevada', '50-300'],
  ['Lactato LCR (mmol/l)', 'Habitualmente <= 4,2', '> 4,2 apoya bacteriana', 'Suele no elevarse', 'Variable'],
  ['PL traumática', 'Corregir si hay hematíes', 'Restar 1 leucocito/700-1.000 hematíes y 1 mg/dl proteínas/1.000 hematíes', 'Valorar corrección', 'Valorar corrección'],
];

const THORACENTESIS_REFERENCE_ROWS = [
  ['Proteínas en líquido pleural / proteínas séricas', '> 0,5', 'Exudado si positivo'],
  ['LDH pleural / LDH sérica', '> 0,6', 'Exudado si positivo'],
  ['LDH pleural', '> 2/3 del límite alto sérico normal', 'Exudado si positivo'],
  ['Gradiente albúmina sérica - pleural', '> 1,2 g/dl', 'Sugiere falso exudado cardíaco'],
  ['Albúmina pleural / sérica', '> 0,67', 'Sugiere falso exudado hepático'],
];

const PROCEDURE_SELECTOR_ITEMS: Array<{
  id: ProcedureId;
  label: string;
  imageSrc?: string;
  imageAlt?: string;
}> = [
  {
    id: 'paracentesis',
    label: 'Paracentesis',
    imageSrc: '/img/codsepsis/abd.svg',
    imageAlt: 'Paracentesis',
  },
  {
    id: 'artrocentesis',
    label: 'Artrocentesis',
  },
  {
    id: 'puncion-lumbar',
    label: 'Punción Lumbar',
    imageSrc: '/img/codsepsis/snc.svg',
    imageAlt: 'Punción lumbar',
  },
  {
    id: 'toracocentesis',
    label: 'Toracocentesis',
    imageSrc: '/img/codsepsis/resp.svg',
    imageAlt: 'Toracocentesis',
  },
];

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function shouldShowCopyableReport(title: string, label: string) {
  if (label === 'Datos incompletos' || label === 'Baja probabilidad') return false;
  return title !== 'Orientación insuficiente';
}

function calculateAlbuminReplacement(litersDrained: number | null) {
  if (litersDrained === null || !Number.isFinite(litersDrained) || litersDrained <= 0) return null;

  const grams = litersDrained * 8;
  const vials20 = grams / 10;
  const ml20 = vials20 * 50;

  return { grams, vials20, ml20 };
}

function formatCompactNumber(value: number, digits = 1) {
  return value.toFixed(digits).replace(/\.0$/u, '');
}

function ArthrocentesisIcon({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 4C20.5523 4 21 4.44772 21 5V13.3431C21 14.6692 20.4732 15.941 19.5355 16.8787L19.0317 17.3826C18.1384 18.2758 18.1384 19.7242 19.0317 20.6174C19.7279 21.3136 20.7914 21.4862 21.6721 21.0459L21.9145 20.9247C23.2273 20.2683 24.7727 20.2683 26.0855 20.9247L26.3279 21.0459C27.2086 21.4862 28.2721 21.3136 28.9683 20.6174C29.8616 19.7242 29.8616 18.2758 28.9683 17.3826L28.4645 16.8787C27.5268 15.941 27 14.6692 27 13.3431V5C27 4.44772 27.4477 4 28 4C28.5523 4 29 4.44772 29 5V6.70355C36.5086 8.87023 42 15.7938 42 24C42 32.2062 36.5086 39.1298 29 41.2965V43C29 43.5523 28.5523 44 28 44C27.4477 44 27 43.5523 27 43V34.6569C27 33.3308 27.5268 32.059 28.4645 31.1213L28.9683 30.6174C29.8616 29.7242 29.8616 28.2758 28.9683 27.3826C28.2721 26.6864 27.2086 26.5138 26.3279 26.9541L26.0855 27.0753C24.7727 27.7317 23.2273 27.7317 21.9145 27.0753L21.6721 26.9541C20.7914 26.5138 19.7279 26.6864 19.0317 27.3826C18.1384 28.2758 18.1384 29.7242 19.0317 30.6174L19.5355 31.1213C20.4732 32.059 21 33.3308 21 34.6569V43C21 43.5523 20.5523 44 20 44C19.4477 44 19 43.5523 19 43V41.2965C11.4914 39.1298 6 32.2062 6 24C6 15.7938 11.4914 8.87023 19 6.70355V5C19 4.44772 19.4477 4 20 4ZM19 8.79677C12.6121 10.8964 8 16.9096 8 24C8 31.0905 12.6121 37.1037 19 39.2033V34.6569C19 33.8612 18.6839 33.0981 18.1213 32.5355L17.6174 32.0317C15.9431 30.3573 15.9431 27.6427 17.6174 25.9683C18.9224 24.6634 20.9159 24.3399 22.5665 25.1652L22.8089 25.2864C23.5587 25.6613 24.4413 25.6613 25.1911 25.2864L25.4335 25.1652C27.0841 24.3399 29.0776 24.6634 30.3826 25.9683C32.0569 27.6427 32.0569 30.3573 30.3826 32.0317L29.8787 32.5355C29.3161 33.0981 29 33.8612 29 34.6569V39.2033C35.3879 37.1037 40 31.0905 40 24C40 16.9096 35.3879 10.8964 29 8.79677V13.3431C29 14.1388 29.3161 14.9019 29.8787 15.4645L30.3826 15.9683C32.0569 17.6427 32.0569 20.3573 30.3826 22.0317C29.0776 23.3366 27.0841 23.6601 25.4335 22.8348L25.1911 22.7136C24.4413 22.3387 23.5587 22.3387 22.8089 22.7136L22.5665 22.8348C20.9159 23.6601 18.9224 23.3366 17.6174 22.0317C15.9431 20.3573 15.9431 17.6427 17.6174 15.9683L18.1213 15.4645C18.6839 14.9019 19 14.1388 19 13.3431V8.79677Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = '0.1',
  min,
  hint,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step?: string;
  min?: string;
  hint?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(event) => onChange(parseNumber(event.target.value))}
        step={step}
        min={min}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
      {hint ? <div className="mt-1 text-xs leading-5 text-slate-500">{hint}</div> : null}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <span className="flex min-h-[50px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        <span>{checked ? 'Sí' : 'No'}</span>
      </span>
      {hint ? <div className="mt-1 text-xs leading-5 text-slate-500">{hint}</div> : null}
    </label>
  );
}

function ReferenceTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-slate-200">
      <table className="w-full border-collapse text-sm text-slate-800">
        <thead className="bg-slate-100 text-slate-900">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border border-slate-200 px-4 py-3 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${row[0]}-${cellIndex}`}
                  className={`border border-slate-200 px-4 py-3 align-top ${cellIndex === 0 ? 'font-medium text-slate-900' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function updateParacentesis(
  current: BiologicalFluidInputs,
  key: keyof ParacentesisInput,
  nextValue: ParacentesisInput[keyof ParacentesisInput]
) {
  return {
    ...current,
    paracentesis: {
      ...current.paracentesis,
      [key]: nextValue,
    },
  };
}

function updateArthrocentesis(
  current: BiologicalFluidInputs,
  key: keyof ArthrocentesisInput,
  nextValue: ArthrocentesisInput[keyof ArthrocentesisInput]
) {
  return {
    ...current,
    artrocentesis: {
      ...current.artrocentesis,
      [key]: nextValue,
    },
  };
}

function updateLumbarPuncture(
  current: BiologicalFluidInputs,
  key: keyof LumbarPunctureInput,
  nextValue: LumbarPunctureInput[keyof LumbarPunctureInput]
) {
  return {
    ...current,
    'puncion-lumbar': {
      ...current['puncion-lumbar'],
      [key]: nextValue,
    },
  };
}

function updateThoracentesis(
  current: BiologicalFluidInputs,
  key: keyof ThoracentesisInput,
  nextValue: ThoracentesisInput[keyof ThoracentesisInput]
) {
  return {
    ...current,
    toracocentesis: {
      ...current.toracocentesis,
      [key]: nextValue,
    },
  };
}

function resetProcedureInputs(current: BiologicalFluidInputs, procedure: ProcedureId) {
  const defaults = createDefaultBiologicalFluidInputs();

  return {
    ...current,
    [procedure]: defaults[procedure],
  };
}

function ProcedureDetails({ procedure }: { procedure: ProcedureId }) {
  const info = PROCEDURE_INFO.find((item) => item.id === procedure);
  if (!info) return null;

  return (
    <SectionCard title={info.title} subtitle={info.description}>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Indicaciones
          </div>
          <ul className="mt-2 space-y-1.5 text-sm leading-5 text-slate-700">
            {info.indications.map((item) => (
              <li key={item} className="rounded-xl bg-white/65 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/75 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-800">
            Contraindicaciones
          </div>
          <ul className="mt-2 space-y-1.5 text-sm leading-5 text-slate-700">
            {info.contraindications.map((item) => (
              <li key={item} className="rounded-xl bg-white/70 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {info.extraCards?.length ? (
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {info.extraCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
            >
              <div className="text-sm font-semibold text-slate-900">{card.title}</div>
              {card.description ? (
                <p className="mt-1 text-sm leading-5 text-slate-600">{card.description}</p>
              ) : null}
              {card.indications?.length ? (
                <div className="mt-2 space-y-1.5 text-sm leading-5 text-slate-700">
                  {card.indications.map((item) => (
                    <div key={item} className="rounded-xl bg-emerald-50/80 px-3 py-2">
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}
              {card.contraindications?.length ? (
                <div className="mt-2 space-y-1.5 text-sm leading-5 text-slate-700">
                  {card.contraindications.map((item) => (
                    <div key={item} className="rounded-xl bg-rose-50/80 px-3 py-2">
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}

function ProcedureForm({
  procedure,
  inputs,
  setInputs,
}: {
  procedure: ProcedureId;
  inputs: BiologicalFluidInputs;
  setInputs: (value: BiologicalFluidInputs) => void;
}) {
  if (procedure === 'paracentesis') {
    const value = inputs.paracentesis;
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SelectField
          label="Aspecto macroscópico"
          value={value.appearance}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'appearance', nextValue))}
          options={[
            { value: 'clear', label: 'Amarillo claro / cristalino' },
            { value: 'hematic', label: 'Hemático' },
            { value: 'milky', label: 'Lechoso' },
            { value: 'brown', label: 'Marronáceo' },
            { value: 'other', label: 'Otro / no filiado' },
          ]}
        />
        <NumberField
          label="Leucocitos totales en líquido ascítico (/mm³)"
          value={value.totalLeukocytes}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'totalLeukocytes', nextValue))}
          step="1"
          min="0"
        />
        <NumberField
          label="PMN en líquido ascítico (/mm³)"
          value={value.pmn}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'pmn', nextValue))}
          step="1"
          min="0"
        />
        <SelectField
          label="Celularidad predominante"
          value={value.mononuclearPredominance ? 'mn' : 'pmn'}
          onChange={(nextValue) =>
            setInputs(updateParacentesis(inputs, 'mononuclearPredominance', nextValue === 'mn'))
          }
          options={[
            { value: 'pmn', label: 'PMN' },
            { value: 'mn', label: 'Mononuclear' },
          ]}
        />
        <NumberField
          label="Hematíes en líquido ascítico (/mm³)"
          value={value.rbc}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'rbc', nextValue))}
          step="1"
          min="0"
          hint="Si es hemática y >10.000/mm³, se corrigen los PMN automáticamente."
        />
        <NumberField
          label="Albúmina sérica (g/dl)"
          value={value.serumAlbumin}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'serumAlbumin', nextValue))}
          hint="Necesaria para calcular el GASA."
        />
        <NumberField
          label="Albúmina ascítica (g/dl)"
          value={value.asciticAlbumin}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'asciticAlbumin', nextValue))}
          hint="GASA = albúmina sérica - albúmina ascítica."
        />
        <NumberField
          label="Glucosa en líquido ascítico (mg/dl)"
          value={value.glucose}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'glucose', nextValue))}
          step="1"
          hint="Útil para sospechar peritonitis bacteriana secundaria si es < 50 mg/dl."
        />
        <NumberField
          label="LDH en líquido ascítico (UI/l)"
          value={value.ldh}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'ldh', nextValue))}
          step="1"
          hint="Útil para sospechar peritonitis bacteriana secundaria si supera el límite alto sérico normal."
        />
        <NumberField
          label="Límite alto normal de LDH sérica (UI/l)"
          value={value.serumLdhUpperLimit}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'serumLdhUpperLimit', nextValue))}
          step="1"
          hint={<RunyonHint />}
        />
        <NumberField
          label="Amilasa en líquido ascítico (UI/l)"
          value={value.amylase}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'amylase', nextValue))}
          step="1"
          hint="Ayuda a sospechar ascitis pancreática si es > 100 UI/l."
        />
        <NumberField
          label="Litros evacuados"
          value={value.litersDrained}
          onChange={(nextValue) => setInputs(updateParacentesis(inputs, 'litersDrained', nextValue))}
          step="0.1"
          min="0"
          hint="Para calcular la reposición con albúmina tras la paracentesis."
        />
      </div>
    );
  }

  if (procedure === 'artrocentesis') {
    const value = inputs.artrocentesis;
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SelectField
          label="Viscosidad"
          value={value.viscosity}
          onChange={(nextValue) => setInputs(updateArthrocentesis(inputs, 'viscosity', nextValue))}
          options={[
            { value: 'high', label: 'Alta' },
            { value: 'low', label: 'Baja' },
            { value: 'variable', label: 'Variable' },
          ]}
        />
        <SelectField
          label="Claridad"
          value={value.clarity}
          onChange={(nextValue) => setInputs(updateArthrocentesis(inputs, 'clarity', nextValue))}
          options={[
            { value: 'transparent', label: 'Transparente' },
            { value: 'translucent', label: 'Translúcido' },
            { value: 'opaque', label: 'Opaco' },
            { value: 'bloody', label: 'Sanguinolento' },
          ]}
        />
        <SelectField
          label="Color"
          value={value.color}
          onChange={(nextValue) => setInputs(updateArthrocentesis(inputs, 'color', nextValue))}
          options={[
            { value: 'clear', label: 'Claro' },
            { value: 'yellowish', label: 'Amarillento' },
            { value: 'intense-yellow', label: 'Amarillo intenso' },
            { value: 'purulent', label: 'Purulento' },
            { value: 'red', label: 'Rojo' },
          ]}
        />
        <NumberField
          label="Leucocitos (/mm³)"
          value={value.leukocytes}
          onChange={(nextValue) => setInputs(updateArthrocentesis(inputs, 'leukocytes', nextValue))}
          step="1"
          min="0"
        />
        <SelectField
          label="Cristales"
          value={value.crystals}
          onChange={(nextValue) => setInputs(updateArthrocentesis(inputs, 'crystals', nextValue))}
          options={[
            { value: 'none', label: 'No identificados' },
            { value: 'urate', label: 'Urato monosódico' },
            { value: 'cppd', label: 'Pirofosfato cálcico' },
            { value: 'hydroxyapatite', label: 'Hidroxiapatita' },
          ]}
        />
        <CheckboxField
          label="Cultivo positivo"
          checked={value.culturePositive}
          onChange={(nextValue) => setInputs(updateArthrocentesis(inputs, 'culturePositive', nextValue))}
        />
      </div>
    );
  }

  if (procedure === 'puncion-lumbar') {
    const value = inputs['puncion-lumbar'];
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SelectField
          label="Presión de apertura"
          value={value.openingPressure}
          onChange={(nextValue) => setInputs(updateLumbarPuncture(inputs, 'openingPressure', nextValue))}
          options={[
            { value: 'high', label: 'Alta' },
            { value: 'normal', label: 'Normal (< 20 cmH2O)' },
            { value: 'indeterminate', label: 'Indeterminada' },
          ]}
        />
        <SelectField
          label="Aspecto"
          value={value.aspect}
          onChange={(nextValue) => setInputs(updateLumbarPuncture(inputs, 'aspect', nextValue))}
          options={[
            { value: 'clear', label: 'Claro' },
            { value: 'turbid', label: 'Turbio' },
          ]}
        />
        <NumberField
          label="Leucocitos (/mm³)"
          value={value.leukocytes}
          onChange={(nextValue) => setInputs(updateLumbarPuncture(inputs, 'leukocytes', nextValue))}
          step="1"
          min="0"
        />
        <NumberField
          label="Hematíes en LCR (/mm³)"
          value={value.rbc}
          onChange={(nextValue) => setInputs(updateLumbarPuncture(inputs, 'rbc', nextValue))}
          step="1"
          min="0"
          hint="Si la PL es traumática, se corrigen automáticamente leucocitos y proteinorraquia."
        />
        <SelectField
          label="Celularidad predominante"
          value={value.predominantCellularity}
          onChange={(nextValue) => setInputs(updateLumbarPuncture(inputs, 'predominantCellularity', nextValue))}
          options={[
            { value: 'mn', label: 'Mononuclear' },
            { value: 'pmn', label: 'PMN' },
            { value: 'variable', label: 'Variable' },
          ]}
        />
        <NumberField
          label="Glucorraquia (% de glucemia)"
          value={value.glucosePercent}
          onChange={(nextValue) => setInputs(updateLumbarPuncture(inputs, 'glucosePercent', nextValue))}
          step="1"
          min="0"
        />
        <NumberField
          label="Proteinorraquia (mg/dl)"
          value={value.proteins}
          onChange={(nextValue) => setInputs(updateLumbarPuncture(inputs, 'proteins', nextValue))}
          step="1"
          min="0"
        />
        <NumberField
          label="Lactato en LCR (mmol/l)"
          value={value.lactate}
          onChange={(nextValue) => setInputs(updateLumbarPuncture(inputs, 'lactate', nextValue))}
          step="0.1"
          min="0"
          hint="Un valor > 4,2 mmol/l apoya meningitis bacteriana frente a vírica, con limitaciones si hubo antibióticos previos, convulsiones o encefalitis herpética."
        />
      </div>
    );
  }

  const value = inputs.toracocentesis;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <NumberField
        label="Proteínas pleurales (g/dl)"
        value={value.pleuralProteins}
        onChange={(nextValue) => setInputs(updateThoracentesis(inputs, 'pleuralProteins', nextValue))}
      />
      <NumberField
        label="Proteínas séricas (g/dl)"
        value={value.serumProteins}
        onChange={(nextValue) => setInputs(updateThoracentesis(inputs, 'serumProteins', nextValue))}
      />
      <NumberField
        label="LDH pleural (UI/l)"
        value={value.pleuralLdh}
        onChange={(nextValue) => setInputs(updateThoracentesis(inputs, 'pleuralLdh', nextValue))}
        step="1"
      />
      <NumberField
        label="LDH sérica (UI/l)"
        value={value.serumLdh}
        onChange={(nextValue) => setInputs(updateThoracentesis(inputs, 'serumLdh', nextValue))}
        step="1"
      />
      <NumberField
        label="Límite alto LDH sérica normal (UI/l)"
        value={value.serumLdhUpperLimit}
        onChange={(nextValue) => setInputs(updateThoracentesis(inputs, 'serumLdhUpperLimit', nextValue))}
        step="1"
      />
      <NumberField
        label="Albúmina pleural (g/dl)"
        value={value.pleuralAlbumin}
        onChange={(nextValue) => setInputs(updateThoracentesis(inputs, 'pleuralAlbumin', nextValue))}
      />
      <NumberField
        label="Albúmina sérica (g/dl)"
        value={value.serumAlbumin}
        onChange={(nextValue) => setInputs(updateThoracentesis(inputs, 'serumAlbumin', nextValue))}
      />
    </div>
  );
}

function ProcedureReference({ procedure }: { procedure: ProcedureId }) {
  if (procedure === 'paracentesis') {
    return (
      <SectionCard
        title="Tabla rápida de ascitis"
        subtitle="Resumen operativo derivado del algoritmo diferencial incluido."
      >
        <ReferenceTable headers={['Dato clave', 'Orientación']} rows={PARACENTESIS_REFERENCE_ROWS} />
      </SectionCard>
    );
  }

  if (procedure === 'artrocentesis') {
    return (
      <SectionCard
        title="Tabla de líquido sinovial"
        subtitle="Patrones de referencia para diferenciar líquido articular normal y patológico."
      >
        <ReferenceTable
          headers={['Característica', 'Normal', 'No inflamatorio', 'Inflamatorio', 'Séptico', 'Hemorrágico']}
          rows={ARTHROCENTESIS_REFERENCE_ROWS}
        />
      </SectionCard>
    );
  }

  if (procedure === 'puncion-lumbar') {
    return (
      <SectionCard
        title="Tabla rápida de LCR"
        subtitle="Patrones diferenciales en infección del sistema nervioso central."
      >
        <ReferenceTable
          headers={['Característica', 'Normal', 'Meningitis aguda purulenta', 'Meningitis/encefalitis viral', 'Meningitis subaguda o crónica']}
          rows={LP_REFERENCE_ROWS}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Criterios de Light"
      subtitle="Basta cumplir un criterio para clasificar como exudado pleural."
    >
      <ReferenceTable headers={['Determinación', 'Punto de corte', 'Interpretación']} rows={THORACENTESIS_REFERENCE_ROWS} />
    </SectionCard>
  );
}

export default function BiologicalFluidsApp() {
  const [procedure, setProcedure] = useState<ProcedureId | null>(null);
  const [inputs, setInputs] = useState<BiologicalFluidInputs>(createDefaultBiologicalFluidInputs);

  const info = procedure ? PROCEDURE_INFO.find((item) => item.id === procedure) : null;
  const interpretation = procedure ? evaluateBiologicalFluidProcedure(procedure, inputs) : null;
  const albuminReplacement =
    procedure === 'paracentesis'
      ? calculateAlbuminReplacement(inputs.paracentesis.litersDrained)
      : null;
  const reportText =
    procedure === 'paracentesis' && albuminReplacement && interpretation
      ? `${interpretation.reportText}\nReposición con albúmina tras paracentesis: ${formatCompactNumber(albuminReplacement.grams, 1)} g en total (${formatCompactNumber(albuminReplacement.vials20, 1)} viales de 50 ml al 20%, ${formatCompactNumber(albuminReplacement.ml20, 0)} ml).`
      : interpretation?.reportText;
  const handleResetProcedure = () => {
    if (!procedure) return;
    setInputs((current) => resetProcedureInputs(current, procedure));
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#eef8fb_0%,#f6fbff_46%,#fff7ef_100%)] px-6 py-7 shadow-sm sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2b5d68]">
          Líquidos biológicos
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Aproximación diagnóstica de líquidos biológicos
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
          Paracentesis, artrocentesis, punción lumbar y toracocentesis con indicaciones,
          contraindicaciones e interpretación orientativa del líquido obtenido en Urgencias.
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
          Herramienta de cribado clínico. La salida es orientativa y debe integrarse con la
          microbiología, la imagen y el contexto del paciente.
        </div>
      </section>

      <div className="mt-8">
        <SectionCard title="Selecciona la prueba">
        <div className="mx-auto grid max-w-3xl grid-cols-2 place-items-center gap-1.5 md:grid-cols-4 xl:grid-cols-4">
          {PROCEDURE_SELECTOR_ITEMS.map((item) => {
            const isActive = item.id === procedure;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                onClick={() => setProcedure(item.id)}
                className={`group relative mx-auto w-full max-w-[122px] overflow-hidden rounded-xl border-2 bg-white/95 p-1.5 transition ${
                  isActive
                    ? 'border-white shadow-md ring-1 ring-slate-200'
                    : 'border-white hover:shadow-sm hover:ring-1 hover:ring-slate-200'
                }`}
              >
                <div
                  className={`flex aspect-[1/0.82] items-center justify-center rounded-lg border p-1 ${
                    isActive
                      ? 'border-white/20 bg-gradient-to-br from-[#1f6b63] via-[#3b907e] to-[#9cc08b] shadow-inner'
                      : 'border-slate-200 bg-gradient-to-br from-[#4f7180] to-[#86a7b2]'
                  }`}
                >
                  <div
                    className={`relative flex h-full w-full items-center justify-center ${
                      item.id === 'artrocentesis' ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]' : ''
                    }`}
                  >
                    {item.imageSrc ? (
                      <Image
                        src={item.imageSrc}
                        alt={item.imageAlt ?? item.label}
                        width={84}
                        height={84}
                        className="h-full w-full object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                      />
                    ) : (
                      <ArthrocentesisIcon className="h-full w-full" />
                    )}
                  </div>
                </div>

                <div
                  className={`mt-1 text-center text-[10px] font-medium leading-tight ${
                    isActive ? 'text-[#2b5d68]' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
        </SectionCard>
      </div>

      {procedure && interpretation && info ? <div className="mt-6 space-y-6">
        <ProcedureDetails procedure={procedure} />

        <SectionCard
          title={procedure === 'paracentesis' ? 'Resultados analíticos' : `Datos del ${info?.fluidLabel.toLowerCase() ?? 'líquido'}`}
          subtitle="Introduce solo lo que tengas disponible; la interpretación se recalcula sobre la marcha."
          action={
            <button
              type="button"
              onClick={handleResetProcedure}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              Reiniciar formulario
            </button>
          }
        >
          <ProcedureForm procedure={procedure} inputs={inputs} setInputs={setInputs} />
        </SectionCard>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#f5fbfc,#fffaf3)] px-4 py-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Interpretación
            </div>
            <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold leading-tight text-slate-900">
                {interpretation.title}
              </h2>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#47656c]">
                {interpretation.label}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{interpretation.summary}</p>
          </div>

          {interpretation.calculations.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {interpretation.calculations.map((item) => (
                <div
                  key={item.label}
                  className="flex min-h-[136px] flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </div>
                  <div className="mt-2 text-lg font-semibold leading-tight text-slate-900">
                    {item.value}
                  </div>
                  {item.note ? <p className="mt-1 text-sm text-slate-700">{item.note}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          {procedure === 'paracentesis' && albuminReplacement ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Reposición con albúmina
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-emerald-100 bg-white/80 p-3 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Gramos
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatCompactNumber(albuminReplacement.grams, 1)} g
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-white/80 p-3 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Viales 20% 50 ml
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatCompactNumber(albuminReplacement.vials20, 1)}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-white/80 p-3 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Volumen total
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatCompactNumber(albuminReplacement.ml20, 0)} ml
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Recomendación usada: 8 g de albúmina por litro de ascitis extraída. Con albúmina
                al 20%, 1 vial de 50 ml aporta 10 g y cubre aproximadamente 1,25 litros
                evacuados.
              </p>
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Datos de apoyo
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {interpretation.findings.length > 0 ? (
                  interpretation.findings.map((item) => <li key={item}>• {item}</li>)
                ) : (
                  <li>• Sin hallazgos específicos añadidos con los datos actuales.</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Siguientes pasos
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {interpretation.nextSteps.length > 0 ? (
                  interpretation.nextSteps.map((item) => <li key={item}>• {item}</li>)
                ) : (
                  <li>• No hay recomendaciones adicionales automáticas.</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Alertas
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {interpretation.alerts.length > 0 ? (
                  interpretation.alerts.map((item) => <li key={item}>• {item}</li>)
                ) : (
                  <li>• Sin alertas críticas automáticas con los datos introducidos.</li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {reportText && shouldShowCopyableReport(interpretation.title, interpretation.label) ? (
          <CopyableReport reportText={reportText} />
        ) : null}
        <ProcedureReference procedure={procedure} />
      </div> : null}
    </main>
  );
}
