'use client';

import { useState } from 'react';

import { createDefaultFraInput, type FraInput } from '@/clinical/fra';

type PatientInputFormProps = {
  value: FraInput;
  onChange: (value: FraInput) => void;
};

type Option = {
  key: string;
  label: string;
};

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type BaselineTimeUnit = 'days' | 'weeks' | 'months';

const BASELINE_UNIT_OPTIONS: Array<{ value: BaselineTimeUnit; label: string; factorHours: number }> = [
  { value: 'days', label: 'Días', factorHours: 24 },
  { value: 'weeks', label: 'Semanas', factorHours: 24 * 7 },
  { value: 'months', label: 'Meses', factorHours: 24 * 30 },
];

function SectionCard({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = '0.1',
  min,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step?: string;
  min?: string;
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
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

function CombinedTimeField({
  label,
  value,
  unit,
  onValueChange,
  onUnitChange,
}: {
  label: string;
  value: number | null;
  unit: BaselineTimeUnit;
  onValueChange: (value: number | null) => void;
  onUnitChange: (unit: BaselineTimeUnit) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ''}
          onChange={(event) => onValueChange(parseNumber(event.target.value))}
          step="1"
          min="0"
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none"
        />
        <select
          value={unit}
          onChange={(event) => onUnitChange(event.target.value as BaselineTimeUnit)}
          className="w-28 border-l border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none"
        >
          {BASELINE_UNIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
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
        <span>Sí</span>
      </span>
    </label>
  );
}

function CheckboxGrid({
  options,
  isChecked,
  onToggle,
}: {
  options: Option[];
  isChecked: (key: string) => boolean;
  onToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option.key}
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50/70"
        >
          <input
            type="checkbox"
            checked={isChecked(option.key)}
            onChange={(event) => onToggle(option.key, event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

const sedimentOptions: Option[] = [
  { key: 'blandSediment', label: 'Sedimento anodino' },
  { key: 'hyalineCasts', label: 'Cilindros hialinos' },
  { key: 'tubularSediment', label: 'Cilindros granulosos / pigmentados / celulares' },
  { key: 'hematuria', label: 'Hematuria' },
  { key: 'proteinuria', label: 'Proteinuria' },
  { key: 'glomerularSediment', label: 'Cilindros hemáticos / hematíes dismórficos' },
  { key: 'pyuriaBacteriuria', label: 'Leucocituria / bacteriuria' },
  { key: 'eosinophiluria', label: 'Eosinofiluria' },
  { key: 'crystals', label: 'Cristales' },
  { key: 'hemePositiveWithoutRbc', label: 'Hemo positivo sin hematíes' },
];

export default function PatientInputForm({ value, onChange }: PatientInputFormProps) {
  const [baselineUnit, setBaselineUnit] = useState<BaselineTimeUnit>('days');

  function updateTopLevel<Key extends keyof FraInput>(key: Key, nextValue: FraInput[Key]) {
    onChange({ ...value, [key]: nextValue });
  }

  function updateUrineField<Key extends keyof FraInput['urineStudies']>(
    key: Key,
    nextValue: FraInput['urineStudies'][Key]
  ) {
    onChange({
      ...value,
      urineStudies: {
        ...value.urineStudies,
        [key]: nextValue,
      },
    });
  }

  function resetForm() {
    setBaselineUnit('days');
    onChange(createDefaultFraInput());
  }

  const baselineFactor =
    BASELINE_UNIT_OPTIONS.find((option) => option.value === baselineUnit)?.factorHours ?? 24;
  const baselineDisplayValue =
    value.baselineTimeHours === null ? null : Number((value.baselineTimeHours / baselineFactor).toFixed(2));
  const urineRateDisplay =
    value.urineOutputTotalMl !== null &&
    value.weightKg !== null &&
    value.oliguriaDurationHours !== null &&
    value.weightKg > 0 &&
    value.oliguriaDurationHours > 0
      ? `${(value.urineOutputTotalMl / value.weightKg / value.oliguriaDurationHours).toFixed(2)} ml/kg/h`
      : '—';

  function isSedimentChecked(key: string) {
    switch (key) {
      case 'tubularSediment':
        return value.urineStudies.granularCasts || value.urineStudies.cellularCasts;
      case 'glomerularSediment':
        return value.urineStudies.redCellCasts;
      case 'pyuriaBacteriuria':
        return value.urineStudies.leukocyturia || value.urineStudies.bacteriuria;
      default:
        return Boolean(value.urineStudies[key as keyof FraInput['urineStudies']]);
    }
  }

  function toggleSediment(key: string, checked: boolean) {
    if (key === 'tubularSediment') {
      onChange({
        ...value,
        urineStudies: {
          ...value.urineStudies,
          granularCasts: checked,
          cellularCasts: checked,
        },
      });
      return;
    }

    if (key === 'glomerularSediment') {
      updateUrineField('redCellCasts', checked);
      return;
    }

    if (key === 'pyuriaBacteriuria') {
      onChange({
        ...value,
        urineStudies: {
          ...value.urineStudies,
          leukocyturia: checked,
          bacteriuria: checked,
        },
      });
      return;
    }

    updateUrineField(key as keyof FraInput['urineStudies'], checked as never);
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="A. Datos básicos"
        actions={
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Limpiar formulario
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <NumberField
            label="Peso (kg)"
            value={value.weightKg}
            onChange={(next) => updateTopLevel('weightKg', next)}
            step="1"
            min="0"
          />
          <NumberField
            label="Creatinina actual (mg/dl)"
            value={value.creatinineCurrentMgDl}
            onChange={(next) => updateTopLevel('creatinineCurrentMgDl', next)}
          />
          <NumberField
            label="Creatinina basal (mg/dl)"
            value={value.creatinineBaselineMgDl}
            onChange={(next) => updateTopLevel('creatinineBaselineMgDl', next)}
          />
          <CombinedTimeField
            label="Tiempo desde la creatinina basal"
            value={baselineDisplayValue}
            unit={baselineUnit}
            onValueChange={(next) =>
              updateTopLevel('baselineTimeHours', next === null ? null : next * baselineFactor)
            }
            onUnitChange={setBaselineUnit}
          />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">Diuresis</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <NumberField
              label="Diuresis acumulada (ml)"
              value={value.urineOutputTotalMl}
              onChange={(next) => updateTopLevel('urineOutputTotalMl', next)}
              step="100"
              min="0"
            />
            <NumberField
              label="Horas del periodo"
              value={value.oliguriaDurationHours}
              onChange={(next) => updateTopLevel('oliguriaDurationHours', next)}
              step="1"
              min="0"
            />
            <ReadOnlyField
              label="mL/kg/h calculado"
              value={urineRateDisplay}
            />
            <CheckboxField
              label="Anuria"
              checked={value.anuria}
              onChange={(checked) => updateTopLevel('anuria', checked)}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            La diuresis sirve sobre todo para aplicar el criterio urinario de KDIGO. Si no se
            conoce con fiabilidad en domicilio, puede dejarse sin rellenar.
          </p>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="B. Bioquímica plasma/urinaria">
          <div className="grid gap-4 md:grid-cols-2">
            <NumberField
              label="Na plasma (mEq/l)"
              value={value.urineStudies.plasmaSodiumMmolL}
              onChange={(next) => updateUrineField('plasmaSodiumMmolL', next)}
            />
            <NumberField
              label="Na orina (mEq/l)"
              value={value.urineStudies.urineSodiumMmolL}
              onChange={(next) => updateUrineField('urineSodiumMmolL', next)}
            />
            <NumberField
              label="Creatinina plasma (mg/dl)"
              value={value.urineStudies.plasmaCreatinineMgDl}
              onChange={(next) => updateUrineField('plasmaCreatinineMgDl', next)}
            />
            <NumberField
              label="Creatinina orina (mg/dl)"
              value={value.urineStudies.urineCreatinineMgDl}
              onChange={(next) => updateUrineField('urineCreatinineMgDl', next)}
            />
            <NumberField
              label="Urea plasma (mg/dl)"
              value={value.urineStudies.plasmaUreaMgDl}
              onChange={(next) => updateUrineField('plasmaUreaMgDl', next)}
            />
            <NumberField
              label="Urea orina (mg/dl)"
              value={value.urineStudies.urineUreaMgDl}
              onChange={(next) => updateUrineField('urineUreaMgDl', next)}
            />
            <NumberField
              label="Osmolaridad urinaria (mOsm/kg)"
              value={value.urineStudies.urineOsmolalityMosmKg}
              onChange={(next) => updateUrineField('urineOsmolalityMosmKg', next)}
              step="1"
            />
            <NumberField
              label="Densidad urinaria"
              value={value.urineStudies.urineSpecificGravity}
              onChange={(next) => updateUrineField('urineSpecificGravity', next)}
              step="0.001"
            />
          </div>
        </SectionCard>

        <SectionCard title="C. Sedimento">
          <CheckboxGrid options={sedimentOptions} isChecked={isSedimentChecked} onToggle={toggleSediment} />
        </SectionCard>
      </div>
    </div>
  );
}
