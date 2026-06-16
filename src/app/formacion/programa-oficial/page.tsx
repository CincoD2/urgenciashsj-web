import type { Metadata } from 'next';
import Link from 'next/link';
import FormacionProgramaExplorer from '@/components/FormacionProgramaExplorer';
import { muyeProgramData } from '@/lib/muyeProgramData';

const pagePath = '/formacion/programa-oficial';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urgenciashsj.es';
const pageUrl = new URL(pagePath, siteUrl).toString();
const pageTitle = 'POE Urgencias | Programa Oficial de la Especialidad de Urgencias y Emergencias';
const pageDescription =
  'POE urgencias: consulta interactiva del Programa Oficial de la Especialidad de Urgencias y Emergencias (MUYE) con competencias, rotaciones, guardias y formación complementaria.';

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: pagePath,
  },
  keywords: [
    'POE urgencias',
    'POE Urgencias',
    'programa oficial urgencias',
    'programa oficial especialidad urgencias y emergencias',
    'MUYE',
    'BOE urgencias emergencias',
    'rotaciones urgencias',
  ],
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pagePath,
    type: 'article',
    images: ['/logourg.png'],
  },
  twitter: {
    card: 'summary',
    title: pageTitle,
    description: pageDescription,
    images: ['/logourg.png'],
  },
};

function BackToTopLink() {
  return (
    <a
      href="#top"
      className="inline-flex items-center justify-center rounded-full border border-[#d7e4ee] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide !text-[#2b5d68] no-underline shadow-sm transition hover:bg-[#f5fafb] hover:!text-[#2b5d68]"
    >
      Volver arriba
    </a>
  );
}

type TrainingGroupId = 'cursos' | 'talleres' | 'simulacion' | 'complementaria';

type TrainingItem = {
  label: string;
  mentions: number;
  sources: string[];
};

type TrainingGroup = {
  id: TrainingGroupId;
  title: string;
  description: string;
  items: TrainingItem[];
};

type RotationTimelineBlock = {
  id: string;
  label: string;
  title: string;
  totalMonths: number;
  supportText: string;
  notes: string[];
  segments: Array<{
    label: string;
    shortLabel: string;
    detail?: string;
    monthsLabel: string;
    maxMonths: number;
    colorClass: string;
    tintClass: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function normalizeTrainingKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTrainingLabel(value: string) {
  return value
    .replace(/^[●•–-]\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/\.$/, '')
    .trim();
}

function classifyTrainingSegment(value: string): TrainingGroupId | null {
  if (/\bsimulaci(?:o|ó)n|\bsimulacros?\b|\bsimulaciones?\b/i.test(value)) return 'simulacion';
  if (/\btaller(?:es)?\b/i.test(value)) return 'talleres';
  if (/\bcurso(?:s)?\b/i.test(value)) return 'cursos';
  if (/\bformaci(?:o|ó)n\b|\bsesi(?:o|ó)n(?:es)?\b|\bjornadas?\b|\bcongresos?\b/i.test(value)) {
    return 'complementaria';
  }
  return null;
}

function extractTrainingSegments(value: string) {
  return value
    .split(/(?<=\.)\s+|(?=●)|(?=•)|(?=–\s)/)
    .map(cleanTrainingLabel)
    .filter(Boolean)
    .filter((segment) => classifyTrainingSegment(segment) !== null);
}

function getSectionSourceLabel(sectionId: string, competencyCode: string) {
  if (sectionId === 'transversales') return `Transv ${competencyCode}`;
  if (sectionId === 'comunes') return `MFYC ${competencyCode}`;
  return `MUYE ${competencyCode}`;
}

function buildCompetencySourceMap() {
  const sourceMap = new Map<string, string>();

  muyeProgramData.sections.forEach((section) => {
    section.domains.forEach((domain) => {
      domain.competencies.forEach((competency) => {
        sourceMap.set(getSectionSourceLabel(section.id, competency.code), competency.text);
      });
    });
  });

  return sourceMap;
}

function buildTrainingCompendium() {
  const groupMeta: Record<TrainingGroupId, Omit<TrainingGroup, 'items'>> = {
    cursos: {
      id: 'cursos',
      title: 'Cursos',
      description: 'Cursos explícitamente recomendados o incluidos en actividades del programa.',
    },
    talleres: {
      id: 'talleres',
      title: 'Talleres',
      description: 'Talleres prácticos y entrenamiento procedural citados en el POE.',
    },
    simulacion: {
      id: 'simulacion',
      title: 'Simulación',
      description: 'Simulación clínica, simulacros y entrenamiento en escenarios críticos.',
    },
    complementaria: {
      id: 'complementaria',
      title: 'Otra formación complementaria',
      description: 'Sesiones, jornadas y otras actividades formativas recomendadas.',
    },
  };

  const groups = new Map<TrainingGroupId, Map<string, TrainingItem>>();
  (Object.keys(groupMeta) as TrainingGroupId[]).forEach((key) => groups.set(key, new Map()));

  muyeProgramData.sections.forEach((section) => {
    section.domains.forEach((domain) => {
      domain.competencies.forEach((competency) => {
        const sourceTag = getSectionSourceLabel(section.id, competency.code);

        [competency.activity, competency.recommendations].forEach((text) => {
          if (!text) return;

          extractTrainingSegments(text).forEach((segment) => {
            const groupId = classifyTrainingSegment(segment);
            if (!groupId) return;

            const key = normalizeTrainingKey(segment);
            const group = groups.get(groupId);
            if (!group) return;

            const existing = group.get(key) ?? {
              label: segment,
              mentions: 0,
              sources: [],
            };

            existing.mentions += 1;
            if (!existing.sources.includes(sourceTag)) existing.sources.push(sourceTag);
            group.set(key, existing);
          });
        });
      });
    });
  });

  return (Object.keys(groupMeta) as TrainingGroupId[])
    .map((id) => ({
      ...groupMeta[id],
      items: Array.from(groups.get(id)?.values() ?? []).sort((a, b) => {
        return b.mentions - a.mentions || a.label.localeCompare(b.label, 'es');
      }),
    }))
    .filter((group) => group.items.length > 0);
}

const totalCompetencies = muyeProgramData.sections.reduce(
  (total, section) =>
    total +
    section.domains.reduce((sectionTotal, domain) => sectionTotal + domain.competencies.length, 0),
  0
);

const totalDomains = muyeProgramData.sections.reduce(
  (total, section) => total + section.domains.length,
  0
);

const guardias = muyeProgramData.rotations.guardias.filter(
  (item) => item !== 'Atención continuada (guardias):'
);

const trainingCompendium = buildTrainingCompendium();
const competencySourceMap = buildCompetencySourceMap();
const rotationTimeline: RotationTimelineBlock[] = [
  {
    id: 'r1-r2',
    label: 'R1-R2',
    title: 'Periodo común y base asistencial',
    totalMonths: 24,
    supportText:
      'Representación orientativa del bloque inicial. Para hacer visible la carga relativa de cada rotatorio se usa el extremo alto de cada rango.',
    notes: [
      'Bloque común con MFYC en los dos primeros años.',
      'La secuencia concreta es flexible y depende de la organización de la unidad docente.',
    ],
    segments: [
      {
        label: 'Urgencias hospitalarias generales y específicas',
        shortLabel: 'Urgencias hospitalarias',
        detail: 'CGD · GIN · OFT · ORL · PED · PSQ · COT · URO',
        monthsLabel: '12-14 m',
        maxMonths: 14,
        colorClass: 'from-[#2b5d68] to-[#3d7684]',
        tintClass: 'bg-[#eef6f8] text-[#2b5d68]',
      },
      {
        label: 'Radiodiagnóstico y especialidades clínicas',
        shortLabel: 'Radiodiag. y clínicas',
        detail: 'MIN · DIG · CAR · NFR · NML · NRL',
        monthsLabel: '5-6 m',
        maxMonths: 6,
        colorClass: 'from-[#3c6f65] to-[#5f9488]',
        tintClass: 'bg-[#edf7f3] text-[#3c6f65]',
      },
      {
        label: 'Atención primaria',
        shortLabel: 'Atención primaria',
        monthsLabel: '2 m',
        maxMonths: 2,
        colorClass: 'from-[#6b5a82] to-[#8b7aa5]',
        tintClass: 'bg-[#f4f0f8] text-[#6b5a82]',
      },
      {
        label: 'Emergencias extrahospitalarias (SEM)',
        shortLabel: 'SEM',
        monthsLabel: '1-2 m',
        maxMonths: 2,
        colorClass: 'from-[#9b5c39] to-[#c27a55]',
        tintClass: 'bg-[#fbf1ea] text-[#8b5436]',
      },
    ],
  },
  {
    id: 'r3-r4',
    label: 'R3-R4',
    title: 'Consolidación específica avanzada',
    totalMonths: 24,
    supportText:
      'Bloque final con mayor peso en urgencias hospitalarias, emergencias extrahospitalarias y áreas críticas.',
    notes: [
      'La estancia optativa se recomienda en el segundo o tercer trimestre de R4.',
      'Anestesia, reanimación y medicina intensiva suelen concentrarse en el tercer año.',
    ],
    segments: [
      {
        label: 'Urgencias hospitalarias generales (HRD + HD)',
        shortLabel: 'Urgencias hospitalarias',
        monthsLabel: '10-12 m',
        maxMonths: 12,
        colorClass: 'from-[#2b5d68] to-[#3d7684]',
        tintClass: 'bg-[#eef6f8] text-[#2b5d68]',
      },
      {
        label: 'Emergencias extrahospitalarias (SEM en UME y CCUE)',
        shortLabel: 'SEM / UME / CCUE',
        monthsLabel: '5-6 m',
        maxMonths: 6,
        colorClass: 'from-[#9b5c39] to-[#c27a55]',
        tintClass: 'bg-[#fbf1ea] text-[#8b5436]',
      },
      {
        label: 'Anestesia, reanimación y medicina intensiva',
        shortLabel: 'Anestesia / UCI',
        monthsLabel: '3-4 m',
        maxMonths: 4,
        colorClass: 'from-[#6b5a82] to-[#8b7aa5]',
        tintClass: 'bg-[#f4f0f8] text-[#6b5a82]',
      },
      {
        label: 'Estancia formativa de libre elección',
        shortLabel: 'Libre elección',
        monthsLabel: '2 m',
        maxMonths: 2,
        colorClass: 'from-[#3c6f65] to-[#5f9488]',
        tintClass: 'bg-[#edf7f3] text-[#3c6f65]',
      },
    ],
  },
];
const totalTrainingItems = trainingCompendium.reduce(
  (total, group) => total + group.items.length,
  0
);
const heroActionButtonClass =
  'inline-flex items-center justify-center rounded-full border border-white/75 bg-white/80 px-4 py-2 text-sm font-medium !text-[#2b5d68] no-underline shadow-sm transition hover:border-[#2b5d68] hover:bg-[#2b5d68] hover:!text-white';

export default function ProgramaOficialPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    description: pageDescription,
    url: pageUrl,
    inLanguage: 'es',
    about: [
      { '@type': 'Thing', name: 'POE urgencias' },
      { '@type': 'Thing', name: 'Programa Oficial de la Especialidad de Urgencias y Emergencias' },
      { '@type': 'Thing', name: 'Medicina de Urgencias y Emergencias' },
    ],
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Formación',
          item: new URL('/formacion', siteUrl).toString(),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'POE Urgencias',
          item: pageUrl,
        },
      ],
    },
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <section
        id="top"
        className="scroll-mt-28 relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(238,246,248,0.96),rgba(255,255,255,0.92))] px-6 py-8 shadow-[0_18px_48px_rgba(20,37,45,0.10)] sm:px-8"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.12]"
            style={{ backgroundImage: 'url(/urg-background.png)' }}
          />
          <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-[#cfe2e6]/65 blur-3xl" />
          <div className="absolute right-0 top-12 h-44 w-44 rounded-full bg-[#dce9f3]/70 blur-3xl" />
        </div>

        <div className="relative z-10 space-y-5">
          <Link
            href="/formacion"
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2b5d68] backdrop-blur hover:bg-white"
          >
            ← Volver a Formación
          </Link>

          <div className="max-w-4xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2b5d68]">
              POE Urgencias · BOE · {muyeProgramData.meta.order}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Programa Oficial de la Especialidad de Urgencias y Emergencias
            </h1>
            <div className="max-w-3xl space-y-3 text-sm leading-6 text-[#48636a] sm:text-base">
              <p>
                Si buscas el POE de urgencias, esta página reúne en formato navegable el Programa
                Oficial de la Especialidad de Urgencias y Emergencias publicado en el BOE. Permite
                recorrer competencias, actividades formativas, rotaciones y guardias sin leer el
                documento completo.
              </p>
              <p>
                El POE se organiza en tres bloques: competencias transversales, comunes con MFYC y
                específicas de MUYE. Cada bloque se divide en dominios que puedes filtrar y
                desplegar.
              </p>
              <p>
                Cada competencia muestra, cuando existe, la actividad formativa, el contexto de
                aprendizaje, las recomendaciones y los instrumentos de evaluación. Más abajo
                encontrarás también el compendio formativo, las rotaciones y las guardias.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={muyeProgramData.meta.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className={heroActionButtonClass}
            >
              PDF del POE
            </a>
            <a
              href={muyeProgramData.meta.eliUrl}
              target="_blank"
              rel="noreferrer"
              className={heroActionButtonClass}
            >
              Web del BOE
            </a>
            <a href="#explorador" className={heroActionButtonClass}>
              Explorar programa
            </a>
            <a href="#formacion-complementaria" className={heroActionButtonClass}>
              Formación complementaria
            </a>
            <a href="#rotaciones" className={heroActionButtonClass}>
              Itinerario formativo
            </a>
            <a href="#guardias" className={heroActionButtonClass}>
              Guardias
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-[1.5rem] border border-[#d1e6df] bg-[#edf7f3] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#3c6f65]">
            Publicación
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {formatDate(muyeProgramData.meta.publicationDate)}
          </p>
          <p className="mt-1 text-sm text-[#58736b]">
            Vigente desde el {formatDate(muyeProgramData.meta.effectiveDate)}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-[#cfe2e6] bg-[#eef6f8] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
            Duración oficial
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {muyeProgramData.meta.duration}
          </p>
          <p className="mt-1 text-sm text-[#577178]">44 meses de formación efectiva</p>
        </div>
        <div className="rounded-[1.5rem] border border-[#e0d9eb] bg-[#f4f0f8] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5a82]">Estructura</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">R1-R2 y R3-R4</p>
          <p className="mt-1 text-sm text-[#6b617b]">
            Bloque común inicial y consolidación específica avanzada
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-[#d7e4ee] bg-[#eef3f8] p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#385f7a]">
            Competencias
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{totalCompetencies}</p>
          <p className="mt-1 text-sm text-[#5a7080]">{totalDomains} dominios navegables</p>
        </div>
      </section>

      <section id="explorador" className="scroll-mt-28 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2b5d68]">
              Navegación por competencias
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">Explorador del programa</h2>
          </div>
          <BackToTopLink />
        </div>
        <FormacionProgramaExplorer
          sections={muyeProgramData.sections}
          evaluationInstruments={muyeProgramData.meta.evaluationInstruments}
        />
      </section>

      <section id="formacion-complementaria" className="scroll-mt-28 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2b5d68]">
              Formación Complementaria Recomendada
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">
              Cursos, talleres y formación complementaria del POE
            </h2>
          </div>
          <BackToTopLink />
        </div>

        <div className="rounded-[1.5rem] border border-[#d7e4ee] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-3xl text-sm leading-6 text-[#48636a]">
              Compendio extraído de las actividades formativas y recomendaciones del programa
              oficial. Agrupa las menciones a cursos, talleres, simulación y otras actividades
              complementarias para facilitar la planificación del itinerario formativo.
            </p>
            <span className="rounded-full bg-[#eef6f8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
              {totalTrainingItems} referencias agrupadas
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {trainingCompendium.map((group, index) => (
            <details
              key={group.id}
              open={index === 0}
              className="group rounded-[1.5rem] border border-[#d7e4ee] bg-white p-5 shadow-sm open:border-[#c4dbe1]"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 border-b border-[#ecf3f5] pb-4">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d7e4ee] bg-[#f7fbfc] text-[#5d767d] transition group-open:rotate-90 group-open:border-[#b7d3da] group-open:bg-[#eef6f8] group-open:text-[#2b5d68]">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="m8 6 4 4-4 4" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">{group.title}</h3>
                    <span className="rounded-full bg-[#eef6f8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      {group.items.length}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#5d767d]">{group.description}</p>
                </div>
              </summary>

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {group.items.map((item) => (
                  <div
                    key={`${group.id}-${item.label}`}
                    className="rounded-2xl border border-[#ecf3f5] bg-[#fbfdfe] p-4"
                  >
                    <p className="text-sm font-medium leading-6 text-slate-900">{item.label}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#d7e4ee] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#5d767d]">
                        {item.mentions} menciones
                      </span>
                      {item.sources.slice(0, 6).map((source) => (
                        <span
                          key={`${item.label}-${source}`}
                          title={competencySourceMap.get(source) ?? source}
                          className="cursor-help rounded-full bg-[#eef6f8] px-2.5 py-1 text-[11px] font-medium text-[#2b5d68]"
                        >
                          {source}
                        </span>
                      ))}
                      {item.sources.length > 6 ? (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#5d767d]">
                          +{item.sources.length - 6} más
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section id="rotaciones" className="scroll-mt-28 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2b5d68]">
              Itinerario formativo
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">Rotaciones y estancias</h2>
          </div>
          <BackToTopLink />
        </div>

        <div className="rounded-[1.5rem] border border-[#d7e4ee] bg-white p-6 shadow-sm">
          <div className="space-y-3 text-sm leading-6 text-[#48636a]">
            {muyeProgramData.rotations.intro.slice(0, 3).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[#d7e4ee] bg-[linear-gradient(180deg,#ffffff,#f8fbfc)] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2b5d68]">
                Cronograma orientativo
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                Distribución visual de los rotatorios por bloque
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#5d767d]">
                Lectura rápida de R1-R2 y R3-R4 basada en la tabla del POE. La banda usa la duración
                alta de cada rango para ofrecer una referencia visual clara sin sustituir la
                flexibilidad real del itinerario.
              </p>
            </div>
            <div className="rounded-2xl border border-[#ecf3f5] bg-white px-4 py-3 text-sm text-[#5d767d] shadow-sm">
              24 meses por bloque
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {rotationTimeline.map((block) => (
              <section
                key={block.id}
                className="rounded-[1.5rem] border border-[#e5eef1] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2b5d68]">
                      {block.label}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-950">{block.title}</h4>
                  </div>
                  <span className="rounded-full bg-[#eef6f8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    {block.totalMonths} meses
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#5d767d]">{block.supportText}</p>

                <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[#dfe9eb] bg-[#f8fbfc] p-3">
                  <div
                    className="hidden md:grid"
                    style={{ gridTemplateColumns: `repeat(${block.totalMonths}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: block.totalMonths }, (_, index) => (
                      <div
                        key={`${block.id}-month-${index + 1}`}
                        className="border-r border-[#e7eef0] px-1 pb-2 text-center last:border-r-0"
                      >
                        <span className="text-[10px] font-medium text-[#8aa0a6]">{index + 1}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex overflow-hidden rounded-xl border border-white/70 bg-white">
                    {block.segments.map((segment) => (
                      <div
                        key={`${block.id}-${segment.label}`}
                        className={`flex min-h-24 flex-col justify-between border-r border-white/50 bg-gradient-to-br px-3 py-3 text-white last:border-r-0 ${segment.colorClass}`}
                        style={{ width: `${(segment.maxMonths / block.totalMonths) * 100}%` }}
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                            {segment.monthsLabel}
                          </p>
                          <p className="mt-1 text-sm font-semibold leading-5">
                            {segment.shortLabel}
                          </p>
                          {segment.detail ? (
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white/80">
                              {segment.detail}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-[11px] leading-4 text-white/80">{segment.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {block.segments.map((segment) => (
                      <div
                        key={`${block.id}-${segment.shortLabel}-legend`}
                        className="rounded-2xl border border-[#ecf3f5] bg-[#fbfdfe] p-3"
                      >
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${segment.tintClass}`}
                        >
                          {segment.monthsLabel}
                        </span>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {segment.shortLabel}
                        </p>
                        {segment.detail ? (
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#5d767d]">
                            {segment.detail}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs leading-5 text-[#5d767d]">{segment.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-[#ecf3f5] bg-[#fbfdfe] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#516f75]">
                      Claves del bloque
                    </p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-[#48636a]">
                      {block.notes.map((note) => (
                        <li key={`${block.id}-${note}`}>{note}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {muyeProgramData.rotations.periods.map((period) => (
            <section
              key={period.yearRange}
              className="rounded-[1.5rem] border border-[#d7e4ee] bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-950">{period.yearRange}</h3>
                <span className="rounded-full bg-[#eef6f8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                  Rotaciones
                </span>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#516f75]">
                    Servicios y tiempos
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[#48636a]">
                    {period.services.map((service) => (
                      <li
                        key={service}
                        className="rounded-2xl border border-[#ecf3f5] bg-[#fbfdfe] px-4 py-3"
                      >
                        {service.replace(/^–\s*/, '')}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#516f75]">
                    Observaciones
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[#48636a]">
                    {period.observations.length > 0 ? (
                      period.observations.map((note) => (
                        <li
                          key={note}
                          className="rounded-2xl border border-[#ecf3f5] bg-[#fbfdfe] px-4 py-3"
                        >
                          {note.replace(/^–\s*/, '')}
                        </li>
                      ))
                    ) : (
                      <li className="rounded-2xl border border-[#ecf3f5] bg-[#fbfdfe] px-4 py-3">
                        Sin observaciones específicas adicionales en la tabla para este bloque.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="rounded-[1.5rem] border border-[#cfe2e6] bg-[#eef6f8] p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2b5d68]">
            Notas del programa
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#48636a]">
            {muyeProgramData.rotations.footnotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="guardias" className="scroll-mt-28 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2b5d68]">
              Atención continuada
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">Guardias</h2>
          </div>
          <BackToTopLink />
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="rounded-[1.5rem] border border-[#e0d9eb] bg-[#f4f0f8] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5a82]">
              Referencia orientativa
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">4-5</p>
            <p className="mt-1 text-sm leading-6 text-[#6b617b]">
              guardias al mes, sin perjuicio de la normativa vigente aplicable.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#d7e4ee] bg-white p-6 shadow-sm">
            <ul className="space-y-3 text-sm leading-6 text-[#48636a]">
              {guardias.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-[#ecf3f5] bg-[#fbfdfe] px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
