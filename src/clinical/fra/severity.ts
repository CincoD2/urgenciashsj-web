import type { FraInput, SeverityAlert, SeverityAssessment } from './types.ts';

function uniqueTargets(alerts: SeverityAlert[]) {
  return Array.from(new Set(alerts.flatMap((alert) => alert.targets)));
}

export function assessSeverity(input: FraInput): SeverityAssessment {
  const alerts: SeverityAlert[] = [];

  if (typeof input.potassiumMmolL === 'number' && input.potassiumMmolL >= 6.5) {
    alerts.push({
      code: 'hyperkalemia-severe',
      message: 'Hiperpotasemia grave (K ≥ 6,5 mmol/l).',
      targets: ['Nefrologia', 'UCI'],
    });
  }
  if (input.hyperkalemiaEcgChanges || input.hyperkalemiaSymptoms) {
    alerts.push({
      code: 'hyperkalemia-symptomatic',
      message: 'Hiperpotasemia con cambios ECG, parálisis o síntomas.',
      targets: ['Nefrologia', 'UCI'],
    });
  }
  if (input.hyperkalemiaRefractory) {
    alerts.push({
      code: 'hyperkalemia-refractory',
      message: 'Hiperpotasemia refractaria al tratamiento médico.',
      targets: ['Nefrologia', 'UCI'],
    });
  }
  if ((typeof input.ph === 'number' && input.ph < 7.1) || input.refractoryAcidosis) {
    alerts.push({
      code: 'acidosis-severe',
      message: 'Acidosis metabólica grave o refractaria.',
      targets: ['Nefrologia', 'UCI'],
    });
  }
  if (input.pulmonaryEdemaOrFluidOverload && input.refractoryFluidOverload) {
    alerts.push({
      code: 'volume-overload',
      message: 'Edema agudo de pulmón o sobrecarga sin posibilidad de balance negativo.',
      targets: ['Nefrologia', 'UCI'],
    });
  }
  if (
    input.uremicSymptoms.encephalopathy ||
    input.uremicSymptoms.pericarditis ||
    input.uremicSymptoms.bleedingDiathesis ||
    input.uremicSymptoms.intractableVomiting
  ) {
    alerts.push({
      code: 'uremia-symptomatic',
      message: 'Uremia sintomática.',
      targets: ['Nefrologia'],
    });
  }
  if (input.suspectedDialyzableIntoxication) {
    alerts.push({
      code: 'dialyzable-intoxication',
      message: 'Sospecha de intoxicación dializable.',
      targets: ['Nefrologia', 'UCI'],
    });
  }
  if (input.shock || input.severeSepsis) {
    alerts.push({
      code: 'shock-sepsis',
      message: 'Shock o sepsis grave.',
      targets: ['UCI', 'Nefrologia'],
    });
  }
  if (
    input.infectedObstructionSuspected ||
    input.bilateralObstructionSuspected ||
    ((input.obstructionClues.solitaryKidney || input.ultrasound.solitaryKidney) &&
      (input.ultrasound.hydronephrosis || input.anuria))
  ) {
    alerts.push({
      code: 'obstruction-complicated',
      message: 'Obstrucción infectada, bilateral o en monorreno.',
      targets: ['Urologia', 'Nefrologia'],
    });
  }

  const consultationTargets = uniqueTargets(alerts);
  const hasRedFlags = alerts.length > 0;

  return {
    hasRedFlags,
    alerts,
    consultationTargets,
    summary: hasRedFlags
      ? 'Avisar Nefrología/UCI/Urología según el contexto y valorar TRS urgente.'
      : 'Sin alertas rojas mayores con los datos actuales, pero requiere reevaluación clínica seriada.',
  };
}
