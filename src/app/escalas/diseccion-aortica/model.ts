// Clinical wording and formulas migrated from the supplied protocol.
export type Domain = 'dom1' | 'dom2' | 'dom3';
export type ProtocolState = {
  stanfordMode: 'A' | 'B';
  temT: 'A' | 'B' | 'nonA-nonB';
  temE: 'E0' | 'E1' | 'E2' | 'E3';
  temM: 'M0' | 'M1+' | 'M2+' | 'M3+';
  lumenFilter: 'all' | 'true' | 'false';
  addrs: Record<Domain, string[]>;
  stability: 'estable' | 'inestable';
  ddimer: string;
  highSuspicionOverride: boolean;
  seqStep: 1 | 2 | 3;
  trapSimulated: boolean;
  weightKg: number;
  guideline: 'ESC' | 'AHA';
  bbContra: boolean;
  transferTasks: string[];
};

export const INITIAL_STATE: ProtocolState = {
  stanfordMode: 'A',
  temT: 'A',
  temE: 'E1',
  temM: 'M0',
  lumenFilter: 'all',
  addrs: {
    dom1: [],
    dom2: [],
    dom3: []
  },
  stability: 'estable',
  ddimer: '',
  highSuspicionOverride: false,
  seqStep: 1,
  trapSimulated: false,
  weightKg: 75,
  guideline: 'ESC',
  bbContra: false,
  transferTasks: []
};

export function getAddrsScore(state: ProtocolState) {
  return Object.values(state.addrs).filter(domain => domain.length > 0).length;
}

export function clampWeight(value: string | number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(Math.min(150, Math.max(40, parsed))) : 40;
}

export function getTemImplication(state: ProtocolState) {
  let implication = ``;
  if (state.temT === 'A') {
    implication = `Compromiso de aorta ascendente (puerta ${state.temE}). Prioridad quirúrgica absoluta y traslado inmediato a centro aórtico receptor.`;
  } else if (state.temT === 'nonA-nonB') {
    implication = `Compromiso del arco aórtico sin afectación de ascendente (puerta ${state.temE}). Riesgo intermedio-alto de propagación retrógrada; requiere valoración precoz por equipo aórtico multidisciplinar.`;
  } else {
    implication = `Disección distal a subclavia izquierda (puerta ${state.temE}). Control anti-impulso estricto en UCI y evaluación conjunta con centro receptor.`;
  }

  if (state.temM === 'M1+') {
    implication += ` Malperfusión coronaria activa (M1+): riesgo inminente de shock cardiogénico o IAM; no retrasar traslado por coronariografía.`;
  } else if (state.temM === 'M2+') {
    implication += ` Malperfusión cerebral/supraaórtica (M2+): ictus o síncope; contraindicación absoluta de trombólisis.`;
  } else if (state.temM === 'M3+') {
    implication += ` Malperfusión visceral, renal o de extremidades (M3+): define disección complicada e indica intervención urgente (TEVAR / fenestración / cirugía).`;
  } else {
    implication += ` Sin signos clínicos de malperfusión de órgano diana (M0).`;
  }

  return implication;
}

export function getDrugs(state: ProtocolState) {
  const w = state.weightKg;

  const esmololBolus = (0.5 * w).toFixed(1).replace('.', ',');
  const esmololMinMg = ((25 * w) / 1000).toFixed(2).replace('.', ',');
  const esmololMaxMg = ((50 * w) / 1000).toFixed(2).replace('.', ',');
  const nitroprusiatoMin = (0.3 * w).toFixed(1).replace('.', ',');

  return [
    {
      name: `Esmolol (Paso 2 · 1.ª línea)`,
      mech: `Betabloqueante β1 selectivo. Semivida ultracorta y titulación minuto a minuto.`,
      bolus: `0,5 mg/kg en 1 min (${esmololBolus} mg IV)`,
      infusion: `25–50 mcg/kg/min (${esmololMinMg}–${esmololMaxMg} mg/min)`,
      highlight: !state.bbContra,
      dimmed: state.bbContra
    },
    {
      name: `Labetalol (Paso 2 · 1.ª línea)`,
      mech: `Bloqueo α + β combinado; descenso conjunto de frecuencia cardíaca y TA.`,
      bolus: `Bolo inicial de 20 mg IV`,
      infusion: `0,5–2 mg/min en perfusión continua`,
      highlight: !state.bbContra,
      dimmed: state.bbContra
    },
    {
      name: `Diltiazem o Verapamilo (Paso 2 · Alternativa)`,
      mech: `Calcioantagonista no dihidropiridínico cuando el betabloqueo está contraindicado.`,
      bolus: `Titulación IV lenta según protocolo local`,
      infusion: `Perfusión controlada para meta de FC sin hipotensión severa`,
      highlight: state.bbContra,
      dimmed: !state.bbContra
    },
    {
      name: `Nicardipino (Paso 3 · Vasodilatador)`,
      mech: `Calcioantagonista arterial de ajuste rápido. Añadir solo tras betabloqueo eficaz.`,
      bolus: `Sin bolo inicial habitual`,
      infusion: `Iniciar a 5 mg/h; escalar 2,5 mg/h cada 5–15 min (máx. 15 mg/h)`,
      highlight: false,
      dimmed: false
    },
    {
      name: `Nitroprusiato sódico (Paso 3 · Vasodilatador)`,
      mech: `Vasodilatador mixto potente. Requiere betabloqueo previo obligatorio.`,
      bolus: `Sin bolo`,
      infusion: `Inicio 0,3 mcg/kg/min (${nitroprusiatoMin} mcg/min); titular según PAS`,
      highlight: false,
      dimmed: false
    },
    {
      name: `Nitroglicerina (Paso 3 · Vasodilatador)`,
      mech: `Alternativa vasodilatadora IV si persiste PAS > 120 mmHg tras betabloqueo.`,
      bolus: `Sin bolo`,
      infusion: `10–200 mcg/min en perfusión IV continua`,
      highlight: false,
      dimmed: false
    }
  ];

}

export function buildSbarText(state: ProtocolState) {
  const score = getAddrsScore(state);
  const tLabel = state.temT === 'nonA-nonB' ? `No-A No-B` : `Stanford ${state.temT}`;
  const fcMeta = state.guideline === 'ESC' ? `<= 60 lpm (ESC 2024)` : `60–80 lpm (ACC/AHA)`;
  const bbOption = state.bbContra
    ? `Diltiazem/Verapamilo IV (contraindicación a betabloqueo)`
    : `Esmolol (carga ${(0.5 * state.weightKg).toFixed(1)} mg + ${((25 * state.weightKg) / 1000).toFixed(2)}–${((50 * state.weightKg) / 1000).toFixed(2)} mg/min) o Labetalol`;
  const ddimerText = state.ddimer === '' ? `No introducido` : `${state.ddimer} ng/mL`;

  const findings = [...state.addrs.dom1, ...state.addrs.dom2, ...state.addrs.dom3];
  const findingsLine = findings.length > 0 ? findings.join(', ') : `Ninguno marcado`;

  return [
    `INFORME DE ACTIVACIÓN CÓDIGO AORTA — TRASLADO URGENTE`,
    `Origen: Servicio de Urgencias (Hospital sin Cirugía Cardiovascular)`,
    `Clasificación: ${tLabel} | Código TEM: T-${state.temT} · ${state.temE} · ${state.temM}`,
    `Estratificación: ADD-RS ${score}/3 (${state.stability.toUpperCase()}) | Dímero-D: ${ddimerText}`,
    `Hallazgos clave: ${findingsLine}`,
    `Manejo anti-impulso (${state.weightKg} kg): Analgesia opiácea IV + ${bbOption}`,
    `Metas hemodinámicas en traslado: ${fcMeta} y PAS 100–120 mmHg`,
    `Verificación pre-traslado: ${state.transferTasks.length}/8 ítems completados (incl. envío DICOM si procede).`
  ].join('\n');
}

export type Tone = 'primary' | 'error' | 'positive' | 'warning';
export function getDecision(state: ProtocolState) {
  const score = getAddrsScore(state);
  const parsed = Number(state.ddimer);
  const ddVal = state.ddimer.trim() === '' || !Number.isFinite(parsed) || parsed < 0 ? null : parsed;
  let route = '';
  let tone: Tone = 'primary';
  let headline = '';
  let detail = '';
  if (state.stability === 'inestable') {
    route = 'node-unstable';
    tone = 'error';
    headline = `Inestabilidad hemodinámica · POCUS (SPEED) urgente`;
    detail = `No trasladar a TC si existe riesgo vital inmediato. Realizar POCUS a pie de cama (ETT + aorta abdominal, sensibilidad 93,2 %), iniciar soporte y activar de inmediato al centro aórtico receptor.`;
  } else if (score >= 2 || state.highSuspicionOverride) {
    route = 'node-direct-ct';
    tone = 'error';
    const reason = score >= 2 ? `ADD-RS ${score} (>= 2)` : `Sospecha clínica alta`;
    headline = `${reason} · Angio-TC directa sin esperar Dímero-D`;
    detail = `Solicitar Angio-TC toracoabdominal urgente inmediatamente. No demorar por analítica ni Dímero-D. Iniciar control estricto de FC y PA en urgencias.`;
  } else if (ddVal !== null && !Number.isNaN(ddVal) && ddVal >= 500) {
    route = 'node-ddimer-pos';
    tone = 'primary';
    headline = `ADD-RS ${score} + Dímero-D ${ddVal} ng/mL · Realizar Angio-TC`;
    detail = `El Dímero-D supera el punto de corte (>= 500 ng/mL). Proceder a Angio-TC toracoabdominal urgente para confirmar o descartar síndrome aórtico agudo.`;
  } else if (ddVal !== null && !Number.isNaN(ddVal) && ddVal < 500) {
    route = 'node-ddimer-neg';
    tone = 'positive';
    headline = `ADD-RS ${score} + Dímero-D ${ddVal} ng/mL (< 500) · Bajo riesgo`;
    detail = `Según el estudio ADvISED, ADD-RS <= 1 con Dímero-D < 500 ng/mL permite descartar sin imagen (tasa de fallos 0,3 %), siempre que no exista sospecha clínica alta persistente.`;
  } else {
    headline = `ADD-RS ${score} (<= 1) · Solicitar Dímero-D (corte 500 ng/mL)`;
    detail = `Introduce el resultado de Dímero-D o activa la casilla de sospecha clínica alta si el cuadro sugiere síndrome aórtico agudo pese a puntuación baja.`;
  }
  return { route, tone, headline, detail };
}

export const STANFORD = {
  "A": {
    "badge": "Stanford Tipo A (~70 %) · Emergencia quirúrgica",
    "description": "Compromete la aorta torácica ascendente independientemente del sitio del desgarro primario (DeBakey I o II). Alto riesgo de oclusión coronaria, insuficiencia aórtica aguda, taponamiento cardíaco y rotura. Requiere traslado urgente directo a centro con cirugía cardiovascular."
  },
  "B": {
    "badge": "Stanford Tipo B (~30 %) · Tratamiento médico salvo complicaciones",
    "description": "No compromete la aorta torácica ascendente; afecta distalmente al origen de la subclavia izquierda (DeBakey III). Manejo médico inicial con terapia anti-impulso estricta; requiere traslado urgente para TEVAR o cirugía si presenta malperfusión, dolor refractario, expansión o ruptura."
  }
};

export const SEQUENCE = [
  {
    "headline": "Alerta fisiológica · Taquicardia refleja y aumento de dP/dt",
    "detail": "Administrar un vasodilatador arterial puro (nicardipino o nitroprusiato) antes de frenar la frecuencia cardíaca desencadena descarga simpática y taquicardia refleja, incrementando el estrés parietal (dP/dt) y el riesgo de propagación o rotura de la disección."
  },
  {
    "headline": "Paso 1 activo · Analgesia prioritaria",
    "detail": "Asegurar oxigenación, ventilación y dos catéteres IV de grueso calibre. Monitorización continua de ECG, presión arterial y diuresis. Administrar opiáceos IV antes de valorar la respuesta hemodinámica definitiva."
  },
  {
    "headline": "Paso 2 activo · Betabloqueo IV antes de vasodilatar",
    "detail": "Titular esmolol o labetalol IV hasta lograr FC <= 60 lpm (ESC 2024) o 60–80 lpm (ACC/AHA). No hay diferencia demostrada de superioridad entre esmolol y labetalol: elige según disponibilidad y perfil tensional."
  },
  {
    "headline": "Paso 3 activo · Vasodilatación añadida",
    "detail": "Solo si tras alcanzar la frecuencia objetivo la PAS permanece por encima de 120 mmHg, añadir nicardipino, nitroprusiato sódico o nitroglicerina en perfusión continua hasta PAS 100–120 mmHg (o mínima que preserve perfusión)."
  }
];
export const REFERENCES = "Guía rápida del Síndrome Aórtico Agudo (SSPA); Capítulo 14 de Disección Aórtica (Chaud, Paladini, Martínez Colombres); Protocolo de Urgencias de Disección Aórtica (ADD-RS, estudio ADvISED, protocolo SPEED POCUS, guías ESC 2024, ACC/AHA 2022 y ACEP 2025); Revisión clínico-radiológica en Angio-TC (Nuevo Hospital 2025 y CADI 2024); Fisiopatología y subclasificación Stanford/Weiss (Revista Médica Clínica Las Condes 2022); Tratamiento de los síndromes aórticos agudos (Revista Española de Cardiología). Este recurso apoya la toma de decisiones clínicas y no sustituye el juicio médico individualizado ni los circuitos locales vigentes.";
