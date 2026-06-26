export type ManchesterPatientGroup = 'adult' | 'pediatric';

export type ManchesterPriorityLevel = 1 | 2 | 3 | 4 | 5;

export type ManchesterDestinationCode =
  | 'R'
  | 'Ma'
  | 'Mi'
  | 'PC'
  | 'SC'
  | 'PHAR'
  | 'PSY'
  | 'DENT'
  | 'SHC'
  | 'EYE';

export type ManchesterPriorityConfig = {
  level: ManchesterPriorityLevel;
  colorName: string;
  clinicalLabel: string;
  responseTarget: string;
  resultClassName?: string;
};

export type ManchesterGlossaryEntry = {
  id: string;
  label: string;
  summary: string;
};

export type ManchesterDiscriminant = {
  id: string;
  label: string;
  glossaryId?: string;
};

export type ManchesterAlgorithmStep = {
  priority: ManchesterPriorityLevel;
  resultPriority?: ManchesterPriorityLevel;
  resultTitle?: string;
  resultDescription?: string;
  resultPanelClassName?: string;
  discriminants: ManchesterDiscriminant[];
};

export type ManchesterAlgorithm = {
  id: string;
  discriminatorId: string;
  group: ManchesterPatientGroup;
  title: string;
  sourceLabel: string;
  steps: ManchesterAlgorithmStep[];
  fallbackPriority: ManchesterPriorityLevel;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackPanelClassName?: string;
  fallbackHidePriority?: boolean;
};

export type ManchesterDiscriminator = {
  id: string;
  label: string;
  group: ManchesterPatientGroup;
  algorithmStatus: 'ready' | 'pending';
  algorithmId?: string;
};

export type ManchesterSuggestedDestination = {
  code: string;
  label: string;
};

export const MANCHESTER_PRIORITIES: ManchesterPriorityConfig[] = [
  {
    level: 1,
    colorName: 'Rojo',
    clinicalLabel: 'Urgencia inmediata',
    responseTarget: 'Atención inmediata',
    resultClassName: 'rojo',
  },
  {
    level: 2,
    colorName: 'Naranja',
    clinicalLabel: 'Muy urgente',
    responseTarget: 'Menos de 10 minutos',
    resultClassName: 'naranja',
  },
  {
    level: 3,
    colorName: 'Amarillo',
    clinicalLabel: 'Urgente',
    responseTarget: 'Menos de 60 minutos',
    resultClassName: 'amarillo',
  },
  {
    level: 4,
    colorName: 'Verde',
    clinicalLabel: 'Menos urgente',
    responseTarget: 'Menos de 120 minutos',
    resultClassName: 'verde',
  },
  {
    level: 5,
    colorName: 'Azul',
    clinicalLabel: 'No urgente',
    responseTarget: 'Menos de 240 minutos',
  },
];

export const MANCHESTER_DESTINATION_LABELS: Record<ManchesterDestinationCode, string> = {
  R: 'Sala de paradas / reanimación',
  Ma: 'Nivel 2',
  Mi: 'Nivel 1',
  PC: 'Atención primaria',
  SC: 'Autocuidado',
  PHAR: 'Farmacia',
  PSY: 'Salud Mental',
  DENT: 'Odontología',
  SHC: 'Ginecología / Salud Sexual y Reproductiva',
  EYE: 'Oftalmología',
};

const MANCHESTER_ALGORITHM_DESTINATIONS: Record<string, Partial<Record<ManchesterPriorityLevel, string>>> = {
  'adult-meg': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-sincope-lipotimia': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'PC' },
  'adult-agresion': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'SC' },
  'adult-aparentemente-ebrio': { 1: 'R', 2: 'R/Ma', 3: 'Ma', 4: 'Mi', 5: 'SC' },
  'adult-asma': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-autolesion-deliberada': { 1: 'R', 2: 'R', 3: 'Mi/PSY', 4: 'Mi/PSY' },
  'adult-caidas': { 1: 'R', 2: 'R/Ma', 3: 'Ma', 4: 'Mi', 5: 'PC' },
  'adult-cefalea': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'PC' },
  'pediatric-cefalea': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'PC' },
  'adult-comportamiento-extrano': { 1: 'R', 2: 'Ma', 3: 'Mi/PSY', 4: 'Mi/PSY' },
  'adult-convulsiones': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'PC' },
  'adult-cuerpo-extrano': { 1: 'R', 2: 'R/Ma', 3: 'Mi', 4: 'Mi', 5: 'PC' },
  'adult-diabetes': { 1: 'R', 2: 'R/Ma', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-diarrea': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'SC' },
  'adult-disnea': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'pediatric-disnea-en-ninos': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-dolor-abdominal': { 1: 'R', 2: 'Ma', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'pediatric-dolor-abdominal-en-ninos': { 1: 'R', 2: 'R/Ma', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-dolor-de-cuello': { 1: 'R', 2: 'Ma', 3: 'Mi', 4: 'PC', 5: 'SC' },
  'adult-dolor-de-espalda': { 1: 'R', 2: 'Ma', 3: 'Mi', 4: 'PC', 5: 'PC' },
  'adult-dolor-de-garganta': { 1: 'R', 2: 'Ma', 3: 'Mi', 4: 'PC', 5: 'SC' },
  'adult-dolor-testicular': { 1: 'R', 2: 'Ma', 3: 'Mi', 4: 'Mi', 5: 'PC' },
  'adult-dolor-toracico': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'PC' },
  'adult-embarazo': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-ets': { 1: 'R', 2: 'R/Ma', 3: 'Mi', 4: 'PC', 5: 'SC' },
  'adult-enfermedad-hematologica': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-enfermedad-mental': { 1: 'R', 2: 'Ma', 3: 'PSY', 4: 'PSY' },
  'adult-exantemas': { 1: 'R', 2: 'R', 3: 'Mi', 4: 'PC', 5: 'SC' },
  'adult-exposicion-sustancias-quimicas': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'PC' },
  'adult-focalidad-neurologica': { 2: 'R' },
  'adult-hemorragia-gastrointestinal': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-hemorragia-vaginal': { 1: 'R', 2: 'R/Ma', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-heridas': { 1: 'R', 2: 'R/Ma', 3: 'Mi', 4: 'Mi', 5: 'SC' },
  'adult-infecciones-locales-y-abscesos': { 1: 'R', 2: 'Ma', 3: 'Mi', 4: 'PC', 5: 'PC' },
  'adult-lesiones-en-el-tronco': { 1: 'R', 2: 'R', 3: 'Mi', 4: 'Mi', 5: 'PC' },
  'adult-mordeduras-y-picaduras': { 1: 'R', 2: 'R', 3: 'Mi', 4: 'PC', 5: 'PC' },
  'adult-palpitaciones': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-politraumatismo': { 1: 'R', 2: 'R', 3: 'Ma' },
  'adult-problemas-de-oido': { 1: 'R', 2: 'Ma', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-problemas-dentales': { 1: 'R', 2: 'Ma', 3: 'Mi', 4: 'DENT', 5: 'DENT' },
  'adult-problemas-en-las-extremidades': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'PC' },
  'adult-problemas-faciales': { 1: 'R', 2: 'R/Ma', 3: 'Ma', 4: 'Mi', 5: 'PC' },
  'adult-problemas-nasales': { 1: 'R', 2: 'Ma', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-problemas-oculares': { 1: 'Ma', 2: 'Ma', 3: 'Mi/EYE', 4: 'Mi', 5: 'PC' },
  'adult-problemas-urinarios': { 1: 'R', 2: 'Ma', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'adult-quemaduras-y-escaldaduras': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'SC' },
  'adult-sobredosis-y-envenenamiento': { 1: 'R', 2: 'Ma', 3: 'Ma', 4: 'Mi' },
  'adult-traumatismo-craneoencefalico': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'SC' },
  'adult-vomitos': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'SC' },
  'pediatric-bebe-o-nino-pequeno-que-llora': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'pediatric-nino-cojeando': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'Mi', 5: 'PC' },
  'pediatric-nino-con-meg': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'pediatric-nino-irritable': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
  'pediatric-padres-preocupados': { 1: 'R', 2: 'R', 3: 'Ma', 4: 'PC', 5: 'PC' },
};

export const MANCHESTER_GLOSSARY: ManchesterGlossaryEntry[] = [
  {
    id: 'via-aerea-comprometida',
    label: 'Vía aérea comprometida',
    summary: 'Obstrucción parcial o total que impide mantener la vía aérea abierta de forma eficaz.',
  },
  {
    id: 'respiracion-inadecuada',
    label: 'Respiración inadecuada',
    summary: 'Ventilación insuficiente para mantener una oxigenación adecuada, con signos de agotamiento o trabajo respiratorio.',
  },
  {
    id: 'shock',
    label: 'Shock',
    summary: 'Estado con hipoperfusión y datos como hipotensión, taquicardia, palidez, sudoración o alteración del nivel de conciencia.',
  },
  {
    id: 'dolor-intenso',
    label: 'Dolor intenso',
    summary: 'Dolor puntuado de 7 a 10 en escalas habituales de intensidad.',
  },
  {
    id: 'dolor-vertice-hombro',
    label: 'Dolor en vértice de hombro',
    summary: 'Dolor referido en el hombro que puede indicar irritación diafragmática.',
  },
  {
    id: 'dolor-irradiado-hacia-la-espalda',
    label: 'Dolor irradiado hacia la espalda',
    summary: 'Dolor abdominal con irradiación retroperitoneal, continua o intermitente.',
  },
  {
    id: 'vomito-agudo-de-sangre',
    label: 'Vómito agudo de sangre',
    summary: 'Hematemesis presenciada o con restos evidentes de sangre o posos de café.',
  },
  {
    id: 'emision-aguda-de-sangre-rectal',
    label: 'Emisión aguda de sangre por vía rectal',
    summary: 'Rectorragia abundante o alterada en cantidad clínicamente relevante.',
  },
  {
    id: 'dolor-moderado',
    label: 'Dolor moderado',
    summary: 'Dolor soportable, pero clínicamente relevante y por encima de molestias leves.',
  },
  {
    id: 'vomito-persistente',
    label: 'Vómito persistente',
    summary: 'Vómitos mantenidos en el tiempo que no ceden de forma razonable.',
  },
  {
    id: 'problema-reciente',
    label: 'Problema reciente',
    summary: 'Síntoma o motivo de consulta iniciado durante la última semana.',
  },
  {
    id: 'crisis-convulsiva',
    label: 'Crisis convulsiva',
    summary: 'Convulsión activa o muy reciente con compromiso clínico actual.',
  },
  {
    id: 'pulso-anormal',
    label: 'Pulso anormal',
    summary: 'Frecuencia, ritmo o calidad del pulso con alteración clínicamente significativa.',
  },
  {
    id: 'historia-de-riesgo-especial-de-infeccion',
    label: 'Historia de riesgo especial de infección',
    summary: 'Antecedentes o contexto que aumentan de forma relevante el riesgo de infección grave.',
  },
  {
    id: 'nivel-de-consciencia-alterado',
    label: 'Nivel de consciencia alterado',
    summary: 'Disminución o alteración del estado de alerta respecto a la situación basal.',
  },
  {
    id: 'signos-de-meningismo',
    label: 'Signos de meningismo',
    summary: 'Rigidez de nuca u otros signos compatibles con irritación meníngea.',
  },
  {
    id: 'exantema-desconocido',
    label: 'Exantema desconocido',
    summary: 'Erupción cutánea de causa no filiada con relevancia clínica para el triaje.',
  },
  {
    id: 'purpura',
    label: 'Púrpura',
    summary: 'Lesiones cutáneas hemorrágicas no blanqueables a la presión.',
  },
  {
    id: 'exantema-no-blanqueable',
    label: 'Exantema no blanqueable',
    summary:
      'Erupción cutánea que no pierde color al presionarla, compatible con sangrado cutáneo o afectación vascular.',
  },
  {
    id: 'adulto-muy-caliente',
    label: 'Adulto muy caliente',
    summary: 'Fiebre elevada o impresión térmica muy alta con repercusión clínica.',
  },
  {
    id: 'instauracion-rapida',
    label: 'Instauración rápida',
    summary: 'Inicio brusco o claramente acelerado del cuadro clínico.',
  },
  {
    id: 'historia-de-viaje-al-extranjero',
    label: 'Historia de viaje al extranjero',
    summary: 'Viaje reciente fuera del entorno habitual con posible relación clínica.',
  },
  {
    id: 'secreciones-o-vesiculas-generalizadas',
    label: 'Secreciones o vesículas generalizadas',
    summary: 'Lesiones o exudados distribuidos de forma extensa por el cuerpo.',
  },
  {
    id: 'adulto-caliente',
    label: 'Adulto caliente',
    summary: 'Fiebre o sensación térmica aumentada sin criterios de gravedad máxima.',
  },
  {
    id: 'acalorado-templado',
    label: 'Acalorado (templado)',
    summary: 'Aumento leve de temperatura o sensación febril sin signos de alarma mayores.',
  },
  {
    id: 'dolor',
    label: 'Dolor',
    summary: 'Dolor leve o inespecífico que no alcanza criterios de dolor moderado o intenso.',
  },
  {
    id: 'dolor-cardiaco',
    label: 'Dolor cardíaco',
    summary: 'Dolor torácico o equivalente clínico sugestivo de origen cardíaco.',
  },
  {
    id: 'disnea-aguda',
    label: 'Disnea aguda',
    summary: 'Dificultad respiratoria de aparición aguda o empeoramiento brusco.',
  },
  {
    id: 'frio',
    label: 'Frío',
    summary: 'Piel fría o sensación de frialdad con posible repercusión hemodinámica.',
  },
  {
    id: 'historia-inapropiada',
    label: 'Historia inapropiada',
    summary: 'Relato clínico discordante, incoherente o no explicable por el cuadro aparente.',
  },
  {
    id: 'historia-significativa-de-alergia',
    label: 'Historia significativa de alergia',
    summary: 'Antecedentes alérgicos relevantes para valorar un episodio potencialmente grave.',
  },
  {
    id: 'historia-de-inconsciencia',
    label: 'Historia de inconsciencia',
    summary: 'Pérdida previa de conciencia referida o documentada en el episodio actual.',
  },
  {
    id: 'nueva-focalidad-neurologica-menor-de-24h',
    label: 'Nueva focalidad neurológica < 24 h',
    summary:
      'Cualquier déficit neurológico ocurrido en las 24 h previas. Incluye pérdida o alteración de la sensibilidad, debilidad de extremidades (permanente o transitoria) y alteraciones intestinales o en diuresis.',
  },
  {
    id: 'nueva-focalidad-neurologica-mayor-de-24h',
    label: 'Nueva focalidad neurológica > 24 h',
    summary:
      'Cualquier pérdida de función neurológica de más de 24 horas de evolución, incluyendo alteración o pérdida de sensibilidad, debilidad de las extremidades, transitoria o permanente, y alteraciones de la función vesical o intestinal.',
  },
  {
    id: 'perdida-de-funcion-focal-o-progresiva',
    label: 'Pérdida de función focal o progresiva',
    summary: 'Déficit neurológico localizado o empeoramiento funcional progresivo.',
  },
  {
    id: 'hemorragia-desangrante',
    label: 'Hemorragia desangrante',
    summary: 'Sangrado masivo o exanguinante con riesgo vital inmediato.',
  },
  {
    id: 'hemorragia-vaginal-abundante',
    label: 'Hemorragia vaginal abundante',
    summary:
      'La pérdida de sangre por vía vaginal es extremadamente difícil de valorar. La presencia de coágulos grandes o de un flujo constante cumple este criterio. El uso de un gran número de compresas o toallas sanitarias sugiere una pérdida abundante.',
  },
  {
    id: 'hemorragia-vaginal-en-gestante-de-20-semanas-o-mas',
    label: 'Hemorragia vaginal en gestante de 20 semanas o más',
    summary: 'Sangrado vaginal en una gestante con 20 semanas o más de evolución del embarazo.',
  },
  {
    id: 'parto-activo',
    label: 'Parto activo',
    summary: 'Mujer que presenta contracciones dolorosas regulares y frecuentes.',
  },
  {
    id: 'prolapso-del-cordon-umbilical',
    label: 'Prolapso del cordón umbilical',
    summary: 'Prolapso de cualquier parte del cordón a través del cérvix.',
  },
  {
    id: 'mecanismo-de-la-lesion-determinante',
    label: 'Mecanismo de la lesión determinante',
    summary: 'Mecanismo traumático de alta energía o claramente asociado a lesión grave.',
  },
  {
    id: 'hemorragia-mayor-incontrolable',
    label: 'Hemorragia mayor incontrolable',
    summary: 'Sangrado importante que no cede con medidas básicas de control.',
  },
  {
    id: 'hemorragia-menor-incontrolable',
    label: 'Hemorragia menor incontrolable',
    summary: 'Sangrado persistente de menor cuantía que sigue sin controlarse adecuadamente.',
  },
  {
    id: 'signos-sintomas-neurologicos-recientes',
    label: 'Signos/síntomas neurológicos recientes',
    summary: 'Manifestaciones neurológicas de nueva aparición o claramente recientes.',
  },
  {
    id: 'tumefaccion',
    label: 'Tumefacción',
    summary: 'Aumento de volumen o hinchazón localizada en la zona afectada.',
  },
  {
    id: 'tumefaccion-facial',
    label: 'Tumefacción facial',
    summary: 'Hinchazón localizada en la cara con relevancia clínica para la valoración odontológica o infecciosa.',
  },
  {
    id: 'deformidad',
    label: 'Deformidad',
    summary: 'Alteración visible de la anatomía normal compatible con lesión estructural.',
  },
  {
    id: 'nino-que-no-responde',
    label: 'Niño que no responde',
    summary: 'Ausencia de respuesta apropiada a estímulos verbales o dolorosos.',
  },
  {
    id: 'hipoglucemia',
    label: 'Hipoglucemia',
    summary: 'Glucemia baja con síntomas o riesgo clínico relevante.',
  },
  {
    id: 'nivel-de-consciencia-alterado-no-atribuible-al-alcohol-por-completo',
    label: 'Nivel de consciencia alterado no atribuible al alcohol por completo',
    summary: 'Alteración del estado mental no explicable solo por la intoxicación etílica.',
  },
  {
    id: 'historia-inadecuada',
    label: 'Historia inadecuada',
    summary: 'Información insuficiente o poco fiable para explicar el cuadro con seguridad.',
  },
  {
    id: 'nivel-de-consciencia-alterado-atribuible-al-alcohol-por-completo',
    label: 'Nivel de consciencia alterado atribuible al alcohol por completo',
    summary: 'Alteración del estado mental coherente con intoxicación etílica aislada.',
  },
  {
    id: 'traumatismo-craneoencefalico',
    label: 'Traumatismo craneoencefálico',
    summary: 'Antecedente o sospecha de golpe craneal relevante en el episodio actual.',
  },
  {
    id: 'lesion',
    label: 'Lesión',
    summary: 'Daño físico identificable asociado al motivo de consulta.',
  },
  {
    id: 'posible-embarazo',
    label: 'Posibilidad de embarazo',
    summary:
      'Cualquier mujer con faltas menstruales es un posible embarazo. Incluso cualquier paciente en edad fértil que mantiene relaciones sin protección se debe considerar potencialmente embarazada.',
  },
  {
    id: 'exposicion-de-partes-fetales',
    label: 'Exposición de partes fetales',
    summary: 'Coronamiento o exposición de cualquier parte del feto en vagina.',
  },
  {
    id: 'hipertension-arterial',
    label: 'Hipertensión arterial',
    summary: 'Historia de hipertensión arterial o hipertensión objetivada en la exploración.',
  },
  {
    id: 'historia-de-convulsion',
    label: 'Historia de convulsión',
    summary: 'Cualquier crisis convulsiva observada o reportada durante el periodo de enfermedad o tras un traumatismo.',
  },
  {
    id: 'sangrado-vaginal',
    label: 'Sangrado vaginal',
    summary: 'Cualquier sangrado vaginal.',
  },
  {
    id: 'trauma-vaginal',
    label: 'Trauma vaginal',
    summary: 'Cualquier historia o evidencia de trauma vaginal directo.',
  },
  {
    id: 'incapaz-de-decir-frases',
    label: 'Incapaz de decir frases',
    summary: 'Disnea con incapacidad para hablar en frases completas.',
  },
  {
    id: 'taquicardia-acusada',
    label: 'Taquicardia acusada',
    summary: 'Frecuencia cardíaca marcadamente elevada según la situación clínica.',
  },
  {
    id: 'flujo-espiratorio-maximo-muy-bajo',
    label: 'Flujo espiratorio máximo muy bajo',
    summary: 'Peak flow severamente reducido respecto al esperado o al mejor conocido.',
  },
  {
    id: 'saturacion-de-oxigeno-muy-baja',
    label: 'Saturación de oxígeno muy baja',
    summary: 'Hipoxemia grave objetivada por pulsioximetría.',
  },
  {
    id: 'flujo-espiratorio-maximo-bajo',
    label: 'Flujo espiratorio máximo bajo',
    summary: 'Peak flow disminuido de forma clínicamente relevante, sin llegar al rango más grave.',
  },
  {
    id: 'saturacion-de-oxigeno-baja',
    label: 'Saturación de oxígeno baja',
    summary: 'Hipoxemia leve o moderada objetivada por pulsioximetría.',
  },
  {
    id: 'historia-significativa-de-asma',
    label: 'Historia significativa de asma',
    summary: 'Antecedentes de asma grave o de riesgo relevante para el episodio actual.',
  },
  {
    id: 'no-mejora-con-el-propio-tratamiento-de-asma',
    label: 'No mejora con el propio tratamiento de asma',
    summary: 'Persistencia de síntomas pese al tratamiento habitual administrado por el paciente.',
  },
  {
    id: 'respiracion-sibilante-o-sibilancias',
    label: 'Respiración sibilante o sibilancias',
    summary: 'Presencia audible o auscultable de sibilancias.',
  },
  {
    id: 'infeccion-respiratoria',
    label: 'Infección respiratoria',
    summary: 'Síntomas o signos compatibles con infección de vías respiratorias.',
  },
  {
    id: 'historia-de-incidente-significativo',
    label: 'Historia de incidente significativo',
    summary: 'Relato de accidente o evento con potencial de lesión importante.',
  },
  {
    id: 'historial-medico-significativo',
    label: 'Historial médico significativo',
    summary: 'Antecedentes médicos relevantes que aumentan el riesgo o la complejidad del cuadro traumático actual.',
  },
  {
    id: 'alto-riesgo-de-volver-a-autolesionarse',
    label: 'Alto riesgo de volver a autolesionarse',
    summary: 'Riesgo inmediato elevado de repetición de autolesión o suicidio.',
  },
  {
    id: 'riesgo-moderado-de-volver-a-autolesionarse',
    label: 'Riesgo moderado de volver a autolesionarse',
    summary: 'Riesgo relevante, aunque no máximo, de nueva autolesión en el corto plazo.',
  },
  {
    id: 'angustia-acusada',
    label: 'Angustia acusada',
    summary: 'Malestar emocional intenso y manifiesto con necesidad de valoración preferente.',
  },
  {
    id: 'deformidad-grosera',
    label: 'Deformidad grosera',
    summary: 'Deformidad muy evidente, sugestiva de lesión ósea o articular importante.',
  },
  {
    id: 'coagulopatia',
    label: 'Coagulopatía',
    summary: 'Coagulopatía congénita o adquirida que incrementa el riesgo hemorrágico.',
  },
  {
    id: 'evisceracion-de-organos',
    label: 'Evisceración de órganos',
    summary: 'Exteriorización de vísceras u órganos a través de una herida, indicativa de traumatismo grave.',
  },
  {
    id: 'fractura-abierta',
    label: 'Fractura abierta',
    summary: 'Fractura con herida asociada y comunicación con el foco óseo.',
  },
  {
    id: 'historia-de-sobredosis-y-o-envenenamiento',
    label: 'Historia de sobredosis y/o envenenamiento',
    summary: 'Antecedente o sospecha fundada de ingesta tóxica, sobredosis o exposición venenosa reciente.',
  },
  {
    id: 'palpitaciones-en-este-momento',
    label: 'Palpitaciones en este momento',
    summary:
      'Sensación de latidos rápidos, a menudo descritos como un tambor, que se mantiene en el momento de la valoración.',
  },
  {
    id: 'antecedente-cardiaco',
    label: 'Antecedente cardiaco',
    summary:
      'Disritmia recurrente conocida que haya amenazado la estabilidad, así como una cardiopatía conocida que pueda empeorar la situación rápidamente.',
  },
  {
    id: 'alto-riesgo-de-danar-a-otros',
    label: 'Alto riesgo de dañar a otros',
    summary: 'Conducta o amenaza con probabilidad inmediata elevada de agresión a terceros.',
  },
  {
    id: 'alto-riesgo-de-autolesion',
    label: 'Alto riesgo de autolesión',
    summary: 'Riesgo elevado e inmediato de hacerse daño de nuevo durante la estancia actual.',
  },
  {
    id: 'historia-psiquiatrica-significativa',
    label: 'Historia psiquiátrica significativa',
    summary: 'Antecedentes psiquiátricos relevantes para interpretar el episodio y su riesgo.',
  },
  {
    id: 'riesgo-moderado-de-danar-a-otros',
    label: 'Riesgo moderado de dañar a otros',
    summary: 'Probabilidad relevante, aunque no máxima, de conducta agresiva hacia terceros.',
  },
  {
    id: 'riesgo-moderado-de-autolesion',
    label: 'Riesgo moderado de autolesión',
    summary: 'Probabilidad clínicamente relevante de autolesión, sin criterios de riesgo máximo inmediato.',
  },
  {
    id: 'nino-caliente',
    label: 'Niño caliente',
    summary: 'Fiebre o impresión térmica elevada en un paciente pediátrico con relevancia para el triaje.',
  },
  {
    id: 'comportamiento-atipico',
    label: 'Comportamiento atípico',
    summary: 'Conducta o respuesta no habitual para la edad y la situación clínica, referida por cuidadores o detectada en valoración.',
  },
  {
    id: 'signos-de-dolor-intenso',
    label: 'Signos de dolor intenso',
    summary: 'Manifestaciones conductuales o fisiológicas compatibles con dolor intenso en pacientes que no lo expresan de forma fiable.',
  },
  {
    id: 'responde-solo-a-la-voz-o-al-dolor',
    label: 'Responde sólo a la voz o al dolor',
    summary: 'Nivel de respuesta reducido en el que el paciente sólo reacciona ante estímulos verbales intensos o dolorosos.',
  },
  {
    id: 'languido',
    label: 'Lánguido',
    summary: 'Aspecto decaído, flacidez o escasa actividad espontánea con preocupación clínica en el paciente pediátrico.',
  },
  {
    id: 'signos-de-dolor-moderado',
    label: 'Signos de dolor moderado',
    summary: 'Manifestaciones observables compatibles con dolor moderado cuando la autoevaluación no es fiable.',
  },
  {
    id: 'inconsolable-por-los-padres',
    label: 'Inconsolable por los padres',
    summary: 'Llanto o malestar persistente que no mejora con las medidas habituales de consuelo ofrecidas por los cuidadores.',
  },
  {
    id: 'llanto-prolongado-o-ininterrumpido',
    label: 'Llanto prolongado o ininterrumpido',
    summary: 'Llanto mantenido durante un periodo clínicamente relevante, sin pausas adecuadas o claramente fuera de lo esperable.',
  },
  {
    id: 'incapaz-de-alimentarse',
    label: 'Incapaz de alimentarse',
    summary: 'Dificultad o imposibilidad para realizar una toma adecuada por mal estado general, dolor o compromiso clínico.',
  },
  {
    id: 'masa-abdominal-visible',
    label: 'Masa abdominal visible',
    summary: 'Abultamiento o masa abdominal visible o claramente palpable que obliga a valoración preferente.',
  },
  {
    id: 'aumento-del-trabajo-respiratorio',
    label: 'Aumento del trabajo respiratorio',
    summary: 'Incremento del esfuerzo ventilatorio con tiraje, aleteo nasal o uso de musculatura accesoria.',
  },
  {
    id: 'incapaz-del-trabajo-respiratorio',
    label: 'Incapaz del trabajo respiratorio',
    summary: 'Fatiga o incapacidad para sostener el esfuerzo respiratorio efectivo, con riesgo de deterioro inminente.',
  },
  {
    id: 'incapacidad-para-soportar-peso',
    label: 'Incapacidad para soportar peso',
    summary: 'Imposibilidad o gran dificultad para apoyar peso sobre la extremidad afectada durante la marcha o la bipedestación.',
  },
  {
    id: 'no-puede-ser-entretenido',
    label: 'No puede ser entretenido',
    summary: 'Irritabilidad mantenida que no mejora con distracción, juego o interacción habitual para la edad.',
  },
  {
    id: 'no-se-alimenta',
    label: 'No se alimenta',
    summary: 'Rechazo o incapacidad para realizar una toma adecuada según la edad y la situación basal del paciente.',
  },
  {
    id: 'no-orina',
    label: 'No orina',
    summary: 'Ausencia de micción en un periodo clínicamente preocupante para la edad, sugestiva de deshidratación o compromiso sistémico.',
  },
  {
    id: 'incapaz-de-reaccionar-con-los-padres',
    label: 'Incapaz de reaccionar con los padres',
    summary: 'Disminución marcada de la interacción o de la respuesta habitual con los cuidadores principales.',
  },
  {
    id: 'cefalea',
    label: 'Cefalea',
    summary: 'Dolor de cabeza clínicamente relevante como síntoma asociado al episodio.',
  },
  {
    id: 'dolor-en-region-temporal',
    label: 'Dolor en región temporal',
    summary: 'Molestias a la palpación en la región temporal (especialmente sobre la arteria temporal).',
  },
  {
    id: 'historia-de-traumatismo-craneoencefalico',
    label: 'Historia de traumatismo craneoencefálico',
    summary: 'Antecedente reciente de golpe craneal o mecanismo compatible con traumatismo craneoencefálico.',
  },
  {
    id: 'historia-significativa',
    label: 'Historia significativa',
    summary: 'Antecedentes o datos de la anamnesis con relevancia clínica clara para aumentar la prioridad.',
  },
  {
    id: 'heces-negras-o-color-grosella',
    label: 'Heces negras o color grosella',
    summary: 'Deposiciones melénicas o con sangre alterada/fresca de aspecto claramente patológico.',
  },
  {
    id: 'historia-de-vomito-de-sangre',
    label: 'Historia de vómito de sangre',
    summary: 'Antecedente reciente de hematemesis referida por el paciente o acompañantes.',
  },
  {
    id: 'signos-de-deshidratacion',
    label: 'Signos de deshidratación',
    summary: 'Datos clínicos de pérdida de volumen como sequedad, taquicardia, hipotensión o mala perfusión.',
  },
  {
    id: 'estado-critico-de-la-piel',
    label: 'Estado crítico de la piel',
    summary: 'Compromiso cutáneo grave con riesgo de necrosis, isquemia o lesión extensa clínicamente relevante.',
  },
  {
    id: 'vomitos',
    label: 'Vómitos',
    summary: 'Presencia de vómitos sin criterios de persistencia o gravedad mayor.',
  },
  {
    id: 'babeo',
    label: 'Babeo',
    summary: 'Sialorrea o incapacidad para manejar secreciones, sugestiva de compromiso de vía aérea superior.',
  },
  {
    id: 'estridor',
    label: 'Estridor',
    summary: 'Ruido respiratorio inspiratorio compatible con obstrucción de la vía aérea superior.',
  },
  {
    id: 'traumatismo-directo-en-el-cuello',
    label: 'Traumatismo directo en el cuello',
    summary: 'Golpe o lesión directa sobre la región cervical con posible repercusión estructural o neurológica.',
  },
  {
    id: 'traumatismo-directo-en-la-espalda',
    label: 'Traumatismo directo en la espalda',
    summary: 'Golpe o lesión directa sobre la espalda con posibilidad de daño vertebral o neurológico.',
  },
  {
    id: 'incapaz-de-caminar',
    label: 'Incapaz de caminar',
    summary: 'Imposibilidad para deambular por dolor, debilidad o déficit funcional agudo.',
  },
  {
    id: 'dolor-abdominal',
    label: 'Dolor abdominal',
    summary: 'Dolor localizado en abdomen con relevancia clínica dentro del cuadro actual.',
  },
  {
    id: 'dolor-pleuritico',
    label: 'Dolor pleurítico',
    summary: 'Dolor torácico que empeora con la respiración o la tos, sugestivo de afectación pleural.',
  },
  {
    id: 'instauracion-aguda-tras-una-lesion',
    label: 'Instauración aguda tras una lesión',
    summary: 'Inicio brusco del síntoma respiratorio tras un traumatismo o lesión reciente.',
  },
  {
    id: 'agotamiento',
    label: 'Agotamiento',
    summary: 'Fatiga respiratoria o agotamiento clínico por esfuerzo ventilatorio sostenido.',
  },
  {
    id: 'lesion-toracica',
    label: 'Lesión torácica',
    summary: 'Antecedente o sospecha de lesión en tórax relacionada con el cuadro respiratorio.',
  },
  {
    id: 'sibilancias',
    label: 'Sibilancias',
    summary: 'Presencia de sibilancias audibles o auscultables, sugestivas de broncoespasmo o reacción alérgica.',
  },
  {
    id: 'hiperglucemia',
    label: 'Hiperglucemia',
    summary: 'Elevación de la glucemia con relevancia clínica en el contexto del episodio actual.',
  },
  {
    id: 'hiperglucemia-con-cetosis',
    label: 'Hiperglucemia con cetosis',
    summary: 'Hiperglucemia acompañada de cetosis o sospecha de descompensación metabólica aguda.',
  },
  {
    id: 'traumatismo-penetrante-ocular',
    label: 'Traumatismo penetrante ocular',
    summary: 'Lesión ocular penetrante o sospecha fundada de perforación del globo ocular.',
  },
  {
    id: 'inflamacion-local',
    label: 'Inflamación local',
    summary: 'Signos inflamatorios localizados como dolor, rubor, calor o tumefacción en la zona afectada.',
  },
  {
    id: 'infeccion-local',
    label: 'Infección local',
    summary: 'Signos clínicos de infección localizada en el área del cuerpo extraño.',
  },
  {
    id: 'edad-menor-de-25-anos',
    label: 'Edad < 25 años',
    summary: 'Edad inferior a 25 años, factor de riesgo clínico relevante para este algoritmo.',
  },
  {
    id: 'gangrena-escrotal',
    label: 'Gangrena escrotal',
    summary: 'Necrosis o infección grave del escroto, con riesgo elevado de progresión rápida.',
  },
  {
    id: 'priapismo',
    label: 'Priapismo',
    summary: 'Erección persistente y dolorosa, no relacionada con estímulo sexual y con riesgo de daño tisular.',
  },
  {
    id: 'dolor-espasmodico',
    label: 'Dolor espasmódico',
    summary: 'Dolor tipo cólico o espasmódico, intermitente y de intensidad clínicamente relevante.',
  },
  {
    id: 'hematuria-franca',
    label: 'Hematuria franca',
    summary: 'Presencia visible de sangre en la orina, en cantidad clínicamente relevante.',
  },
  {
    id: 'retencion-de-orina',
    label: 'Retención de orina',
    summary: 'Imposibilidad o dificultad marcada para vaciar la vejiga con distensión o dolor asociado.',
  },
  {
    id: 'disuria',
    label: 'Disuria',
    summary: 'Dolor, escozor o dificultad al orinar sin otros criterios de mayor gravedad.',
  },
  {
    id: 'celulitis-escrotal',
    label: 'Celulitis escrotal',
    summary: 'Infección de partes blandas del escroto con inflamación y dolor local.',
  },
  {
    id: 'traumatismo-escrotal',
    label: 'Traumatismo escrotal',
    summary: 'Golpe o lesión reciente sobre el escroto con posible lesión testicular asociada.',
  },
  {
    id: 'inmunosupresion-conocida',
    label: 'Inmunosupresión conocida',
    summary: 'Situación de inmunodepresión conocida con aumento del riesgo de infección o evolución grave.',
  },
  {
    id: 'historia-hematologica-significativa',
    label: 'Historia hematológica significativa',
    summary: 'Antecedentes hematológicos relevantes que incrementan el riesgo o modifican la prioridad.',
  },
  {
    id: 'dolor-testicular',
    label: 'Dolor testicular',
    summary: 'Dolor localizado en testículo o escroto con relevancia clínica dentro del cuadro actual.',
  },
  {
    id: 'perturbador',
    label: 'Perturbador',
    summary: 'Comportamiento mental o conductual llamativo, inquietante o claramente alterado sin criterios de mayor gravedad.',
  },
  {
    id: 'dolor-picor-moderado',
    label: 'Dolor/picor moderado',
    summary: 'Molestia cutánea moderada por dolor o prurito, con relevancia clínica pero sin criterios máximos.',
  },
  {
    id: 'dolor-picor-intenso',
    label: 'Dolor/picor intenso',
    summary: 'Dolor o prurito de alta intensidad con repercusión clínica significativa.',
  },
  {
    id: 'dolor-picor',
    label: 'Dolor/picor',
    summary: 'Dolor o prurito leve como síntoma asociado al exantema.',
  },
  {
    id: 'edema-facial',
    label: 'Edema facial',
    summary: 'Hinchazón facial clínicamente relevante, potencialmente relacionada con reacción alérgica o tóxica.',
  },
  {
    id: 'edema-en-la-lengua',
    label: 'Edema en la lengua',
    summary: 'Aumento de volumen de la lengua con riesgo de compromiso de la vía aérea.',
  },
  {
    id: 'letalidad-alta',
    label: 'Letalidad alta',
    summary: 'Exposición a una sustancia con toxicidad alta o potencial vitalmente amenazante.',
  },
  {
    id: 'letalidad-moderada',
    label: 'Letalidad moderada',
    summary: 'Exposición a una sustancia con toxicidad intermedia o riesgo clínico relevante.',
  },
  {
    id: 'lesion-por-inhalacion-quimica',
    label: 'Lesión por inhalación química',
    summary: 'Síntomas o signos de daño respiratorio por inhalación de agentes químicos.',
  },
  {
    id: 'lesion-inhalatoria',
    label: 'Lesión inhalatoria',
    summary: 'Daño respiratorio por inhalación de humo, gases calientes o tóxicos, con riesgo de deterioro rápido.',
  },
  {
    id: 'inhalacion-de-humo',
    label: 'Inhalación de humo',
    summary: 'Exposición respiratoria a humo en el contexto de incendio o combustión, con relevancia clínica.',
  },
  {
    id: 'lesion-por-electricidad',
    label: 'Lesión por electricidad',
    summary: 'Quemadura o traumatismo producido por corriente eléctrica, con riesgo de lesión profunda o arritmias.',
  },
  {
    id: 'quemadura-quimica',
    label: 'Quemadura química',
    summary: 'Lesión cutánea o mucosa producida por agentes químicos con riesgo de progresión del daño.',
  },
  {
    id: 'lesion-quimica-ocular',
    label: 'Lesión química ocular',
    summary: 'Exposición química en ojo con riesgo de lesión corneal o daño ocular agudo.',
  },
  {
    id: 'reduccion-de-agudeza-visual',
    label: 'Reducción de agudeza visual',
    summary: 'Disminución objetivable o referida de la visión con relevancia clínica en la valoración ocular.',
  },
  {
    id: 'perdida-reciente-de-vision-completa-y-repentina',
    label: 'Pérdida reciente de visión completa y repentina',
    summary: 'Pérdida súbita y completa de visión de inicio reciente, sugestiva de patología ocular o neurológica urgente.',
  },
  {
    id: 'ojo-rojo',
    label: 'Ojo rojo',
    summary: 'Hiperemia ocular o conjuntival como síntoma principal sin otros criterios de mayor gravedad.',
  },
  {
    id: 'diplopia',
    label: 'Diplopia',
    summary: 'Visión doble que se corrige al ocluir un ojo.',
  },
  {
    id: 'alteracion-de-la-sensibilidad-facial',
    label: 'Alteración de la sensibilidad facial',
    summary: 'Cualquier alteración de la sensibilidad de la cara.',
  },
  {
    id: 'lenguaje-anormal',
    label: 'Lenguaje anormal',
    summary: 'Alteración del lenguaje expresivo o comprensivo sugestiva de focalidad neurológica.',
  },
  {
    id: 'asimetria-facial',
    label: 'Asimetría facial',
    summary: 'Desviación o debilidad facial unilateral compatible con focalidad neurológica.',
  },
  {
    id: 'asimetria-en-mmss',
    label: 'Asimetría en MMSS',
    summary: 'Déficit motor o asimetría en miembros superiores compatible con afectación neurológica focal.',
  },
  {
    id: 'inicio-de-los-sintomas-menor-de-4-5h',
    label: 'Inicio de los síntomas < 4,5 h',
    summary: 'Inicio reciente del déficit neurológico dentro de una ventana temporal potencialmente terapéutica.',
  },
  {
    id: 'utilice-el-discriminador-adulto-con-meg',
    label: 'Utilice el discriminador ADULTO CON MEG',
    summary: 'Derivar la valoración al algoritmo de Adulto con mal estado general cuando proceda.',
  },
  {
    id: 'activacion-codigo-ictus',
    label: 'Activación código ICTUS',
    summary: 'Salida operativa para activar el circuito asistencial de ictus de forma inmediata.',
  },
  {
    id: 'compromiso-vascular-distal',
    label: 'Compromiso vascular distal',
    summary: 'Alteración de perfusión distal al área lesionada, con riesgo isquémico de la extremidad o zona afectada.',
  },
  {
    id: 'arrancamiento-agudo-de-diente',
    label: 'Arrancamiento agudo de diente',
    summary: 'Avulsión dental reciente con pérdida completa de la pieza del alveolo.',
  },
  {
    id: 'herida-contaminada',
    label: 'Herida contaminada',
    summary: 'Herida con contaminación relevante o alto riesgo de infección por el mecanismo o el entorno.',
  },
  {
    id: 'herida-reciente',
    label: 'Herida reciente',
    summary: 'Herida producida recientemente dentro del periodo definido por el algoritmo.',
  },
  {
    id: 'lesion-reciente',
    label: 'Lesión reciente',
    summary: 'Traumatismo o lesión ocurridos recientemente que aún precisan valoración aguda.',
  },
  {
    id: 'dolor-al-mover-la-articulacion',
    label: 'Dolor al mover la articulación',
    summary: 'Dolor desencadenado o claramente agravado por la movilización articular.',
  },
  {
    id: 'articulacion-caliente',
    label: 'Articulación caliente',
    summary: 'Aumento de temperatura local articular sugestivo de proceso inflamatorio o infeccioso.',
  },
  {
    id: 'enfisema-subcutaneo',
    label: 'Enfisema subcutáneo',
    summary: 'Presencia de aire en tejido subcutáneo, con crepitación o tumefacción característica.',
  },
  {
    id: 'hematoma-auricular',
    label: 'Hematoma auricular',
    summary: 'Colección hemática en pabellón auricular, habitualmente postraumática y con riesgo de deformidad.',
  },
  {
    id: 'vertigo',
    label: 'Vértigo',
    summary: 'Sensación rotatoria o de movimiento con repercusión clínica en el contexto del problema ótico.',
  },
  {
    id: 'perdida-aguda-de-audicion',
    label: 'Pérdida aguda de audición',
    summary: 'Disminución o pérdida auditiva de instauración aguda que requiere valoración preferente.',
  },
  {
    id: 'hematoma-en-cuero-cabelludo',
    label: 'Hematoma en cuero cabelludo',
    summary: 'Tumefacción o colección hemática en cuero cabelludo tras traumatismo, clínicamente relevante en TCE.',
  },
];

const PEDIATRIC_LABELS = [
  'Bebé o niño pequeño que llora',
  'Cefalea',
  'Convulsiones',
  'Diabetes',
  'Disnea en niños',
  'Dolor abdominal en niños',
  'Dolor de cuello',
  'Dolor de espalda',
  'Dolor de garganta',
  'Dolor testicular',
  'Enfermedad hematológica',
  'Exantemas',
  'Infecciones locales y abscesos',
  'Niño cojeando',
  'Niño con mal estado general (MEG)',
  'Niño irritable',
  'Padres preocupados',
  'Politraumatismo',
  'Problemas de oído',
  'Problemas dentales',
  'Problemas faciales',
  'Problemas urinarios',
  'Quemaduras y escaldaduras',
  'Sobredosis y envenenamiento',
  'Traumatismo craneoencefálico',
  'Vómitos',
] as const;

const ADULT_LABELS = [
  'Adulto con mal estado general (MEG)',
  'Adulto con síncope o lipotimia',
  'Agresión',
  'Aparentemente ebrio',
  'Asma',
  'Autolesión (deliberada)',
  'Caídas',
  'Cefalea',
  'Comportamiento extraño',
  'Convulsiones',
  'Cuerpo extraño',
  'Diabetes',
  'Diarrea',
  'Disnea',
  'Dolor abdominal',
  'Dolor de cuello',
  'Dolor de espalda',
  'Dolor de garganta',
  'Dolor testicular',
  'Dolor torácico',
  'Embarazo',
  'Enfermedad de transmisión sexual (ETS)',
  'Enfermedad hematológica',
  'Enfermedad mental',
  'Exantemas',
  'Exposición a sustancias químicas',
  'Focalidad neurológica',
  'Hemorragia gastrointestinal',
  'Hemorragia vaginal',
  'Heridas',
  'Infecciones locales y abscesos',
  'Lesiones en el tronco',
  'Mordeduras y picaduras',
  'Palpitaciones',
  'Politraumatismo',
  'Problemas de oído',
  'Problemas dentales',
  'Problemas en las extremidades',
  'Problemas faciales',
  'Problemas nasales',
  'Problemas oculares',
  'Problemas urinarios',
  'Quemaduras y escaldaduras',
  'Sobredosis y envenenamiento',
  'Traumatismo craneoencefálico',
  'Vómitos',
] as const;

const READY_ALGORITHM_IDS: Partial<Record<ManchesterPatientGroup, Record<string, string>>> = {
  adult: {
    'Adulto con mal estado general (MEG)': 'adult-meg',
    'Adulto con síncope o lipotimia': 'adult-sincope-lipotimia',
    Agresión: 'adult-agresion',
    'Aparentemente ebrio': 'adult-aparentemente-ebrio',
    Asma: 'adult-asma',
    'Autolesión (deliberada)': 'adult-autolesion-deliberada',
    Caídas: 'adult-caidas',
    Cefalea: 'adult-cefalea',
    'Comportamiento extraño': 'adult-comportamiento-extrano',
    Convulsiones: 'adult-convulsiones',
    'Cuerpo extraño': 'adult-cuerpo-extrano',
    Diabetes: 'adult-diabetes',
    Diarrea: 'adult-diarrea',
    Disnea: 'adult-disnea',
    'Dolor abdominal': 'adult-dolor-abdominal',
    'Dolor de cuello': 'adult-dolor-de-cuello',
    'Dolor de espalda': 'adult-dolor-de-espalda',
    'Dolor de garganta': 'adult-dolor-de-garganta',
    'Dolor testicular': 'adult-dolor-testicular',
    'Dolor torácico': 'adult-dolor-toracico',
    Embarazo: 'adult-embarazo',
    'Enfermedad de transmisión sexual (ETS)': 'adult-ets',
    'Enfermedad hematológica': 'adult-enfermedad-hematologica',
    'Enfermedad mental': 'adult-enfermedad-mental',
    Exantemas: 'adult-exantemas',
    'Exposición a sustancias químicas': 'adult-exposicion-sustancias-quimicas',
    'Focalidad neurológica': 'adult-focalidad-neurologica',
    'Hemorragia gastrointestinal': 'adult-hemorragia-gastrointestinal',
    'Hemorragia vaginal': 'adult-hemorragia-vaginal',
    Heridas: 'adult-heridas',
    'Infecciones locales y abscesos': 'adult-infecciones-locales-y-abscesos',
    'Lesiones en el tronco': 'adult-lesiones-en-el-tronco',
    'Mordeduras y picaduras': 'adult-mordeduras-y-picaduras',
    Palpitaciones: 'adult-palpitaciones',
    Politraumatismo: 'adult-politraumatismo',
    'Problemas dentales': 'adult-problemas-dentales',
    'Problemas de oído': 'adult-problemas-de-oido',
    'Problemas en las extremidades': 'adult-problemas-en-las-extremidades',
    'Problemas faciales': 'adult-problemas-faciales',
    'Problemas nasales': 'adult-problemas-nasales',
    'Problemas oculares': 'adult-problemas-oculares',
    'Problemas urinarios': 'adult-problemas-urinarios',
    'Quemaduras y escaldaduras': 'adult-quemaduras-y-escaldaduras',
    'Sobredosis y envenenamiento': 'adult-sobredosis-y-envenenamiento',
    'Traumatismo craneoencefálico': 'adult-traumatismo-craneoencefalico',
    Vómitos: 'adult-vomitos',
  },
  pediatric: {
    'Bebé o niño pequeño que llora': 'pediatric-bebe-o-nino-pequeno-que-llora',
    Cefalea: 'pediatric-cefalea',
    Convulsiones: 'adult-convulsiones',
    Diabetes: 'adult-diabetes',
    'Disnea en niños': 'pediatric-disnea-en-ninos',
    'Dolor abdominal en niños': 'pediatric-dolor-abdominal-en-ninos',
    'Dolor de cuello': 'adult-dolor-de-cuello',
    'Dolor de espalda': 'adult-dolor-de-espalda',
    'Dolor de garganta': 'adult-dolor-de-garganta',
    'Dolor testicular': 'adult-dolor-testicular',
    'Enfermedad hematológica': 'adult-enfermedad-hematologica',
    Exantemas: 'adult-exantemas',
    'Infecciones locales y abscesos': 'adult-infecciones-locales-y-abscesos',
    'Niño cojeando': 'pediatric-nino-cojeando',
    'Niño con mal estado general (MEG)': 'pediatric-nino-con-meg',
    'Niño irritable': 'pediatric-nino-irritable',
    'Padres preocupados': 'pediatric-padres-preocupados',
    Politraumatismo: 'adult-politraumatismo',
    'Problemas de oído': 'adult-problemas-de-oido',
    'Problemas dentales': 'adult-problemas-dentales',
    'Problemas faciales': 'adult-problemas-faciales',
    'Problemas urinarios': 'adult-problemas-urinarios',
    'Quemaduras y escaldaduras': 'adult-quemaduras-y-escaldaduras',
    'Sobredosis y envenenamiento': 'adult-sobredosis-y-envenenamiento',
    'Traumatismo craneoencefálico': 'adult-traumatismo-craneoencefalico',
    Vómitos: 'adult-vomitos',
  },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createDiscriminator(group: ManchesterPatientGroup, label: string): ManchesterDiscriminator {
  const id = `${group}-${slugify(label)}`;
  const algorithmId = READY_ALGORITHM_IDS[group]?.[label];

  return {
    id,
    label,
    group,
    algorithmStatus: algorithmId ? 'ready' : 'pending',
    algorithmId,
  };
}

export const MANCHESTER_DISCRIMINATORS: ManchesterDiscriminator[] = [
  ...ADULT_LABELS.map((label) => createDiscriminator('adult', label)),
  ...PEDIATRIC_LABELS.map((label) => createDiscriminator('pediatric', label)),
];

const CEFALEA_STEPS: ManchesterAlgorithmStep[] = [
  {
    priority: 1,
    discriminants: [
      { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
      { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
      { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
      { id: 'nino-que-no-responde', label: '¿Niño que no responde?', glossaryId: 'nino-que-no-responde' },
      { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
    ],
  },
  {
    priority: 2,
    discriminants: [
      {
        id: 'nivel-de-consciencia-alterado',
        label: '¿Nivel de consciencia alterado?',
        glossaryId: 'nivel-de-consciencia-alterado',
      },
      {
        id: 'nueva-focalidad-neurologica-menor-de-24h',
        label: '¿Nueva focalidad neurológica < 24 h?',
        glossaryId: 'nueva-focalidad-neurologica-menor-de-24h',
      },
      { id: 'signos-de-meningismo', label: '¿Signos de meningismo?', glossaryId: 'signos-de-meningismo' },
      { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
      {
        id: 'exantema-no-blanqueable',
        label: '¿Exantema no blanqueable?',
        glossaryId: 'exantema-no-blanqueable',
      },
      { id: 'instauracion-rapida', label: '¿Instauración rápida?', glossaryId: 'instauracion-rapida' },
      {
        id: 'perdida-reciente-de-vision-completa-y-repentina',
        label: '¿Pérdida aguda completa de visión?',
        glossaryId: 'perdida-reciente-de-vision-completa-y-repentina',
      },
      { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
      { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
      { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
    ],
  },
  {
    priority: 3,
    discriminants: [
      {
        id: 'perdida-de-funcion-focal-o-progresiva',
        label: '¿Nueva focalidad neurológica > 24 h?',
        glossaryId: 'perdida-de-funcion-focal-o-progresiva',
      },
      {
        id: 'reduccion-de-agudeza-visual',
        label: '¿Reducción reciente de agudeza visual?',
        glossaryId: 'reduccion-de-agudeza-visual',
      },
      {
        id: 'dolor-en-region-temporal',
        label: '¿Dolor en región temporal?',
        glossaryId: 'dolor-en-region-temporal',
      },
      {
        id: 'historia-de-inconsciencia',
        label: '¿Historia de inconsciencia?',
        glossaryId: 'historia-de-inconsciencia',
      },
      { id: 'vomito-persistente', label: '¿Vómito persistente?', glossaryId: 'vomito-persistente' },
      { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
      { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
      { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
    ],
  },
  {
    priority: 4,
    discriminants: [
      { id: 'vomitos', label: '¿Vómitos?', glossaryId: 'vomitos' },
      { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
      { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
      { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
    ],
  },
];

export const MANCHESTER_ALGORITHMS: ManchesterAlgorithm[] = [
  {
    id: 'adult-hemorragia-gastrointestinal',
    discriminatorId: 'adult-hemorragia-gastrointestinal',
    group: 'adult',
    title: 'Hemorragia gastrointestinal',
    sourceLabel: 'PNG adulto: Hemorragia gastrointestinal',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'vomito-agudo-de-sangre',
            label: '¿Vómito agudo de sangre?',
            glossaryId: 'vomito-agudo-de-sangre',
          },
          {
            id: 'emision-aguda-de-sangre-rectal',
            label: '¿Emisión aguda de sangre fresca o alterada por vía rectal?',
            glossaryId: 'emision-aguda-de-sangre-rectal',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'heces-negras-o-color-grosella',
            label: '¿Heces negras o color grosella?',
            glossaryId: 'heces-negras-o-color-grosella',
          },
          {
            id: 'historia-de-vomito-de-sangre',
            label: '¿Historia de vómito de sangre?',
            glossaryId: 'historia-de-vomito-de-sangre',
          },
          {
            id: 'vomito-persistente',
            label: '¿Vómito persistente?',
            glossaryId: 'vomito-persistente',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'vomitos', label: '¿Vómitos?', glossaryId: 'vomitos' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-heridas',
    discriminatorId: 'adult-heridas',
    group: 'adult',
    title: 'Heridas',
    sourceLabel: 'PNG adulto: Heridas',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'compromiso-vascular-distal',
            label: '¿Compromiso vascular distal?',
            glossaryId: 'compromiso-vascular-distal',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          {
            id: 'signos-sintomas-neurologicos-recientes',
            label: '¿Signos/síntomas neurológicos recientes?',
            glossaryId: 'signos-sintomas-neurologicos-recientes',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'inflamacion-local', label: '¿Inflamación local?', glossaryId: 'inflamacion-local' },
          { id: 'infeccion-local', label: '¿Infección local?', glossaryId: 'infeccion-local' },
          { id: 'herida-contaminada', label: '¿Herida contaminada?', glossaryId: 'herida-contaminada' },
          { id: 'herida-reciente', label: '¿Herida reciente?', glossaryId: 'herida-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-infecciones-locales-y-abscesos',
    discriminatorId: 'adult-infecciones-locales-y-abscesos',
    group: 'adult',
    title: 'Infecciones locales y abscesos',
    sourceLabel: 'PNG adulto: Infecciones locales y abscesos',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'enfisema-subcutaneo', label: '¿Enfisema subcutáneo?', glossaryId: 'enfisema-subcutaneo' },
          { id: 'compromiso-vascular', label: '¿Compromiso vascular?', glossaryId: 'compromiso-vascular-distal' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'dolor-al-mover-la-articulacion',
            label: '¿Dolor al mover la articulación?',
            glossaryId: 'dolor-al-mover-la-articulacion',
          },
          { id: 'articulacion-caliente', label: '¿Articulación caliente?', glossaryId: 'articulacion-caliente' },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-exantemas',
    discriminatorId: 'adult-exantemas',
    group: 'adult',
    title: 'Exantemas',
    sourceLabel: 'PNG adulto: Exantemas',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
          { id: 'estridor', label: '¿Estridor?', glossaryId: 'estridor' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-picor-intenso', label: '¿Dolor/picor intenso?', glossaryId: 'dolor-picor-intenso' },
          {
            id: 'historia-significativa-de-alergia',
            label: '¿Historia significativa de alergia?',
            glossaryId: 'historia-significativa-de-alergia',
          },
          { id: 'edema-facial', label: '¿Edema facial?', glossaryId: 'edema-facial' },
          { id: 'edema-en-la-lengua', label: '¿Edema en la lengua?', glossaryId: 'edema-en-la-lengua' },
          { id: 'disnea-aguda', label: '¿Disnea aguda?', glossaryId: 'disnea-aguda' },
          { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-picor-moderado', label: '¿Dolor/picor moderado?', glossaryId: 'dolor-picor-moderado' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'secreciones-o-vesiculas-generalizadas',
            label: '¿Secreciones o vesículas generalizadas?',
            glossaryId: 'secreciones-o-vesiculas-generalizadas',
          },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor-picor', label: '¿Dolor/picor?', glossaryId: 'dolor-picor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-exposicion-sustancias-quimicas',
    discriminatorId: 'adult-exposicion-a-sustancias-quimicas',
    group: 'adult',
    title: 'Exposición a sustancias químicas',
    sourceLabel: 'PNG adulto: Exposición a sustancias químicas',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'lesion-quimica-ocular', label: '¿Lesión química ocular?', glossaryId: 'lesion-quimica-ocular' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
          { id: 'estridor', label: '¿Estridor?', glossaryId: 'estridor' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'letalidad-alta', label: '¿Letalidad alta?', glossaryId: 'letalidad-alta' },
          { id: 'edema-facial', label: '¿Edema facial?', glossaryId: 'edema-facial' },
          { id: 'edema-en-la-lengua', label: '¿Edema en la lengua?', glossaryId: 'edema-en-la-lengua' },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'lesion-por-inhalacion-quimica',
            label: '¿Lesión por inhalación química?',
            glossaryId: 'lesion-por-inhalacion-quimica',
          },
          {
            id: 'saturacion-de-oxigeno-muy-baja',
            label: '¿Saturación de oxígeno muy baja?',
            glossaryId: 'saturacion-de-oxigeno-muy-baja',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'letalidad-moderada', label: '¿Letalidad moderada?', glossaryId: 'letalidad-moderada' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'secreciones-o-vesiculas-generalizadas',
            label: '¿Secreciones o vesículas generalizadas?',
            glossaryId: 'secreciones-o-vesiculas-generalizadas',
          },
          {
            id: 'saturacion-de-oxigeno-baja',
            label: '¿Saturación de oxígeno baja?',
            glossaryId: 'saturacion-de-oxigeno-baja',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'lesion', label: '¿Lesión?', glossaryId: 'lesion' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-focalidad-neurologica',
    discriminatorId: 'adult-focalidad-neurologica',
    group: 'adult',
    title: 'Focalidad neurológica',
    sourceLabel: 'PNG adulto: Focalidad neurológica',
    fallbackPriority: 5,
    fallbackTitle: 'Seleccionar discriminador Adulto con mal estado general (MEG)',
    fallbackDescription: 'Si no se cumplen criterios de código ictus, continúa la valoración con Adulto con mal estado general.',
    fallbackPanelClassName: 'rounded-2xl border border-slate-200 bg-slate-100 p-4 text-slate-900',
    fallbackHidePriority: true,
    steps: [
      {
        priority: 2,
        resultPriority: 2,
        discriminants: [
          { id: 'lenguaje-anormal', label: '¿Lenguaje anormal?', glossaryId: 'lenguaje-anormal' },
          { id: 'asimetria-facial', label: '¿Asimetría facial?', glossaryId: 'asimetria-facial' },
          { id: 'asimetria-en-mmss', label: '¿Asimetría en MMSS?', glossaryId: 'asimetria-en-mmss' },
          {
            id: 'inicio-de-los-sintomas-menor-de-4-5h',
            label: '¿Inicio de los síntomas < 4,5 h?',
            glossaryId: 'inicio-de-los-sintomas-menor-de-4-5h',
          },
        ],
      },
    ],
  },
  {
    id: 'adult-lesiones-en-el-tronco',
    discriminatorId: 'adult-lesiones-en-el-tronco',
    group: 'adult',
    title: 'Lesiones en el tronco',
    sourceLabel: 'PNG adulto: Lesiones en el tronco',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'mecanismo-de-la-lesion-determinante',
            label: '¿Mecanismo de la lesión determinante?',
            glossaryId: 'mecanismo-de-la-lesion-determinante',
          },
          {
            id: 'historia-de-incidente-significativo',
            label: '¿Historia de incidente significativo?',
            glossaryId: 'historia-de-incidente-significativo',
          },
          { id: 'disnea-aguda', label: '¿Disnea aguda?', glossaryId: 'disnea-aguda' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'evisceracion-de-organos',
            label: '¿Evisceración de órganos?',
            glossaryId: 'evisceracion-de-organos',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'inflamacion-local', label: '¿Inflamación local?', glossaryId: 'inflamacion-local' },
          { id: 'infeccion-local', label: '¿Infección local?', glossaryId: 'infeccion-local' },
          { id: 'lesion-reciente', label: '¿Lesión reciente?', glossaryId: 'lesion-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-mordeduras-y-picaduras',
    discriminatorId: 'adult-mordeduras-y-picaduras',
    group: 'adult',
    title: 'Mordeduras y picaduras',
    sourceLabel: 'PNG adulto: Mordeduras y picaduras',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'estridor', label: '¿Estridor?', glossaryId: 'estridor' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'historia-significativa-de-alergia',
            label: '¿Historia significativa de alergia?',
            glossaryId: 'historia-significativa-de-alergia',
          },
          { id: 'disnea-aguda', label: '¿Disnea aguda?', glossaryId: 'disnea-aguda' },
          { id: 'sibilancias', label: '¿Sibilancias?', glossaryId: 'sibilancias' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          { id: 'edema-en-la-lengua', label: '¿Edema en la lengua?', glossaryId: 'edema-en-la-lengua' },
          { id: 'edema-facial', label: '¿Edema facial?', glossaryId: 'edema-facial' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          {
            id: 'secreciones-o-vesiculas-generalizadas',
            label: '¿Secreciones o vesículas generalizadas?',
            glossaryId: 'secreciones-o-vesiculas-generalizadas',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'inflamacion-local', label: '¿Inflamación local?', glossaryId: 'inflamacion-local' },
          { id: 'infeccion-local', label: '¿Infección local?', glossaryId: 'infeccion-local' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-politraumatismo',
    discriminatorId: 'adult-politraumatismo',
    group: 'adult',
    title: 'Politraumatismo',
    sourceLabel: 'PNG adulto: Politraumatismo',
    fallbackPriority: 4,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'nino-que-no-responde', label: '¿Niño que no responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'historia-de-incidente-significativo',
            label: '¿Historia de incidente significativo?',
            glossaryId: 'historia-de-incidente-significativo',
          },
          {
            id: 'mecanismo-de-la-lesion-determinante',
            label: '¿Mecanismo de la lesión determinante?',
            glossaryId: 'mecanismo-de-la-lesion-determinante',
          },
          { id: 'disnea-aguda', label: '¿Disnea aguda?', glossaryId: 'disnea-aguda' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'historial-medico-significativo',
            label: '¿Historial médico significativo?',
            glossaryId: 'historial-medico-significativo',
          },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          {
            id: 'historia-de-inconsciencia',
            label: '¿Historia de inconsciencia?',
            glossaryId: 'historia-de-inconsciencia',
          },
          {
            id: 'signos-sintomas-neurologicos-recientes',
            label: '¿Signos/síntomas neurológicos recientes?',
            glossaryId: 'signos-sintomas-neurologicos-recientes',
          },
        ],
      },
    ],
  },
  {
    id: 'adult-problemas-dentales',
    discriminatorId: 'adult-problemas-dentales',
    group: 'adult',
    title: 'Problemas dentales',
    sourceLabel: 'PNG adulto: Problemas dentales',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
          {
            id: 'arrancamiento-agudo-de-diente',
            label: '¿Arrancamiento agudo de diente?',
            glossaryId: 'arrancamiento-agudo-de-diente',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'tumefaccion-facial', label: '¿Tumefacción facial?', glossaryId: 'tumefaccion-facial' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-problemas-de-oido',
    discriminatorId: 'adult-problemas-de-oido',
    group: 'adult',
    title: 'Problemas de oído',
    sourceLabel: 'PNG adulto: Problemas de oído',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'historia-de-traumatismo-craneoencefalico',
            label: '¿Antecedente de traumatismo craneoencefálico?',
            glossaryId: 'historia-de-traumatismo-craneoencefalico',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          { id: 'hematoma-auricular', label: '¿Hematoma auricular?', glossaryId: 'hematoma-auricular' },
          { id: 'vertigo', label: '¿Vértigo?', glossaryId: 'vertigo' },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          {
            id: 'perdida-aguda-de-audicion',
            label: '¿Pérdida aguda de audición?',
            glossaryId: 'perdida-aguda-de-audicion',
          },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-problemas-en-las-extremidades',
    discriminatorId: 'adult-problemas-en-las-extremidades',
    group: 'adult',
    title: 'Problemas en las extremidades',
    sourceLabel: 'PNG adulto: Problemas en las extremidades',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'compromiso-vascular', label: '¿Compromiso vascular?', glossaryId: 'compromiso-vascular-distal' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'estado-critico-de-la-piel',
            label: '¿Estado crítico de la piel?',
            glossaryId: 'estado-critico-de-la-piel',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          { id: 'deformidad-grosera', label: '¿Deformidad grosera?', glossaryId: 'deformidad-grosera' },
          { id: 'fractura-abierta', label: '¿Fractura abierta?', glossaryId: 'fractura-abierta' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'deformidad', label: '¿Deformidad?', glossaryId: 'deformidad' },
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'tumefaccion', label: '¿Tumefacción?', glossaryId: 'tumefaccion' },
          { id: 'lesion-reciente', label: '¿Lesión reciente?', glossaryId: 'lesion-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-problemas-nasales',
    discriminatorId: 'adult-problemas-nasales',
    group: 'adult',
    title: 'Problemas nasales',
    sourceLabel: 'PNG adulto: Problemas nasales',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'historia-significativa', label: '¿Historia significativa?', glossaryId: 'historia-significativa' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          { id: 'deformidad-grosera', label: '¿Deformidad grosera?', glossaryId: 'deformidad-grosera' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-problemas-oculares',
    discriminatorId: 'adult-problemas-oculares',
    group: 'adult',
    title: 'Problemas oculares',
    sourceLabel: 'PNG adulto: Problemas oculares',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'lesion-quimica-ocular', label: '¿Lesión química ocular?', glossaryId: 'lesion-quimica-ocular' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'traumatismo-penetrante-ocular',
            label: '¿Traumatismo penetrante ocular?',
            glossaryId: 'traumatismo-penetrante-ocular',
          },
          {
            id: 'perdida-reciente-de-vision-completa-y-repentina',
            label: '¿Pérdida reciente de visión completa y repentina?',
            glossaryId: 'perdida-reciente-de-vision-completa-y-repentina',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'reduccion-de-agudeza-visual',
            label: '¿Reducción de agudeza visual?',
            glossaryId: 'reduccion-de-agudeza-visual',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'ojo-rojo', label: '¿Ojo rojo?', glossaryId: 'ojo-rojo' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-problemas-urinarios',
    discriminatorId: 'adult-problemas-urinarios',
    group: 'adult',
    title: 'Problemas urinarios',
    sourceLabel: 'PNG adulto: Problemas urinarios',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'priapismo', label: '¿Priapismo?', glossaryId: 'priapismo' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'dolor-espasmodico', label: '¿Dolor espasmódico?', glossaryId: 'dolor-espasmodico' },
          { id: 'hematuria-franca', label: '¿Hematuria franca?', glossaryId: 'hematuria-franca' },
          { id: 'retencion-de-orina', label: '¿Retención de orina?', glossaryId: 'retencion-de-orina' },
          { id: 'vomito-persistente', label: '¿Vómito persistente?', glossaryId: 'vomito-persistente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'vomitos', label: '¿Vómitos?', glossaryId: 'vomitos' },
          { id: 'tumefaccion', label: '¿Tumefacción?', glossaryId: 'tumefaccion' },
          { id: 'disuria', label: '¿Disuria?', glossaryId: 'disuria' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-quemaduras-y-escaldaduras',
    discriminatorId: 'adult-quemaduras-y-escaldaduras',
    group: 'adult',
    title: 'Quemaduras y escaldaduras',
    sourceLabel: 'PNG adulto: Quemaduras y escaldaduras',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿Niño que no responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'disnea-aguda', label: '¿Disnea aguda?', glossaryId: 'disnea-aguda' },
          { id: 'lesion-inhalatoria', label: '¿Lesión inhalatoria?', glossaryId: 'lesion-inhalatoria' },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'historia-de-incidente-significativo',
            label: '¿Historia de incidente significativo?',
            glossaryId: 'historia-de-incidente-significativo',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'inhalacion-de-humo', label: '¿Inhalación de humo?', glossaryId: 'inhalacion-de-humo' },
          { id: 'lesion-por-electricidad', label: '¿Lesión por electricidad?', glossaryId: 'lesion-por-electricidad' },
          { id: 'quemadura-quimica', label: '¿Quemadura química?', glossaryId: 'quemadura-quimica' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'inflamacion-local', label: '¿Inflamación local?', glossaryId: 'inflamacion-local' },
          { id: 'infeccion-local', label: '¿Infección local?', glossaryId: 'infeccion-local' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-sobredosis-y-envenenamiento',
    discriminatorId: 'adult-sobredosis-y-envenenamiento',
    group: 'adult',
    title: 'Sobredosis y envenenamiento',
    sourceLabel: 'PNG adulto: Sobredosis y envenenamiento',
    fallbackPriority: 4,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿Niño que no responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'letalidad-alta', label: '¿Letalidad alta?', glossaryId: 'letalidad-alta' },
          {
            id: 'alto-riesgo-de-volver-a-autolesionarse',
            label: '¿Alto riesgo de volver a autolesionarse?',
            glossaryId: 'alto-riesgo-de-volver-a-autolesionarse',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'letalidad-moderada', label: '¿Letalidad moderada?', glossaryId: 'letalidad-moderada' },
          {
            id: 'riesgo-moderado-de-volver-a-autolesionarse',
            label: '¿Riesgo moderado de volver a autolesionarse?',
            glossaryId: 'riesgo-moderado-de-volver-a-autolesionarse',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          { id: 'angustia-acusada', label: '¿Angustia acusada?', glossaryId: 'angustia-acusada' },
        ],
      },
    ],
  },
  {
    id: 'adult-traumatismo-craneoencefalico',
    discriminatorId: 'adult-traumatismo-craneoencefalico',
    group: 'adult',
    title: 'Traumatismo craneoencefálico',
    sourceLabel: 'PNG adulto: Traumatismo craneoencefálico',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'nino-que-no-responde', label: '¿Niño que no responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'mecanismo-de-la-lesion-determinante',
            label: '¿Mecanismo de la lesión determinante?',
            glossaryId: 'mecanismo-de-la-lesion-determinante',
          },
          {
            id: 'historia-de-incidente-significativo',
            label: '¿Historia de incidente significativo?',
            glossaryId: 'historia-de-incidente-significativo',
          },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'historia-de-inconsciencia',
            label: '¿Historia de inconsciencia?',
            glossaryId: 'historia-de-inconsciencia',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          {
            id: 'perdida-de-funcion-focal-o-progresiva',
            label: '¿Pérdida de función focal o progresiva?',
            glossaryId: 'perdida-de-funcion-focal-o-progresiva',
          },
          {
            id: 'signos-sintomas-neurologicos-recientes',
            label: '¿Signos/síntomas neurológicos recientes?',
            glossaryId: 'signos-sintomas-neurologicos-recientes',
          },
          { id: 'vomito-persistente', label: '¿Vómito persistente?', glossaryId: 'vomito-persistente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'cefalea', label: '¿Cefalea?', glossaryId: 'cefalea' },
          {
            id: 'hematoma-en-cuero-cabelludo',
            label: '¿Hematoma en cuero cabelludo?',
            glossaryId: 'hematoma-en-cuero-cabelludo',
          },
          { id: 'vomitos', label: '¿Vómitos?', glossaryId: 'vomitos' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-vomitos',
    discriminatorId: 'adult-vomitos',
    group: 'adult',
    title: 'Vómitos',
    sourceLabel: 'PNG adulto: Vómitos',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿Niño que no responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'vomito-agudo-de-sangre', label: '¿Vómito agudo de sangre?', glossaryId: 'vomito-agudo-de-sangre' },
          {
            id: 'emision-aguda-de-sangre-rectal',
            label: '¿Emisión aguda de sangre fresca o alterada por vía rectal?',
            glossaryId: 'emision-aguda-de-sangre-rectal',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'historia-de-vomito-de-sangre',
            label: '¿Historia de vómito de sangre?',
            glossaryId: 'historia-de-vomito-de-sangre',
          },
          {
            id: 'signos-de-deshidratacion',
            label: '¿Signos de deshidratación?',
            glossaryId: 'signos-de-deshidratacion',
          },
          { id: 'vomito-persistente', label: '¿Vómito persistente?', glossaryId: 'vomito-persistente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-ets',
    discriminatorId: 'adult-enfermedad-de-transmision-sexual-ets',
    group: 'adult',
    title: 'Enfermedad de transmisión sexual (ETS)',
    sourceLabel: 'PNG adulto: Enfermedad de transmisión sexual (ETS)',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          { id: 'exantema-desconocido', label: '¿Exantema desconocido?', glossaryId: 'exantema-desconocido' },
          { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'dolor-testicular', label: '¿Dolor testicular?', glossaryId: 'dolor-testicular' },
          {
            id: 'inmunosupresion-conocida',
            label: '¿Inmunosupresión conocida?',
            glossaryId: 'inmunosupresion-conocida',
          },
          {
            id: 'secreciones-o-vesiculas-generalizadas',
            label: '¿Secreciones o vesículas generalizadas?',
            glossaryId: 'secreciones-o-vesiculas-generalizadas',
          },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-enfermedad-hematologica',
    discriminatorId: 'adult-enfermedad-hematologica',
    group: 'adult',
    title: 'Enfermedad hematológica',
    sourceLabel: 'PNG adulto: Enfermedad hematológica',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'historia-hematologica-significativa',
            label: '¿Historia hematológica significativa?',
            glossaryId: 'historia-hematologica-significativa',
          },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          {
            id: 'inmunosupresion-conocida',
            label: '¿Inmunosupresión conocida?',
            glossaryId: 'inmunosupresion-conocida',
          },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-enfermedad-mental',
    discriminatorId: 'adult-enfermedad-mental',
    group: 'adult',
    title: 'Enfermedad mental',
    sourceLabel: 'PNG adulto: Enfermedad mental',
    fallbackPriority: 4,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'alto-riesgo-de-danar-a-otros',
            label: '¿Alto riesgo de dañar a otros?',
            glossaryId: 'alto-riesgo-de-danar-a-otros',
          },
          {
            id: 'alto-riesgo-de-autolesion',
            label: '¿Alto riesgo de autolesión?',
            glossaryId: 'alto-riesgo-de-autolesion',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'riesgo-moderado-de-danar-a-otros',
            label: '¿Riesgo moderado de dañar a otros?',
            glossaryId: 'riesgo-moderado-de-danar-a-otros',
          },
          {
            id: 'riesgo-moderado-de-autolesion',
            label: '¿Riesgo moderado de autolesión?',
            glossaryId: 'riesgo-moderado-de-autolesion',
          },
          {
            id: 'historia-psiquiatrica-significativa',
            label: '¿Historia psiquiátrica significativa?',
            glossaryId: 'historia-psiquiatrica-significativa',
          },
          { id: 'perturbador', label: '¿Perturbador?', glossaryId: 'perturbador' },
          { id: 'angustia-acusada', label: '¿Angustia acusada?', glossaryId: 'angustia-acusada' },
        ],
      },
    ],
  },
  {
    id: 'adult-cuerpo-extrano',
    discriminatorId: 'adult-cuerpo-extrano',
    group: 'adult',
    title: 'Cuerpo extraño',
    sourceLabel: 'PNG adulto: Cuerpo extraño',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
          { id: 'estridor', label: '¿Estridor?', glossaryId: 'estridor' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'mecanismo-de-la-lesion-determinante',
            label: '¿Mecanismo de la lesión determinante?',
            glossaryId: 'mecanismo-de-la-lesion-determinante',
          },
          {
            id: 'historia-de-incidente-significativo',
            label: '¿Historia de incidente significativo?',
            glossaryId: 'historia-de-incidente-significativo',
          },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'traumatismo-penetrante-ocular',
            label: '¿Traumatismo penetrante ocular?',
            glossaryId: 'traumatismo-penetrante-ocular',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'inflamacion-local', label: '¿Inflamación local?', glossaryId: 'inflamacion-local' },
          { id: 'infeccion-local', label: '¿Infección local?', glossaryId: 'infeccion-local' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-dolor-testicular',
    discriminatorId: 'adult-dolor-testicular',
    group: 'adult',
    title: 'Dolor testicular',
    sourceLabel: 'PNG adulto: Dolor testicular',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
          {
            id: 'edad-menor-de-25-anos',
            label: '¿Edad < 25 años?',
            glossaryId: 'edad-menor-de-25-anos',
          },
          { id: 'gangrena-escrotal', label: '¿Gangrena escrotal?', glossaryId: 'gangrena-escrotal' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'dolor-espasmodico', label: '¿Dolor espasmódico?', glossaryId: 'dolor-espasmodico' },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
          { id: 'celulitis-escrotal', label: '¿Celulitis escrotal?', glossaryId: 'celulitis-escrotal' },
          {
            id: 'vomito-persistente',
            label: '¿Vómito persistente?',
            glossaryId: 'vomito-persistente',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'vomitos', label: '¿Vómitos?', glossaryId: 'vomitos' },
          { id: 'traumatismo-escrotal', label: '¿Traumatismo escrotal?', glossaryId: 'traumatismo-escrotal' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-dolor-toracico',
    discriminatorId: 'adult-dolor-toracico',
    group: 'adult',
    title: 'Dolor torácico',
    sourceLabel: 'PNG adulto: Dolor torácico',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'disnea-aguda', label: '¿Disnea aguda?', glossaryId: 'disnea-aguda' },
          { id: 'dolor-cardiaco', label: '¿Dolor cardíaco?', glossaryId: 'dolor-cardiaco' },
          { id: 'pulso-anormal', label: '¿Pulso anormal?', glossaryId: 'pulso-anormal' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'dolor-pleuritico', label: '¿Dolor pleurítico?', glossaryId: 'dolor-pleuritico' },
          {
            id: 'vomito-persistente',
            label: '¿Vómito persistente?',
            glossaryId: 'vomito-persistente',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'vomitos', label: '¿Vómitos?', glossaryId: 'vomitos' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-diabetes',
    discriminatorId: 'adult-diabetes',
    group: 'adult',
    title: 'Diabetes',
    sourceLabel: 'PNG adulto: Diabetes',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿Niño que no responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'hipoglucemia', label: '¿Hipoglucemia?', glossaryId: 'hipoglucemia' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'hiperglucemia-con-cetosis',
            label: '¿Hiperglucemia con cetosis?',
            glossaryId: 'hiperglucemia-con-cetosis',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'hiperglucemia', label: '¿Hiperglucemia?', glossaryId: 'hiperglucemia' },
          {
            id: 'vomito-persistente',
            label: '¿Vómito persistente?',
            glossaryId: 'vomito-persistente',
          },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'vomitos', label: '¿Vómitos?', glossaryId: 'vomitos' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-disnea',
    discriminatorId: 'adult-disnea',
    group: 'adult',
    title: 'Disnea',
    sourceLabel: 'PNG adulto: Disnea',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-cardiaco', label: '¿Dolor cardíaco?', glossaryId: 'dolor-cardiaco' },
          {
            id: 'instauracion-aguda-tras-una-lesion',
            label: '¿Instauración aguda tras una lesión?',
            glossaryId: 'instauracion-aguda-tras-una-lesion',
          },
          {
            id: 'incapaz-de-decir-frases',
            label: '¿Incapaz de decir frases?',
            glossaryId: 'incapaz-de-decir-frases',
          },
          {
            id: 'flujo-espiratorio-maximo-muy-bajo',
            label: '¿Flujo espiratorio máximo muy bajo?',
            glossaryId: 'flujo-espiratorio-maximo-muy-bajo',
          },
          {
            id: 'saturacion-de-oxigeno-muy-baja',
            label: '¿Saturación de oxígeno muy baja?',
            glossaryId: 'saturacion-de-oxigeno-muy-baja',
          },
          { id: 'pulso-anormal', label: '¿Pulso anormal?', glossaryId: 'pulso-anormal' },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          { id: 'agotamiento', label: '¿Agotamiento?', glossaryId: 'agotamiento' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-pleuritico', label: '¿Dolor pleurítico?', glossaryId: 'dolor-pleuritico' },
          {
            id: 'historia-significativa-de-asma',
            label: '¿Historia significativa de asma?',
            glossaryId: 'historia-significativa-de-asma',
          },
          {
            id: 'flujo-espiratorio-maximo-bajo',
            label: '¿Flujo espiratorio máximo bajo?',
            glossaryId: 'flujo-espiratorio-maximo-bajo',
          },
          {
            id: 'saturacion-de-oxigeno-baja',
            label: '¿Saturación de oxígeno baja?',
            glossaryId: 'saturacion-de-oxigeno-baja',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          {
            id: 'respiracion-sibilante-o-sibilancias',
            label: '¿Respiración sibilante o sibilancias?',
            glossaryId: 'respiracion-sibilante-o-sibilancias',
          },
          { id: 'infeccion-respiratoria', label: '¿Infección respiratoria?', glossaryId: 'infeccion-respiratoria' },
          { id: 'lesion-toracica', label: '¿Lesión torácica?', glossaryId: 'lesion-toracica' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-dolor-de-cuello',
    discriminatorId: 'adult-dolor-de-cuello',
    group: 'adult',
    title: 'Dolor de cuello',
    sourceLabel: 'PNG adulto: Dolor de cuello',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'signos-de-meningismo', label: '¿Signos de meningismo?', glossaryId: 'signos-de-meningismo' },
          { id: 'exantema-desconocido', label: '¿Exantema desconocido?', glossaryId: 'exantema-desconocido' },
          { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'traumatismo-directo-en-el-cuello',
            label: '¿Traumatismo directo en el cuello?',
            glossaryId: 'traumatismo-directo-en-el-cuello',
          },
          {
            id: 'signos-sintomas-neurologicos-recientes',
            label: '¿Signos/síntomas neurológicos recientes?',
            glossaryId: 'signos-sintomas-neurologicos-recientes',
          },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-dolor-de-espalda',
    discriminatorId: 'adult-dolor-de-espalda',
    group: 'adult',
    title: 'Dolor de espalda',
    sourceLabel: 'PNG adulto: Dolor de espalda',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'dolor-abdominal', label: '¿Dolor abdominal?', glossaryId: 'dolor-abdominal' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'signos-sintomas-neurologicos-recientes',
            label: '¿Signos/síntomas neurológicos recientes?',
            glossaryId: 'signos-sintomas-neurologicos-recientes',
          },
          {
            id: 'traumatismo-directo-en-la-espalda',
            label: '¿Traumatismo directo en la espalda?',
            glossaryId: 'traumatismo-directo-en-la-espalda',
          },
          {
            id: 'incapaz-de-caminar',
            label: '¿Incapaz de caminar?',
            glossaryId: 'incapaz-de-caminar',
          },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-dolor-de-garganta',
    discriminatorId: 'adult-dolor-de-garganta',
    group: 'adult',
    title: 'Dolor de garganta',
    sourceLabel: 'PNG adulto: Dolor de garganta',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'babeo', label: '¿Babeo?', glossaryId: 'babeo' },
          { id: 'estridor', label: '¿Estridor?', glossaryId: 'estridor' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
          {
            id: 'historia-de-viaje-al-extranjero',
            label: '¿Historia de viaje al extranjero?',
            glossaryId: 'historia-de-viaje-al-extranjero',
          },
          { id: 'instauracion-rapida', label: '¿Instauración rápida?', glossaryId: 'instauracion-rapida' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-diarrea',
    discriminatorId: 'adult-diarrea',
    group: 'adult',
    title: 'Diarrea',
    sourceLabel: 'PNG adulto: Diarrea',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'vomito-agudo-de-sangre',
            label: '¿Vómito agudo de sangre?',
            glossaryId: 'vomito-agudo-de-sangre',
          },
          {
            id: 'emision-aguda-de-sangre-rectal',
            label: '¿Emisión aguda de sangre fresca o alterada por vía rectal?',
            glossaryId: 'emision-aguda-de-sangre-rectal',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'historia-significativa',
            label: '¿Historia significativa?',
            glossaryId: 'historia-significativa',
          },
          {
            id: 'heces-negras-o-color-grosella',
            label: '¿Heces negras o color grosella?',
            glossaryId: 'heces-negras-o-color-grosella',
          },
          {
            id: 'historia-de-vomito-de-sangre',
            label: '¿Historia de vómito de sangre?',
            glossaryId: 'historia-de-vomito-de-sangre',
          },
          {
            id: 'signos-de-deshidratacion',
            label: '¿Signos de deshidratación?',
            glossaryId: 'signos-de-deshidratacion',
          },
          {
            id: 'vomito-persistente',
            label: '¿Vómito persistente?',
            glossaryId: 'vomito-persistente',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'vomitos', label: '¿Vómitos?', glossaryId: 'vomitos' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-convulsiones',
    discriminatorId: 'adult-convulsiones',
    group: 'adult',
    title: 'Convulsiones',
    sourceLabel: 'PNG adulto: Convulsiones',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿Niño que no responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
          { id: 'hipoglucemia', label: '¿Hipoglucemia?', glossaryId: 'hipoglucemia' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'historia-de-sobredosis-y-o-envenenamiento',
            label: '¿Historia de sobredosis y/o envenenamiento?',
            glossaryId: 'historia-de-sobredosis-y-o-envenenamiento',
          },
          {
            id: 'signos-de-meningismo',
            label: '¿Signos de meningismo?',
            glossaryId: 'signos-de-meningismo',
          },
          { id: 'exantema-desconocido', label: '¿Exantema desconocido?', glossaryId: 'exantema-desconocido' },
          { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'historia-de-traumatismo-craneoencefalico',
            label: '¿Historia de traumatismo craneoencefálico?',
            glossaryId: 'historia-de-traumatismo-craneoencefalico',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'perdida-de-funcion-focal-o-progresiva',
            label: '¿Pérdida de función focal o progresiva?',
            glossaryId: 'perdida-de-funcion-focal-o-progresiva',
          },
          {
            id: 'signos-sintomas-neurologicos-recientes',
            label: '¿Signos/síntomas neurológicos recientes?',
            glossaryId: 'signos-sintomas-neurologicos-recientes',
          },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'cefalea', label: '¿Cefalea?', glossaryId: 'cefalea' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-comportamiento-extrano',
    discriminatorId: 'adult-comportamiento-extrano',
    group: 'adult',
    title: 'Comportamiento extraño',
    sourceLabel: 'PNG adulto: Comportamiento extraño',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hipoglucemia', label: '¿Hipoglucemia?', glossaryId: 'hipoglucemia' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'historia-de-sobredosis-y-o-envenenamiento',
            label: '¿Historia de sobredosis y/o envenenamiento?',
            glossaryId: 'historia-de-sobredosis-y-o-envenenamiento',
          },
          {
            id: 'alto-riesgo-de-danar-a-otros',
            label: '¿Alto riesgo de dañar a otros?',
            glossaryId: 'alto-riesgo-de-danar-a-otros',
          },
          {
            id: 'alto-riesgo-de-autolesion',
            label: '¿Alto riesgo de autolesión?',
            glossaryId: 'alto-riesgo-de-autolesion',
          },
          {
            id: 'historia-psiquiatrica-significativa',
            label: '¿Historia psiquiátrica significativa?',
            glossaryId: 'historia-psiquiatrica-significativa',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'traumatismo-craneoencefalico',
            label: '¿Traumatismo craneoencefálico?',
            glossaryId: 'traumatismo-craneoencefalico',
          },
          {
            id: 'riesgo-moderado-de-danar-a-otros',
            label: '¿Riesgo moderado de dañar a otros?',
            glossaryId: 'riesgo-moderado-de-danar-a-otros',
          },
          {
            id: 'riesgo-moderado-de-autolesion',
            label: '¿Riesgo moderado de autolesión?',
            glossaryId: 'riesgo-moderado-de-autolesion',
          },
          {
            id: 'historia-de-inconsciencia',
            label: '¿Historia de inconsciencia?',
            glossaryId: 'historia-de-inconsciencia',
          },
          {
            id: 'signos-sintomas-neurologicos-recientes',
            label: '¿Signos/síntomas neurológicos recientes?',
            glossaryId: 'signos-sintomas-neurologicos-recientes',
          },
          {
            id: 'perdida-de-funcion-focal-o-progresiva',
            label: '¿Pérdida de función focal o progresiva?',
            glossaryId: 'perdida-de-funcion-focal-o-progresiva',
          },
        ],
      },
    ],
  },
  {
    id: 'adult-meg',
    discriminatorId: 'adult-adulto-con-mal-estado-general-meg',
    group: 'adult',
    title: 'Adulto con mal estado general (MEG)',
    sourceLabel: 'PDF adulto: Adulto con mal estado general (MEG)',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'pulso-anormal', label: '¿Pulso anormal?', glossaryId: 'pulso-anormal' },
          {
            id: 'historia-de-riesgo-especial-de-infeccion',
            label: '¿Historia de riesgo especial de infección?',
            glossaryId: 'historia-de-riesgo-especial-de-infeccion',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'signos-de-meningismo',
            label: '¿Signos de meningismo?',
            glossaryId: 'signos-de-meningismo',
          },
          { id: 'exantema-desconocido', label: '¿Exantema desconocido?', glossaryId: 'exantema-desconocido' },
          { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
          { id: 'adulto-muy-caliente', label: '¿Adulto muy caliente?', glossaryId: 'adulto-muy-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'instauracion-rapida', label: '¿Instauración rápida?', glossaryId: 'instauracion-rapida' },
          {
            id: 'historia-de-viaje-al-extranjero',
            label: '¿Historia de viaje al extranjero?',
            glossaryId: 'historia-de-viaje-al-extranjero',
          },
          {
            id: 'secreciones-o-vesiculas-generalizadas',
            label: '¿Secreciones o vesículas generalizadas?',
            glossaryId: 'secreciones-o-vesiculas-generalizadas',
          },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
        ],
      },
    ],
  },
  {
    id: 'adult-sincope-lipotimia',
    discriminatorId: 'adult-adulto-con-sincope-o-lipotimia',
    group: 'adult',
    title: 'Adulto con síncope o lipotimia',
    sourceLabel: 'PDF adulto: Adulto con síncope o lipotimia',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'dolor-cardiaco', label: '¿Dolor cardíaco?', glossaryId: 'dolor-cardiaco' },
          { id: 'disnea-aguda', label: '¿Disnea aguda?', glossaryId: 'disnea-aguda' },
          { id: 'pulso-anormal', label: '¿Pulso anormal?', glossaryId: 'pulso-anormal' },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          { id: 'exantema-desconocido', label: '¿Exantema desconocido?', glossaryId: 'exantema-desconocido' },
          { id: 'adulto-muy-caliente', label: '¿Muy caliente?', glossaryId: 'adulto-muy-caliente' },
          { id: 'frio', label: '¿Frío?', glossaryId: 'frio' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'historia-significativa-de-alergia',
            label: '¿Historia significativa de alergia?',
            glossaryId: 'historia-significativa-de-alergia',
          },
          {
            id: 'historia-de-inconsciencia',
            label: '¿Historia de inconsciencia?',
            glossaryId: 'historia-de-inconsciencia',
          },
          {
            id: 'perdida-de-funcion-focal-o-progresiva',
            label: '¿Pérdida de función focal o progresiva?',
            glossaryId: 'perdida-de-funcion-focal-o-progresiva',
          },
          { id: 'adulto-caliente', label: '¿Adulto caliente?', glossaryId: 'adulto-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-agresion',
    discriminatorId: 'adult-agresion',
    group: 'adult',
    title: 'Agresión',
    sourceLabel: 'PDF adulto: Agresión',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'mecanismo-de-la-lesion-determinante',
            label: '¿Mecanismo de la lesión determinante?',
            glossaryId: 'mecanismo-de-la-lesion-determinante',
          },
          { id: 'disnea-aguda', label: '¿Disnea aguda?', glossaryId: 'disnea-aguda' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          {
            id: 'historia-de-inconsciencia',
            label: '¿Historia de inconsciencia?',
            glossaryId: 'historia-de-inconsciencia',
          },
          {
            id: 'signos-sintomas-neurologicos-recientes',
            label: '¿Signos/síntomas neurológicos recientes?',
            glossaryId: 'signos-sintomas-neurologicos-recientes',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'tumefaccion', label: '¿Tumefacción?', glossaryId: 'tumefaccion' },
          { id: 'deformidad', label: '¿Deformidad?', glossaryId: 'deformidad' },
        ],
      },
    ],
  },
  {
    id: 'adult-aparentemente-ebrio',
    discriminatorId: 'adult-aparentemente-ebrio',
    group: 'adult',
    title: 'Aparentemente ebrio',
    sourceLabel: 'PDF adulto: Aparentemente ebrio',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿Niño que no responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
          { id: 'hipoglucemia', label: '¿Hipoglucemia?', glossaryId: 'hipoglucemia' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'nivel-de-consciencia-alterado-no-atribuible-al-alcohol-por-completo',
            label: '¿Nivel de consciencia alterado no atribuible al alcohol por completo?',
            glossaryId: 'nivel-de-consciencia-alterado-no-atribuible-al-alcohol-por-completo',
          },
          { id: 'historia-inadecuada', label: '¿Historia inadecuada?', glossaryId: 'historia-inadecuada' },
          { id: 'frio', label: '¿Frío?', glossaryId: 'frio' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'nivel-de-consciencia-alterado-atribuible-al-alcohol-por-completo',
            label: '¿Nivel de consciencia alterado atribuible al alcohol por completo?',
            glossaryId: 'nivel-de-consciencia-alterado-atribuible-al-alcohol-por-completo',
          },
          {
            id: 'historia-de-inconsciencia',
            label: '¿Historia de inconsciencia?',
            glossaryId: 'historia-de-inconsciencia',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'traumatismo-craneoencefalico',
            label: '¿Traumatismo craneoencefálico?',
            glossaryId: 'traumatismo-craneoencefalico',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'lesion', label: '¿Lesión?', glossaryId: 'lesion' },
        ],
      },
    ],
  },
  {
    id: 'adult-asma',
    discriminatorId: 'adult-asma',
    group: 'adult',
    title: 'Asma',
    sourceLabel: 'PDF adulto: Asma',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿Niño que no responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'incapaz-de-decir-frases',
            label: '¿Incapaz de decir frases?',
            glossaryId: 'incapaz-de-decir-frases',
          },
          { id: 'taquicardia-acusada', label: '¿Taquicardia acusada?', glossaryId: 'taquicardia-acusada' },
          {
            id: 'flujo-espiratorio-maximo-muy-bajo',
            label: '¿Flujo espiratorio máximo muy bajo?',
            glossaryId: 'flujo-espiratorio-maximo-muy-bajo',
          },
          {
            id: 'saturacion-de-oxigeno-muy-baja',
            label: '¿Saturación de oxígeno muy baja?',
            glossaryId: 'saturacion-de-oxigeno-muy-baja',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'flujo-espiratorio-maximo-bajo',
            label: '¿Flujo espiratorio máximo bajo?',
            glossaryId: 'flujo-espiratorio-maximo-bajo',
          },
          {
            id: 'saturacion-de-oxigeno-baja',
            label: '¿Saturación de oxígeno baja?',
            glossaryId: 'saturacion-de-oxigeno-baja',
          },
          {
            id: 'historia-significativa-de-asma',
            label: '¿Historia significativa de asma?',
            glossaryId: 'historia-significativa-de-asma',
          },
          {
            id: 'no-mejora-con-el-propio-tratamiento-de-asma',
            label: '¿No mejora con el propio tratamiento de asma?',
            glossaryId: 'no-mejora-con-el-propio-tratamiento-de-asma',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          {
            id: 'respiracion-sibilante-o-sibilancias',
            label: '¿Respiración sibilante o sibilancias?',
            glossaryId: 'respiracion-sibilante-o-sibilancias',
          },
          { id: 'infeccion-respiratoria', label: '¿Infección respiratoria?', glossaryId: 'infeccion-respiratoria' },
        ],
      },
    ],
  },
  {
    id: 'adult-autolesion-deliberada',
    discriminatorId: 'adult-autolesion-deliberada',
    group: 'adult',
    title: 'Autolesión (deliberada)',
    sourceLabel: 'PDF adulto: Autolesión (deliberada)',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'hemorragia-desangrante', label: '¿Hemorragia desangrante?', glossaryId: 'hemorragia-desangrante' },
          { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'historia-de-incidente-significativo',
            label: '¿Historia de incidente significativo?',
            glossaryId: 'historia-de-incidente-significativo',
          },
          {
            id: 'mecanismo-de-la-lesion-determinante',
            label: '¿Mecanismo de la lesión determinante?',
            glossaryId: 'mecanismo-de-la-lesion-determinante',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'disnea-aguda', label: '¿Disnea aguda?', glossaryId: 'disnea-aguda' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'alto-riesgo-de-volver-a-autolesionarse',
            label: '¿Alto riesgo de volver a autolesionarse?',
            glossaryId: 'alto-riesgo-de-volver-a-autolesionarse',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          {
            id: 'riesgo-moderado-de-volver-a-autolesionarse',
            label: '¿Riesgo moderado de volver a autolesionarse?',
            glossaryId: 'riesgo-moderado-de-volver-a-autolesionarse',
          },
          { id: 'angustia-acusada', label: '¿Angustia acusada?', glossaryId: 'angustia-acusada' },
        ],
      },
    ],
  },
  {
    id: 'adult-caidas',
    discriminatorId: 'adult-caidas',
    group: 'adult',
    title: 'Caídas',
    sourceLabel: 'PDF adulto: Caídas',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'historia-de-incidente-significativo',
            label: '¿Historia de incidente significativo?',
            glossaryId: 'historia-de-incidente-significativo',
          },
          { id: 'pulso-anormal', label: '¿Pulso anormal?', glossaryId: 'pulso-anormal' },
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          { id: 'frio', label: '¿Frío?', glossaryId: 'frio' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          {
            id: 'historia-de-inconsciencia',
            label: '¿Historia de inconsciencia?',
            glossaryId: 'historia-de-inconsciencia',
          },
          {
            id: 'perdida-de-funcion-focal-o-progresiva',
            label: '¿Pérdida de función focal o progresiva?',
            glossaryId: 'perdida-de-funcion-focal-o-progresiva',
          },
          {
            id: 'deformidad-grosera',
            label: '¿Deformidad grosera?',
            glossaryId: 'deformidad-grosera',
          },
          { id: 'fractura-abierta', label: '¿Fractura abierta?', glossaryId: 'fractura-abierta' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'deformidad', label: '¿Deformidad?', glossaryId: 'deformidad' },
          { id: 'tumefaccion', label: '¿Tumefacción?', glossaryId: 'tumefaccion' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'pediatric-bebe-o-nino-pequeno-que-llora',
    discriminatorId: 'pediatric-bebe-o-nino-pequeno-que-llora',
    group: 'pediatric',
    title: 'Bebé o niño pequeño que llora',
    sourceLabel: 'PNG pediátrico: Bebé o niño pequeño que llora',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿No responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'signos-de-dolor-intenso',
            label: '¿Signos de dolor intenso?',
            glossaryId: 'signos-de-dolor-intenso',
          },
          {
            id: 'responde-solo-a-la-voz-o-al-dolor',
            label: '¿Responde sólo a la voz o al dolor?',
            glossaryId: 'responde-solo-a-la-voz-o-al-dolor',
          },
          { id: 'exantema-desconocido', label: '¿Exantema desconocido?', glossaryId: 'exantema-desconocido' },
          { id: 'languido', label: '¿Lánguido?', glossaryId: 'languido' },
          { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'signos-de-dolor-moderado',
            label: '¿Signos de dolor moderado?',
            glossaryId: 'signos-de-dolor-moderado',
          },
          {
            id: 'historia-de-inconsciencia',
            label: '¿Historia de inconsciencia?',
            glossaryId: 'historia-de-inconsciencia',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'inconsolable-por-los-padres',
            label: '¿Inconsolable por los padres?',
            glossaryId: 'inconsolable-por-los-padres',
          },
          {
            id: 'llanto-prolongado-o-ininterrumpido',
            label: '¿Llanto prolongado o ininterrumpido?',
            glossaryId: 'llanto-prolongado-o-ininterrumpido',
          },
          {
            id: 'incapaz-de-alimentarse',
            label: '¿Incapaz de alimentarse?',
            glossaryId: 'incapaz-de-alimentarse',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          {
            id: 'comportamiento-atipico',
            label: '¿Comportamiento atípico?',
            glossaryId: 'comportamiento-atipico',
          },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'pediatric-disnea-en-ninos',
    discriminatorId: 'pediatric-disnea-en-ninos',
    group: 'pediatric',
    title: 'Disnea en niños',
    sourceLabel: 'PNG pediátrico: Disnea en niños',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿No responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'babeo', label: '¿Babeo?', glossaryId: 'babeo' },
          { id: 'estridor', label: '¿Estridor?', glossaryId: 'estridor' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'instauracion-aguda-tras-una-lesion',
            label: '¿Instauración aguda tras una lesión?',
            glossaryId: 'instauracion-aguda-tras-una-lesion',
          },
          {
            id: 'aumento-del-trabajo-respiratorio',
            label: '¿Aumento del trabajo respiratorio?',
            glossaryId: 'aumento-del-trabajo-respiratorio',
          },
          {
            id: 'incapaz-del-trabajo-respiratorio',
            label: '¿Incapaz del trabajo respiratorio?',
            glossaryId: 'incapaz-del-trabajo-respiratorio',
          },
          {
            id: 'incapaz-de-decir-frases',
            label: '¿Incapaz de decir frases?',
            glossaryId: 'incapaz-de-decir-frases',
          },
          {
            id: 'responde-solo-a-la-voz-o-al-dolor',
            label: '¿Responde sólo a la voz o al dolor?',
            glossaryId: 'responde-solo-a-la-voz-o-al-dolor',
          },
          {
            id: 'flujo-espiratorio-maximo-muy-bajo',
            label: '¿Flujo espiratorio máximo muy bajo?',
            glossaryId: 'flujo-espiratorio-maximo-muy-bajo',
          },
          {
            id: 'saturacion-de-oxigeno-muy-baja',
            label: '¿Saturación de oxígeno muy baja?',
            glossaryId: 'saturacion-de-oxigeno-muy-baja',
          },
          { id: 'agotamiento', label: '¿Agotamiento?', glossaryId: 'agotamiento' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'historia-significativa-de-asma',
            label: '¿Historia significativa de asma?',
            glossaryId: 'historia-significativa-de-asma',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'flujo-espiratorio-maximo-bajo',
            label: '¿Flujo espiratorio máximo bajo?',
            glossaryId: 'flujo-espiratorio-maximo-bajo',
          },
          {
            id: 'saturacion-de-oxigeno-baja',
            label: '¿Saturación de oxígeno baja?',
            glossaryId: 'saturacion-de-oxigeno-baja',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          {
            id: 'respiracion-sibilante-o-sibilancias',
            label: '¿Respiración sibilante o sibilancias?',
            glossaryId: 'respiracion-sibilante-o-sibilancias',
          },
          { id: 'infeccion-respiratoria', label: '¿Infección respiratoria?', glossaryId: 'infeccion-respiratoria' },
          { id: 'lesion-toracica', label: '¿Lesión torácica?', glossaryId: 'lesion-toracica' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'pediatric-dolor-abdominal-en-ninos',
    discriminatorId: 'pediatric-dolor-abdominal-en-ninos',
    group: 'pediatric',
    title: 'Dolor abdominal en niños',
    sourceLabel: 'PNG pediátrico: Dolor abdominal en niños',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'signos-de-dolor-intenso',
            label: '¿Signos de dolor intenso?',
            glossaryId: 'signos-de-dolor-intenso',
          },
          {
            id: 'vomito-agudo-de-sangre',
            label: '¿Vómito agudo de sangre?',
            glossaryId: 'vomito-agudo-de-sangre',
          },
          {
            id: 'emision-aguda-de-sangre-rectal',
            label: '¿Emisión aguda de sangre fresca o alterada por vía rectal?',
            glossaryId: 'emision-aguda-de-sangre-rectal',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'signos-de-dolor-moderado',
            label: '¿Signos de dolor moderado?',
            glossaryId: 'signos-de-dolor-moderado',
          },
          {
            id: 'inconsolable-por-los-padres',
            label: '¿Inconsolable por los padres?',
            glossaryId: 'inconsolable-por-los-padres',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          {
            id: 'masa-abdominal-visible',
            label: '¿Masa abdominal visible?',
            glossaryId: 'masa-abdominal-visible',
          },
          {
            id: 'heces-negras-o-color-grosella',
            label: '¿Heces negras o color grosella?',
            glossaryId: 'heces-negras-o-color-grosella',
          },
          {
            id: 'vomito-persistente',
            label: '¿Vómito persistente?',
            glossaryId: 'vomito-persistente',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'vomitos', label: '¿Vómitos?', glossaryId: 'vomitos' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'pediatric-nino-cojeando',
    discriminatorId: 'pediatric-nino-cojeando',
    group: 'pediatric',
    title: 'Niño cojeando',
    sourceLabel: 'PNG pediátrico: Niño cojeando',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          { id: 'compromiso-vascular', label: '¿Compromiso vascular?', glossaryId: 'compromiso-vascular' },
          { id: 'exantema-desconocido', label: '¿Exantema desconocido?', glossaryId: 'exantema-desconocido' },
          { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'dolor-al-mover-la-articulacion',
            label: '¿Dolor al mover la articulación?',
            glossaryId: 'dolor-al-mover-la-articulacion',
          },
          {
            id: 'incapacidad-para-soportar-peso',
            label: '¿Incapacidad para soportar peso?',
            glossaryId: 'incapacidad-para-soportar-peso',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          { id: 'articulacion-caliente', label: '¿Articulación caliente?', glossaryId: 'articulacion-caliente' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'pediatric-nino-con-meg',
    discriminatorId: 'pediatric-nino-con-meg',
    group: 'pediatric',
    title: 'Niño con mal estado general (MEG)',
    sourceLabel: 'PNG pediátrico: Niño con mal estado general (MEG)',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'crisis-convulsiva', label: '¿Crisis convulsiva?', glossaryId: 'crisis-convulsiva' },
          { id: 'nino-que-no-responde', label: '¿No responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'responde-solo-a-la-voz-o-al-dolor',
            label: '¿Responde sólo a la voz o al dolor?',
            glossaryId: 'responde-solo-a-la-voz-o-al-dolor',
          },
          {
            id: 'incapaz-de-reaccionar-con-los-padres',
            label: '¿Incapaz de reaccionar con los padres?',
            glossaryId: 'incapaz-de-reaccionar-con-los-padres',
          },
          { id: 'exantema-desconocido', label: '¿Exantema desconocido?', glossaryId: 'exantema-desconocido' },
          { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
          { id: 'frio', label: '¿Frío?', glossaryId: 'frio' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          { id: 'no-orina', label: '¿No orina?', glossaryId: 'no-orina' },
          { id: 'no-se-alimenta', label: '¿No se alimenta?', glossaryId: 'no-se-alimenta' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          {
            id: 'comportamiento-atipico',
            label: '¿Comportamiento atípico?',
            glossaryId: 'comportamiento-atipico',
          },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'pediatric-nino-irritable',
    discriminatorId: 'pediatric-nino-irritable',
    group: 'pediatric',
    title: 'Niño irritable',
    sourceLabel: 'PNG pediátrico: Niño irritable',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿No responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'historia-de-sobredosis-y-o-envenenamiento',
            label: '¿Historia de sobredosis y/o envenenamiento?',
            glossaryId: 'historia-de-sobredosis-y-o-envenenamiento',
          },
          {
            id: 'responde-solo-a-la-voz-o-al-dolor',
            label: '¿Responde sólo a la voz o al dolor?',
            glossaryId: 'responde-solo-a-la-voz-o-al-dolor',
          },
          { id: 'exantema-desconocido', label: '¿Exantema desconocido?', glossaryId: 'exantema-desconocido' },
          { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'no-puede-ser-entretenido',
            label: '¿No puede ser entretenido?',
            glossaryId: 'no-puede-ser-entretenido',
          },
          {
            id: 'llanto-prolongado-o-ininterrumpido',
            label: '¿Llanto prolongado o ininterrumpido?',
            glossaryId: 'llanto-prolongado-o-ininterrumpido',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          { id: 'no-se-alimenta', label: '¿No se alimenta?', glossaryId: 'no-se-alimenta' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          {
            id: 'comportamiento-atipico',
            label: '¿Comportamiento atípico?',
            glossaryId: 'comportamiento-atipico',
          },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'pediatric-padres-preocupados',
    discriminatorId: 'pediatric-padres-preocupados',
    group: 'pediatric',
    title: 'Padres preocupados',
    sourceLabel: 'PNG pediátrico: Padres preocupados',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          { id: 'via-aerea-comprometida', label: '¿Vía aérea comprometida?', glossaryId: 'via-aerea-comprometida' },
          { id: 'respiracion-inadecuada', label: '¿Respiración inadecuada?', glossaryId: 'respiracion-inadecuada' },
          { id: 'nino-que-no-responde', label: '¿No responde?', glossaryId: 'nino-que-no-responde' },
          { id: 'shock', label: '¿Shock?', glossaryId: 'shock' },
        ],
      },
      {
        priority: 2,
        discriminants: [
          { id: 'languido', label: '¿Lánguido?', glossaryId: 'languido' },
          { id: 'dolor-intenso', label: '¿Dolor intenso?', glossaryId: 'dolor-intenso' },
          {
            id: 'responde-solo-a-la-voz-o-al-dolor',
            label: '¿Responde sólo a la voz o al dolor?',
            glossaryId: 'responde-solo-a-la-voz-o-al-dolor',
          },
          {
            id: 'incapaz-de-reaccionar-con-los-padres',
            label: '¿Incapaz de reaccionar con los padres?',
            glossaryId: 'incapaz-de-reaccionar-con-los-padres',
          },
          {
            id: 'historia-de-sobredosis-y-o-envenenamiento',
            label: '¿Historia de sobredosis y/o envenenamiento?',
            glossaryId: 'historia-de-sobredosis-y-o-envenenamiento',
          },
          { id: 'exantema-desconocido', label: '¿Exantema desconocido?', glossaryId: 'exantema-desconocido' },
          { id: 'purpura', label: '¿Púrpura?', glossaryId: 'purpura' },
          { id: 'nino-caliente', label: '¿Niño caliente?', glossaryId: 'nino-caliente' },
        ],
      },
      {
        priority: 3,
        discriminants: [
          { id: 'dolor-moderado', label: '¿Dolor moderado?', glossaryId: 'dolor-moderado' },
          {
            id: 'llanto-prolongado-o-ininterrumpido',
            label: '¿Llanto prolongado o ininterrumpido?',
            glossaryId: 'llanto-prolongado-o-ininterrumpido',
          },
          {
            id: 'inconsolable-por-los-padres',
            label: '¿Inconsolable por los padres?',
            glossaryId: 'inconsolable-por-los-padres',
          },
          { id: 'historia-inapropiada', label: '¿Historia inapropiada?', glossaryId: 'historia-inapropiada' },
          { id: 'no-orina', label: '¿No orina?', glossaryId: 'no-orina' },
          { id: 'no-se-alimenta', label: '¿No se alimenta?', glossaryId: 'no-se-alimenta' },
        ],
      },
      {
        priority: 4,
        discriminants: [
          { id: 'dolor', label: '¿Dolor?', glossaryId: 'dolor' },
          { id: 'acalorado-templado', label: '¿Acalorado (templado)?', glossaryId: 'acalorado-templado' },
          {
            id: 'comportamiento-atipico',
            label: '¿Comportamiento atípico?',
            glossaryId: 'comportamiento-atipico',
          },
          { id: 'problema-reciente', label: '¿Problema reciente?', glossaryId: 'problema-reciente' },
        ],
      },
    ],
  },
  {
    id: 'adult-cefalea',
    discriminatorId: 'adult-cefalea',
    group: 'adult',
    title: 'Cefalea',
    sourceLabel: 'Imagen común: Cefalea',
    fallbackPriority: 5,
    steps: CEFALEA_STEPS,
  },
  {
    id: 'pediatric-cefalea',
    discriminatorId: 'pediatric-cefalea',
    group: 'pediatric',
    title: 'Cefalea',
    sourceLabel: 'Imagen común: Cefalea',
    fallbackPriority: 5,
    steps: CEFALEA_STEPS,
  },
  {
    id: 'adult-dolor-abdominal',
    discriminatorId: 'adult-dolor-abdominal',
    group: 'adult',
    title: 'Dolor abdominal',
    sourceLabel: 'PDF adulto: Dolor abdominal',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          {
            id: 'via-aerea-comprometida',
            label: '¿Vía aérea comprometida?',
            glossaryId: 'via-aerea-comprometida',
          },
          {
            id: 'respiracion-inadecuada',
            label: '¿Respiración inadecuada?',
            glossaryId: 'respiracion-inadecuada',
          },
          {
            id: 'shock',
            label: '¿Shock?',
            glossaryId: 'shock',
          },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'dolor-intenso',
            label: '¿Dolor intenso?',
            glossaryId: 'dolor-intenso',
          },
          {
            id: 'dolor-irradiado-hacia-la-espalda',
            label: '¿Dolor irradiado hacia la espalda?',
            glossaryId: 'dolor-irradiado-hacia-la-espalda',
          },
          {
            id: 'vomito-agudo-de-sangre',
            label: '¿Vómito agudo de sangre?',
            glossaryId: 'vomito-agudo-de-sangre',
          },
          {
            id: 'emision-aguda-de-sangre-rectal',
            label: '¿Emisión aguda de sangre fresca o alterada por vía rectal?',
            glossaryId: 'emision-aguda-de-sangre-rectal',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'dolor-moderado',
            label: '¿Dolor moderado?',
            glossaryId: 'dolor-moderado',
          },
          {
            id: 'dolor-vertice-hombro',
            label: '¿Dolor en vértice de hombro?',
            glossaryId: 'dolor-vertice-hombro',
          },
          {
            id: 'posible-embarazo',
            label: '¿Posibilidad de embarazo?',
            glossaryId: 'posible-embarazo',
          },
          {
            id: 'heces-negras-o-grosella',
            label: '¿Heces negras o color grosella?',
          },
          {
            id: 'vomito-persistente',
            label: '¿Vómito persistente?',
            glossaryId: 'vomito-persistente',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          {
            id: 'vomitos',
            label: '¿Vómitos?',
          },
          {
            id: 'problema-reciente',
            label: '¿Problema reciente?',
            glossaryId: 'problema-reciente',
          },
        ],
      },
    ],
  },
  {
    id: 'adult-hemorragia-vaginal',
    discriminatorId: 'adult-hemorragia-vaginal',
    group: 'adult',
    title: 'Hemorragia vaginal',
    sourceLabel: 'Entrada manual: Hemorragia vaginal',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          {
            id: 'via-aerea-comprometida',
            label: '¿Vía aérea comprometida?',
            glossaryId: 'via-aerea-comprometida',
          },
          {
            id: 'respiracion-inadecuada',
            label: '¿Respiración inadecuada?',
            glossaryId: 'respiracion-inadecuada',
          },
          {
            id: 'hemorragia-desangrante',
            label: '¿Hemorragia desangrante?',
            glossaryId: 'hemorragia-desangrante',
          },
          {
            id: 'shock',
            label: '¿Shock?',
            glossaryId: 'shock',
          },
          {
            id: 'nino-que-no-responde',
            label: '¿Niño que no responde?',
            glossaryId: 'nino-que-no-responde',
          },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'hemorragia-vaginal-abundante',
            label: '¿Hemorragia vaginal abundante?',
            glossaryId: 'hemorragia-vaginal-abundante',
          },
          {
            id: 'hemorragia-vaginal-en-gestante-de-20-semanas-o-mas',
            label: '¿Hemorragia vaginal en gestante de 20 semanas o más?',
            glossaryId: 'hemorragia-vaginal-en-gestante-de-20-semanas-o-mas',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'adulto-muy-caliente',
            label: '¿Adulto muy caliente?',
            glossaryId: 'adulto-muy-caliente',
          },
          {
            id: 'dolor-intenso',
            label: '¿Dolor intenso?',
            glossaryId: 'dolor-intenso',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'trauma-vaginal',
            label: '¿Trauma vaginal?',
            glossaryId: 'trauma-vaginal',
          },
          {
            id: 'posible-embarazo',
            label: '¿Posibilidad de embarazo?',
            glossaryId: 'posible-embarazo',
          },
          {
            id: 'historia-inapropiada',
            label: '¿Historia inapropiada?',
            glossaryId: 'historia-inapropiada',
          },
          {
            id: 'dolor-abdominal',
            label: '¿Dolor abdominal?',
            glossaryId: 'dolor-abdominal',
          },
          {
            id: 'dolor-vertice-hombro',
            label: '¿Dolor en vértice de hombro?',
            glossaryId: 'dolor-vertice-hombro',
          },
          {
            id: 'adulto-caliente',
            label: '¿Adulto caliente?',
            glossaryId: 'adulto-caliente',
          },
          {
            id: 'dolor-moderado',
            label: '¿Dolor moderado?',
            glossaryId: 'dolor-moderado',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          {
            id: 'dolor',
            label: '¿Dolor?',
            glossaryId: 'dolor',
          },
          {
            id: 'problema-reciente',
            label: '¿Problema reciente?',
            glossaryId: 'problema-reciente',
          },
        ],
      },
    ],
  },
  {
    id: 'adult-embarazo',
    discriminatorId: 'adult-embarazo',
    group: 'adult',
    title: 'Embarazo',
    sourceLabel: 'Entrada manual: Embarazo',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          {
            id: 'via-aerea-comprometida',
            label: '¿Vía aérea comprometida?',
            glossaryId: 'via-aerea-comprometida',
          },
          {
            id: 'respiracion-inadecuada',
            label: '¿Respiración inadecuada?',
            glossaryId: 'respiracion-inadecuada',
          },
          {
            id: 'crisis-convulsiva',
            label: '¿Crisis convulsiva?',
            glossaryId: 'crisis-convulsiva',
          },
          {
            id: 'hemorragia-desangrante',
            label: '¿Hemorragia desangrante?',
            glossaryId: 'hemorragia-desangrante',
          },
          {
            id: 'shock',
            label: '¿Shock?',
            glossaryId: 'shock',
          },
          {
            id: 'nino-que-no-responde',
            label: '¿Niño que no responde?',
            glossaryId: 'nino-que-no-responde',
          },
          {
            id: 'prolapso-del-cordon-umbilical',
            label: '¿Prolapso del cordón umbilical?',
            glossaryId: 'prolapso-del-cordon-umbilical',
          },
          {
            id: 'exposicion-de-partes-fetales',
            label: '¿Exposición de partes fetales?',
            glossaryId: 'exposicion-de-partes-fetales',
          },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'hemorragia-vaginal-abundante',
            label: '¿Hemorragia vaginal abundante?',
            glossaryId: 'hemorragia-vaginal-abundante',
          },
          {
            id: 'hemorragia-vaginal-en-gestante-de-20-semanas-o-mas',
            label: '¿Hemorragia vaginal en gestante de 20 semanas o más?',
            glossaryId: 'hemorragia-vaginal-en-gestante-de-20-semanas-o-mas',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'parto-activo',
            label: '¿Parto activo?',
            glossaryId: 'parto-activo',
          },
          {
            id: 'historia-de-convulsion',
            label: '¿Historia de convulsión?',
            glossaryId: 'historia-de-convulsion',
          },
          {
            id: 'adulto-muy-caliente',
            label: '¿Adulto muy caliente?',
            glossaryId: 'adulto-muy-caliente',
          },
          {
            id: 'dolor-intenso',
            label: '¿Dolor intenso?',
            glossaryId: 'dolor-intenso',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'hipertension-arterial',
            label: '¿Hipertensión arterial?',
            glossaryId: 'hipertension-arterial',
          },
          {
            id: 'sangrado-vaginal',
            label: '¿Sangrado vaginal?',
            glossaryId: 'sangrado-vaginal',
          },
          {
            id: 'lesion-reciente',
            label: '¿Lesión reciente?',
            glossaryId: 'lesion-reciente',
          },
          {
            id: 'historia-inapropiada',
            label: '¿Historia inapropiada?',
            glossaryId: 'historia-inapropiada',
          },
          {
            id: 'adulto-caliente',
            label: '¿Adulto caliente?',
            glossaryId: 'adulto-caliente',
          },
          {
            id: 'dolor-vertice-hombro',
            label: '¿Dolor en vértice de hombro?',
            glossaryId: 'dolor-vertice-hombro',
          },
          {
            id: 'dolor-moderado',
            label: '¿Dolor moderado?',
            glossaryId: 'dolor-moderado',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          {
            id: 'acalorado-templado',
            label: '¿Acalorado (templado)?',
            glossaryId: 'acalorado-templado',
          },
          {
            id: 'dolor',
            label: '¿Dolor?',
            glossaryId: 'dolor',
          },
        ],
      },
    ],
  },
  {
    id: 'adult-palpitaciones',
    discriminatorId: 'adult-palpitaciones',
    group: 'adult',
    title: 'Palpitaciones',
    sourceLabel: 'Entrada manual: Palpitaciones',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          {
            id: 'via-aerea-comprometida',
            label: '¿Vía aérea comprometida?',
            glossaryId: 'via-aerea-comprometida',
          },
          {
            id: 'respiracion-inadecuada',
            label: '¿Respiración inadecuada?',
            glossaryId: 'respiracion-inadecuada',
          },
          {
            id: 'shock',
            label: '¿Shock?',
            glossaryId: 'shock',
          },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'disnea-aguda',
            label: '¿Disnea aguda?',
            glossaryId: 'disnea-aguda',
          },
          {
            id: 'pulso-anormal',
            label: '¿Pulso anormal?',
            glossaryId: 'pulso-anormal',
          },
          {
            id: 'dolor-cardiaco',
            label: '¿Dolor cardíaco?',
            glossaryId: 'dolor-cardiaco',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'historia-de-sobredosis-y-o-envenenamiento',
            label: '¿Historia de sobredosis y/o envenenamiento?',
            glossaryId: 'historia-de-sobredosis-y-o-envenenamiento',
          },
          {
            id: 'adulto-muy-caliente',
            label: '¿Adulto muy caliente?',
            glossaryId: 'adulto-muy-caliente',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'historia-de-inconsciencia',
            label: '¿Historia de inconsciencia?',
            glossaryId: 'historia-de-inconsciencia',
          },
          {
            id: 'palpitaciones-en-este-momento',
            label: '¿Palpitaciones en este momento?',
            glossaryId: 'palpitaciones-en-este-momento',
          },
          {
            id: 'antecedente-cardiaco',
            label: '¿Antecedente cardiaco?',
            glossaryId: 'antecedente-cardiaco',
          },
          {
            id: 'adulto-caliente',
            label: '¿Adulto caliente?',
            glossaryId: 'adulto-caliente',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          {
            id: 'problema-reciente',
            label: '¿Problema reciente?',
            glossaryId: 'problema-reciente',
          },
        ],
      },
    ],
  },
  {
    id: 'adult-problemas-faciales',
    discriminatorId: 'adult-problemas-faciales',
    group: 'adult',
    title: 'Problemas faciales',
    sourceLabel: 'Entrada manual: Problemas faciales',
    fallbackPriority: 5,
    steps: [
      {
        priority: 1,
        discriminants: [
          {
            id: 'via-aerea-comprometida',
            label: '¿Vía aérea comprometida?',
            glossaryId: 'via-aerea-comprometida',
          },
          {
            id: 'respiracion-inadecuada',
            label: '¿Respiración inadecuada?',
            glossaryId: 'respiracion-inadecuada',
          },
          {
            id: 'hemorragia-desangrante',
            label: '¿Hemorragia desangrante?',
            glossaryId: 'hemorragia-desangrante',
          },
          {
            id: 'shock',
            label: '¿Shock?',
            glossaryId: 'shock',
          },
          {
            id: 'nino-que-no-responde',
            label: '¿Niño que no responde?',
            glossaryId: 'nino-que-no-responde',
          },
        ],
      },
      {
        priority: 2,
        discriminants: [
          {
            id: 'hemorragia-mayor-incontrolable',
            label: '¿Hemorragia mayor incontrolable?',
            glossaryId: 'hemorragia-mayor-incontrolable',
          },
          {
            id: 'nivel-de-consciencia-alterado',
            label: '¿Nivel de consciencia alterado?',
            glossaryId: 'nivel-de-consciencia-alterado',
          },
          {
            id: 'nueva-focalidad-neurologica-menor-de-24h',
            label: '¿Déficit neurológico < 24 h?',
            glossaryId: 'nueva-focalidad-neurologica-menor-de-24h',
          },
          {
            id: 'nino-caliente',
            label: '¿Niño caliente?',
            glossaryId: 'nino-caliente',
          },
          {
            id: 'adulto-muy-caliente',
            label: '¿Adulto muy caliente?',
            glossaryId: 'adulto-muy-caliente',
          },
          {
            id: 'dolor-intenso',
            label: '¿Dolor intenso?',
            glossaryId: 'dolor-intenso',
          },
        ],
      },
      {
        priority: 3,
        discriminants: [
          {
            id: 'hemorragia-menor-incontrolable',
            label: '¿Hemorragia menor incontrolable?',
            glossaryId: 'hemorragia-menor-incontrolable',
          },
          {
            id: 'nueva-focalidad-neurologica-mayor-de-24h',
            label: '¿Déficit neurológico de nueva aparición > 24 h?',
            glossaryId: 'nueva-focalidad-neurologica-mayor-de-24h',
          },
          {
            id: 'deformidad-grosera',
            label: '¿Deformidad grosera?',
            glossaryId: 'deformidad-grosera',
          },
          {
            id: 'reduccion-de-agudeza-visual',
            label: '¿Reducción de la visión reciente?',
            glossaryId: 'reduccion-de-agudeza-visual',
          },
          {
            id: 'arrancamiento-agudo-de-diente',
            label: '¿Avulsión dental completa aguda?',
            glossaryId: 'arrancamiento-agudo-de-diente',
          },
          {
            id: 'historia-de-inconsciencia',
            label: '¿Historia de inconsciencia?',
            glossaryId: 'historia-de-inconsciencia',
          },
          {
            id: 'coagulopatia',
            label: '¿Coagulopatía?',
            glossaryId: 'coagulopatia',
          },
          {
            id: 'historia-inapropiada',
            label: '¿Historia inapropiada?',
            glossaryId: 'historia-inapropiada',
          },
          {
            id: 'adulto-caliente',
            label: '¿Adulto caliente?',
            glossaryId: 'adulto-caliente',
          },
          {
            id: 'dolor-moderado',
            label: '¿Dolor moderado?',
            glossaryId: 'dolor-moderado',
          },
        ],
      },
      {
        priority: 4,
        discriminants: [
          {
            id: 'edema-facial',
            label: '¿Edema facial?',
            glossaryId: 'edema-facial',
          },
          {
            id: 'hematoma-auricular',
            label: '¿Hematoma auricular?',
            glossaryId: 'hematoma-auricular',
          },
          {
            id: 'diplopia',
            label: '¿Diplopia?',
            glossaryId: 'diplopia',
          },
          {
            id: 'alteracion-de-la-sensibilidad-facial',
            label: '¿Alteración de la sensibilidad facial?',
            glossaryId: 'alteracion-de-la-sensibilidad-facial',
          },
          {
            id: 'ojo-rojo',
            label: '¿Ojo rojo?',
            glossaryId: 'ojo-rojo',
          },
          {
            id: 'acalorado-templado',
            label: '¿Acalorado (templado)?',
            glossaryId: 'acalorado-templado',
          },
          {
            id: 'dolor',
            label: '¿Dolor?',
            glossaryId: 'dolor',
          },
          {
            id: 'problema-reciente',
            label: '¿Problema reciente?',
            glossaryId: 'problema-reciente',
          },
        ],
      },
    ],
  },
];

export function getPriorityConfig(level: ManchesterPriorityLevel) {
  return MANCHESTER_PRIORITIES.find((item) => item.level === level) ?? null;
}

export function getSuggestedDestination(
  algorithmId: string | undefined,
  priority: ManchesterPriorityLevel
): ManchesterSuggestedDestination | null {
  if (!algorithmId) return null;

  const code = MANCHESTER_ALGORITHM_DESTINATIONS[algorithmId]?.[priority];
  if (!code) return null;

  const label = code
    .split('/')
    .map((item) => {
      const normalized = item.trim() as ManchesterDestinationCode;
      return MANCHESTER_DESTINATION_LABELS[normalized] ?? item.trim();
    })
    .join(' / ');

  return { code, label };
}

export function getGlossaryEntry(id: string | undefined) {
  if (!id) return null;
  return MANCHESTER_GLOSSARY.find((item) => item.id === id) ?? null;
}

export function getAlgorithmById(id: string | undefined) {
  if (!id) return null;
  return MANCHESTER_ALGORITHMS.find((item) => item.id === id) ?? null;
}
