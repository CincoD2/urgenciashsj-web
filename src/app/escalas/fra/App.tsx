'use client';

import { useState } from 'react';

import {
  createDefaultFraInput,
  evaluateFraCase,
  type EtiologyAssessment,
  type FraInput,
  type KdigoStage,
} from '@/clinical/fra';

import CopyableReport from './components/CopyableReport';
import PatientInputForm from './components/PatientInputForm';
import UrinaryPatternsTable from './components/UrinaryPatternsTable';

const RESULT_PANEL_BY_STAGE: Record<KdigoStage, string> = {
  0: 'resultado amarillo',
  1: 'resultado amarillo',
  2: 'resultado naranja',
  3: 'resultado rojo',
};

function formatValue(value: number | null, suffix = '', decimals?: number) {
  if (value === null) return 'No disponible';
  const formatted = typeof decimals === 'number' ? value.toFixed(decimals) : String(value);
  return `${formatted}${suffix}`;
}

function trimSentenceEnding(text: string) {
  return text.trim().replace(/[.;:\s]+$/u, '');
}

function joinSummaryItems(items: string[]) {
  const cleaned = items.map((item) => trimSentenceEnding(item)).filter(Boolean);
  return cleaned.join(' · ');
}

function resultTitle(mostLikely: EtiologyAssessment['mostLikely']) {
  if (mostLikely === 'prerenal') return 'Prerrenal';
  if (mostLikely === 'intrinsic') return 'Renal/parénquimatosa';
  if (mostLikely === 'postrenal') return 'Postrenal/obstructiva';
  if (mostLikely === 'mixed') return 'Mixta / multifactorial';
  return 'Indeterminada';
}

export default function FraApp() {
  const [input, setInput] = useState<FraInput>(createDefaultFraInput);
  const assessment = evaluateFraCase(input);
  const matchedKdigoCriteria = assessment.kdigo.matchedCriteria.filter((criterion) => criterion.matched);
  const prerenalScore =
    assessment.etiology.scores.find((score) => score.bucket === 'prerenal')?.score ?? 0;
  const intrinsicScore =
    assessment.etiology.scores.find((score) => score.bucket === 'intrinsic')?.score ?? 0;
  const postrenalScore =
    assessment.etiology.scores.find((score) => score.bucket === 'postrenal')?.score ?? 0;
  const differentialsText =
    assessment.etiology.differentials.length > 0
      ? assessment.etiology.differentials.join(', ')
      : 'Sin diferenciales dominantes con los datos actuales';
  const alertsText =
    assessment.severity.alerts.length > 0
      ? joinSummaryItems(assessment.severity.alerts.map((alert) => alert.message))
      : 'Sin alertas de gravedad mayores con los datos actuales';
  const managementText = [
    ...assessment.management.general,
    ...assessment.management.targeted,
    ...assessment.management.monitoring,
  ].slice(0, 5);
  const managementSummary = joinSummaryItems(managementText);
  const caveatsSummary = joinSummaryItems(assessment.caveats.slice(0, 2));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#eff8fb_0%,#f7fbff_46%,#fff8f1_100%)] px-6 py-7 shadow-sm sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2b5d68]">
          Insuficiencia renal
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Fracaso Renal Agudo
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base">
          Entrada rápida para Urgencias: clasifica KDIGO, calcula FeNa y FeUrea cuando sea posible y
          orienta si el patrón es prerrenal, renal/parénquimatoso o postrenal.
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
          No sustituye el juicio clínico. Si faltan datos, el cálculo se muestra como no disponible.
          El FRA puede ser multifactorial.
        </div>
      </section>

      <div className="mt-6 space-y-6">
        <PatientInputForm value={input} onChange={setInput} />

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className={RESULT_PANEL_BY_STAGE[assessment.kdigo.stage]}>
            <div className="interpretacion">
              {assessment.kdigo.hasFra ? 'Cumple criterios de FRA' : 'FRA no confirmado'}
            </div>
            <div className="resultado-subtexto">
              {assessment.kdigo.hasFra
                ? assessment.kdigo.stage === 0
                  ? 'Criterios KDIGO positivos con los datos actuales.'
                  : `Estadio KDIGO ${assessment.kdigo.stage}.`
                : 'No hay criterios KDIGO confirmados con los datos actuales.'}
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <b>Criterio(s) positivo(s):</b>{' '}
            {matchedKdigoCriteria.length > 0
              ? matchedKdigoCriteria.map((criterion) => criterion.label).join(' · ')
              : 'ninguno con los datos introducidos.'}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold tracking-wide text-slate-500">Diuresis</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {formatValue(assessment.kdigo.urine.rateMlKgHour, ' ml/kg/h', 2)}
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {assessment.kdigo.urine.stage >= 1
                  ? `Criterio por diuresis compatible con KDIGO ${assessment.kdigo.urine.stage}.`
                  : 'Sin criterio de oliguria confirmado.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold tracking-wide text-slate-500">FeNa</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {formatValue(assessment.etiology.fenaPercent, '%')}
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {assessment.etiology.fenaPercent === null
                  ? 'No calculable.'
                  : assessment.etiology.fenaPercent < 1
                    ? 'Orienta a prerrenal.'
                    : 'Menos compatible con prerrenal aislado.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold tracking-wide text-slate-500">FEUrea</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {formatValue(assessment.etiology.feUreaPercent, '%')}
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {assessment.etiology.feUreaPercent === null
                  ? 'No calculable.'
                  : assessment.etiology.feUreaPercent < 35
                    ? 'Apoya prerrenal.'
                    : assessment.etiology.feUreaPercent > 50
                      ? 'Apoya daño tubular/parénquimatoso.'
                      : 'Zona intermedia.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold tracking-wide text-slate-500">CrU/CrP</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {formatValue(assessment.etiology.urinePlasmaCreatinineRatio)}
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {assessment.etiology.urinePlasmaCreatinineRatio === null
                  ? 'No calculable.'
                  : assessment.etiology.urinePlasmaCreatinineRatio > 40
                    ? 'Compatible con patrón prerrenal.'
                    : assessment.etiology.urinePlasmaCreatinineRatio < 20
                      ? 'Compatible con daño tubular.'
                      : 'Interpretación intermedia.'}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Patrón urinario
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {assessment.etiology.urinePattern.length > 0
                ? joinSummaryItems(assessment.etiology.urinePattern.slice(0, 6))
                : 'Sin datos urinarios suficientes para orientar el patrón.'}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-[#f8fbfc] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Prerrenal
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{prerenalScore}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Renal/parénquimatosa
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{intrinsicScore}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#faf8fb] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Postrenal
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{postrenalScore}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Conclusión
            </div>
            <p className="mt-2 text-sm font-medium text-slate-900">
              <b>Orientación etiológica:</b> {resultTitle(assessment.etiology.mostLikely)}.
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {assessment.etiology.explanation}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              <b>Diferenciales relevantes:</b> {differentialsText}.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              <b>Alertas:</b> {alertsText}.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              <b>Manejo inicial sugerido:</b> {managementSummary}.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              <b>Observaciones:</b> {caveatsSummary}. El FRA puede ser multifactorial y no sustituye
              el juicio clínico.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-6 space-y-6">
        <CopyableReport reportText={assessment.reportText} />
        <UrinaryPatternsTable />
      </div>

      <section className="mt-8 space-y-3 text-sm leading-relaxed text-slate-700">
        <p className="font-semibold">Bibliografía:</p>
        <p>
          <em>Manual de Diagnóstico y Terapéutica Médica</em> (12 de Octubre). 9.ª edición. Aparicio
          Minguijón EM, Caso Laviana JM, Díaz Santiañez M, Fernández Argüeso A, Heredia Mena C,
          Muñoz Hernández M, Salmerón Godoy L, Sánchez Fernández M, Verdejo Gómez MÁ, eds.
        </p>
        <p>
          <em>Medicina de Urgencias y Emergencias. Guía diagnóstica y protocolos de actuación</em>.
          7.ª edición. Jiménez Murillo L, Montero Pérez FJ, dirs.
        </p>
      </section>
    </main>
  );
}
