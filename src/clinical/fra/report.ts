import type { FraAssessment } from './types.ts';

function bucketLabel(bucket: FraAssessment['etiology']['mostLikely']) {
  if (bucket === 'prerenal') return 'Prerrenal';
  if (bucket === 'intrinsic') return 'Renal/parénquimatosa';
  if (bucket === 'postrenal') return 'Postrenal/obstructiva';
  if (bucket === 'mixed') return 'Mixta/multifactorial';
  return 'Indeterminada';
}

function formatNumber(value: number, decimals = 1) {
  return value.toFixed(decimals);
}

function criterionLabel(id: FraAssessment['kdigo']['matchedCriteria'][number]['id']) {
  switch (id) {
    case 'creatinine-48h':
      return 'Aumento de creatinina ≥ 0,3 mg/dl en 48 h';
    case 'creatinine-7d':
      return 'Creatinina ≥ 1,5 veces la basal en 7 días';
    case 'urine':
      return 'Diuresis < 0,5 ml/kg/h durante ≥ 6 h';
    case 'trs':
      return 'Terapia renal sustitutiva iniciada';
    default:
      return '';
  }
}

function normalizeReportText(text: string) {
  return text
    .replaceAll('Relacion', 'Relación')
    .replaceAll('patron', 'patrón')
    .replaceAll('etiologica', 'etiológica')
    .replaceAll('sintomas', 'síntomas')
    .replaceAll('glomerulonefritis', 'glomerulonefritis')
    .replaceAll('obstruccion', 'obstrucción')
    .replaceAll('dilatacion', 'dilatación')
    .replaceAll('via urinaria', 'vía urinaria');
}

export function buildFraReport(assessment: FraAssessment) {
  const { kdigo, etiology } = assessment;
  const positiveCriteria = kdigo.matchedCriteria
    .filter((criterion) => criterion.matched)
    .map((criterion) => criterionLabel(criterion.id))
    .filter(Boolean);
  const lines: string[] = [];

  if (kdigo.hasFra) {
    lines.push(`FRA KDIGO ${kdigo.stage}.`);
  } else {
    lines.push('Sin criterios actuales de FRA.');
  }

  if (positiveCriteria.length > 0) {
    lines.push(`Criterios: ${positiveCriteria.join('; ')}.`);
  }

  if (kdigo.urine.rateMlKgHour !== null) {
    lines.push(`Diuresis: ${formatNumber(kdigo.urine.rateMlKgHour, 2)} ml/kg/h.`);
  }

  const calculationBits: string[] = [];
  if (etiology.fenaPercent !== null) calculationBits.push(`FeNa ${formatNumber(etiology.fenaPercent)}%`);
  if (etiology.feUreaPercent !== null) calculationBits.push(`FEUrea ${formatNumber(etiology.feUreaPercent)}%`);
  if (etiology.urinePlasmaCreatinineRatio !== null) {
    calculationBits.push(`CrU/CrP ${formatNumber(etiology.urinePlasmaCreatinineRatio)}`);
  }
  if (calculationBits.length > 0) {
    lines.push(`Parámetros urinarios: ${calculationBits.join('; ')}.`);
  }

  if (etiology.urinePattern.length > 0) {
    lines.push(`Patrón urinario: ${normalizeReportText(etiology.urinePattern.slice(0, 5).join('; '))}.`);
  }

  lines.push(
    `Orientación etiológica: ${bucketLabel(etiology.mostLikely)}. Puntuación prerrenal ${etiology.scores.find((score) => score.bucket === 'prerenal')?.score ?? 0}, renal/parénquimatosa ${etiology.scores.find((score) => score.bucket === 'intrinsic')?.score ?? 0}, postrenal ${etiology.scores.find((score) => score.bucket === 'postrenal')?.score ?? 0}.`
  );

  return lines.join('\n');
}
