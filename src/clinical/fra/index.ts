import { assessEtiology } from './etiology.ts';
import { assessKdigo } from './kdigo.ts';
import { buildManagementPlan } from './management.ts';
import { buildFraReport } from './report.ts';
import { assessSeverity } from './severity.ts';
import type { FraAssessment, FraInput } from './types.ts';

export * from './etiology.ts';
export * from './kdigo.ts';
export * from './management.ts';
export * from './report.ts';
export * from './severity.ts';
export * from './types.ts';
export * from './urine.ts';

export function evaluateFraCase(input: FraInput): FraAssessment {
  const kdigo = assessKdigo(input);
  const etiology = assessEtiology(input);
  const severity = assessSeverity(input);
  const management = buildManagementPlan(input, kdigo, etiology, severity);

  const caveats = [
    ...kdigo.limitations,
    ...etiology.warnings,
    'El resultado es orientativo y debe integrarse con la exploracion, la tendencia analitica y el contexto clinico.',
  ];

  const assessment: FraAssessment = {
    kdigo,
    etiology,
    severity,
    management,
    caveats: Array.from(new Set(caveats)),
    reportText: '',
  };

  assessment.reportText = buildFraReport(assessment);
  return assessment;
}
