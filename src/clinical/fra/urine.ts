import type { FraInput, KdigoStage, NumericValue, UrineAssessment } from './types.ts';

function isPositiveNumber(value: NumericValue): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function calculateUrineOutputRate(input: FraInput): {
  rateMlKgHour: NumericValue;
  limitations: string[];
} {
  const limitations: string[] = [];

  if (
    isPositiveNumber(input.urineOutputTotalMl) &&
    isPositiveNumber(input.weightKg) &&
    isPositiveNumber(input.oliguriaDurationHours)
  ) {
    return {
      rateMlKgHour: input.urineOutputTotalMl / input.weightKg / input.oliguriaDurationHours,
      limitations,
    };
  }

  if (input.urineOutputTotalMl !== null && !isPositiveNumber(input.weightKg)) {
    limitations.push('No se puede derivar ml/kg/h sin peso.');
  }
  if (input.urineOutputTotalMl !== null && !isPositiveNumber(input.oliguriaDurationHours)) {
    limitations.push('No se puede derivar ml/kg/h sin duracion de la oliguria.');
  }

  return {
    rateMlKgHour: null,
    limitations,
  };
}

function classifyUrineStage(rateMlKgHour: NumericValue, durationHours: NumericValue, anuria: boolean): {
  stage: KdigoStage;
  matchedCriteria: string[];
} {
  const matchedCriteria: string[] = [];
  let stage: KdigoStage = 0;

  if (anuria && typeof durationHours === 'number' && durationHours >= 12) {
    matchedCriteria.push('Anuria durante al menos 12 h');
    return { stage: 3, matchedCriteria };
  }

  if (typeof rateMlKgHour !== 'number' || typeof durationHours !== 'number') {
    return { stage, matchedCriteria };
  }

  if (rateMlKgHour < 0.3 && durationHours >= 24) {
    stage = 3;
    matchedCriteria.push(`Diuresis ${rateMlKgHour.toFixed(2)} ml/kg/h durante ${durationHours} h`);
    return { stage, matchedCriteria };
  }

  if (rateMlKgHour < 0.5 && durationHours >= 12) {
    stage = 2;
    matchedCriteria.push(`Diuresis ${rateMlKgHour.toFixed(2)} ml/kg/h durante ${durationHours} h`);
    return { stage, matchedCriteria };
  }

  if (rateMlKgHour < 0.5 && durationHours >= 6) {
    stage = 1;
    matchedCriteria.push(`Diuresis ${rateMlKgHour.toFixed(2)} ml/kg/h durante ${durationHours} h`);
  }

  return { stage, matchedCriteria };
}

export function assessUrineCriteria(input: FraInput): UrineAssessment {
  const rate = calculateUrineOutputRate(input);
  const classification = classifyUrineStage(
    rate.rateMlKgHour,
    input.oliguriaDurationHours,
    input.anuria
  );

  const limitations = [...rate.limitations];
  if (input.anuria && input.oliguriaDurationHours === null) {
    limitations.push('La anuria sin duracion documentada obliga a valorar gravedad, pero no permite estadificar por diuresis.');
  }

  return {
    rateMlKgHour: rate.rateMlKgHour,
    stage: classification.stage,
    matchedCriteria: classification.matchedCriteria,
    limitations,
  };
}
