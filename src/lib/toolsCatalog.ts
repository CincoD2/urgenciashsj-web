import { getScaleMetaBySlug } from '@/lib/escalasMeta';

export type ToolCategoryId =
  | 'orion'
  | 'triaje'
  | 'respiratorio'
  | 'infecciosas'
  | 'metabolismo'
  | 'neurologia'
  | 'cardiologia'
  | 'digestivo'
  | 'vascular'
  | 'endocrinologia'
  | 'farmacia'
  | 'toxicologia';

export type ToolCategory = {
  id: ToolCategoryId;
  label: string;
  description: string;
  accent: string;
  softAccent: string;
};

export type ToolCatalogItem = {
  id: string;
  title: string;
  href: string;
  summary: string;
  tags: string[];
  category: ToolCategoryId;
  secondaryCategories: ToolCategoryId[];
  featured: boolean;
  badge?: string;
  searchText: string;
};

type ToolDefinition = {
  slug?: string;
  href?: string;
  title?: string;
  summary?: string;
  tags?: string[];
  category: ToolCategoryId;
  secondaryCategories?: ToolCategoryId[];
  featured?: boolean;
  badge?: string;
};

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'orion',
    label: 'Orion Clinic',
    description: 'Automatización y limpieza de texto clínico para ahorrar pasos repetitivos.',
    accent: 'text-[#275966]',
    softAccent: 'bg-[#e8f4f6]',
  },
  {
    id: 'triaje',
    label: 'Triaje',
    description: 'Herramientas de clasificación inicial y priorización asistencial en urgencias.',
    accent: 'text-[#24526a]',
    softAccent: 'bg-[#eaf4fb]',
  },
  {
    id: 'respiratorio',
    label: 'Respiratorio',
    description: 'Oxigenación, neumonía, inhaladores y soporte respiratorio inicial.',
    accent: 'text-[#2e655b]',
    softAccent: 'bg-[#ecf7f2]',
  },
  {
    id: 'infecciosas',
    label: 'Infecciosas',
    description: 'Sepsis, antibioterapia y escalas de gravedad del paciente infectado.',
    accent: 'text-[#8a4b26]',
    softAccent: 'bg-[#fff2e8]',
  },
  {
    id: 'metabolismo',
    label: 'Metabolismo y electrolitos',
    description: 'Alteraciones del sodio, equilibrio ácido-base y conversiones útiles.',
    accent: 'text-[#7b4e1d]',
    softAccent: 'bg-[#fff5e7]',
  },
  {
    id: 'neurologia',
    label: 'Neurología',
    description: 'Valoración neurológica rápida, ictus y nivel de consciencia.',
    accent: 'text-[#5c558a]',
    softAccent: 'bg-[#f1effa]',
  },
  {
    id: 'cardiologia',
    label: 'Cardiología',
    description: 'Riesgo trombótico, sangrado y valoración hemodinámica práctica.',
    accent: 'text-[#7d3045]',
    softAccent: 'bg-[#faedf1]',
  },
  {
    id: 'digestivo',
    label: 'Digestivo',
    description: 'Pancreatitis y hemorragia digestiva con herramientas de decisión rápida.',
    accent: 'text-[#6d5b2d]',
    softAccent: 'bg-[#f8f5e8]',
  },
  {
    id: 'vascular',
    label: 'Vascular',
    description: 'Estratificación de riesgo tromboembólico venoso en contexto clínico.',
    accent: 'text-[#325a73]',
    softAccent: 'bg-[#edf5fa]',
  },
  {
    id: 'endocrinologia',
    label: 'Endocrinología',
    description: 'Apoyo al ajuste inicial de tratamiento insulínico al ingreso.',
    accent: 'text-[#876634]',
    softAccent: 'bg-[#fbf3e6]',
  },
  {
    id: 'farmacia',
    label: 'Farmacia',
    description: 'Preparación de perfusiones y diluciones con acceso directo a mezclas.',
    accent: 'text-[#2f6072]',
    softAccent: 'bg-[#ebf5f8]',
  },
  {
    id: 'toxicologia',
    label: 'Toxicología',
    description: 'Cálculos rápidos relacionados con consumo de alcohol y carga etílica.',
    accent: 'text-[#5d5c2d]',
    softAccent: 'bg-[#f5f6e9]',
  },
];

const TOOL_DEFINITIONS: ToolDefinition[] = [
  { slug: 'OrionSF', category: 'orion', featured: true },
  {
    slug: 'triaje-manchester',
    category: 'triaje',
    featured: true,
    badge: 'Nuevo',
  },

  {
    href: '/inhaladores',
    title: 'Inhaladores',
    summary:
      'Guía visual de dispositivos inhalados con apoyo práctico para seleccionar, revisar y explicar la técnica.',
    tags: ['respiratorio', 'dispositivos', 'educación'],
    category: 'respiratorio',
    featured: true,
    badge: 'Guía visual',
  },
  {
    slug: 'antibioterapia-nac',
    category: 'respiratorio',
    secondaryCategories: ['infecciosas'],
    featured: true,
  },
  { slug: 'curb65', category: 'respiratorio' },
  { slug: 'psi', category: 'respiratorio' },
  { slug: 'pes', category: 'respiratorio' },
  { slug: 'gradiente-aa-o2', category: 'respiratorio' },
  { slug: 'pafi', category: 'respiratorio' },
  { slug: 'safi', category: 'respiratorio' },

  { slug: 'antibioterapia-codigo-sepsis', category: 'infecciosas', featured: true },
  { slug: 'idsa', category: 'infecciosas' },
  { slug: 'sofa', category: 'infecciosas' },
  { slug: 'qsofa', category: 'infecciosas' },
  { slug: 'sirs', category: 'infecciosas' },
  { slug: 'news-2', category: 'infecciosas' },

  { slug: 'anion-gap', category: 'metabolismo' },
  { slug: 'hiperNa', category: 'metabolismo' },
  { slug: 'hipopotasemia', category: 'metabolismo' },
  { slug: 'hiponatremia', category: 'metabolismo' },
  { slug: 'urea-bun', category: 'metabolismo' },

  { slug: 'glasgow', category: 'neurologia' },
  { slug: 'nihss', category: 'neurologia' },
  { slug: 'mrs', category: 'neurologia' },

  { slug: 'cha2ds2va', category: 'cardiologia' },
  { slug: 'hasbled', category: 'cardiologia' },
  { slug: 'timi-scacest', category: 'cardiologia' },
  { slug: 'timi-scasest', category: 'cardiologia' },
  { slug: 'tam', category: 'cardiologia' },

  { slug: 'bisap', category: 'digestivo' },
  { slug: 'blatchford', category: 'digestivo' },
  { slug: 'waterfall', category: 'digestivo' },

  { slug: 'wells-tvp', category: 'vascular' },
  { slug: 'padua', category: 'vascular' },

  { slug: 'insulinizacion', category: 'endocrinologia' },

  { slug: 'standycalc', category: 'farmacia', featured: true, badge: 'Beta' },

  { slug: 'ube', category: 'toxicologia' },
];

function resolveTool(definition: ToolDefinition): ToolCatalogItem {
  const meta = definition.slug ? getScaleMetaBySlug(definition.slug) : null;
  const href = definition.href ?? `/escalas/${definition.slug}`;
  const title = definition.title ?? meta?.title ?? definition.slug ?? href;
  const summary = definition.summary ?? meta?.summary ?? 'Herramienta clínica';
  const tags = Array.from(new Set([...(meta?.tags ?? []), ...(definition.tags ?? [])]));

  return {
    id: definition.slug ?? href,
    title,
    href,
    summary,
    tags,
    category: definition.category,
    secondaryCategories: definition.secondaryCategories ?? [],
    featured: definition.featured ?? false,
    badge: definition.badge,
    searchText: [
      title,
      summary,
      ...tags,
      definition.category,
      ...(definition.secondaryCategories ?? []),
    ]
      .join(' ')
      .toLowerCase(),
  };
}

export const TOOLS_CATALOG: ToolCatalogItem[] = TOOL_DEFINITIONS.map(resolveTool);

export const FEATURED_TOOLS = TOOLS_CATALOG.filter((tool) => tool.featured);

export function getCategoryById(categoryId: ToolCategoryId) {
  return TOOL_CATEGORIES.find((category) => category.id === categoryId) ?? null;
}

export function toolBelongsToCategory(tool: ToolCatalogItem, categoryId: ToolCategoryId) {
  return tool.category === categoryId || tool.secondaryCategories.includes(categoryId);
}
