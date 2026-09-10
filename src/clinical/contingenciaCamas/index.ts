export type ContingencyPhase = 0 | 1 | 2 | 3 | 4;

export type ContingencyState = {
  pendingLevel2: number;
  occupiedLevel2: number;
  pendingObservation: number;
  occupiedObservation: number;
  polyvalent: number;
  ordinaryHours: boolean;
  forecastUnfavourable: boolean;
  bedsUnavailable: boolean;
  pendingDischarges: boolean;
  phase2Implemented: boolean;
  phase3Implemented: boolean;
  persistentBlock: boolean;
  noImmediateCapacity: boolean;
};

export function getContingencyTotals(state: ContingencyState) {
  const level2 = state.pendingLevel2 + state.occupiedLevel2;
  const observation = state.pendingObservation + state.occupiedObservation;
  return { level2, observation, pendingAdmissions: state.pendingLevel2 + state.pendingObservation };
}

export type ContingencyAction = { text: string; responsible: string };

export type ContingencyResult = {
  phase: ContingencyPhase;
  phaseName: string;
  criteriaMet: string[];
  criteriaMissing: string[];
  anticipatedActivation: boolean;
  rationale: string;
  actions: ContingencyAction[];
  responsibilities: {
    activation: string;
    beds: string;
    communication: string;
    operationalReference: string;
  };
  reportText: string;
  unclassifiedSituation: boolean;
};

const PHASE_NAMES: Record<ContingencyPhase, string> = {
  0: 'Normalidad operativa',
  1: 'Tensión moderada',
  2: 'Inicio de saturación',
  3: 'Situación crítica',
  4: 'Bloqueo completo',
};

const BASE_ACTIONS: ContingencyAction[] = [
  { text: 'Gestión ordinaria de camas, altas, ingresos y traslados.', responsible: 'Gestión de Camas y equipos asistenciales' },
  { text: 'Seguimiento preventivo de la previsión de ingresos y altas.', responsible: 'Urgencias y Gestión de Camas' },
];

const PHASE_ACTIONS: Record<ContingencyPhase, ContingencyAction[]> = {
  0: BASE_ACTIONS,
  1: [
    { text: 'Activar circuito de aviso y coordinación.', responsible: 'Responsables de activación según horario' },
    { text: 'Modificar temporalmente el circuito ordinario de asignación de camas.', responsible: 'Gestión de Camas y Dirección de Enfermería / Supervisión General' },
    { text: 'Priorizar camas para pacientes con ingreso indicado en Observación y pendientes de alta de UCI, con criterios clínicos y de seguridad.', responsible: 'Gestión de Camas, facultativos especialistas y unidades implicadas' },
    { text: 'Solicitar valoración prioritaria de ingresos pendientes en Urgencias.', responsible: 'Facultativos especialistas correspondientes' },
    { text: 'Priorizar altas hospitalarias a primera hora, procurando formalizarlas antes de las 12:00 cuando sea posible.', responsible: 'Equipos médicos de hospitalización' },
    { text: 'Habilitar solárium de plantas Centro para pacientes pendientes de alta, máximo 12 camas.', responsible: 'Unidades de hospitalización y Gestión de Camas' },
    { text: 'Utilizar área polivalente si es necesario, máximo 4 puestos y según profesionales disponibles.', responsible: 'Referente operativo de Nivel 2 y Supervisión' },
    { text: 'Informar a pacientes y familiares y, cuando proceda, al Servicio de Emergencias Sanitarias.', responsible: 'Equipo asistencial y responsables del plan' },
  ],
  2: [
    { text: 'Mantener todas las medidas de Fase 1.', responsible: 'Responsables de activación y equipos de Fase 1' },
    { text: 'Contactar con Coordinación Quirúrgica para revisar programación y favorecer UCSI cuando sea posible.', responsible: 'Coordinación Quirúrgica' },
    { text: 'Ocupar efectivamente los solárium de plantas Centro con pacientes pendientes de alta.', responsible: 'Unidades de hospitalización y Gestión de Camas' },
    { text: 'Trasladar a camas convencionales de plantas Centro a pacientes con ingreso indicado desde Observación, objetivo de liberar hasta 12 camas.', responsible: 'Gestión de Camas, facultativos y unidades de hospitalización' },
    { text: 'Habilitar solárium de plantas Sur para pacientes pendientes de alta, máximo 12 camas.', responsible: 'Unidades de hospitalización y Gestión de Camas' },
    { text: 'Mantener área polivalente, máximo 4 puestos.', responsible: 'Referente operativo de Nivel 2 y Supervisión' },
    { text: 'Revisar continuamente ingresos pendientes, altas previstas y necesidades de transporte sanitario.', responsible: 'Urgencias, Gestión de Camas y transporte sanitario' },
  ],
  3: [
    { text: 'Mantener las medidas acumulativas de las fases anteriores.', responsible: 'Responsables del plan y equipos asistenciales' },
    { text: 'Ocupar efectivamente los solárium de plantas Sur con pacientes pendientes de alta.', responsible: 'Unidades de hospitalización y Gestión de Camas' },
    { text: 'Trasladar a camas convencionales de plantas Sur a pacientes con ingreso indicado desde Observación, objetivo de liberar hasta 12 camas adicionales.', responsible: 'Gestión de Camas, facultativos y unidades de hospitalización' },
    { text: 'Habilitar solárium de plantas Norte para pacientes pendientes de alta, máximo 4.', responsible: 'Unidades de hospitalización y Gestión de Camas' },
    { text: 'Valorar derivaciones externas u otras medidas de apoyo.', responsible: 'Responsables del plan' },
  ],
  4: [
    { text: 'Mantener todas las medidas acumulativas anteriores.', responsible: 'Responsables del plan y equipos asistenciales' },
    { text: 'Ocupar solárium Norte, máximo 4 pacientes pendientes de alta.', responsible: 'Unidades de hospitalización y Gestión de Camas' },
    { text: 'Trasladar a camas convencionales Norte hasta 4 pacientes con ingreso indicado desde Urgencias.', responsible: 'Gestión de Camas, facultativos y unidades de hospitalización' },
    { text: 'Mantener coordinación permanente.', responsible: 'Responsables de activación según horario' },
    { text: 'Adoptar medidas extraordinarias, incluidas derivaciones externas.', responsible: 'Responsables del plan' },
  ],
};

export function getInheritedPhaseMeasures(phase: ContingencyPhase) {
  return Array.from({ length: Math.max(0, phase - 1) }, (_, index) => index + 1)
    .map((inheritedPhase) => ({
      phase: inheritedPhase as ContingencyPhase,
      actions: PHASE_ACTIONS[inheritedPhase as ContingencyPhase].filter(
        (action) => !action.text.toLowerCase().startsWith('mantener')
      ),
    }))
    .filter(({ actions }) => actions.length > 0);
}

function responsibilities(ordinaryHours: boolean) {
  return ordinaryHours
    ? {
        activation: 'Dirección Médica y Dirección de Enfermería',
        beds: 'Admisión / Gestión de Camas junto con Dirección de Enfermería',
        communication:
          'Gestión de Camas comunica a Dirección de Enfermería, que coordina con Dirección Médica. La fase y las medidas adoptadas se comunican a los servicios y unidades afectados y a la Jefatura de Personal Subalterno.',
        operationalReference:
          'Profesional de enfermería más veterano presente en el turno, como referente operativo del Nivel 2',
      }
    : {
        activation: 'Jefe/a de Guardia y Supervisor/a General',
        beds: 'Supervisión General',
        communication:
          'Admisión de Urgencias comunica a Supervisión General, que lo traslada a Jefe/a de Guardia. La fase y las medidas adoptadas se comunican a los servicios y unidades afectados y a la Jefatura de Personal Subalterno.',
        operationalReference:
          'Profesional de enfermería más veterano presente en el turno, como referente operativo del Nivel 2',
      };
}

function phaseCriteria(state: ContingencyState) {
  const { level2, observation, pendingAdmissions } = getContingencyTotals(state);
  const phase0 = level2 <= 14 && observation <= 14 && state.polyvalent === 0;
  const phase1 = level2 >= 16 || (observation >= 15 && observation <= 18);
  const phase2 = level2 === 18 || observation >= 19;
  const phase3 = state.phase2Implemented && level2 === 18 && observation === 21 && state.polyvalent === 4 && pendingAdmissions > 0;
  const phase4 =
    state.phase2Implemented &&
    state.phase3Implemented &&
    state.persistentBlock &&
    level2 === 18 &&
    observation === 21 &&
    state.polyvalent === 4 &&
    pendingAdmissions > 0 &&
    state.noImmediateCapacity;
  return { phase0, phase1, phase2, phase3, phase4 };
}

export function determineContingencyPhase(state: ContingencyState): ContingencyResult {
  const { level2, observation, pendingAdmissions } = getContingencyTotals(state);
  const criteria = phaseCriteria(state);
  const completePhase: ContingencyPhase = criteria.phase4 ? 4 : criteria.phase3 ? 3 : criteria.phase2 ? 2 : criteria.phase1 ? 1 : criteria.phase0 ? 0 : 0;
  const context = state.forecastUnfavourable || state.bedsUnavailable || state.pendingDischarges || state.persistentBlock || state.noImmediateCapacity;
  let phase = completePhase;
  let anticipatedActivation = false;

  if (context && completePhase < 4) {
    const nextPhase = completePhase === 0 ? 1 : completePhase === 1 ? 2 : completePhase === 2 && state.phase2Implemented ? 3 : completePhase === 3 ? 4 : 1;
    const target4 =
      nextPhase === 4 &&
      state.phase2Implemented &&
      state.phase3Implemented &&
      state.persistentBlock &&
      pendingAdmissions > 0 &&
      state.noImmediateCapacity;
    const target3 = nextPhase === 3 && state.phase2Implemented;
    const target2 = nextPhase === 2 && (state.forecastUnfavourable || state.bedsUnavailable || state.pendingDischarges);
    if (target4 || target3 || target2 || nextPhase === 1) {
      phase = nextPhase as ContingencyPhase;
      anticipatedActivation = !criteria[`phase${phase}` as keyof typeof criteria];
    }
  }

  const unclassifiedSituation = phase === 0 && !criteria.phase0;
  const met: string[] = [];
  const missing: string[] = [];

  if (unclassifiedSituation) {
    missing.push('Situación intermedia: no encaja completamente en los umbrales definidos del plan');
  } else if (phase === 0) {
    if (level2 <= 14) met.push(`Nivel 2 dentro de normalidad (${level2}/18)`);
    if (observation <= 14) met.push(`Observación dentro de normalidad (${observation}/21)`);
    if (state.polyvalent === 0) met.push('Área polivalente sin uso');
  } else if (phase === 1) {
    if (level2 >= 16) met.push(`Nivel 2 ${level2}/18 supera el 90%`);
    if (observation >= 15 && observation <= 18) {
      met.push(`Observación ${observation}/21 se encuentra entre el 70% y el 90% aproximadamente`);
    }
    if (met.length === 0) missing.push('Nivel 2 con 16-18 boxes u Observación con 15-18 camas aproximadamente');
  } else if (phase === 2) {
    if (level2 === 18) met.push('Nivel 2 al 100% (18/18)');
    if (observation >= 19) met.push(`Observación por encima del 90% (${observation}/21)`);
    if (met.length === 0) missing.push('Nivel 2 al 100% u Observación con 19 o más camas');
  } else if (phase === 3) {
    if (state.phase2Implemented) met.push('Fase 2 plenamente implantada');
    if (level2 === 18) met.push('Nivel 2 al 100% (18/18)');
    if (observation === 21) met.push('Observación al 100% (21/21)');
    if (state.polyvalent === 4) met.push('Área polivalente completa (4/4)');
    if (pendingAdmissions > 0) met.push(`Persisten ${pendingAdmissions} pacientes pendientes de ingreso`);
    if (met.length < 5) missing.push('Debe cumplirse el conjunto de criterios orientativos de Fase 3');
  } else {
    if (state.phase2Implemented) met.push('Fase 2 plenamente implantada');
    if (state.phase3Implemented) met.push('Fase 3 plenamente implantada');
    if (level2 === 18) met.push('Nivel 2 al 100% (18/18)');
    if (observation === 21) met.push('Observación al 100% (21/21)');
    if (state.polyvalent === 4) met.push('Área polivalente ocupada (4/4)');
    if (pendingAdmissions > 0) met.push(`Existen ${pendingAdmissions} pacientes pendientes de ingreso`);
    if (state.persistentBlock) met.push('Persiste el bloqueo pese a las fases previas');
    if (state.noImmediateCapacity) met.push('No existe capacidad inmediata para absorber los ingresos pendientes');
    if (met.length < 8) missing.push('Debe cumplirse el conjunto de criterios orientativos de Fase 4');
  }

  const activation = responsibilities(state.ordinaryHours);
  const pendingDescription = pendingAdmissions === 1 ? '1 paciente pendiente de ingreso' : `${pendingAdmissions} pacientes pendientes de ingreso`;
  const occupancy = `Nivel 2 ${level2}/18 (${Math.round((level2 / 18) * 1000) / 10}% de ocupación), Observación ${observation}/21 (${Math.round((observation / 21) * 1000) / 10}% de ocupación), área polivalente ${state.polyvalent}/4 y ${pendingDescription}`;
  const rationale = anticipatedActivation
    ? `La situación no reúne necesariamente todos los criterios simultáneos de Fase ${phase}, si bien la previsión asistencial y/o la disponibilidad real de camas permite valorar su activación anticipada conforme al PLAN-HOSP-01.`
    : `La situación es compatible con Fase ${phase} porque ${phase === 0 && criteria.phase0 ? 'se mantiene dentro de los umbrales orientativos de normalidad' : phase === 0 ? 'no se cumplen de forma completa los criterios de una fase superior y requiere valoración organizativa' : 'se cumplen los criterios orientativos de ocupación y contexto disponibles'}; la fase estimada debe ser validada por los responsables del plan.`;
  const phaseDescription = unclassifiedSituation
    ? 'La situación no encaja completamente en una fase definida del PLAN-HOSP-01 y requiere valoración organizativa.'
    : `La situación resulta compatible con Fase ${phase} (${PHASE_NAMES[phase]}) conforme a los criterios orientativos del PLAN-HOSP-01.`;
  const reportText = `Situación asistencial: ${occupancy}. ${phaseDescription} Corresponde a ${activation.activation} valorar y, en su caso, activar la fase, con coordinación de la gestión de camas a cargo de ${activation.beds}. ${anticipatedActivation ? rationale + ' ' : ''}El referente operativo del Nivel 2 será ${activation.operationalReference}. Se indican las medidas acumulativas previstas para la fase, manteniendo seguimiento periódico de ocupación, ingresos pendientes, altas previstas, disponibilidad real de camas y necesidades de transporte.`;

  return {
    phase,
    phaseName: unclassifiedSituation ? 'Valoración organizativa (situación intermedia)' : PHASE_NAMES[phase],
    criteriaMet: met,
    criteriaMissing: missing,
    anticipatedActivation,
    rationale,
    actions: PHASE_ACTIONS[phase],
    responsibilities: activation,
    reportText,
    unclassifiedSituation,
  };
}
