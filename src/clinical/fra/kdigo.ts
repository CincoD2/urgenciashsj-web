import { assessUrineCriteria } from './urine.ts';
import type {
  ChronicityAssessment,
  FraInput,
  KdigoAssessment,
  KdigoCriterionResult,
  KdigoStage,
  NumericValue,
} from './types.ts';

function round(value: NumericValue, decimals = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function describeStage(stage: KdigoStage) {
  if (stage === 0) return 'Sin estadio KDIGO confirmado con los datos actuales.';
  return `KDIGO ${stage}`;
}

export function assessChronicityContext(input: FraInput): ChronicityAssessment {
  const items: string[] = [];

  if (input.chronicKidneyDiseaseKnown) items.push('ERC conocida');
  if (input.chronicity.chronicAnemia) items.push('anemia crónica');
  if (input.chronicity.hyperphosphatemia) items.push('hiperfosfatemia');
  if (input.chronicity.hypocalcemia) items.push('hipocalcemia');
  if (input.chronicity.hyperparathyroidism) items.push('hiperparatiroidismo');
  if (input.chronicity.smallKidneys || input.ultrasound.smallKidneys) items.push('riñones pequeños');
  if (input.chronicity.hyperechogenicKidneys || input.ultrasound.hyperechogenicity) {
    items.push('riñones hiperecogénicos');
  }
  if (input.chronicity.chronicPolyuriaNocturiaPruritus) items.push('poliuria/nicturia/prurito crónicos');

  const signalCount = items.length;
  const suggestsChronicity = signalCount >= 2 || input.chronicKidneyDiseaseKnown;

  return {
    signalCount,
    suggestsChronicity,
    items,
    summary: suggestsChronicity
      ? `Existen datos de cronicidad (${items.join(', ')}), por lo que debe contemplarse FRA sobre ERC o enfermedad renal crónica no conocida.`
      : null,
  };
}

export function assessKdigo(input: FraInput): KdigoAssessment {
  const limitations: string[] = [];
  const matchedCriteria: KdigoCriterionResult[] = [];
  const urine = assessUrineCriteria(input);

  const currentCr = input.creatinineCurrentMgDl;
  const baselineCr = input.creatinineBaselineMgDl;
  const baselineTime = input.baselineTimeHours;
  const creatinineRatio =
    typeof currentCr === 'number' && typeof baselineCr === 'number' && baselineCr > 0
      ? round(currentCr / baselineCr)
      : null;
  const creatinineDeltaMgDl =
    typeof currentCr === 'number' && typeof baselineCr === 'number'
      ? round(currentCr - baselineCr)
      : null;

  const within48h = typeof baselineTime === 'number' && baselineTime <= 48;
  const within7d = typeof baselineTime === 'number' && baselineTime <= 168;

  const meetsCr48h =
    typeof creatinineDeltaMgDl === 'number' && creatinineDeltaMgDl >= 0.3 && within48h;
  const meetsCr7d = typeof creatinineRatio === 'number' && creatinineRatio >= 1.5 && within7d;

  matchedCriteria.push({
    id: 'creatinine-48h',
    label: 'Aumento de creatinina ≥ 0,3 mg/dl en 48 h',
    matched: meetsCr48h,
    detail: meetsCr48h
      ? `Delta de creatinina ${creatinineDeltaMgDl} mg/dl en ${baselineTime} h.`
      : typeof creatinineDeltaMgDl === 'number' && typeof baselineTime === 'number'
        ? `Delta de creatinina ${creatinineDeltaMgDl} mg/dl en ${baselineTime} h.`
        : 'Faltan creatinina basal, actual o ventana temporal.',
  });
  matchedCriteria.push({
    id: 'creatinine-7d',
    label: 'Creatinina ≥ 1,5 veces basal en 7 días',
    matched: meetsCr7d,
    detail: meetsCr7d
      ? `Relación creatinina ${creatinineRatio} en ${baselineTime} h.`
      : typeof creatinineRatio === 'number' && typeof baselineTime === 'number'
        ? `Relación creatinina ${creatinineRatio} en ${baselineTime} h.`
        : 'Faltan creatinina basal, actual o ventana temporal.',
  });
  matchedCriteria.push({
    id: 'urine',
    label: 'Diuresis < 0,5 ml/kg/h durante ≥ 6 h',
    matched: urine.stage >= 1,
    detail:
      urine.matchedCriteria[0] ??
      (urine.rateMlKgHour === null
        ? 'No hay datos suficientes de diuresis.'
        : `Diuresis ${round(urine.rateMlKgHour)} ml/kg/h sin criterio temporal KDIGO.`),
  });
  matchedCriteria.push({
    id: 'trs',
    label: 'Inicio de terapia renal sustitutiva',
    matched: input.renalReplacementStarted,
    detail: input.renalReplacementStarted
      ? 'El paciente ya ha iniciado TRS.'
      : 'No consta TRS.',
  });

  if (baselineCr !== null && baselineTime === null) {
    limitations.push('La creatinina basal sin fecha limita la confirmación formal de los criterios por creatinina.');
  }
  if (typeof baselineTime === 'number' && baselineTime > 168 && baselineCr !== null) {
    limitations.push('La creatinina basal disponible está fuera de las ventanas KDIGO de 48 h y 7 días.');
  }
  limitations.push(...urine.limitations);

  let creatinineStage: KdigoStage = 0;
  if (input.renalReplacementStarted) {
    creatinineStage = 3;
  } else if (typeof creatinineRatio === 'number' || typeof creatinineDeltaMgDl === 'number') {
    if (
      (typeof creatinineRatio === 'number' && creatinineRatio >= 3) ||
      (typeof currentCr === 'number' &&
        currentCr >= 4 &&
        typeof creatinineDeltaMgDl === 'number' &&
        creatinineDeltaMgDl >= 0.3)
    ) {
      creatinineStage = 3;
    } else if (typeof creatinineRatio === 'number' && creatinineRatio >= 2 && within7d) {
      creatinineStage = 2;
    } else if (
      (typeof creatinineRatio === 'number' && creatinineRatio >= 1.5 && within7d) ||
      meetsCr48h
    ) {
      creatinineStage = 1;
    }
  }

  const stage = Math.max(creatinineStage, urine.stage, input.renalReplacementStarted ? 3 : 0) as KdigoStage;
  const hasFra =
    matchedCriteria.some((criterion) => criterion.matched) ||
    input.renalReplacementStarted;
  const chronicity = assessChronicityContext(input);

  return {
    hasFra,
    stage,
    creatinineRatio,
    creatinineDeltaMgDl,
    urine,
    matchedCriteria,
    limitations,
    stageExplanation: describeStage(stage),
    chronicity,
  };
}
