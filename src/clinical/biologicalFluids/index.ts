export type ProcedureId =
  | 'paracentesis'
  | 'artrocentesis'
  | 'puncion-lumbar'
  | 'toracocentesis';

export type ProcedureInfo = {
  id: ProcedureId;
  title: string;
  shortTitle: string;
  fluidLabel: string;
  description: string;
  indications: string[];
  contraindications: string[];
  extraCards?: Array<{
    title: string;
    description: string;
    contraindications?: string[];
    indications?: string[];
  }>;
};

export type ParacentesisInput = {
  appearance: 'clear' | 'hematic' | 'milky' | 'brown' | 'other';
  totalLeukocytes: number | null;
  pmn: number | null;
  rbc: number | null;
  serumAlbumin: number | null;
  asciticAlbumin: number | null;
  glucose: number | null;
  ldh: number | null;
  serumLdhUpperLimit: number | null;
  mononuclearPredominance: boolean;
  amylase: number | null;
  litersDrained: number | null;
};

export type ArthrocentesisInput = {
  viscosity: 'high' | 'low' | 'variable';
  clarity: 'transparent' | 'translucent' | 'opaque' | 'bloody';
  color: 'clear' | 'yellowish' | 'intense-yellow' | 'purulent' | 'red';
  leukocytes: number | null;
  culturePositive: boolean;
  crystals: 'none' | 'urate' | 'cppd' | 'hydroxyapatite';
};

export type LumbarPunctureInput = {
  openingPressure: 'high' | 'normal' | 'indeterminate';
  aspect: 'clear' | 'turbid';
  leukocytes: number | null;
  rbc: number | null;
  predominantCellularity: 'mn' | 'pmn' | 'variable';
  glucosePercent: number | null;
  proteins: number | null;
  lactate: number | null;
};

export type ThoracentesisInput = {
  pleuralProteins: number | null;
  serumProteins: number | null;
  pleuralLdh: number | null;
  serumLdh: number | null;
  serumLdhUpperLimit: number | null;
  pleuralAlbumin: number | null;
  serumAlbumin: number | null;
};

export type BiologicalFluidInputs = {
  paracentesis: ParacentesisInput;
  artrocentesis: ArthrocentesisInput;
  'puncion-lumbar': LumbarPunctureInput;
  toracocentesis: ThoracentesisInput;
};

export type Interpretation = {
  title: string;
  label: string;
  summary: string;
  findings: string[];
  nextSteps: string[];
  alerts: string[];
  calculations: Array<{
    label: string;
    value: string;
    note?: string;
  }>;
  reportText: string;
};

export const PROCEDURE_INFO: ProcedureInfo[] = [
  {
    id: 'paracentesis',
    title: 'Paracentesis',
    shortTitle: 'Ascitis',
    fluidLabel: 'Líquido ascítico',
    description:
      'Extracción por punción percutánea de líquido de la cavidad abdominal. Técnica sencilla y generalmente segura.',
    indications: [
      'Diagnóstico etiológico de la ascitis.',
      'Evacuación de ascitis refractaria al tratamiento médico.',
      'Despistaje de peritonitis bacteriana espontánea y secundaria.',
      'En general, realizar a todo paciente con cirrosis descompensada que consulte por una complicación en Urgencias.',
    ],
    contraindications: [
      'Única contraindicación absoluta: fibrinólisis o coagulación intravascular diseminada.',
      'Puede realizarse con INR > 5 y plaquetas < 20.000/mm³ en situaciones seleccionadas.',
      'Si hay anatomía complicada, poco líquido, embarazo, visceromegalias, globo vesical o dilatación intestinal, debe guiarse por ecografía.',
    ],
  },
  {
    id: 'artrocentesis',
    title: 'Artrocentesis',
    shortTitle: 'Líquido sinovial',
    fluidLabel: 'Líquido articular',
    description: 'Obtención de líquido articular mediante punción percutánea.',
    indications: [
      'Diagnóstico etiológico de monoartritis séptica y cristalina.',
      'Tratamiento de hemartros y derrames a tensión.',
      'Tratamiento del quiste de Baker e infiltración articular.',
    ],
    contraindications: [
      'Alteración grave de la hemostasia (AP < 50% o plaquetas < 50.000/mm³).',
      'Infección de la zona de punción.',
    ],
  },
  {
    id: 'puncion-lumbar',
    title: 'Punción lumbar',
    shortTitle: 'LCR',
    fluidLabel: 'Líquido cefalorraquídeo',
    description:
      'Acceso al espacio subaracnoideo para extracción de LCR, medición de la presión intracraneal o administración de sustancias.',
    indications: [
      'Diagnóstico de infección del sistema nervioso central.',
      'Diagnóstico de hemorragia subaracnoidea u otra patología neurológica.',
      'Administración de medicamentos.',
    ],
    contraindications: [
      'Hipertensión intracraneal por masas u obstrucción del sistema ventricular.',
      'Debe descartarse con exploración neurológica y fondo de ojo y/o TC craneal cuando proceda.',
      'Tratamiento anticoagulante o alteración de la hemostasia (INR > 1,4 o plaquetas < 50.000/mm³).',
    ],
    extraCards: [
      {
        title: 'Procesado de la muestra',
        description:
          'La muestra de LCR se recoge idealmente en tres tubos secos y estériles (1-2 ml por tubo). El primer tubo presenta más riesgo de contaminación y de contener hematíes en PL traumática.',
        indications: [
          'Enviar el tubo menos turbio o hemático para estudio citobioquímico.',
          'Reservar dos tubos para estudios microbiológicos.',
        ],
      },
    ],
  },
  {
    id: 'toracocentesis',
    title: 'Toracocentesis',
    shortTitle: 'Pleural',
    fluidLabel: 'Líquido pleural',
    description:
      'Extracción de líquido o aire del espacio pleural cuando se encuentra ocupado. Debe evitarse la comunicación directa con la atmósfera para prevenir neumotórax iatrogénico.',
    indications: [
      'Diagnóstico etiológico de un derrame pleural.',
      'Evacuación de cantidades pequeñas-moderadas de aire o líquido pleural.',
      'En general no se recomienda extraer más de 1-1,5 litros mediante toracocentesis, salvo control por manometría pleural.',
    ],
    contraindications: [
      'No realizar si existe indicación directa de colocación de drenaje endotorácico.',
      'Contraindicaciones relativas: INR > 2 o plaquetas < 50.000/mm³.',
      'Contraindicación relativa adicional: soporte ventilatorio con presiones elevadas.',
    ],
    extraCards: [
      {
        title: 'Drenaje endotorácico',
        description:
          'Permite evacuar aire o líquido del espacio pleural mediante un tubo torácico, favoreciendo la expansión pulmonar.',
        contraindications: [
          'Contraindicación relativa: coagulopatía (plaquetas < 50.000 y actividad de protrombina < 65%).',
          'Puede obviarse en situaciones de extrema urgencia.',
        ],
      },
    ],
  },
];

export function createDefaultBiologicalFluidInputs(): BiologicalFluidInputs {
  return {
    paracentesis: {
      appearance: 'clear',
      totalLeukocytes: null,
      pmn: null,
      rbc: null,
      serumAlbumin: null,
      asciticAlbumin: null,
      glucose: null,
      ldh: null,
      serumLdhUpperLimit: null,
      mononuclearPredominance: false,
      amylase: null,
      litersDrained: null,
    },
    artrocentesis: {
      viscosity: 'high',
      clarity: 'transparent',
      color: 'clear',
      leukocytes: null,
      culturePositive: false,
      crystals: 'none',
    },
    'puncion-lumbar': {
      openingPressure: 'indeterminate',
      aspect: 'clear',
      leukocytes: null,
      rbc: null,
      predominantCellularity: 'mn',
      glucosePercent: null,
      proteins: null,
      lactate: null,
    },
    toracocentesis: {
      pleuralProteins: null,
      serumProteins: null,
      pleuralLdh: null,
      serumLdh: null,
      serumLdhUpperLimit: null,
      pleuralAlbumin: null,
      serumAlbumin: null,
    },
  };
}

export function evaluateBiologicalFluidProcedure(
  procedure: ProcedureId,
  inputs: BiologicalFluidInputs
): Interpretation {
  switch (procedure) {
    case 'paracentesis':
      return evaluateParacentesis(inputs.paracentesis);
    case 'artrocentesis':
      return evaluateArthrocentesis(inputs.artrocentesis);
    case 'puncion-lumbar':
      return evaluateLumbarPuncture(inputs['puncion-lumbar']);
    case 'toracocentesis':
      return evaluateThoracentesis(inputs.toracocentesis);
  }
}

function formatNumber(value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) return 'No disponible';
  return value.toFixed(digits).replace(/\.0$/u, '');
}

function addIfPresent(items: string[], condition: boolean, text: string) {
  if (condition) items.push(text);
}

function buildReport(
  header: string,
  summary: string,
  findings: string[],
  nextSteps: string[],
  alerts: string[]
) {
  const lines = [
    header,
    `Conclusión: ${summary}`,
    findings.length > 0 ? `Datos de apoyo: ${findings.join(' · ')}` : null,
    nextSteps.length > 0 ? `Siguiente paso orientativo: ${nextSteps.join(' · ')}` : null,
    alerts.length > 0 ? `Alertas: ${alerts.join(' · ')}` : null,
  ];

  return lines.filter(Boolean).join('\n');
}

function evaluateParacentesis(input: ParacentesisInput): Interpretation {
  const findings: string[] = [];
  const nextSteps: string[] = [];
  const alerts: string[] = [];
  const calculations: Interpretation['calculations'] = [];
  const saag =
    input.serumAlbumin !== null && input.asciticAlbumin !== null
      ? input.serumAlbumin - input.asciticAlbumin
      : null;
  const correctedLeukocytes =
    input.totalLeukocytes !== null && input.rbc !== null && input.rbc > 10000
      ? Math.max(0, input.totalLeukocytes - input.rbc / 750)
      : input.totalLeukocytes;
  const correctedPmn =
    input.pmn !== null && input.rbc !== null && input.rbc > 10000
      ? Math.max(0, input.pmn - input.rbc / 250)
      : input.pmn;

  if (input.totalLeukocytes !== null) {
    calculations.push({
      label: 'Leucocitos medidos',
      value: `${formatNumber(input.totalLeukocytes, 0)} /mm³`,
    });
  }

  if (correctedLeukocytes !== null && correctedLeukocytes !== input.totalLeukocytes) {
    calculations.push({
      label: 'Leucocitos corregidos',
      value: `${formatNumber(correctedLeukocytes, 0)} /mm³`,
      note: 'Corrección aplicada por ascitis hemática (>10.000 hematíes/mm³).',
    });
  }

  if (input.pmn !== null) {
    calculations.push({ label: 'PMN medidos', value: `${formatNumber(input.pmn, 0)} /mm³` });
  }

  if (correctedPmn !== null && correctedPmn !== input.pmn) {
    calculations.push({
      label: 'PMN corregidos',
      value: `${formatNumber(correctedPmn, 0)} /mm³`,
      note: 'Corrección aplicada por ascitis hemática (>10.000 hematíes/mm³).',
    });
  }

  if (input.serumAlbumin !== null) {
    calculations.push({
      label: 'Albúmina sérica',
      value: `${formatNumber(input.serumAlbumin, 1)} g/dl`,
    });
  }

  if (input.asciticAlbumin !== null) {
    calculations.push({
      label: 'Albúmina ascítica',
      value: `${formatNumber(input.asciticAlbumin, 1)} g/dl`,
    });
  }

  if (saag !== null) {
    calculations.push({
      label: 'GASA',
      value: `${formatNumber(saag, 1)} g/dl`,
      note: 'Gradiente seroascítico de albúmina = albúmina sérica - albúmina ascítica.',
    });
  }

  if (input.appearance === 'milky') {
    findings.push('Aspecto lechoso.');
    nextSteps.push('Si persiste la sospecha, solicitar triglicéridos en líquido ascítico para descartar ascitis quilosa.');
  }

  if (input.appearance === 'brown') {
    findings.push('Aspecto marronáceo.');
    nextSteps.push('Si la sospecha clínica lo justifica, solicitar bilirrubina en líquido ascítico y completar estudio hepatobiliar.');
  }

  if (input.appearance === 'hematic') {
    addIfPresent(findings, input.rbc !== null, `Ascitis hemática (${formatNumber(input.rbc, 0)} hematíes/mm³).`);
  }

  if (correctedPmn !== null && correctedPmn >= 250) {
    alerts.push('PMN >= 250/mm³: tratar como infección peritoneal hasta demostrar lo contrario.');
    findings.push(`PMN compatibles con ascitis neutrocítica (${formatNumber(correctedPmn, 0)} /mm³).`);

    if (input.amylase !== null && input.amylase > 100) {
      findings.push(`Amilasa elevada (${formatNumber(input.amylase, 0)} UI/l).`);
      nextSteps.push('Solicitar TC abdominal con protocolo pancreático.');
      return finalizedInterpretation(
        'Ascitis pancreática',
        'Sospecha alta',
        'La ascitis neutrocítica con amilasa > 100 UI/l orienta a ascitis pancreática.',
        findings,
        nextSteps,
        alerts,
        calculations
      );
    }

    const suggestsSecondary =
      input.glucose !== null &&
      input.glucose < 50 &&
      input.ldh !== null &&
      input.serumLdhUpperLimit !== null &&
      input.ldh > input.serumLdhUpperLimit;

    if (suggestsSecondary) {
      addIfPresent(findings, input.glucose !== null && input.glucose < 50, `Glucosa baja (${formatNumber(input.glucose, 0)} mg/dl).`);
      addIfPresent(
        findings,
        input.ldh !== null &&
          input.serumLdhUpperLimit !== null &&
          input.ldh > input.serumLdhUpperLimit,
        `LDH elevada (${formatNumber(input.ldh, 0)} UI/l; superior al límite sérico normal).`
      );
      nextSteps.push('Solicitar TC abdominopélvica urgente con contraste i.v. si es viable.');
      nextSteps.push('Iniciar antibioterapia y valorar control del foco.');
      nextSteps.push('Sospechar perforación de víscera hueca si el recuento neutrofílico es muy alto o la respuesta al tratamiento es inadecuada.');
      return finalizedInterpretation(
        'Peritonitis bacteriana secundaria',
        'Sospecha alta',
        'La ascitis neutrocítica con glucosa baja y LDH elevada obliga a sospechar peritonitis bacteriana secundaria.',
        findings,
        nextSteps,
        alerts,
        calculations
      );
    }

    const supportsSpontaneous =
      (input.glucose === null || input.glucose >= 50) &&
      (input.ldh === null ||
        input.serumLdhUpperLimit === null ||
        input.ldh <= input.serumLdhUpperLimit);

    if (supportsSpontaneous) {
      nextSteps.push('Iniciar antibioterapia dirigida a peritonitis bacteriana espontánea.');
      nextSteps.push('El recuento leucocitario/PMN debería valorarse de forma precoz, idealmente en la primera hora tras la paracentesis.');
      return finalizedInterpretation(
        'Peritonitis bacteriana espontánea probable',
        'Sospecha alta',
        'La ascitis neutrocítica sin datos analíticos de alarma para secundaria orienta primero a peritonitis bacteriana espontánea.',
        findings,
        nextSteps,
        alerts,
        calculations
      );
    }

    nextSteps.push('Valorar infección peritoneal primaria frente a secundaria según contexto y repetir estudio microbiológico.');
    nextSteps.push('Si predominan células mononucleares, pensar en carcinomatosis o tuberculosis peritoneal.');
    return finalizedInterpretation(
      'Ascitis neutrocítica',
      'Sospecha intermedia',
      'Hay PMN >= 250/mm³, pero faltan datos suficientes para discriminar con seguridad entre PBE y peritonitis secundaria.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  if (correctedPmn !== null) {
    findings.push(`PMN < 250/mm³ (${formatNumber(correctedPmn, 0)} /mm³).`);
  }

  if (saag !== null) {
    if (saag >= 1.1) {
      nextSteps.push('Orienta a ascitis por hipertensión portal; correlacionar con hepatopatía, insuficiencia cardiaca u otras causas clínicas.');
      return finalizedInterpretation(
        'Ascitis por hipertensión portal',
        'Sospecha alta',
        'GASA >= 1,1 orienta a ascitis por hipertensión portal.',
        findings,
        nextSteps,
        alerts,
        calculations
      );
    }

    addIfPresent(findings, input.mononuclearPredominance, 'Predominio mononuclear.');
    if (input.mononuclearPredominance) {
      nextSteps.push('Si persiste la sospecha, ampliar estudio con ADA, micobacterias y citología fuera del circuito inmediato de Urgencias.');
    } else {
      nextSteps.push('Completar estudio etiológico no portal según contexto clínico.');
    }
    return finalizedInterpretation(
      'Ascitis no portal',
      'Sospecha intermedia',
      'GASA < 1,1 orienta a ascitis no relacionada con hipertensión portal.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  nextSteps.push('Completar al menos PMN, albúmina sérica y albúmina ascítica para afinar la orientación.');
  return finalizedInterpretation(
    'Orientación insuficiente',
    'Datos incompletos',
    'Con los datos actuales no se puede encajar la ascitis en uno de los patrones de referencia principales.',
    findings,
    nextSteps,
    alerts,
    calculations
  );
}

function evaluateArthrocentesis(input: ArthrocentesisInput): Interpretation {
  const findings: string[] = [];
  const nextSteps: string[] = [];
  const alerts: string[] = [];
  const calculations: Interpretation['calculations'] = [];

  if (input.leukocytes !== null) {
    calculations.push({
      label: 'Leucocitos',
      value: `${formatNumber(input.leukocytes, 0)} /mm³`,
    });
  }

  if (input.culturePositive || (input.leukocytes !== null && input.leukocytes > 100000) || input.color === 'purulent') {
    addIfPresent(findings, input.culturePositive, 'Cultivo positivo.');
    addIfPresent(findings, input.color === 'purulent', 'Aspecto purulento.');
    addIfPresent(
      findings,
      input.leukocytes !== null && input.leukocytes > 100000,
      `Leucocitos > 100.000/mm³ (${formatNumber(input.leukocytes, 0)}).`
    );
    alerts.push('Descartar artritis séptica y priorizar drenaje/antibioterapia.');
    nextSteps.push('Enviar cultivo y comenzar cobertura antibiótica según contexto clínico.');
    return finalizedInterpretation(
      'Artritis séptica',
      'Sospecha alta',
      'El patrón del líquido sinovial es compatible con artritis séptica.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  if (input.clarity === 'bloody' || input.color === 'red') {
    addIfPresent(findings, true, 'Líquido sanguinolento/rojo.');
    addIfPresent(
      findings,
      input.leukocytes !== null && input.leukocytes >= 200 && input.leukocytes <= 2000,
      `Rango leucocitario compatible con hemartros (${formatNumber(input.leukocytes, 0)} /mm³).`
    );
    nextSteps.push('Correlacionar con traumatismo, anticoagulación o coagulopatía.');
    return finalizedInterpretation(
      'Hemartros',
      'Sospecha alta',
      'El líquido articular tiene un patrón compatible con hemartros.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  if (input.crystals !== 'none') {
    const crystalLabel =
      input.crystals === 'urate'
        ? 'Urato monosódico'
        : input.crystals === 'cppd'
          ? 'Pirofosfato cálcico'
          : 'Hidroxiapatita';
    findings.push(`Cristales identificados: ${crystalLabel}.`);
    nextSteps.push('Correlacionar con artritis microcristalina y clínica articular.');
    return finalizedInterpretation(
      'Artritis microcristalina / inflamatoria',
      'Sospecha alta',
      'La presencia de cristales orienta a artritis microcristalina dentro de un patrón inflamatorio.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  if (
    (input.leukocytes !== null && input.leukocytes >= 1000) ||
    input.viscosity === 'low' ||
    input.clarity === 'translucent' ||
    input.color === 'intense-yellow'
  ) {
    addIfPresent(findings, input.viscosity === 'low', 'Viscosidad baja.');
    addIfPresent(findings, input.clarity === 'translucent', 'Aspecto translúcido.');
    addIfPresent(findings, input.color === 'intense-yellow', 'Color amarillo intenso.');
    addIfPresent(
      findings,
      input.leukocytes !== null,
      `Leucocitos en rango inflamatorio (${formatNumber(input.leukocytes, 0)} /mm³).`
    );
    nextSteps.push('Valorar artritis inflamatoria o cristalina según contexto clínico.');
    return finalizedInterpretation(
      'Derrame inflamatorio',
      'Sospecha alta',
      'El líquido articular presenta un patrón inflamatorio.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  if (
    (input.leukocytes !== null && input.leukocytes >= 50) ||
    input.color === 'yellowish'
  ) {
    addIfPresent(findings, input.color === 'yellowish', 'Color amarillento.');
    addIfPresent(
      findings,
      input.leukocytes !== null,
      `Leucocitos compatibles con patrón no inflamatorio (${formatNumber(input.leukocytes, 0)} /mm³).`
    );
    nextSteps.push('Correlacionar con artropatía degenerativa o sobrecarga mecánica.');
    return finalizedInterpretation(
      'Derrame no inflamatorio',
      'Sospecha alta',
      'El patrón del líquido sinovial es más compatible con un derrame no inflamatorio.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  nextSteps.push('Si la sospecha clínica es alta, un líquido aparentemente normal no excluye patología precoz.');
  return finalizedInterpretation(
    'Líquido sinovial normal o escasamente reactivo',
    'Baja probabilidad',
    'Con los datos actuales el líquido se aproxima más al patrón normal.',
    findings,
    nextSteps,
    alerts,
    calculations
  );
}

function evaluateLumbarPuncture(input: LumbarPunctureInput): Interpretation {
  const findings: string[] = [];
  const nextSteps: string[] = [];
  const alerts: string[] = [];
  const calculations: Interpretation['calculations'] = [];
  const correctedLeukocytes =
    input.leukocytes !== null && input.rbc !== null && input.rbc > 0
      ? Math.max(0, input.leukocytes - input.rbc / 1000)
      : input.leukocytes;
  const correctedProteins =
    input.proteins !== null && input.rbc !== null && input.rbc > 0
      ? Math.max(0, input.proteins - input.rbc / 1000)
      : input.proteins;

  calculations.push({
    label: 'Presión de apertura',
    value:
      input.openingPressure === 'high'
        ? 'Alta'
        : input.openingPressure === 'normal'
          ? 'Normal (< 20 cmH2O)'
          : 'Indeterminada',
  });

  if (input.leukocytes !== null) {
    calculations.push({
      label: 'Leucocitos',
      value: `${formatNumber(input.leukocytes, 0)} /mm³`,
    });
  }

  if (correctedLeukocytes !== null && correctedLeukocytes !== input.leukocytes) {
    calculations.push({
      label: 'Leucocitos corregidos',
      value: `${formatNumber(correctedLeukocytes, 0)} /mm³`,
      note: 'Corrección orientativa por PL traumática: la bibliografía usa aproximadamente 1 leucocito por cada 700-1.000 hematíes.',
    });
  }

  if (input.rbc !== null) {
    calculations.push({
      label: 'Hematíes en LCR',
      value: `${formatNumber(input.rbc, 0)} /mm³`,
    });
  }

  if (input.glucosePercent !== null) {
    calculations.push({
      label: 'Glucorraquia',
      value: `${formatNumber(input.glucosePercent, 0)} % de la glucemia`,
    });
  }

  if (input.proteins !== null) {
    calculations.push({
      label: 'Proteinorraquia',
      value: `${formatNumber(input.proteins, 0)} mg/dl`,
    });
  }

  if (correctedProteins !== null && correctedProteins !== input.proteins) {
    calculations.push({
      label: 'Proteinorraquia corregida',
      value: `${formatNumber(correctedProteins, 0)} mg/dl`,
      note: 'Corrección por PL traumática: restar 1 mg/dl por cada 1.000 hematíes.',
    });
  }

  if (input.lactate !== null) {
    calculations.push({
      label: 'Lactato en LCR',
      value: `${formatNumber(input.lactate, 1)} mmol/l`,
      note:
        input.lactate > 4.2
          ? 'Un valor > 4,2 mmol/l apoya meningitis bacteriana frente a vírica, con utilidad menor si hubo antibióticos previos, convulsiones o encefalitis herpética.'
          : undefined,
    });
  }

  const isNormal =
    (input.openingPressure === 'normal' || input.openingPressure === 'indeterminate') &&
    input.aspect === 'clear' &&
    (correctedLeukocytes === null || correctedLeukocytes < 5) &&
    input.predominantCellularity === 'mn' &&
    (input.glucosePercent === null || (input.glucosePercent >= 60 && input.glucosePercent <= 80)) &&
    (correctedProteins === null || (correctedProteins >= 30 && correctedProteins <= 50)) &&
    (input.lactate === null || input.lactate <= 4.2);

  if (isNormal) {
    nextSteps.push('Si la sospecha clínica persiste, interpretar junto con microbiología y neuroimagen.');
    return finalizedInterpretation(
      'LCR normal',
      'Baja probabilidad',
      'Los datos introducidos encajan con un patrón de LCR normal.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  let bacterialScore = 0;
  let viralScore = 0;
  let chronicScore = 0;

  if (input.openingPressure === 'high') {
    bacterialScore += 1;
    chronicScore += 1;
  }
  if (input.openingPressure === 'normal') {
    viralScore += 1;
  }

  if (input.aspect === 'turbid') bacterialScore += 2;
  if (input.aspect === 'clear') viralScore += 1;

  if (correctedLeukocytes !== null) {
    if (correctedLeukocytes >= 1000 && correctedLeukocytes <= 5000) bacterialScore += 2;
    if (correctedLeukocytes >= 5 && correctedLeukocytes <= 1000) viralScore += 2;
    if (correctedLeukocytes >= 50 && correctedLeukocytes <= 500) chronicScore += 2;
  }

  if (input.predominantCellularity === 'pmn') bacterialScore += 2;
  if (input.predominantCellularity === 'mn') viralScore += 2;
  if (input.predominantCellularity === 'variable') chronicScore += 1;

  if (input.glucosePercent !== null) {
    if (input.glucosePercent < 40) bacterialScore += 2;
    if (input.glucosePercent > 60) viralScore += 2;
    if (input.glucosePercent < 60) chronicScore += 2;
  }

  if (correctedProteins !== null) {
    if (correctedProteins > 100) bacterialScore += 1;
    if (correctedProteins >= 30 && correctedProteins <= 100) viralScore += 1;
    if (correctedProteins >= 50 && correctedProteins <= 300) chronicScore += 2;
  }

  if (input.lactate !== null) {
    if (input.lactate > 4.2) bacterialScore += 2;
    if (input.lactate <= 4.2) viralScore += 1;
  }

  if (bacterialScore >= viralScore && bacterialScore >= chronicScore) {
    addIfPresent(findings, input.aspect === 'turbid', 'LCR turbio.');
    addIfPresent(
      findings,
      correctedLeukocytes !== null,
      `Pleocitosis compatible (${formatNumber(correctedLeukocytes, 0)} /mm³).`
    );
    addIfPresent(findings, input.predominantCellularity === 'pmn', 'Predominio PMN.');
    addIfPresent(
      findings,
      input.glucosePercent !== null && input.glucosePercent < 40,
      `Glucorraquia < 40% (${formatNumber(input.glucosePercent, 0)}%).`
    );
    addIfPresent(
      findings,
      input.lactate !== null && input.lactate > 4.2,
      `Lactato elevado (${formatNumber(input.lactate, 1)} mmol/l).`
    );
    alerts.push('Sospecha de meningitis bacteriana aguda: priorizar antibióticos y hemocultivos.');
    nextSteps.push('Completar cultivo/tinción de Gram y comenzar tratamiento empírico si el contexto lo apoya.');
    nextSteps.push('Recordar que el lactato pierde utilidad relativa en pacientes pretratados con antibióticos, con convulsiones o con encefalitis herpética.');
    return finalizedInterpretation(
      'Meningitis aguda purulenta',
      'Sospecha alta',
      'El patrón del LCR es más compatible con meningitis bacteriana aguda purulenta.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  if (chronicScore > viralScore) {
    addIfPresent(findings, input.aspect === 'turbid', 'LCR turbio.');
    addIfPresent(
      findings,
      correctedLeukocytes !== null,
      `Pleocitosis en rango subagudo/crónico (${formatNumber(correctedLeukocytes, 0)} /mm³).`
    );
    addIfPresent(
      findings,
      input.glucosePercent !== null && input.glucosePercent < 60,
      `Glucorraquia baja (${formatNumber(input.glucosePercent, 0)}%).`
    );
    addIfPresent(
      findings,
      correctedProteins !== null && correctedProteins >= 50,
      `Proteinorraquia elevada (${formatNumber(correctedProteins, 0)} mg/dl).`
    );
    nextSteps.push('Ampliar estudio hacia TBC, criptococo, Listeria y otras etiologías subagudas/crónicas.');
    return finalizedInterpretation(
      'Meningitis subaguda o crónica',
      'Sospecha intermedia-alta',
      'El patrón del LCR es más compatible con meningitis subaguda o crónica.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  addIfPresent(findings, input.aspect === 'clear', 'LCR claro.');
  addIfPresent(
    findings,
    correctedLeukocytes !== null,
    `Pleocitosis compatible (${formatNumber(correctedLeukocytes, 0)} /mm³).`
  );
  addIfPresent(findings, input.predominantCellularity === 'mn', 'Predominio mononuclear.');
  addIfPresent(
    findings,
    input.glucosePercent !== null && input.glucosePercent > 60,
      `Glucorraquia conservada (${formatNumber(input.glucosePercent, 0)}%).`
  );
  addIfPresent(
    findings,
    input.lactate !== null && input.lactate <= 4.2,
    `Lactato no elevado (${formatNumber(input.lactate, 1)} mmol/l).`
  );
  nextSteps.push('Correlacionar con panel viral/PCR y contexto clínico.');
  return finalizedInterpretation(
    'Meningitis o encefalitis viral',
    'Sospecha intermedia-alta',
    'El patrón del LCR se aproxima más a meningitis o encefalitis viral.',
    findings,
    nextSteps,
    alerts,
    calculations
  );
}

function evaluateThoracentesis(input: ThoracentesisInput): Interpretation {
  const findings: string[] = [];
  const nextSteps: string[] = [];
  const alerts: string[] = [];
  const calculations: Interpretation['calculations'] = [];

  const proteinRatio =
    input.pleuralProteins !== null &&
    input.serumProteins !== null &&
    input.serumProteins > 0
      ? input.pleuralProteins / input.serumProteins
      : null;
  const ldhRatio =
    input.pleuralLdh !== null && input.serumLdh !== null && input.serumLdh > 0
      ? input.pleuralLdh / input.serumLdh
      : null;
  const ldhUpperTwoThirds =
    input.serumLdhUpperLimit !== null ? (2 * input.serumLdhUpperLimit) / 3 : null;
  const albuminGradient =
    input.serumAlbumin !== null && input.pleuralAlbumin !== null
      ? input.serumAlbumin - input.pleuralAlbumin
      : null;
  const pleuralSerumAlbuminRatio =
    input.pleuralAlbumin !== null &&
    input.serumAlbumin !== null &&
    input.serumAlbumin > 0
      ? input.pleuralAlbumin / input.serumAlbumin
      : null;

  if (proteinRatio !== null) {
    calculations.push({
      label: 'Proteínas LP/suero',
      value: formatNumber(proteinRatio, 2),
      note: proteinRatio > 0.5 ? 'Criterio de Light positivo.' : undefined,
    });
  }

  if (ldhRatio !== null) {
    calculations.push({
      label: 'LDH LP/suero',
      value: formatNumber(ldhRatio, 2),
      note: ldhRatio > 0.6 ? 'Criterio de Light positivo.' : undefined,
    });
  }

  if (ldhUpperTwoThirds !== null && input.pleuralLdh !== null) {
    calculations.push({
      label: 'LDH pleural',
      value: `${formatNumber(input.pleuralLdh, 0)} UI/l`,
      note:
        input.pleuralLdh > ldhUpperTwoThirds
          ? 'Superior a 2/3 del límite sérico normal.'
          : `Umbral 2/3: ${formatNumber(ldhUpperTwoThirds, 0)} UI/l.`,
    });
  }

  if (albuminGradient !== null) {
    calculations.push({
      label: 'Gradiente albúmina sérica-LP',
      value: `${formatNumber(albuminGradient, 2)} g/dl`,
    });
  }

  if (pleuralSerumAlbuminRatio !== null) {
    calculations.push({
      label: 'Albúmina LP/sérica',
      value: formatNumber(pleuralSerumAlbuminRatio, 2),
    });
  }

  const lightCriteria = [
    proteinRatio !== null && proteinRatio > 0.5,
    ldhRatio !== null && ldhRatio > 0.6,
    input.pleuralLdh !== null && ldhUpperTwoThirds !== null && input.pleuralLdh > ldhUpperTwoThirds,
  ].filter(Boolean).length;

  const isExudate = lightCriteria >= 1;

  if (lightCriteria > 0) {
    findings.push(`${lightCriteria} criterio(s) de Light positivo(s).`);
  }

  if (isExudate && albuminGradient !== null && albuminGradient > 1.2) {
    findings.push(`Gradiente albúmina sérica-LP > 1,2 (${formatNumber(albuminGradient, 2)} g/dl).`);
    nextSteps.push('Correlacionar con insuficiencia cardiaca o diuresis previa: posible falso exudado.');
    return finalizedInterpretation(
      'Falso exudado cardíaco',
      'Sospecha alta',
      'Aunque cumple criterios de Light de exudado, el gradiente de albúmina orienta a falso exudado de origen cardíaco.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  if (isExudate && pleuralSerumAlbuminRatio !== null && pleuralSerumAlbuminRatio > 0.67) {
    findings.push(`Cociente albúmina LP/sérica > 0,67 (${formatNumber(pleuralSerumAlbuminRatio, 2)}).`);
    nextSteps.push('Correlacionar con hidrotórax hepático o contexto hepatológico.');
    return finalizedInterpretation(
      'Falso exudado hepático',
      'Sospecha alta',
      'Aunque cumple criterios de Light de exudado, el cociente de albúmina orienta a falso exudado hepático.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  if (isExudate) {
    nextSteps.push('Completar estudio etiológico del exudado pleural según contexto clínico.');
    return finalizedInterpretation(
      'Exudado pleural',
      'Sospecha alta',
      'El líquido pleural cumple al menos un criterio de Light y se clasifica como exudado.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  if (proteinRatio !== null || ldhRatio !== null || (input.pleuralLdh !== null && ldhUpperTwoThirds !== null)) {
    nextSteps.push('Correlacionar con insuficiencia cardiaca, cirrosis o hipoproteinemia según el contexto.');
    return finalizedInterpretation(
      'Transudado pleural',
      'Sospecha alta',
      'No cumple criterios de Light de exudado y orienta a transudado.',
      findings,
      nextSteps,
      alerts,
      calculations
    );
  }

  nextSteps.push('Introducir proteínas y/o LDH en líquido pleural y suero para aplicar criterios de Light.');
  return finalizedInterpretation(
    'Orientación insuficiente',
    'Datos incompletos',
    'No hay datos suficientes para clasificar el líquido pleural con criterios de Light.',
    findings,
    nextSteps,
    alerts,
    calculations
  );
}

function finalizedInterpretation(
  title: string,
  label: string,
  summary: string,
  findings: string[],
  nextSteps: string[],
  alerts: string[],
  calculations: Interpretation['calculations']
): Interpretation {
  return {
    title,
    label,
    summary,
    findings,
    nextSteps,
    alerts,
    calculations,
    reportText: buildReport(title, summary, findings, nextSteps, alerts),
  };
}
