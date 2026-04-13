export type ScaleMeta = {
  title: string;
  summary: string;
  tags: string[];
  keywords?: string[];
};

export const SCALE_META_BY_SLUG: Record<string, ScaleMeta> = {
  OrionSF: {
    title: 'Orion Smart Formatter',
    summary:
      'Detecta y formatea texto pegado de GestLab y tratamientos de SIA, integrando el antiguo depurador de tratamientos y el formateador de analíticas en una única herramienta reutilizable.',
    tags: ['orion', 'analítica', 'tratamientos', 'depurador SIA'],
    keywords: [
      'smart formatter',
      'gestlab',
      'sia',
      'parser',
      'laboratorio',
      'depurador',
      'tratamientos sia',
      'formateo analitica orion',
      'formateador analitica',
    ],
  },
  'anion-gap': {
    title: 'Anion GAP',
    summary:
      'Calcula la brecha aniónica para orientar acidosis metabólica y alteraciones del equilibrio ácido-base.',
    tags: ['equilibrio ácido-base', 'acidosis metabólica', 'iones'],
    keywords: ['anion gap', 'brecha aniónica', 'sodio', 'cloro', 'bicarbonato'],
  },
  'antibioterapia-codigo-sepsis': {
    title: 'Antibioterapia Empírica Código Sepsis',
    summary:
      'Orienta la antibioterapia empírica inicial del código sepsis según foco, prótesis y factores de riesgo microbiológico.',
    tags: ['sepsis', 'antibioterapia', 'infección grave'],
    keywords: ['código sepsis', 'shock séptico', 'antibióticos', 'empírico', 'foco infeccioso'],
  },
  'antibioterapia-nac': {
    title: 'Antibioterapia Empírica NAC',
    summary:
      'Guía antibiótica para neumonía adquirida en la comunidad con rutas según manejo ambulatorio u hospitalario, PES, UCI, alergia a betalactámicos e inmunosupresión.',
    tags: ['neumonía', 'antibioterapia', 'respiratorio'],
    keywords: [
      'nac',
      'neumonía adquirida en la comunidad',
      'tratamiento antibiótico',
      'empírico',
      'ambulatorio',
      'hospitalizado',
      'uci',
      'pes',
      'inmunocomprometido',
      'betalactámicos',
    ],
  },
  bisap: {
    title: 'BISAP Score',
    summary:
      'Estratifica la gravedad y el riesgo de mortalidad precoz en pancreatitis aguda durante las primeras 24 horas.',
    tags: ['pancreatitis aguda', 'gravedad', 'mortalidad'],
    keywords: ['bisap', 'sirs', 'bun', 'uci', 'derrame pleural'],
  },
  blatchford: {
    title: 'Blatchford Score',
    summary:
      'Estima el riesgo y la necesidad de intervención en la hemorragia digestiva alta antes de la endoscopia.',
    tags: ['hemorragia digestiva alta', 'riesgo', 'endoscopia'],
    keywords: ['glasgow-blatchford', 'gbs', 'hematemesis', 'melenas'],
  },
  cha2ds2va: {
    title: 'CHA2DS2-VA',
    summary:
      'Calcula el riesgo tromboembólico en fibrilación auricular no valvular para orientar la anticoagulación.',
    tags: ['fibrilación auricular', 'ictus', 'anticoagulación'],
    keywords: ['cha2ds2', 'riesgo embólico', 'fa'],
  },
  curb65: {
    title: 'CURB-65',
    summary:
      'Valora la gravedad de la neumonía adquirida en la comunidad y ayuda a decidir ingreso o manejo ambulatorio.',
    tags: ['neumonía', 'gravedad', 'ingreso'],
    keywords: ['curb', 'nac', 'pneumonia', 'mortalidad'],
  },
  depuradorTtos: {
    title: 'Depurador Tratamientos SIA - Orion Clínic',
    summary:
      'Limpia y reorganiza listados de tratamiento de SIA y Orion para obtener un texto claro, uniforme y copiable.',
    tags: ['tratamiento', 'sia', 'orion'],
    keywords: ['medicación', 'depurador', 'tratamientos', 'pegado'],
  },
  'formateo-analitica-orion': {
    title: 'Formateo Analítica Orion',
    summary:
      'Convierte una analítica pegada desde Orion o GestLab en un resumen ordenado, legible y fácil de reutilizar.',
    tags: ['analítica', 'orion', 'laboratorio'],
    keywords: ['gestlab', 'bioquímica', 'hemograma', 'parser'],
  },
  glasgow: {
    title: 'Glasgow Coma Scale',
    summary:
      'Calcula la puntuación de Glasgow para valorar el nivel de conciencia y la gravedad del deterioro neurológico.',
    tags: ['nivel de conciencia', 'neurología', 'trauma'],
    keywords: ['gcs', 'coma scale', 'apertura ocular', 'respuesta verbal'],
  },
  'gradiente-aa-o2': {
    title: 'Gradiente A-a O2',
    summary:
      'Calcula el gradiente alveolo-arterial de oxígeno para orientar alteraciones del intercambio gaseoso.',
    tags: ['oxigenación', 'gasometría', 'intercambio gaseoso'],
    keywords: ['gradiente a-a', 'pao2', 'fio2', 'gasometría arterial'],
  },
  hasbled: {
    title: 'HAS-BLED',
    summary:
      'Estima el riesgo hemorrágico en pacientes con fibrilación auricular candidatos a anticoagulación.',
    tags: ['hemorragia', 'anticoagulación', 'fibrilación auricular'],
    keywords: ['has-bled', 'sangrado', 'fa'],
  },
  hiperNa: {
    title: 'Hipernatremia',
    summary:
      'Ayuda a valorar el déficit de agua libre y a planificar la corrección de la hipernatremia de forma segura.',
    tags: ['hipernatremia', 'sodio', 'fluidoterapia'],
    keywords: ['déficit de agua', 'corrección de sodio', 'natremia'],
  },
  hiponatremia: {
    title: 'Hiponatremia',
    summary:
      'Orienta el diagnóstico y la corrección de la hiponatremia según gravedad, cronicidad y situación clínica.',
    tags: ['hiponatremia', 'sodio', 'trastornos hidroelectrolíticos'],
    keywords: ['corrección de sodio', 'osmolaridad', 'hiponatremia grave'],
  },
  idsa: {
    title: 'IDSA/ATS',
    summary:
      'Aplica los criterios IDSA/ATS para valorar gravedad en neumonía y necesidad de ingreso en UCI.',
    tags: ['neumonía', 'uci', 'gravedad'],
    keywords: ['idsa', 'ats', 'nac', 'criterios mayores', 'criterios menores'],
  },
  insulinizacion: {
    title: 'Insulinización al ingreso',
    summary:
      'Ayuda a pautar la insulinización inicial del paciente hiperglucémico al ingreso hospitalario.',
    tags: ['hiperglucemia', 'diabetes', 'insulina'],
    keywords: ['glucemia', 'corrección', 'basal-bolo'],
  },
  mrs: {
    title: 'Escala de Rankin modificada (mRS)',
    summary:
      'Clasifica el grado de discapacidad funcional, especialmente útil en ictus y seguimiento neurológico.',
    tags: ['ictus', 'discapacidad', 'funcionalidad'],
    keywords: ['rankin', 'mrs', 'dependencia', 'autonomía'],
  },
  'news-2': {
    title: 'NEWS-2',
    summary:
      'Detecta deterioro clínico agudo y ayuda a estratificar riesgo mediante constantes vitales seriadas.',
    tags: ['deterioro clínico', 'constantes vitales', 'sepsis'],
    keywords: ['news2', 'early warning score', 'alarma precoz'],
  },
  nihss: {
    title: 'Escala NIHSS',
    summary:
      'Cuantifica la gravedad del déficit neurológico en el ictus agudo y facilita su seguimiento.',
    tags: ['ictus', 'neurología', 'gravedad'],
    keywords: ['nihss', 'stroke', 'déficit neurológico'],
  },
  padua: {
    title: 'Escala de Padua',
    summary:
      'Estima el riesgo de tromboembolismo venoso en pacientes médicos hospitalizados para orientar profilaxis.',
    tags: ['tromboembolismo venoso', 'profilaxis', 'hospitalización'],
    keywords: ['padua', 'tev', 'tvp', 'embolia pulmonar'],
  },
  pafi: {
    title: 'PaFi',
    summary:
      'Calcula la relación PaO2/FiO2 para valorar la gravedad de la insuficiencia respiratoria.',
    tags: ['oxigenación', 'insuficiencia respiratoria', 'gasometría'],
    keywords: ['pafi', 'pao2/fio2', 'sdra'],
  },
  psi: {
    title: 'PSI (Pneumonia Severity Index)',
    summary:
      'Estratifica la gravedad de la neumonía adquirida en la comunidad y orienta el nivel asistencial.',
    tags: ['neumonía', 'gravedad', 'mortalidad'],
    keywords: ['psi', 'fine score', 'nac', 'pneumonia severity index'],
  },
  pes: {
    title: 'PES Score',
    summary:
      'Estima el riesgo de patógenos PES en neumonía adquirida en la comunidad para orientar cobertura antibiótica ampliada.',
    tags: ['neumonía', 'antibioterapia', 'multirresistentes'],
    keywords: [
      'pes',
      'pes score',
      'escala pes',
      'pseudomonas',
      'sarm',
      'mrsa',
      'blee',
      'nac',
      'neumonia adquirida en la comunidad',
      'pseudomonas aeruginosa',
    ],
  },
  qsofa: {
    title: 'qSOFA',
    summary:
      'Criba pacientes con sospecha de infección y riesgo de sepsis mediante criterios clínicos rápidos.',
    tags: ['sepsis', 'cribado', 'deterioro clínico'],
    keywords: ['quick sofa', 'infección', 'hipotensión', 'taquipnea'],
  },
  safi: {
    title: 'SaFi',
    summary:
      'Calcula la relación saturación de oxígeno/FiO2 como alternativa sencilla a PaFi.',
    tags: ['oxigenación', 'saturación', 'insuficiencia respiratoria'],
    keywords: ['safi', 'spo2/fio2', 'hipoxemia'],
  },
  sirs: {
    title: 'SIRS',
    summary:
      'Aplica los criterios de respuesta inflamatoria sistémica para identificar activación inflamatoria significativa.',
    tags: ['inflamación sistémica', 'sepsis', 'criterios clínicos'],
    keywords: ['sirs', 'temperatura', 'frecuencia cardiaca', 'leucocitos'],
  },
  sofa: {
    title: 'SOFA',
    summary:
      'Cuantifica el grado de disfunción orgánica y ayuda a estratificar gravedad en sepsis y críticos.',
    tags: ['sepsis', 'disfunción orgánica', 'uci'],
    keywords: ['sofa score', 'fallo multiorgánico', 'mortalidad'],
  },
  standycalc: {
    title: 'STANDyCALC',
    summary:
      'Calculadora de mezclas y perfusiones para preparar diluciones estandarizadas de fármacos.',
    tags: ['perfusiones', 'diluciones', 'farmacia'],
    keywords: ['mezclas', 'infusión', 'standycalc', 'fármacos'],
  },
  tam: {
    title: 'Tensión Arterial Media (TAM)',
    summary:
      'Calcula la tensión arterial media a partir de la presión arterial sistólica y diastólica.',
    tags: ['hemodinámica', 'presión arterial', 'perfusión'],
    keywords: ['pam', 'tam', 'map', 'mean arterial pressure'],
  },
  'timi-scacest': {
    title: 'TIMI para SCACEST',
    summary:
      'Estratifica riesgo en el síndrome coronario agudo con elevación del ST mediante TIMI.',
    tags: ['síndrome coronario agudo', 'scacest', 'riesgo'],
    keywords: ['timi', 'stemi', 'iam con elevación st'],
  },
  'timi-scasest': {
    title: 'TIMI-SCASEST',
    summary:
      'Estratifica riesgo en el síndrome coronario agudo sin elevación del ST mediante TIMI.',
    tags: ['síndrome coronario agudo', 'scasest', 'riesgo'],
    keywords: ['timi', 'nstemi', 'angina inestable'],
  },
  ube: {
    title: 'Unidades de Bebida Estándar (UBE)',
    summary:
      'Calcula las unidades de bebida estándar para estimar consumo de alcohol y carga etílica.',
    tags: ['alcohol', 'toxicología', 'consumo'],
    keywords: ['ube', 'etanol', 'gramos alcohol', 'bebida estándar'],
  },
  'urea-bun': {
    title: 'Conversor Urea - BUN',
    summary:
      'Convierte valores entre urea y BUN para facilitar interpretación clínica y uso en escalas.',
    tags: ['urea', 'bun', 'conversión'],
    keywords: ['blood urea nitrogen', 'laboratorio', 'analítica'],
  },
  waterfall: {
    title: 'WATERFALL',
    summary:
      'Orienta la fluidoterapia inicial y la reevaluación en pancreatitis aguda basada en el estudio WATERFALL.',
    tags: ['pancreatitis aguda', 'fluidoterapia', 'reevaluación'],
    keywords: ['waterfall', 'resucitación con fluidos', 'ringer lactato'],
  },
  'wells-tvp': {
    title: 'Wells - TVP',
    summary:
      'Calcula la probabilidad clínica de trombosis venosa profunda mediante la escala de Wells.',
    tags: ['trombosis venosa profunda', 'probabilidad clínica', 'riesgo'],
    keywords: ['wells', 'tvp', 'tromboembolismo venoso'],
  },
};

export function getScaleMetaBySlug(slug: string | null | undefined) {
  if (!slug) return null;
  return SCALE_META_BY_SLUG[slug] ?? null;
}

export function getScaleMetaByPath(pathname: string | null | undefined) {
  if (!pathname) return null;
  const match = pathname.match(/^\/escalas\/([^/?#]+)/);
  if (!match) return null;
  return getScaleMetaBySlug(match[1]);
}
