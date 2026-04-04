'use client';
// @ts-nocheck

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import InformeCopiable from '@/components/InformeCopiable';

type FocusId =
  | 'resp'
  | 'abd'
  | 'uro'
  | 'ppb'
  | 'snc'
  | 'iv_sin_protesis'
  | 'iv_con_protesis'
  | 'sin_foco';

type WeightBandId = '50-59' | '60-69' | '70-79' | '80-89' | '90-99' | '>100';
type FgBandId = '<30' | '30-50' | '50-70' | '70-90' | '>90';

type RecommendationLine = {
  text: string;
  protocol?: number;
};

type Recommendation = {
  baseLine: string;
  baseProtocol: number;
  optionalLines?: RecommendationLine[];
  adjunctLines?: string[];
  notes?: string[];
  requiresVancomycin?: boolean;
  meropenemOkInPenicillinAllergy?: boolean;
};

type VancomycinPlan = {
  kind: 'alternative' | 'vancomycin';
  line: string;
  protocol: number;
  fgBand: FgBandId;
  weightBand: WeightBandId;
};

const FOCOS: Array<{
  id: FocusId;
  label: string;
  imageSrc: string;
  imageAlt: string;
  badge?: string;
  prosthesisMarker?: boolean;
}> = [
  {
    id: 'resp',
    label: 'Respiratorio',
    imageSrc: '/img/codsepsis/resp.svg',
    imageAlt: 'Foco respiratorio',
  },
  {
    id: 'abd',
    label: 'Abdominal',
    imageSrc: '/img/codsepsis/abd.svg',
    imageAlt: 'Foco abdominal',
  },
  {
    id: 'uro',
    label: 'Urológico',
    imageSrc: '/img/codsepsis/Uro.svg',
    imageAlt: 'Foco urológico',
  },
  {
    id: 'ppb',
    label: 'PPB',
    imageSrc: '/img/codsepsis/ppb.svg',
    imageAlt: 'Foco de partes blandas',
  },
  {
    id: 'snc',
    label: 'SNC',
    imageSrc: '/img/codsepsis/snc.svg',
    imageAlt: 'Foco del sistema nervioso central',
  },
  {
    id: 'iv_sin_protesis',
    label: 'Intravascular sin prótesis/catéter',
    imageSrc: '/img/codsepsis/iv.svg',
    imageAlt: 'Foco intravascular sin prótesis o catéter',
    badge: 'Sin prótesis',
  },
  {
    id: 'iv_con_protesis',
    label: 'Intravascular con prótesis/catéter',
    imageSrc: '/img/codsepsis/iv.svg',
    imageAlt: 'Foco intravascular con prótesis o catéter',
    badge: 'Con prótesis',
    prosthesisMarker: true,
  },
  {
    id: 'sin_foco',
    label: 'Sin foco o Fiebre neutropénica',
    imageSrc: '/img/codsepsis/sinfoco.svg',
    imageAlt: 'Sin foco filiado o fiebre neutropénica',
  },
];

const YES_NO_OPTIONS = [
  { id: 'no', label: 'No' },
  { id: 'si', label: 'Sí' },
] as const;

const BMR_CRITERIA = [
  { id: 'shock_septico', label: 'Shock séptico' },
  { id: 'ingreso', label: 'Ingreso >5 días en 3 meses previos' },
  { id: 'institucionalizacion', label: 'Institucionalización' },
  { id: 'colonizacion_bmr', label: 'Colonización o infección previa conocida por BMR' },
  { id: 'antibioterapia_previa', label: 'Antibioterapia >7 días en el mes previo' },
  {
    id: 'erc_dialisis',
    label: 'Enfermedad renal crónica con hemodiálisis o diálisis peritoneal ambulatoria continua',
  },
  {
    id: 'patologia_cronica',
    label: 'Patología crónica con alta incidencia de colonización/infección por BMR',
  },
] as const;

const ALLERGY_NOTE =
  'En alérgicos a penicilinas debe solicitarse interconsulta a Alergología para valoración y estudio.';
const LEVO_NOTE = 'Levofloxacino 500 mg/12 h durante 1-2 días y después continuar con 500 mg/24 h.';
const AZTREONAM_NOTE =
  'Ante desabastecimiento de Aztreonam se recomienda sustituir por Amikacina 20 mg/Kg/24 h.';
const MEROPENEM_ALLERGY_NOTE =
  'Meropenem se considera de elección en alérgicos a penicilinas por su baja reactividad cruzada.';

const COMPLEMENTARY_TESTS_BY_FOCUS: Partial<Record<FocusId, string[]>> = {
  resp: [
    'Sangre: hemocultivos.',
    'Esputo: cultivo y tinción de Gram; frotis nasofaríngeo PCR COVID, gripe y VRS.',
    'Líquido pleural: cultivo y tinción de Gram.',
    'Orina: antigenuria de neumococo y legionela.',
  ],
  abd: [
    'Sangre: hemocultivos y lipasemia.',
    'Prueba de imagen para descartar colecciones y valorar viabilidad de drenaje percutáneo.',
    'Material purulento obtenido por punción/acto quirúrgico: cultivo y tinción de Gram.',
  ],
  uro: [
    'Sangre: hemocultivos.',
    'Orina (sondaje, punción suprapúbica o espontánea): cultivo.',
    'Material purulento: cultivo y tinción de Gram.',
  ],
  ppb: [
    'Sangre: hemocultivos.',
    'Muestra de tejidos (aspiración de secreciones frescas de la úlcera y herida o biopsia del fondo): tinción de Gram y cultivo.',
  ],
  iv_sin_protesis: [
    'Sangre: hemocultivos de muestra simultánea del extremo del catéter y de otra ubicación; una diferencia de crecimiento >2 horas sugiere infección relacionada con el dispositivo.',
    'Cultivo de los 5 cm últimos del catéter.',
  ],
  iv_con_protesis: [
    'Sangre: hemocultivos de muestra simultánea del extremo del catéter y de otra ubicación; una diferencia de crecimiento >2 horas sugiere infección relacionada con el dispositivo.',
    'Cultivo de los 5 cm últimos del catéter.',
  ],
  snc: [
    'Sangre: hemocultivos.',
    'Prueba de imagen: TAC craneal para descartar signos de hipertensión intracraneal previa a la realización de punción lumbar, así como evaluar probables focos intracraneales.',
    'LCR: tinción de Gram y cultivo.',
    'Sangre: serología VIH si absceso de causa cerebral desconocida.',
  ],
};

const RECOMMENDATIONS: Record<string, Recommendation> = {
  'resp|no|no': {
    baseLine: 'Ceftriaxona 2 g/24 h + Azitromicina 500 mg/24 h',
    baseProtocol: 1,
    adjunctLines: [
      'Valorar ± Oseltamivir 75 mg/12 h vo si el contexto epidemiológico es favorable.',
    ],
    notes: ['Si hay sospecha de infección por SARS-CoV-2, consultar el protocolo específico.'],
  },
  'resp|no|si': {
    baseLine: 'Levofloxacino 500 mg/12 h',
    baseProtocol: 11,
    adjunctLines: [
      'Valorar ± Oseltamivir 75 mg/12 h vo si el contexto epidemiológico es favorable.',
    ],
    notes: [
      LEVO_NOTE,
      'Si hay sospecha de infección por SARS-CoV-2, consultar el protocolo específico.',
    ],
  },
  'resp|si|no': {
    baseLine: 'Ceftazidima 2 g/8 h + Levofloxacino 500 mg/12 h + Linezolid 600 mg/12 h',
    baseProtocol: 19,
    adjunctLines: [
      'Valorar ± Oseltamivir 75 mg/12 h vo si el contexto epidemiológico es favorable.',
    ],
    notes: [
      LEVO_NOTE,
      'Si hay sospecha de infección por SARS-CoV-2, consultar el protocolo específico.',
    ],
  },
  'resp|si|si': {
    baseLine: 'Levofloxacino 500 mg/12 h + Aztreonam 2 g/8 h + Linezolid 600 mg/12 h',
    baseProtocol: 28,
    adjunctLines: [
      'Valorar ± Oseltamivir 75 mg/12 h vo si el contexto epidemiológico es favorable.',
    ],
    notes: [
      LEVO_NOTE,
      AZTREONAM_NOTE,
      'Si hay sospecha de infección por SARS-CoV-2, consultar el protocolo específico.',
    ],
  },

  'abd|no|no': {
    baseLine: 'Ceftriaxona 2 g/24 h + Metronidazol 500 mg/8 h',
    baseProtocol: 2,
    optionalLines: [{ text: 'Añadir Ampicilina 2 g/4 h si afectación biliar/colon', protocol: 3 }],
  },
  'abd|no|si': {
    baseLine: 'Aztreonam 2 g/8 h + Metronidazol 500 mg/8 h',
    baseProtocol: 12,
    requiresVancomycin: true,
    notes: [AZTREONAM_NOTE],
  },
  'abd|si|no': {
    baseLine: 'Meropenem 1 g/8 h',
    baseProtocol: 20,
    requiresVancomycin: true,
  },
  'abd|si|si': {
    baseLine: 'Aztreonam 2 g/8 h',
    baseProtocol: 18,
    requiresVancomycin: true,
    notes: [AZTREONAM_NOTE],
  },

  'uro|no|no': {
    baseLine: 'Ceftriaxona 2 g/24 h',
    baseProtocol: 4,
  },
  'uro|no|si': {
    baseLine: 'Aztreonam 2 g/8 h',
    baseProtocol: 13,
    notes: [AZTREONAM_NOTE],
  },
  'uro|si|no': {
    baseLine: 'Meropenem 1 g/8 h + Amikacina 20 mg/Kg/24 h',
    baseProtocol: 21,
    optionalLines: [{ text: 'Añadir Ampicilina 2 g/4 h si SV, ATB o IQ <3 meses', protocol: 22 }],
  },
  'uro|si|si': {
    baseLine: 'Aztreonam 2 g/8 h',
    baseProtocol: 18,
    requiresVancomycin: true,
    notes: [AZTREONAM_NOTE],
  },

  'ppb|no|no': {
    baseLine: 'Cefazolina 2 g/8 h + Ceftriaxona 2 g/24 h',
    baseProtocol: 5,
  },
  'ppb|no|si': {
    baseLine: 'Ciprofloxacino 400 mg/12 h + Clindamicina 600 mg/6 h',
    baseProtocol: 14,
  },
  'ppb|si|no': {
    baseLine: 'Piperacilina/Tazobactam 4/0,5 g/6 h',
    baseProtocol: 10,
    requiresVancomycin: true,
  },
  'ppb|si|si': {
    baseLine: 'Aztreonam 2 g/8 h',
    baseProtocol: 18,
    requiresVancomycin: true,
    notes: [AZTREONAM_NOTE],
  },

  'snc|no|no': {
    baseLine: 'Ceftriaxona 2 g/12 h',
    baseProtocol: 6,
    optionalLines: [
      { text: 'Añadir Ampicilina 2 g/4 h si inmunodepresión o >55 años', protocol: 7 },
    ],
    adjunctLines: ['Añadir Aciclovir 10 mg/Kg/8 h.'],
  },
  'snc|no|si': {
    baseLine: 'Levofloxacino 500 mg/12 h + Rifampicina 600 mg/12 h',
    baseProtocol: 15,
    requiresVancomycin: true,
    optionalLines: [
      { text: 'Añadir Cotrimoxazol 320 mg/12 h si inmunodepresión o >55 años', protocol: 16 },
    ],
    adjunctLines: ['Añadir Aciclovir 10 mg/Kg/8 h.'],
    notes: [LEVO_NOTE],
  },
  'snc|si|no': {
    baseLine: 'Meropenem 2 g/8 h',
    baseProtocol: 23,
    requiresVancomycin: true,
    optionalLines: [
      { text: 'Añadir Ampicilina 2 g/4 h si inmunodepresión o >55 años', protocol: 24 },
    ],
    adjunctLines: ['Añadir Aciclovir 10 mg/Kg/8 h.'],
  },
  'snc|si|si': {
    baseLine: 'Meropenem 2 g/8 h',
    baseProtocol: 23,
    requiresVancomycin: true,
    optionalLines: [
      { text: 'Añadir Cotrimoxazol 320 mg/8 h si inmunodepresión o >55 años', protocol: 30 },
    ],
    adjunctLines: ['Añadir Aciclovir 10 mg/Kg/8 h.'],
    meropenemOkInPenicillinAllergy: true,
  },

  'iv_sin_protesis|no|no': {
    baseLine: 'Ampicilina 2 g/4 h + Cloxacilina 1 g/4 h + Gentamicina 240 mg/24 h',
    baseProtocol: 8,
  },
  'iv_sin_protesis|no|si': {
    baseLine: 'Daptomicina 10 mg/Kg/24 h + Gentamicina 240 mg/24 h',
    baseProtocol: 17,
  },
  'iv_sin_protesis|si|no': {
    baseLine: 'Meropenem 2 g/8 h',
    baseProtocol: 25,
    requiresVancomycin: true,
  },
  'iv_sin_protesis|si|si': {
    baseLine: 'Meropenem 2 g/8 h',
    baseProtocol: 25,
    requiresVancomycin: true,
    meropenemOkInPenicillinAllergy: true,
  },

  'iv_con_protesis|no|no': {
    baseLine: 'Daptomicina 10 mg/Kg/24 h + Rifampicina 600 mg/12 h + Gentamicina 240 mg/24 h',
    baseProtocol: 9,
  },
  'iv_con_protesis|no|si': {
    baseLine: 'Daptomicina 10 mg/Kg/24 h + Rifampicina 600 mg/12 h + Gentamicina 240 mg/24 h',
    baseProtocol: 9,
  },
  'iv_con_protesis|si|no': {
    baseLine: 'Meropenem 2 g/8 h + Rifampicina 600 mg/12 h',
    baseProtocol: 26,
    requiresVancomycin: true,
  },
  'iv_con_protesis|si|si': {
    baseLine: 'Meropenem 2 g/8 h + Rifampicina 600 mg/12 h',
    baseProtocol: 26,
    requiresVancomycin: true,
    meropenemOkInPenicillinAllergy: true,
  },

  'sin_foco|no|no': {
    baseLine: 'Piperacilina/Tazobactam 4/0,5 g/6 h',
    baseProtocol: 10,
    requiresVancomycin: true,
  },
  'sin_foco|no|si': {
    baseLine: 'Aztreonam 2 g/8 h',
    baseProtocol: 18,
    requiresVancomycin: true,
    notes: [AZTREONAM_NOTE],
  },
  'sin_foco|si|no': {
    baseLine: 'Meropenem 2 g/8 h + Amikacina 20 mg/Kg/24 h + Linezolid 600 mg/12 h',
    baseProtocol: 27,
  },
  'sin_foco|si|si': {
    baseLine: 'Meropenem 2 g/8 h + Amikacina 20 mg/Kg/24 h + Linezolid 600 mg/12 h',
    baseProtocol: 27,
    meropenemOkInPenicillinAllergy: true,
  },
};

const WEIGHT_BANDS: Array<{ id: WeightBandId; label: string; min: number; max: number }> = [
  { id: '50-59', label: '50-59 Kg', min: 50, max: 59.999 },
  { id: '60-69', label: '60-69 Kg', min: 60, max: 69.999 },
  { id: '70-79', label: '70-79 Kg', min: 70, max: 79.999 },
  { id: '80-89', label: '80-89 Kg', min: 80, max: 89.999 },
  { id: '90-99', label: '90-99 Kg', min: 90, max: 99.999 },
  { id: '>100', label: '>100 Kg', min: 100, max: Number.POSITIVE_INFINITY },
];

const VANCO_ALTERNATIVE_BY_WEIGHT: Record<WeightBandId, { line: string; protocol: number }> = {
  '50-59': { line: 'Linezolid 600 mg/12 h o Daptomicina 10 mg/Kg/48 h', protocol: 1 },
  '60-69': { line: 'Linezolid 600 mg/12 h o Daptomicina 10 mg/Kg/48 h', protocol: 2 },
  '70-79': { line: 'Linezolid 600 mg/12 h o Daptomicina 10 mg/Kg/48 h', protocol: 3 },
  '80-89': { line: 'Linezolid 600 mg/12 h o Daptomicina 10 mg/Kg/48 h', protocol: 6 },
  '90-99': { line: 'Linezolid 600 mg/12 h o Daptomicina 10 mg/Kg/48 h', protocol: 7 },
  '>100': { line: 'Linezolid 600 mg/12 h o Daptomicina 10 mg/Kg/48 h', protocol: 8 },
};

const VANCO_DOSES: Record<
  FgBandId,
  Partial<Record<WeightBandId, { line: string; protocol: number }>>
> = {
  '<30': {},
  '30-50': {
    '50-59': { line: '1250 mg STAT (Dosis inicial) + 750 mg/24 h', protocol: 1 },
    '60-69': { line: '1500 mg STAT (Dosis inicial) + 1000 mg/24 h', protocol: 2 },
    '70-79': { line: '1750 mg STAT (Dosis inicial) + 1000 mg/24 h', protocol: 3 },
    '80-89': { line: '2000 mg STAT (Dosis inicial) + 750 mg/12 h', protocol: 6 },
    '90-99': { line: '2250 mg STAT (Dosis inicial) + 750 mg/12 h', protocol: 7 },
    '>100': { line: '2500 mg STAT (Dosis inicial) + 750 mg/12 h', protocol: 8 },
  },
  '50-70': {
    '50-59': { line: '1250 mg STAT (Dosis inicial) + 750 mg/12 h', protocol: 4 },
    '60-69': { line: '1500 mg STAT (Dosis inicial) + 750 mg/12 h', protocol: 5 },
    '70-79': { line: '1750 mg STAT (Dosis inicial) + 1000 mg/12 h', protocol: 11 },
    '80-89': { line: '2000 mg STAT (Dosis inicial) + 750 mg/8 h', protocol: 12 },
    '90-99': { line: '2250 mg STAT (Dosis inicial) + 1000 mg/8 h', protocol: 15 },
    '>100': { line: '2500 mg STAT (Dosis inicial) + 750 mg/8 h', protocol: 16 },
  },
  '70-90': {
    '50-59': { line: '1250 mg STAT (Dosis inicial) + 750 mg/12 h', protocol: 4 },
    '60-69': { line: '1500 mg STAT (Dosis inicial) + 1000 mg/12 h', protocol: 10 },
    '70-79': { line: '1750 mg STAT (Dosis inicial) + 750 mg/8 h', protocol: 13 },
    '80-89': { line: '2000 mg STAT (Dosis inicial) + 750 mg/8 h', protocol: 14 },
    '90-99': { line: '2250 mg STAT (Dosis inicial) + 1000 mg/8 h', protocol: 18 },
    '>100': { line: '2500 mg STAT (Dosis inicial) + 1000 mg/8 h', protocol: 19 },
  },
  '>90': {
    '50-59': { line: '1250 mg STAT (Dosis inicial) + 1000 mg/12 h', protocol: 9 },
    '60-69': { line: '1500 mg STAT (Dosis inicial) + 1000 mg/12 h', protocol: 10 },
    '70-79': { line: '1750 mg STAT (Dosis inicial) + 750 mg/8 h', protocol: 13 },
    '80-89': { line: '2000 mg STAT (Dosis inicial) + 1000 mg/8 h', protocol: 17 },
    '90-99': { line: '2250 mg STAT (Dosis inicial) + 1000 mg/8 h', protocol: 18 },
    '>100': { line: '2500 mg STAT (Dosis inicial) + 1000 mg/8 h', protocol: 19 },
  },
};

function parsePositiveNumber(raw: string): number | null {
  const cleaned = raw.replace(',', '.').trim();
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function getFocusLabel(focus: FocusId | null) {
  return FOCOS.find((item) => item.id === focus)?.label ?? '';
}

function getComplementaryTests(focus: FocusId | null) {
  if (!focus) return [];
  return COMPLEMENTARY_TESTS_BY_FOCUS[focus] ?? [];
}

function getWeightBand(weight: number): WeightBandId | null {
  return WEIGHT_BANDS.find((band) => weight >= band.min && weight < band.max)?.id ?? null;
}

function getWeightBandLabel(weightBand: WeightBandId | null) {
  return WEIGHT_BANDS.find((band) => band.id === weightBand)?.label ?? '';
}

function getFgBand(fg: number): FgBandId {
  if (fg < 30) return '<30';
  if (fg <= 50) return '30-50';
  if (fg <= 70) return '50-70';
  if (fg <= 90) return '70-90';
  return '>90';
}

function buildRecommendationKey(focus: FocusId, riesgoBmr: boolean, alergiaPenicilina: boolean) {
  return `${focus}|${riesgoBmr ? 'si' : 'no'}|${alergiaPenicilina ? 'si' : 'no'}`;
}

function getVancomycinPlan(fg: number, weight: number): VancomycinPlan | null {
  const fgBand = getFgBand(fg);
  const weightBand = getWeightBand(weight);

  if (!weightBand) return null;

  if (fgBand === '<30') {
    const alternative = VANCO_ALTERNATIVE_BY_WEIGHT[weightBand];
    return {
      kind: 'alternative',
      line: alternative.line,
      protocol: alternative.protocol,
      fgBand,
      weightBand,
    };
  }

  const dose = VANCO_DOSES[fgBand][weightBand];
  if (!dose) return null;

  return {
    kind: 'vancomycin',
    line: dose.line,
    protocol: dose.protocol,
    fgBand,
    weightBand,
  };
}

function formatProtocol(protocol?: number) {
  return protocol ? `Protocolo OC ${protocol}` : null;
}

function formatVancomycinProtocol(protocol?: number) {
  return protocol ? `Protocolo OC Vanco ${protocol}` : null;
}

function formatAntiMrsaProtocol(plan: VancomycinPlan | null) {
  if (!plan?.protocol) return null;
  return plan.kind === 'vancomycin' ? formatVancomycinProtocol(plan.protocol) : null;
}

export default function AntibioterapiaCodigoSepsisPage() {
  const [focus, setFocus] = useState<FocusId | null>(null);
  const [selectedBmrCriteria, setSelectedBmrCriteria] = useState<string[]>([]);
  const [alergiaPenicilina, setAlergiaPenicilina] = useState<boolean | null>(null);
  const [filtrado, setFiltrado] = useState('80');
  const [peso, setPeso] = useState('70');

  const filtradoNum = useMemo(() => parsePositiveNumber(filtrado), [filtrado]);
  const pesoNum = useMemo(() => parsePositiveNumber(peso), [peso]);
  const riesgoBmr = useMemo(() => selectedBmrCriteria.length > 0, [selectedBmrCriteria]);

  const recommendation = useMemo(() => {
    if (!focus || alergiaPenicilina === null) return null;
    return RECOMMENDATIONS[buildRecommendationKey(focus, riesgoBmr, alergiaPenicilina)] ?? null;
  }, [alergiaPenicilina, focus, riesgoBmr]);

  const vancomycinPlan = useMemo(() => {
    if (!recommendation?.requiresVancomycin) return null;
    if (filtradoNum === null || pesoNum === null) return null;
    return getVancomycinPlan(filtradoNum, pesoNum);
  }, [filtradoNum, pesoNum, recommendation]);

  const state = useMemo(() => {
    if (!focus || alergiaPenicilina === null) {
      return {
        color: 'amarillo',
        heading: 'Faltan datos',
        summary:
          'Selecciona foco y Alergia a Penicilinas. Los criterios de riesgo para BMR son opcionales.',
        ready: false,
      };
    }

    if (!recommendation) {
      return {
        color: 'rojo',
        heading: 'Combinación no disponible',
        summary: 'No se ha encontrado una pauta para la combinación seleccionada.',
        ready: false,
      };
    }

    if (!recommendation.requiresVancomycin) {
      return {
        color: 'verde',
        heading: `Pauta resuelta · ${formatProtocol(recommendation.baseProtocol)}`,
        summary: recommendation.baseLine,
        ready: true,
      };
    }

    if (!filtrado.trim() || !peso.trim()) {
      return {
        color: 'amarillo',
        heading: 'Faltan filtrado y peso',
        summary: 'Esta pauta necesita la calculadora asociada de Vancomicina. Introduce FG y peso.',
        ready: false,
      };
    }

    if (filtradoNum === null || pesoNum === null) {
      return {
        color: 'rojo',
        heading: 'Filtrado o peso no válidos',
        summary: 'Revisa que ambos sean números positivos.',
        ready: false,
      };
    }

    const weightBand = getWeightBand(pesoNum);
    if (!weightBand) {
      return {
        color: 'rojo',
        heading: 'Peso fuera de la tabla',
        summary: 'La calculadora disponible cubre pesos a partir de 50 Kg.',
        ready: false,
      };
    }

    if (!vancomycinPlan) {
      return {
        color: 'rojo',
        heading: 'No se ha podido resolver la pauta',
        summary: 'No se ha encontrado una combinación válida de filtrado y peso en la tabla.',
        ready: false,
      };
    }

    const antiMrsaLabel =
      vancomycinPlan.kind === 'vancomycin'
        ? `Vancomicina ${vancomycinPlan.line}`
        : `Alternativa a Vancomicina: ${vancomycinPlan.line}`;
    const antiMrsaProtocol = formatAntiMrsaProtocol(vancomycinPlan);

    return {
      color: 'verde',
      heading: antiMrsaProtocol
        ? `Pauta resuelta · ${formatProtocol(recommendation.baseProtocol)} + ${antiMrsaProtocol}`
        : `Pauta resuelta · ${formatProtocol(recommendation.baseProtocol)}`,
      summary: `${recommendation.baseLine}\n${antiMrsaLabel}`,
      ready: true,
    };
  }, [
    filtrado,
    filtradoNum,
    focus,
    peso,
    pesoNum,
    recommendation,
    alergiaPenicilina,
    vancomycinPlan,
  ]);

  const reportText = useMemo(() => {
    if (!focus || alergiaPenicilina === null || !recommendation) return null;
    if (recommendation.requiresVancomycin && !vancomycinPlan) return null;
    const complementaryTests = getComplementaryTests(focus);

    const lines: string[] = [
      'Antibioterapia Empírica Código Sepsis',
      `- Foco: ${getFocusLabel(focus)}`,
      `- Riesgo para BMR / shock séptico: ${
        selectedBmrCriteria.length
          ? BMR_CRITERIA.filter((item) => selectedBmrCriteria.includes(item.id))
              .map((item) => item.label)
              .join(' | ')
          : 'Ninguno'
      }`,
      `- Alergia a Penicilinas: ${alergiaPenicilina ? 'Sí' : 'No'}`,
    ];

    if (
      recommendation.requiresVancomycin &&
      vancomycinPlan &&
      filtradoNum !== null &&
      pesoNum !== null
    ) {
      lines.push(
        `- Filtrado glomerular: ${filtradoNum} mL/min (${vancomycinPlan.fgBand} mL/min)`,
        `- Peso: ${pesoNum} Kg (${getWeightBandLabel(vancomycinPlan.weightBand)})`
      );
    }

    lines.push('', 'Tratamiento recomendado:');
    lines.push(`- ${recommendation.baseLine} (${formatProtocol(recommendation.baseProtocol)})`);

    if (recommendation.requiresVancomycin && vancomycinPlan) {
      const antiMrsaLabel =
        vancomycinPlan.kind === 'vancomycin'
          ? `Vancomicina ${vancomycinPlan.line}`
          : `Sustituto de Vancomicina por FG <30 mL/min: ${vancomycinPlan.line}`;
      const antiMrsaProtocol = formatAntiMrsaProtocol(vancomycinPlan);
      lines.push(`- ${antiMrsaLabel}${antiMrsaProtocol ? ` (${antiMrsaProtocol})` : ''}`);
    }

    for (const optionalLine of recommendation.optionalLines ?? []) {
      lines.push(
        `- ${optionalLine.text}${optionalLine.protocol ? ` (${formatProtocol(optionalLine.protocol)})` : ''}`
      );
    }

    for (const adjunctLine of recommendation.adjunctLines ?? []) {
      lines.push(`- ${adjunctLine}`);
    }

    if (complementaryTests.length) {
      lines.push('', 'Pruebas complementarias recomendadas:');
      for (const test of complementaryTests) {
        lines.push(`- ${test}`);
      }
    }

    const notes = [...(recommendation.notes ?? [])];
    if (alergiaPenicilina) notes.unshift(ALLERGY_NOTE);
    if (alergiaPenicilina && recommendation.meropenemOkInPenicillinAllergy) {
      notes.push(MEROPENEM_ALLERGY_NOTE);
    }

    if (notes.length) {
      lines.push('', 'Notas:');
      for (const note of notes) {
        lines.push(`- ${note}`);
      }
    }

    return lines.join('\n');
  }, [
    alergiaPenicilina,
    filtradoNum,
    focus,
    pesoNum,
    recommendation,
    selectedBmrCriteria,
    vancomycinPlan,
  ]);

  const reset = () => {
    setFocus(null);
    setSelectedBmrCriteria([]);
    setAlergiaPenicilina(null);
    setFiltrado('80');
    setPeso('70');
  };

  return (
    <main className="escala-wrapper escala-full space-y-6" style={{ maxWidth: 1360, padding: 24 }}>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Antibioterapia Empírica Código Sepsis</h1>
        <p className="text-sm text-slate-600">
          Selecciona el foco, marca los criterios de riesgo para BMR o shock séptico y la Alergia a
          Penicilinas. Si la pauta requiere Vancomicina, se activará la calculadora asociada. Datos
          basados en el{' '}
          <Link
            href="/protocolos/sepsis"
            className="text-[#2b5d68] text-sm font-medium underline decoration-[#dfe9eb] underline-offset-4"
          >
            protocolo de Código Sepsis
          </Link>{' '}
          del Hospital Universitario de San Juan en su versión de mayo de 2024.
        </p>
      </div>

      <div className="inputs-grid">
        <div className="input-group input-group-full">
          <label>Foco</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
            {FOCOS.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                className={`group relative overflow-hidden rounded-xl border-2 bg-white p-2 transition ${
                  focus === item.id
                    ? 'border-[#5a7f8a] ring-2 ring-[#5a7f8a]/20'
                    : 'border-slate-200 hover:border-[#5a7f8a]/60'
                }`}
                onClick={() => setFocus(item.id)}
              >
                {item.badge ? (
                  <span
                    className={`absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                      focus === item.id
                        ? 'bg-[#2b5d68] text-white'
                        : 'bg-white/95 text-slate-600 shadow-sm'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}

                <div
                  className={`flex aspect-square items-center justify-center rounded-lg border p-2 ${
                    focus === item.id
                      ? 'border-[#2b5d68]/40 bg-gradient-to-br from-[#2b5d68] to-[#5a7f8a] shadow-inner'
                      : 'border-slate-200 bg-gradient-to-br from-[#4f7180] to-[#86a7b2]'
                  }`}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      width={120}
                      height={120}
                      className="h-full w-full object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                    />

                    {item.prosthesisMarker ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-7 w-3 rounded-full border-2 border-dashed border-white/95 bg-white/10 shadow-sm" />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div
                  className={`mt-1.5 text-center text-[11px] font-medium leading-tight ${
                    focus === item.id ? 'text-[#2b5d68]' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="input-group input-group-full">
          <label>Riesgo para BMR o shock séptico</label>
          <p className="mb-2 text-xs text-slate-500">
            Si seleccionas uno o más, se considera que sí tiene riesgo.
          </p>
          <div className="grid items-stretch gap-2 md:grid-cols-2 lg:grid-cols-12">
            {BMR_CRITERIA.map((item, index) => {
              const active = selectedBmrCriteria.includes(item.id);
              const desktopSpan = index < 4 ? 'lg:col-span-3' : 'lg:col-span-4';
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`selector-btn flex h-full min-h-14 w-full items-center text-left text-sm leading-snug md:col-span-1 ${desktopSpan} ${active ? 'activo' : ''}`}
                  onClick={() =>
                    setSelectedBmrCriteria((current) =>
                      current.includes(item.id)
                        ? current.filter((criterionId) => criterionId !== item.id)
                        : [...current, item.id]
                    )
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="input-group input-group-full">
          <div
            className={`grid gap-4 ${recommendation?.requiresVancomycin ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}
          >
            <div className="input-group">
              <label>Alergia a Penicilinas</label>
              <div className="selector-botones selector-botones-2col">
                {YES_NO_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`selector-btn ${alergiaPenicilina === (item.id === 'si') ? 'activo' : ''}`}
                    onClick={() => setAlergiaPenicilina(item.id === 'si')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {recommendation?.requiresVancomycin && (
              <>
                <div className="input-group">
                  <label>Filtrado glomerular</label>
                  <div className="input-con-unidad">
                    <input
                      type="number"
                      min="1"
                      step="5"
                      value={filtrado}
                      onChange={(event) => setFiltrado(event.target.value)}
                      placeholder="80"
                    />
                    <span className="input-unidad">mL/min</span>
                  </div>
                </div>

                <div className="input-group">
                  <label>Peso</label>
                  <div className="input-con-unidad">
                    <input
                      type="number"
                      min="1"
                      step="2"
                      value={peso}
                      onChange={(event) => setPeso(event.target.value)}
                      placeholder="70"
                    />
                    <span className="input-unidad">Kg</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="acciones-escala">
        <button className="reset-btn" onClick={reset}>
          Reiniciar herramienta
        </button>
      </div>

      <div className={`resultado ${state.color}`}>
        <div className="puntos-total">{state.heading}</div>
        <div className="interpretacion whitespace-pre-line">{state.summary}</div>
      </div>

      {reportText && <InformeCopiable texto={reportText} />}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">Factores de riesgo para BMR</p>
          <ul className="space-y-1">
            {BMR_CRITERIA.map((item) => (
              <li key={item.id}>• {item.label}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-slate-900">Notas prácticas</p>
          <p>{ALLERGY_NOTE}</p>
          <p>{AZTREONAM_NOTE}</p>
          <p>
            Si la calculadora de Vancomicina entra en el rango de FG &lt;30 mL/min, la tabla remite
            a Linezolid 600 mg/12 h o Daptomicina 10 mg/Kg/48 h según el protocolo asociado.
          </p>
        </div>
      </section>
    </main>
  );
}
