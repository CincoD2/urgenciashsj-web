import type {
  EtiologyAssessment,
  FraInput,
  KdigoAssessment,
  ManagementPlan,
  SeverityAssessment,
} from './types.ts';

function addUnique(target: string[], items: string[]) {
  for (const item of items) {
    if (!target.includes(item)) target.push(item);
  }
}

export function buildManagementPlan(
  input: FraInput,
  kdigo: KdigoAssessment,
  etiology: EtiologyAssessment,
  severity: SeverityAssessment
): ManagementPlan {
  const general = [
    'Monitorizar constantes, volemia, diuresis horaria y balance.',
    'Retirar nefrotóxicos si es posible y ajustar fármacos a función renal.',
    'Solicitar o repetir analítica con urea, creatinina, iones, calcio, fósforo, gasometría y sedimento urinario.',
    'Solicitar ECG si hay hiperpotasemia o alteraciones iónicas.',
    'Valorar ecografía renal si la etiología no es clara, hay sospecha obstructiva, anuria, mala evolución o FRA grave.',
    'Evitar contraste yodado si no es imprescindible.',
    'Reevaluar la respuesta clínica y analítica en 6-12 h.',
  ];

  const targeted: string[] = [];
  const consults: string[] = [];
  const monitoring: string[] = [];

  if (severity.hasRedFlags) {
    addUnique(consults, [severity.summary]);
  }

  const hasPrerenal = etiology.scores.find((score) => score.bucket === 'prerenal')?.score ?? 0;
  const hasIntrinsic = etiology.scores.find((score) => score.bucket === 'intrinsic')?.score ?? 0;
  const hasPostrenal = etiology.scores.find((score) => score.bucket === 'postrenal')?.score ?? 0;

  if (etiology.mostLikely === 'prerenal' || (etiology.mixed && hasPrerenal >= 4)) {
    addUnique(targeted, [
      'Si hay hipovolemia, iniciar cristaloide isotónico y valorar solución balanceada si preocupa hipercloremia o acidosis.',
      'Si persiste shock pese a fluidos, iniciar vasopresores (preferentemente noradrenalina) y valorar UCI.',
      'Si hay sepsis, antibioterapia precoz y control del foco.',
      'Si existe insuficiencia cardiaca/cardiorrenal, tratar la congestión, optimizar gasto y frecuencia y usar diurético si hay sobrecarga.',
      'Si el contexto sugiere síndrome hepatorrenal, considerar albúmina, paracentesis si procede y valorar terlipresina según contraindicaciones.',
    ]);
  }

  if (etiology.mostLikely === 'intrinsic' || (etiology.mixed && hasIntrinsic >= 4)) {
    addUnique(targeted, [
      'Tratar la causa subyacente y evitar nuevos insultos renales.',
      'Si orienta a NTA, soporte, ajuste fino de volumen y evitar reposición de potasio salvo indicación clara en paciente oligúrico.',
      'Si sospecha de rabdomiólisis o daño por pigmentos hemo, hidratar, corregir alteraciones iónicas y monitorizar CK/K/P/Ca.',
      'Si sospecha de nefritis intersticial, retirar el fármaco sospechoso y valorar Nefrología/corticoides.',
      'Si sospecha de glomerulonefritis, vasculitis o microangiopatía trombótica, avisar Nefrología urgente y completar estudio inmunológico/hematológico.',
      'Si sospecha de pielonefritis, antibiótico, cultivos y descartar obstrucción asociada.',
    ]);
  }

  if (etiology.mostLikely === 'postrenal' || (etiology.mixed && hasPostrenal >= 4)) {
    addUnique(targeted, [
      'Sondaje vesical si hay sospecha de obstrucción baja o globo vesical.',
      'Avisar a Urología si la obstrucción es alta, bilateral, en monorreno, asociada a sepsis o con FRA grave.',
      'Valorar derivación con catéter ureteral o nefrostomía según nivel de obstrucción.',
      'Vigilar poliuria postobstructiva, deshidratación, hipopotasemia y alteraciones hidroelectrolíticas.',
    ]);
  }

  if (input.pulmonaryEdemaOrFluidOverload) {
    addUnique(targeted, ['Control estricto de congestión y necesidad de balance negativo.']);
  }
  if (input.hyperkalemiaEcgChanges || input.hyperkalemiaSymptoms || input.potassiumMmolL !== null) {
    addUnique(monitoring, [
      'Repetir potasio y ECG tras tratamiento si existe hiperpotasemia o riesgo de progresión.',
    ]);
  }
  if (kdigo.stage >= 2) {
    addUnique(monitoring, ['Mantener seguimiento analítico estrecho por FRA moderado-grave.']);
  }

  if (severity.consultationTargets.includes('Nefrologia')) {
    addUnique(consults, ['Valorar aviso a Nefrología.']);
  }
  if (severity.consultationTargets.includes('UCI')) {
    addUnique(consults, ['Valorar aviso a UCI.']);
  }
  if (severity.consultationTargets.includes('Urologia')) {
    addUnique(consults, ['Valorar aviso a Urología.']);
  }

  return { general, targeted, consults, monitoring };
}
