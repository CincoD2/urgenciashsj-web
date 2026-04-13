'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';
import { ScaleModalChips } from '@/components/mdx/ScaleModalChips';

type SettingId = 'ambulatorio' | 'hospitalizado';
type HostId = 'inmunocompetente' | 'inmunocomprometido';
type PesId = 'lt5' | 'gte5';
type UnitId = 'no-uci' | 'uci';
type SuspicionId = 'aspergillus' | 'otro-hongo' | 'p-jirovecii' | 'cmv';

type RegimenCard = {
  id: string;
  title: string;
  lines: string[];
  protocol?: number;
  highlight?: string;
};

type Recommendation = {
  tone: 'teal' | 'rose' | 'amber' | 'violet';
  title: string;
  summary: string;
  regimens: RegimenCard[];
  notes: string[];
};

const SETTING_OPTIONS: Array<{
  id: SettingId;
  label: string;
  caption: string;
}> = [
  {
    id: 'ambulatorio',
    label: 'Ambulatorio',
    caption: 'Consulta rápida con opciones orales y alternativas por alergia.',
  },
  {
    id: 'hospitalizado',
    label: 'Hospitalizado',
    caption: 'Rama completa con PES, UCI, inmunidad y coberturas adicionales.',
  },
];

const HOST_OPTIONS: Array<{
  id: HostId;
  label: string;
  caption: string;
}> = [
  {
    id: 'inmunocompetente',
    label: 'Inmunocompetente',
    caption: 'Usa la rama clásica del algoritmo con PES y ubicación asistencial.',
  },
  {
    id: 'inmunocomprometido',
    label: 'Inmunocomprometido',
    caption: 'Base amplia y suplementos por sospecha microbiológica concreta.',
  },
];

const PES_OPTIONS: Array<{
  id: PesId;
  label: string;
  caption: string;
}> = [
  {
    id: 'lt5',
    label: 'PES < 5',
    caption: 'Sin cobertura ampliada inicial si el resto del contexto no obliga.',
  },
  {
    id: 'gte5',
    label: 'PES ≥ 5',
    caption: 'Activa cobertura ampliada frente a patógenos resistentes.',
  },
];

const UNIT_OPTIONS: Array<{
  id: UnitId;
  label: string;
  caption: string;
}> = [
  {
    id: 'no-uci',
    label: 'No UCI',
    caption: 'Ingreso convencional o monitorizado fuera de cuidados intensivos.',
  },
  {
    id: 'uci',
    label: 'UCI',
    caption: 'Necesidad de manejo en paciente crítico o con NAC grave.',
  },
];

const SUSPICION_OPTIONS: Array<{
  id: SuspicionId;
  label: string;
  caption: string;
}> = [
  {
    id: 'aspergillus',
    label: 'Sospecha Aspergillus',
    caption: 'Añade cobertura antifúngica dirigida con voriconazol.',
  },
  {
    id: 'otro-hongo',
    label: 'Sospecha otro hongo',
    caption: 'Piensa en anfotericina B liposomal; subir dosis si sospecha de mucorales.',
  },
  {
    id: 'p-jirovecii',
    label: 'Sospecha P. jirovecii',
    caption: 'Añade cotrimoxazol a dosis altas; considerar prednisona si NAC grave.',
  },
  {
    id: 'cmv',
    label: 'Sospecha CMV',
    caption: 'Valora ganciclovir, especialmente en trasplante hematopoyético.',
  },
];

const SETTING_SUPPORT_SCALES = [
  { href: '/escalas/psi', label: 'PSI' },
  { href: '/escalas/curb65', label: 'CURB-65' },
];

const PES_SUPPORT_SCALES = [{ href: '/escalas/pes', label: 'PES Score' }];

const BETA_ALLERGY_NOTE =
  'Solicitar interconsulta a Alergología para estudio de alergias; un alto porcentaje son intolerancias.';
const LEVO_NOTE = 'Levofloxacino 500 mg/12 h durante 1-2 días y después continuar con 500 mg/24 h.';
const OSELTAMIVIR_NOTE =
  'Añadir Oseltamivir 75 mg/12 h si el test es positivo para Influenza, independientemente del tiempo de evolución.';
const AZTREONAM_NOTE =
  'Ante desabastecimiento de Aztreonam, sustituir por Amikacina 20 mg/Kg/24 h.';
const VORICONAZOL_IV_NOTE = 'Voriconazol IV: 6 mg/kg/12 h el día 1 (2 dosis) y luego 4 mg/kg/12 h.';
const NO_IMMEDIATE_EMPIRIC_NOTE =
  'No hay indicación de tratamiento empírico inmediato frente a Nocardia, Tuberculosis, VVZ, Toxoplasma y Strongyloides.';

const IMMUNOCOMPROMISED_ADDONS: Record<SuspicionId, RegimenCard> = {
  aspergillus: {
    id: 'aspergillus',
    title: 'Cobertura añadida · Aspergillus',
    lines: ['Voriconazol VO 400 mg/12 h día 1 y después 200-300 mg/12 h.'],
    highlight: VORICONAZOL_IV_NOTE,
  },
  'otro-hongo': {
    id: 'otro-hongo',
    title: 'Cobertura añadida · Otro hongo',
    lines: ['Anfotericina B liposomal 3-5 mg/kg/día.', '(Mucorales: 7,5 mg/kg/día).'],
  },
  'p-jirovecii': {
    id: 'p-jirovecii',
    title: 'Cobertura añadida · P. jirovecii',
    lines: ['Cotrimoxazol 5 mg/kg/6-8 h.'],
    highlight: 'Considerar prednisona si la NAC es grave.',
  },
  cmv: {
    id: 'cmv',
    title: 'Cobertura añadida · CMV',
    lines: ['Ganciclovir 5 mg/kg/12 h IV.'],
    highlight: 'Especialmente relevante en trasplante hematopoyético.',
  },
};

function protocolLabel(protocol?: number) {
  return protocol ? `Protocolo OC ${protocol}` : null;
}

function getRecommendation(args: {
  setting: SettingId | null;
  hostStatus: HostId | null;
  pesBand: PesId | null;
  unit: UnitId | null;
  betaAllergy: boolean | null;
}): Recommendation | null {
  const { setting, hostStatus, pesBand, unit, betaAllergy } = args;

  if (!setting || betaAllergy === null) return null;

  if (setting === 'ambulatorio') {
    if (betaAllergy) {
      return {
        tone: 'rose',
        title: 'NAC ambulatoria con alergia a betalactámicos',
        summary: 'El esquema ofrece quinolonas respiratorias como alternativas directas.',
        regimens: [
          {
            id: 'amb-beta-levo',
            title: 'Opción 1',
            lines: ['Levofloxacino 500 mg/12 h durante 1-2 días y después 500 mg/24 h.'],
          },
          {
            id: 'amb-beta-moxi',
            title: 'Opción 2',
            lines: ['Moxifloxacino 400 mg/24 h.'],
          },
        ],
        notes: [BETA_ALLERGY_NOTE, OSELTAMIVIR_NOTE],
      };
    }

    return {
      tone: 'teal',
      title: 'NAC ambulatoria',
      summary: 'El esquema presenta varias alternativas válidas dentro de la misma rama.',
      regimens: [
        {
          id: 'amb-amox',
          title: 'Opción base',
          lines: [
            'Amoxicilina 1 g/8 h o Amoxicilina/Clavulánico 875/125 mg/8 h.',
            'Y Azitromicina 500 mg/24 h o Claritromicina 500 mg/12 h.',
          ],
        },
        {
          id: 'amb-cefditoreno',
          title: 'Alternativa oral',
          lines: [
            'Cefditoreno 400 mg/12 h.',
            'Y Azitromicina 500 mg/24 h o Claritromicina 500 mg/12 h.',
          ],
        },
      ],
      notes: [OSELTAMIVIR_NOTE],
    };
  }

  if (!hostStatus) return null;

  if (hostStatus === 'inmunocomprometido') {
    return betaAllergy
      ? {
          tone: 'violet',
          title: 'NAC hospitalizada en inmunocomprometido',
          summary: 'Base amplia de neumonía nosocomial con ajustes por sospecha etiológica.',
          regimens: [
            {
              id: 'ic-beta',
              title: 'Tratamiento basal',
              lines: [
                'Aztreonam 2 g/8 h.',
                'Y Levofloxacino 500 mg/12 h.',
                'Y Linezolid 600 mg/12 h.',
              ],
              protocol: 8,
            },
          ],
          notes: [
            BETA_ALLERGY_NOTE,
            LEVO_NOTE,
            AZTREONAM_NOTE,
            OSELTAMIVIR_NOTE,
            NO_IMMEDIATE_EMPIRIC_NOTE,
          ],
        }
      : {
          tone: 'violet',
          title: 'NAC hospitalizada en inmunocomprometido',
          summary: 'Base amplia de neumonía nosocomial con ajustes por sospecha etiológica.',
          regimens: [
            {
              id: 'ic-standard',
              title: 'Tratamiento basal',
              lines: [
                'Meropenem 1 g/8 h.',
                'Y Levofloxacino 500 mg/12 h.',
                'Y Linezolid 600 mg/12 h.',
              ],
              protocol: 7,
            },
          ],
          notes: [LEVO_NOTE, OSELTAMIVIR_NOTE, NO_IMMEDIATE_EMPIRIC_NOTE],
        };
  }

  if (!pesBand) return null;

  if (pesBand === 'gte5') {
    return betaAllergy
      ? {
          tone: 'rose',
          title: 'NAC hospitalizada · PES ≥ 5',
          summary: 'Cobertura ampliada por alto riesgo de patógenos resistentes.',
          regimens: [
            {
              id: 'pes-gte5-beta',
              title: 'Cobertura ampliada',
              lines: [
                'Aztreonam 2 g/8 h.',
                'Y Levofloxacino 500 mg/12 h.',
                'Y Linezolid 600 mg/12 h.',
              ],
              protocol: 8,
            },
          ],
          notes: [BETA_ALLERGY_NOTE, LEVO_NOTE, AZTREONAM_NOTE, OSELTAMIVIR_NOTE],
        }
      : {
          tone: 'amber',
          title: 'NAC hospitalizada · PES ≥ 5',
          summary: 'Cobertura ampliada por alto riesgo de patógenos resistentes.',
          regimens: [
            {
              id: 'pes-gte5-standard',
              title: 'Cobertura ampliada',
              lines: [
                'Meropenem 1 g/8 h.',
                'Y Levofloxacino 500 mg/12 h.',
                'Y Linezolid 600 mg/12 h.',
              ],
              protocol: 7,
            },
          ],
          notes: [LEVO_NOTE, OSELTAMIVIR_NOTE],
        };
  }

  if (!unit) return null;

  if (unit === 'no-uci') {
    return betaAllergy
      ? {
          tone: 'rose',
          title: 'NAC hospitalizada · PES < 5 · No UCI',
          summary:
            'La rama de alergia a betalactámicos concentra la pauta en monoterapia respiratoria.',
          regimens: [
            {
              id: 'ward-beta',
              title: 'Rama alergia a betalactámicos',
              lines: ['Levofloxacino 500 mg/12 h durante 1-2 días y después 500 mg/24 h.'],
              protocol: 2,
            },
          ],
          notes: [BETA_ALLERGY_NOTE, OSELTAMIVIR_NOTE],
        }
      : {
          tone: 'teal',
          title: 'NAC hospitalizada · PES < 5 · No UCI',
          summary:
            'Hay una pauta estándar y una alternativa si no puedes usar macrólidos o quinolonas.',
          regimens: [
            {
              id: 'ward-standard',
              title: 'Opción estándar',
              lines: ['Ceftriaxona 1-2 g/24 h.', 'Y Azitromicina 500 mg/24 h VO/IV.'],
              protocol: 1,
            },
            {
              id: 'ward-alt',
              title: 'Si alergia/contraindicación a fluorquinolonas o macrólidos',
              lines: ['Ceftriaxona 1-2 g/24 h.', 'Y Doxiciclina 100 mg/12 h VO/IV.'],
              protocol: 3,
            },
          ],
          notes: [OSELTAMIVIR_NOTE],
        };
  }

  return betaAllergy
    ? {
        tone: 'rose',
        title: 'NAC hospitalizada · PES < 5 · UCI',
        summary: 'La pauta recomendada sustituye el betalactámico por aztreonam.',
        regimens: [
          {
            id: 'icu-beta',
            title: 'Rama alergia a betalactámicos',
            lines: [
              'Aztreonam 2 g/8 h.',
              'Y Levofloxacino 500 mg/12 h durante 1-2 días y después 500 mg/24 h.',
            ],
            protocol: 6,
          },
        ],
        notes: [BETA_ALLERGY_NOTE, AZTREONAM_NOTE, OSELTAMIVIR_NOTE],
      }
    : {
        tone: 'amber',
        title: 'NAC hospitalizada · PES < 5 · UCI',
        summary: 'El diagrama permite doble cobertura con macrólido o con quinolona respiratoria.',
        regimens: [
          {
            id: 'icu-standard',
            title: 'Opción estándar',
            lines: ['Ceftriaxona 1-2 g/24 h.', 'Y Azitromicina 500 mg/24 h VO/IV.'],
            protocol: 4,
          },
          {
            id: 'icu-alt',
            title: 'Alternativa con quinolona',
            lines: [
              'Ceftriaxona 2 g/24 h.',
              'Y Levofloxacino 500 mg/12 h durante 1-2 días y después 500 mg/24 h.',
            ],
            protocol: 5,
          },
        ],
        notes: [OSELTAMIVIR_NOTE],
      };
}

function toneClasses(tone: Recommendation['tone']) {
  switch (tone) {
    case 'rose':
      return {
        panel: 'border-[#f0c8cf] bg-[linear-gradient(135deg,#fff7f8,rgba(255,255,255,0.96))]',
        badge: 'border-[#f0c8cf] bg-white/80 text-[#9a4054]',
        glow: 'bg-[#f7d5dc]',
      };
    case 'amber':
      return {
        panel: 'border-[#f0d3aa] bg-[linear-gradient(135deg,#fffaf1,rgba(255,255,255,0.96))]',
        badge: 'border-[#f0d3aa] bg-white/80 text-[#946126]',
        glow: 'bg-[#f6e1bb]',
      };
    case 'violet':
      return {
        panel: 'border-[#dccbea] bg-[linear-gradient(135deg,#faf7ff,rgba(255,255,255,0.96))]',
        badge: 'border-[#dccbea] bg-white/80 text-[#6f4d94]',
        glow: 'bg-[#eadcf5]',
      };
    default:
      return {
        panel: 'border-[#cfe2e6] bg-[linear-gradient(135deg,#f3fbfc,rgba(255,255,255,0.96))]',
        badge: 'border-[#cfe2e6] bg-white/80 text-[#2b5d68]',
        glow: 'bg-[#d9eef1]',
      };
  }
}

function StepButton({
  active,
  disabled,
  label,
  caption,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  caption: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[1.35rem] border p-4 text-left transition ${
        disabled
          ? 'cursor-not-allowed border-slate-200/80 bg-slate-100/60 text-slate-400'
          : active
            ? 'border-[#2b5d68] bg-[linear-gradient(135deg,#f5fbfc,#e6f1f4)] shadow-[0_12px_30px_rgba(43,93,104,0.12)]'
            : 'border-slate-200 bg-white/90 hover:border-[#8fb0b7] hover:shadow-[0_12px_30px_rgba(38,58,66,0.08)]'
      }`}
    >
      <div
        className={`absolute right-0 top-0 h-16 w-16 rounded-full blur-2xl ${
          active ? 'bg-[#d5e8ec]/90' : 'bg-[#eef3f5]'
        }`}
      />
      <div className="relative z-10 space-y-2">
        <div className="text-sm font-semibold text-slate-950">{label}</div>
        <p className={`text-xs leading-5 ${active ? 'text-[#42636b]' : 'text-slate-500'}`}>
          {caption}
        </p>
      </div>
    </button>
  );
}

function PathPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#d7e7ea] bg-white/80 px-3 py-1 text-xs font-medium text-[#416068] shadow-sm">
      {label}
    </span>
  );
}

function RegimenTile({ regimen }: { regimen: RegimenCard }) {
  return (
    <article className="relative overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/90 p-5 shadow-[0_14px_36px_rgba(17,24,39,0.08)]">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-[#edf4f6] blur-3xl" />
      <div className="relative z-10 space-y-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-950">{regimen.title}</h3>
            {regimen.highlight ? (
              <p className="max-w-xl text-xs leading-5 text-[#546e75]">{regimen.highlight}</p>
            ) : null}
          </div>
          {regimen.protocol ? (
            <span className="inline-flex shrink-0 self-start rounded-full border border-[#d7e7ea] bg-[#f4fbfc] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#2b5d68]">
              {protocolLabel(regimen.protocol)}
            </span>
          ) : null}
        </div>

        <ul className="space-y-2 text-sm leading-6 text-slate-700">
          {regimen.lines.map((line) => (
            <li key={`${regimen.id}-${line}`} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5a7f8a]" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function getAddonDisplayTitle(title: string) {
  return title.replace(/^Cobertura añadida ·\s*/, '');
}

export default function AntibioterapiaNacPage() {
  const [setting, setSetting] = useState<SettingId | null>(null);
  const [hostStatus, setHostStatus] = useState<HostId | null>(null);
  const [pesBand, setPesBand] = useState<PesId | null>(null);
  const [unit, setUnit] = useState<UnitId | null>(null);
  const [betaAllergy, setBetaAllergy] = useState<boolean | null>(null);
  const [suspicions, setSuspicions] = useState<SuspicionId[]>([]);

  const recommendation = useMemo(
    () => getRecommendation({ setting, hostStatus, pesBand, unit, betaAllergy }),
    [betaAllergy, hostStatus, pesBand, setting, unit]
  );

  const addonRegimens = useMemo(
    () =>
      hostStatus === 'inmunocomprometido'
        ? suspicions.map((id) => IMMUNOCOMPROMISED_ADDONS[id])
        : [],
    [hostStatus, suspicions]
  );

  const pathSummary = useMemo(() => {
    const items: string[] = [];
    if (setting === 'ambulatorio') items.push('Ambulatorio');
    if (setting === 'hospitalizado') items.push('Hospitalizado');
    if (hostStatus === 'inmunocompetente') items.push('Inmunocompetente');
    if (hostStatus === 'inmunocomprometido') items.push('Inmunocomprometido');
    if (pesBand === 'lt5') items.push('PES < 5');
    if (pesBand === 'gte5') items.push('PES ≥ 5');
    if (unit === 'no-uci') items.push('No UCI');
    if (unit === 'uci') items.push('UCI');
    if (betaAllergy === true) items.push('Alergia a betalactámicos');
    if (betaAllergy === false) items.push('Sin alergia a betalactámicos');
    return items;
  }, [betaAllergy, hostStatus, pesBand, setting, unit]);

  const reportText = useMemo(() => {
    if (!recommendation) return null;

    const lines = ['Antibioterapia empírica NAC'];

    if (pathSummary.length) {
      lines.push(...pathSummary.map((item) => `- ${item}`));
    }

    lines.push('', recommendation.title, recommendation.summary, '', 'Pautas recomendadas:');

    for (const regimen of recommendation.regimens) {
      lines.push(
        `- ${regimen.title}${regimen.protocol ? ` (${protocolLabel(regimen.protocol)})` : ''}`
      );
      for (const line of regimen.lines) {
        lines.push(`  · ${line}`);
      }
      if (regimen.highlight) {
        lines.push(`  · ${regimen.highlight}`);
      }
    }

    if (addonRegimens.length) {
      lines.push('', 'Coberturas adicionales en inmunocomprometido:');
      for (const regimen of addonRegimens) {
        lines.push(
          `- ${regimen.title}${regimen.protocol ? ` (${protocolLabel(regimen.protocol)})` : ''}`
        );
        for (const line of regimen.lines) {
          lines.push(`  · ${line}`);
        }
        if (regimen.highlight) {
          lines.push(`  · ${regimen.highlight}`);
        }
      }
    }

    if (recommendation.notes.length) {
      lines.push('', 'Notas:');
      for (const note of recommendation.notes) {
        lines.push(`- ${note}`);
      }
    }

    return lines.join('\n');
  }, [addonRegimens, pathSummary, recommendation]);

  const reset = () => {
    setSetting(null);
    setHostStatus(null);
    setPesBand(null);
    setUnit(null);
    setBetaAllergy(null);
    setSuspicions([]);
  };

  const pendingSummary = !setting
    ? 'Elige primero si quieres resolver una NAC ambulatoria u hospitalizada.'
    : betaAllergy === null
      ? 'Selecciona si hay alergia a betalactámicos para abrir la rama correcta.'
      : setting === 'hospitalizado' && !hostStatus
        ? 'Define si el paciente es inmunocompetente o inmunocomprometido.'
        : setting === 'hospitalizado' && hostStatus === 'inmunocompetente' && !pesBand
          ? 'Indica el estrato de PES para saber si necesita cobertura ampliada.'
          : setting === 'hospitalizado' &&
              hostStatus === 'inmunocompetente' &&
              pesBand === 'lt5' &&
              !unit
            ? 'Falta decidir si el paciente está en UCI o fuera de UCI.'
            : 'La pauta está lista.';

  const classes = toneClasses(recommendation?.tone ?? 'teal');

  return (
    <main className="space-y-6 px-4 py-5 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(234,247,249,0.94),rgba(255,247,242,0.9),rgba(247,250,255,0.96))] px-6 py-7 shadow-[0_20px_55px_rgba(23,37,48,0.10)] sm:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-[#d6ecef]/90 blur-3xl" />
          <div className="absolute right-0 top-10 h-44 w-44 rounded-full bg-[#f5ddd3]/80 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-[#e3dcf5]/75 blur-3xl" />
          <div className="absolute inset-y-0 right-1/4 w-px bg-[linear-gradient(180deg,transparent,rgba(43,93,104,0.12),transparent)]" />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2b5d68] backdrop-blur">
            Asistente Antibioterapia NAC
          </div>

          <div className="max-w-4xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Antibioterapia empírica NAC
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-[#48636a] sm:text-base">
              Herramienta de ayuda a la decisión clínica para inicio de antibioterapia empírica
              basado en el esquema de antibioterapia del protocolo de{' '}
              <Link
                href="/protocolos/nac"
                className="font-medium text-[#2b5d68] underline decoration-[#d6e7ea] underline-offset-4"
              >
                Neumonía Adquirida en la Comunidad
              </Link>
              . Resuelve la pauta por entorno asistencial, gravedad, alergia a betalactámicos e
              inmunidad del huésped.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-[0_16px_40px_rgba(20,37,45,0.08)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Ruta clínica</p>
                <p className="text-xs leading-5 text-slate-500">
                  Solo aparecen pasos cuando cambian realmente la rama terapéutica.
                </p>
              </div>
              <button className="reset-btn" onClick={reset}>
                Reiniciar herramienta
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    1. Entorno
                  </p>
                  <ScaleModalChips
                    items={SETTING_SUPPORT_SCALES}
                    className="mt-0 ml-auto justify-end"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SETTING_OPTIONS.map((option) => (
                    <StepButton
                      key={option.id}
                      active={setting === option.id}
                      label={option.label}
                      caption={option.caption}
                      onClick={() => {
                        setSetting(option.id);
                        setHostStatus(null);
                        setPesBand(null);
                        setUnit(null);
                        setSuspicions([]);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  2. Betalactámicos
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <StepButton
                    active={betaAllergy === false}
                    disabled={!setting}
                    label="Sin alergia"
                    caption="Mantiene las ramas estándar del algoritmo."
                    onClick={() => setBetaAllergy(false)}
                  />
                  <StepButton
                    active={betaAllergy === true}
                    disabled={!setting}
                    label="Alergia a betalactámicos"
                    caption="Activa las ramas con quinolonas o aztreonam según escenario."
                    onClick={() => setBetaAllergy(true)}
                  />
                </div>
              </div>

              {setting === 'hospitalizado' ? (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      3. Huésped
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {HOST_OPTIONS.map((option) => (
                        <StepButton
                          key={option.id}
                          active={hostStatus === option.id}
                          disabled={betaAllergy === null}
                          label={option.label}
                          caption={option.caption}
                          onClick={() => {
                            setHostStatus(option.id);
                            setPesBand(null);
                            setUnit(null);
                            setSuspicions([]);
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {hostStatus === 'inmunocompetente' ? (
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            4. Riesgo PES
                          </p>
                          <ScaleModalChips
                            items={PES_SUPPORT_SCALES}
                            className="mt-0 ml-auto justify-end"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {PES_OPTIONS.map((option) => (
                            <StepButton
                              key={option.id}
                              active={pesBand === option.id}
                              disabled={!hostStatus}
                              label={option.label}
                              caption={option.caption}
                              onClick={() => {
                                setPesBand(option.id);
                                if (option.id === 'gte5') setUnit(null);
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {pesBand === 'lt5' ? (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            5. Ubicación
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {UNIT_OPTIONS.map((option) => (
                              <StepButton
                                key={option.id}
                                active={unit === option.id}
                                disabled={!pesBand}
                                label={option.label}
                                caption={option.caption}
                                onClick={() => setUnit(option.id)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {hostStatus === 'inmunocomprometido' ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        4. Sospechas añadidas
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {SUSPICION_OPTIONS.map((option) => {
                          const active = suspicions.includes(option.id);
                          return (
                            <StepButton
                              key={option.id}
                              active={active}
                              disabled={!hostStatus}
                              label={option.label}
                              caption={option.caption}
                              onClick={() =>
                                setSuspicions((current) =>
                                  current.includes(option.id)
                                    ? current.filter((item) => item !== option.id)
                                    : [...current, option.id]
                                )
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div>
          <section
            className={`relative overflow-hidden rounded-[1.8rem] border p-5 shadow-[0_18px_42px_rgba(20,37,45,0.08)] ${classes.panel}`}
          >
            <div
              className={`absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl ${classes.glow}`}
            />
            <div className="relative z-10 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${classes.badge}`}
                  >
                    Recomendación actual
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      {recommendation ? recommendation.title : 'Completa la ruta clínica'}
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-[#49636a]">
                      {recommendation ? recommendation.summary : pendingSummary}
                    </p>
                  </div>
                </div>

                {pathSummary.length ? (
                  <div className="flex max-w-xl flex-wrap justify-end gap-2">
                    {pathSummary.map((item) => (
                      <PathPill key={item} label={item} />
                    ))}
                  </div>
                ) : null}
              </div>

              {recommendation ? (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {recommendation.regimens.map((regimen) => (
                      <RegimenTile key={regimen.id} regimen={regimen} />
                    ))}
                  </div>

                  {addonRegimens.length ? (
                    <div className="space-y-3 rounded-[1.4rem] border border-[#dccbea] bg-white/85 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          Coberturas adicionales
                        </p>
                        <p className="text-xs leading-5 text-slate-500">
                          Solo para la rama de inmunocomprometido cuando el patrón radiológico o el
                          defecto inmune orientan la sospecha.
                        </p>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        {addonRegimens.map((regimen) => (
                          <RegimenTile
                            key={regimen.id}
                            regimen={{ ...regimen, title: getAddonDisplayTitle(regimen.title) }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[1.4rem] border border-white/80 bg-white/85 p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-950">Notas prácticas</p>
                    <ul className="space-y-2 text-sm leading-6 text-slate-700">
                      {recommendation.notes.map((note) => (
                        <li key={note} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5a7f8a]" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-[#c8d9de] bg-white/70 p-5 text-sm leading-6 text-slate-600">
                  La herramienta se comporta como árbol de decisión. Según el escenario aparecerán
                  pautas equivalentes o una única rama cerrada cuando el protocolo así lo hace.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      {reportText ? <InformeCopiable texto={reportText} /> : null}
    </main>
  );
}
