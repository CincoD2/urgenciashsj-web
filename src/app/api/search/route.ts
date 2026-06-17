import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

import { getScaleMetaBySlug } from '@/lib/escalasMeta';
import { getHomeSearchEntries } from '@/lib/homeContent';
import { HORARIOS, MONTHS, MONTH_ALIASES, MONTH_LABELS } from '@/lib/horariosData';

type SearchItem = {
  type:
    | 'page'
    | 'protocolo'
    | 'dieta'
    | 'sesion'
    | 'herramienta'
    | 'formacion'
    | 'horario'
    | 'novedad';
  title: string;
  url: string;
  content: string;
  snippet?: string;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tokenize(text: string) {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

function maxAllowedDistance(term: string) {
  if (term.length <= 4) return 1;
  if (term.length <= 8) return 2;
  return 3;
}

function levenshteinWithin(a: string, b: string, maxDistance: number) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDistance) return null;

  const previous = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) previous[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    let current = i;
    let rowMin = current;
    let diagonal = i - 1;

    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      const next = Math.min(
        previous[j] + 1,
        current + 1,
        diagonal + substitutionCost
      );

      diagonal = above;
      previous[j] = current = next;
      if (next < rowMin) rowMin = next;
    }

    if (rowMin > maxDistance) return null;
  }

  return previous[b.length] <= maxDistance ? previous[b.length] : null;
}

function tokenMatchScore(queryToken: string, candidateToken: string) {
  if (queryToken === candidateToken) return 1;
  if (candidateToken.includes(queryToken)) return 0.92;

  const distance = levenshteinWithin(queryToken, candidateToken, maxAllowedDistance(queryToken));
  if (distance === null) return 0;

  if (distance === 1) return 0.82;
  if (distance === 2) return 0.7;
  return 0.6;
}

function buildCandidateTokens(item: SearchItem) {
  const source = `${item.title} ${item.snippet ?? ''} ${item.content.slice(0, 900)}`;
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const token of tokenize(source)) {
    if (seen.has(token)) continue;
    seen.add(token);
    tokens.push(token);
    if (tokens.length >= 90) break;
  }

  return tokens;
}

function fuzzyMatchScore(item: SearchItem, rawQuery: string) {
  const queryTokens = tokenize(rawQuery);
  if (queryTokens.length === 0) return null;

  const titleTokens = tokenize(item.title);
  const candidateTokens = buildCandidateTokens(item);
  let totalScore = 0;

  for (const queryToken of queryTokens) {
    let bestScore = 0;

    for (const token of candidateTokens) {
      const score = tokenMatchScore(queryToken, token);
      if (score > bestScore) bestScore = score;
      if (bestScore === 1) break;
    }

    if (bestScore < 0.7) return null;
    totalScore += bestScore;
  }

  const titleBonus = queryTokens.some((token) => titleTokens.includes(token)) ? 0.08 : 0;
  return totalScore / queryTokens.length + titleBonus;
}

const STANDY_STANDARD_DRUGS = [
  'AMIODARONA',
  'NALOXONA',
  'DOBUTAMINA',
  'NIMODIPINO',
  'DOPAMINA',
  'NITROGLICERINA',
  'FLECAINIDA',
  'NITROPRUSIATO',
  'FLUMAZENILO',
  'OCTREOTIDO',
  'FUROSEMIDA',
  'SODIO HIPERTONICO',
  'HEPARINA',
  'SOMATOSTATINA',
  'LABETALOL',
  'TEOFILINA',
  'MAGNESIO SULFATO',
  'VALPROICO',
  'MORFINA',
  'VERNAKALANT',
  'N-ACETILCISTEINA',
];

const STANDY_RESTRICTED_DRUGS = [
  'CISATRACURIO',
  'ESMOLOL',
  'FUROSEMIDA CONC',
  'LEVOSIMENDAN',
  'MIDAZOLAM',
  'NORADRENALINA',
  'PROCAINAMIDA',
  'SALBUTAMOL',
  'URAPIDIL',
];

const STANDY_ALL_DRUGS = [...STANDY_STANDARD_DRUGS, ...STANDY_RESTRICTED_DRUGS];

const TOOL_METADATA_BY_ROUTE: Record<string, { title?: string; extraContent?: string }> = {
  '/escalas/antibioterapia-nac': {
    title: 'Antibioterapia Empírica NAC',
    extraContent:
      'nac neumonia neumonía comunidad antibiotico antibioticos antibioterapia cipam amoxicilina amoxicilina clavulanico clavulánico cefditoreno levofloxacino moxifloxacino ceftriaxona azitromicina doxiciclina aztreonam meropenem linezolid aspergillus jirovecii cmv oseltamivir betalactamicos betalactámicos pes uci hospitalizado ambulatorio',
  },
  '/escalas/standycalc': {
    title: 'STANDyCALC®',
    extraContent:
      'standycalc perfusion perfusiones dilucion diluciones farmacia farmacos fármacos mezclas infusion infusiones ' +
      'amiodarona naloxona dobutamina nimodipino dopamina nitroglicerina flecainida nitroprusiato flumazenilo ' +
      'octreotido furosemida sodio hipertonico heparina somatostatina labetalol teofilina magnesio sulfato ' +
      'valproico morfina vernakalant n-acetilcisteina',
  },
  '/escalas/blatchford': {
    title: 'Glasgow-Blatchford Bleeding Score',
    extraContent:
      'blatchford glasgow-blatchford gbs hda hemorragia digestiva hemorragia digestiva alta melenas melena sangrado ulcera úlcera hematemesis bun urea endoscopia gastroscopia EDA',
  },
  '/escalas/antibioterapia-codigo-sepsis': {
    title: 'Antibioterapia Empírica Código Sepsis',
    extraContent:
      'antibioterapia antibiotico antibioticos antibiototerapia sepsis codigo sepsis bmr shock septico vancomicina linezolid meropenem aztreonam amikacina piperacilina tazobactam ceftriaxona foco respiratorio abdominal urologico urológico ppb snc intravascular',
  },
  '/escalas/cha2ds2va': {
    title: 'CHA2DS2-VA',
    extraContent:
      'chads chadsva chads-vasc cha2ds2va fibrilacion auricular anticoagulacion riesgo ictus trombo embolismo',
  },
  '/escalas/curb65': {
    title: 'CURB-65',
    extraContent: 'curb curb65 curb-65 neumonia gravedad uci mortalidad',
  },
  '/escalas/mrs': {
    title: 'Rankin modificada (mRS)',
    extraContent:
      'rankin mrs escala rankin modificada discapacidad funcional autonomia autonomía dependencia rehabilitacion rehabilitación ictus ait clasificacion ordinal clasificación ordinal infarto hemorragia hsa subdural',
  },
  '/escalas/news-2': {
    title: 'NEWS-2',
    extraContent: 'news2 news-2 sepsis codigo sepsis alerta temprana deterioro clinico qsofa',
  },
  '/escalas/padua': {
    title: 'Padua (TEV)',
    extraContent:
      'padua padua score riesgo tromboembolico riesgo tromboembólico profilaxis farmacologica profilaxis farmacológica hospitalizacion medica hospitalización médica movilidad reducida cancer activo cáncer activo trombofilia tev tromboembolismo venoso',
  },
  '/escalas/qsofa': {
    title: 'qSOFA',
    extraContent:
      'qsofa quick sofa sofa sepsis codigo sepsis alerta temprana deterioro clinico news2 news-2',
  },
  '/escalas/sofa': {
    title: 'SOFA',
    extraContent: 'sofa sepsis fallo organico disfuncion organica mortalidad',
  },
  '/escalas/tam': {
    title: 'TAm (PAM)',
  },
  '/escalas/timi-scacest': {
    title: 'TIMI SCACEST',
    extraContent: 'timi scacest sindrome coronario agudo con elevacion segmento st riesgo mortalidad',
  },
  '/escalas/timi-scasest': {
    title: 'TIMI SCASEST',
  },
  '/escalas/ube': {
    title: 'Unidades de Bebida Estándar (UBE)',
    extraContent:
      'ube unidades bebida estandar estándar alcohol acohol etanol etanolemia alcoholemia alcoholismo enolismo ebriedad borrachera intoxicacion etilica intoxicación etílica intoxicacion alcoholica intoxicación alcohólica gramos alcohol calorias calorías bebida bebida alcoholica bebida alcohólica copas consumo alcohol consumo de alcohol cerveza vino vino blanco vino tinto vermut whisky wisky vodka ron tequila ginebra brandy pacharan baileys absenta toxicologia toxicología',
  },
  '/escalas/wells-tvp': {
    title: 'Wells – TVP',
    extraContent: 'wells tvp trombosis venosa profunda riesgo tromboembolismo venoso profundo etev tvs',
  },
  '/escalas/idsa': {
    title: 'IDSA/ATS',
    extraContent: 'idsa/ats idsa ats neumonia gravedad uci mortalidad',
  },
  '/escalas/hipopotasemia': {
    title: 'Hipopotasemia',
    extraContent:
      'hipopotasemia hipokaliemia hipokalemia potasio bajo cloruro potasico cloruro potásico kcl potasion bio k aspartico k urinario perdidas renales perdidas extrarrenales diarrea vomitos diureticos hiperaldosteronismo digoxina ecg onda u',
  },
  '/escalas/pes': {
    title: 'PES Score',
    extraContent:
      'pes pes score escala pes neumonia neumonía nac neumonia adquirida en la comunidad pseudomonas blee sarm mrsa multirresistentes antibioticos cobertura ampliada pseudomonas aeruginosa enterobacterias pseudomonas enterobacterias resistente resistencia',
  },
  '/escalas/OrionSF': {
    title: 'Orion Smart Formatter',
    extraContent:
      'orion orionsf orion sf orion smart formatter smart formatter formatter orion unificado analitica analítica analiticas analíticas laboratorio labs lab gestlab resultados peticion petición bioquimica bioquímica hemograma coagulación coagulación gasometria gasometría tratamiento tratamientos medicacion medicación sia depurador depurador sia depurador tratamientos sia antiguo depurador formateo analitica orion formateo analítica orion antiguo formateador analitica formatter analiticas pegar texto copiar pegar formatear formateo parser pegado pruebas complementarias',
  },
};

const REDIRECTED_TOOL_ROUTES = new Set([
  '/escalas/depuradorTtos',
  '/escalas/formateo-analitica-orion',
]);

function slugToTitle(slug: string) {
  const normalized = slug
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
  if (!normalized) return slug;
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => {
      if (/^[A-Z0-9-]+$/.test(part)) return part;
      return part[0]?.toUpperCase() + part.slice(1);
    })
    .join(' ');
}

function walkEscalasRoutes(dirPath: string, routePrefix: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const routes: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const childRoute = `${routePrefix}/${entry.name}`;
      const pageFile = path.join(fullPath, 'page.tsx');
      if (fs.existsSync(pageFile)) routes.push(childRoute);
      routes.push(...walkEscalasRoutes(fullPath, childRoute));
    }
  }

  return routes;
}

function loadProtocolTagsBySlug(): Record<string, string> {
  const dir = path.join(process.cwd(), 'content', 'protocolos');
  if (!fs.existsSync(dir)) return {};
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  const isProd = process.env.NODE_ENV === 'production';
  const entries = files
    .map((file) => file.replace(/\.mdx$/, ''))
    .filter((slug) => !(isProd && slug === 'ejemplo-componentes'))
    .map((slug) => {
      const full = path.join(dir, `${slug}.mdx`);
      const raw = fs.readFileSync(full, 'utf8');
      const { data } = matter(raw);
      const tags = ((data as { tags?: string[] }).tags ?? []).join(' ');
      return [slug, tags] as const;
    });
  return Object.fromEntries(entries);
}

function loadProtocolos(): SearchItem[] {
  const dir = path.join(process.cwd(), 'content', 'protocolos');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  const isProd = process.env.NODE_ENV === 'production';
  return files
    .map((file) => file.replace(/\.mdx$/, ''))
    .filter((slug) => !(isProd && slug === 'ejemplo-componentes'))
    .map((slug) => {
      const full = path.join(dir, `${slug}.mdx`);
      const raw = fs.readFileSync(full, 'utf8');
      const { data, content } = matter(raw);
      const tags = ((data as { tags?: string[] }).tags ?? []).join(' ');
      return {
        type: 'protocolo',
        title: (data as { title?: string }).title ?? slug,
        url: `/protocolos/${slug}`,
        content: `${(data as { description?: string }).description ?? ''}\n${tags}\n${content}`,
        snippet: (data as { description?: string }).description ?? tags,
      };
    });
}

function loadDietas(): SearchItem[] {
  const base = path.join(process.cwd(), 'public', 'dietas_recom');
  const indexPath = path.join(base, 'index.json');
  if (!fs.existsSync(indexPath)) return [];
  const indexRaw = fs.readFileSync(indexPath, 'utf8');
  let index: Array<{
    id?: string;
    titulo?: string;
    ruta?: string;
    tags?: string[];
    sistemas?: string[];
  }> = [];
  try {
    index = JSON.parse(indexRaw);
  } catch {
    return [];
  }
  return index.map((it) => {
    const ruta = it.ruta ?? '';
    const id = it.id ?? it.titulo ?? '';
    const dietasUrl = id ? `/macros?id=${encodeURIComponent(id)}` : '/macros';
    let content = '';
    if (ruta) {
      const rel = ruta.replace(/^\/+/, '');
      const filePath = path.join(process.cwd(), 'public', rel);
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf8');
      }
    }
    return {
      type: 'dieta',
      title: it.titulo ?? 'Macros',
      url: dietasUrl,
      content: `${(it.tags ?? []).join(' ')} ${(it.sistemas ?? []).join(' ')} ${content}`,
      snippet: (it.sistemas ?? []).join(' · ') || (it.tags ?? []).slice(0, 4).join(' · '),
    };
  });
}

function loadPages(queryText?: string): SearchItem[] {
  const homeItems = getHomeSearchEntries()
    .filter((entry) => entry.href !== '/novedades')
    .map((entry) => ({
      type: 'page' as const,
      title: entry.section === 'Inicio' ? entry.title : `${entry.title} (${entry.section})`,
      url: `/?homeSearch=${encodeURIComponent(queryText ?? entry.title)}&homeFocus=${encodeURIComponent(entry.id)}`,
      content: `inicio home portada ${entry.section} ${entry.content}`,
      snippet: entry.section,
    }));

  return [
    { type: 'page', title: 'Inicio', url: '/', content: 'inicio recursos urgencias' },
    ...homeItems,
    { type: 'page', title: 'Protocolos', url: '/protocolos', content: 'protocolos' },
    { type: 'page', title: 'Sesiones', url: '/sesiones', content: 'sesiones' },
    { type: 'page', title: 'Macros', url: '/macros', content: 'dietas recomendaciones macros' },
    {
      type: 'formacion',
      title: 'Formación',
      url: '/formacion',
      content:
        'formación cursos masters rcp politrauma ecografía ventilación atls apls politrauma pediátrico transporte medicalizado uam semes winfocus ecocardioscopia ecografía pulmonar vmni poe muye programa oficial boe',
    },
    {
      type: 'formacion',
      title: 'Programa Oficial de la Especialidad de Urgencias y Emergencias',
      url: '/formacion/programa-oficial',
      content:
        'programa oficial especialidad urgencias emergencias muye poe boe 4 abril 2026 competencias competencias transversales competencias comunes mfyc competencias específicas rotaciones rotatorios estancias guardias formación complementaria cursos talleres simulación cronograma itinerario formativo formación sanitaria especializada medicina urgencias y emergencias instrumentos de evaluación ex ob au 360 po soporte vital vía aérea trauma shock ecografía sem hrd hd ume ccue',
      snippet: 'BOE · competencias · cronograma · rotaciones',
    },
    { type: 'page', title: 'Inhaladores', url: '/inhaladores', content: 'inhaladores' },
    { type: 'page', title: 'Herramientas', url: '/escalas', content: 'escalas herramientas' },
    { type: 'page', title: 'Eventos', url: '/eventos', content: 'eventos calendario agenda' },
  ];
}

function loadHorarios(): SearchItem[] {
  const items: SearchItem[] = [
    {
      type: 'horario',
      title: 'Horarios',
      url: '/horarios',
      content: 'horarios turnos calendario cuadrante',
    },
  ];

  for (const entry of HORARIOS) {
    const year = entry.year;
    const yearStr = String(year);
    const yearShort = yearStr.slice(-2);

    items.push({
      type: 'horario',
      title: `Horarios ${year}`,
      url: '/horarios',
      content: `horarios ${yearStr} ${yearShort}`,
      snippet: `Calendario ${year}`,
    });

    MONTHS.forEach((month, idx) => {
      const url = entry.months[month];
      if (!url) return;

      const label = MONTH_LABELS[month];
      const aliases = MONTH_ALIASES[month];
      const monthNum = String(idx + 1).padStart(2, '0');

      const content = [
        'horarios',
        'turnos',
        label,
        month,
        yearStr,
        yearShort,
        ...aliases,
        `${label} ${yearStr}`,
        `${label} ${yearShort}`,
        `${monthNum}/${yearStr}`,
        `${monthNum}/${yearShort}`,
        `${monthNum}-${yearStr}`,
        `${monthNum}-${yearShort}`,
        `${yearStr}-${monthNum}`,
        `${yearStr}/${monthNum}`,
      ].join(' ');

      items.push({
        type: 'horario',
        title: `Horarios ${label} ${year}`,
        url,
        content,
        snippet: `Horarios · ${label} ${year}`,
      });
    });
  }

  return items;
}

function loadStandycalcBrandNames(): string[] {
  const filePath = path.join(
    process.cwd(),
    'src',
    'app',
    'escalas',
    'standycalc',
    'standycalc-data.json'
  );
  if (!fs.existsSync(filePath)) return [];
  let data: { sheets?: Record<string, { cells?: Record<string, { v?: string }> }> } = {};
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
  const sheets = ['MEZCLAS ESTANDAR', 'MEZCLAS RESTRINGIDAS'];
  const names = new Set<string>();

  for (const sheetName of sheets) {
    const cells = data.sheets?.[sheetName]?.cells;
    if (!cells) continue;
    for (const cell of Object.values(cells)) {
      const v = cell?.v;
      if (!v) continue;
      const text = String(v);
      const parenMatches = text.match(/\(([^)]+)\)/g) ?? [];
      for (const match of parenMatches) {
        const inner = match.slice(1, -1);
        if (!/[®™]/.test(inner)) continue;
        const cleaned = inner.replace(/[®™]/g, '').trim();
        if (!cleaned) continue;
        cleaned
          .split(/[;,/]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((t) => names.add(t));
      }
      const directMatches =
        text.match(/([A-Za-z0-9ÁÉÍÓÚÜÑñ][A-Za-z0-9ÁÉÍÓÚÜÑñ+ \\-]{1,})[®™]/g) ?? [];
      for (const m of directMatches) {
        const cleaned = m.replace(/[®™]/g, '').trim();
        if (cleaned) names.add(cleaned);
      }
    }
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b, 'es'));
}

function loadStandycalcBrandMap(): Record<string, string> {
  const filePath = path.join(
    process.cwd(),
    'src',
    'app',
    'escalas',
    'standycalc',
    'standycalc-data.json'
  );
  if (!fs.existsSync(filePath)) return {};
  let data: { sheets?: Record<string, { cells?: Record<string, { v?: string }> }> } = {};
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
  const sheets = ['MEZCLAS ESTANDAR', 'MEZCLAS RESTRINGIDAS'];
  const drugHeaders: Record<number, string>[] = [];

  for (const sheetName of sheets) {
    const cells = data.sheets?.[sheetName]?.cells;
    if (!cells) continue;
    const headers: Record<number, string> = {};
    for (const [ref, cell] of Object.entries(cells)) {
      if (!ref.startsWith('B') || !cell?.v) continue;
      const row = Number(ref.slice(1));
      const value = String(cell.v);
      const normalized = normalize(value);
      const match = STANDY_ALL_DRUGS.find((drug) => normalized.includes(normalize(drug)));
      if (match) headers[row] = match;
    }
    drugHeaders.push(headers);
  }

  const brandMap = new Map<string, string>();
  for (let i = 0; i < sheets.length; i++) {
    const sheetName = sheets[i];
    const cells = data.sheets?.[sheetName]?.cells;
    if (!cells) continue;
    const headers = drugHeaders[i] ?? {};
    const headerRows = Object.keys(headers)
      .map((r) => Number(r))
      .sort((a, b) => a - b);

    for (const [ref, cell] of Object.entries(cells)) {
      const v = cell?.v;
      if (!v) continue;
      const text = String(v);
      if (!text.includes('®') && !text.includes('™')) continue;
      const row = Number(ref.match(/\d+/)?.[0] ?? 0);
      if (!row) continue;
      const headerRow = headerRows.filter((r) => r <= row).slice(-1)[0];
      if (!headerRow || row - headerRow > 6) continue;
      const drug = headers[headerRow];
      if (!drug) continue;
      const parenMatches = text.match(/\(([^)]+)\)/g) ?? [];
      const names: string[] = [];
      for (const match of parenMatches) {
        const inner = match.slice(1, -1);
        if (!/[®™]/.test(inner)) continue;
        const cleaned = inner.replace(/[®™]/g, '').trim();
        if (!cleaned) continue;
        cleaned
          .split(/[;,/]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((t) => names.push(t));
      }
      const directMatches =
        text.match(/([A-Za-z0-9ÁÉÍÓÚÜÑñ][A-Za-z0-9ÁÉÍÓÚÜÑñ+ \\-]{1,})[®™]/g) ?? [];
      for (const m of directMatches) {
        const cleaned = m.replace(/[®™]/g, '').trim();
        if (cleaned) names.push(cleaned);
      }
      for (const name of names) {
        if (!brandMap.has(name)) brandMap.set(name, drug);
      }
    }
  }

  return Object.fromEntries(brandMap.entries());
}

function loadTools(): SearchItem[] {
  const protocolTagsBySlug = loadProtocolTagsBySlug();
  const brandNames = loadStandycalcBrandNames();
  const brandMap = loadStandycalcBrandMap();
  const routes = walkEscalasRoutes(path.join(process.cwd(), 'src', 'app', 'escalas'), '/escalas').filter(
    (route) => !REDIRECTED_TOOL_ROUTES.has(route)
  );

  const routeItems = routes.map((route) => {
    const slug = route.replace('/escalas/', '');
    const scaleMeta = getScaleMetaBySlug(slug);
    const metadata = TOOL_METADATA_BY_ROUTE[route] ?? {};
    const title = scaleMeta?.title ?? metadata.title ?? slugToTitle(slug);
    const protocolTags = protocolTagsBySlug[slug] ?? '';
    const searchContent = [
      scaleMeta?.summary,
      ...(scaleMeta?.tags ?? []),
      ...(scaleMeta?.keywords ?? []),
      metadata.extraContent ?? `herramientas escalas ${title} ${slug}`,
      protocolTags,
    ]
      .filter(Boolean)
      .join(' ');
    return {
      type: 'herramienta' as const,
      title,
      url: route,
      content: searchContent,
      snippet: scaleMeta?.summary ?? protocolTags ?? 'Herramienta clínica',
    };
  });

  const standycalcExtraItems = [
    ...STANDY_ALL_DRUGS.map((drug) => ({
      type: 'herramienta' as const,
      title: `${drug} (STANDyCALC®)`,
      url: `/escalas/standycalc?drug=${encodeURIComponent(drug)}`,
      content: `standycalc ${drug.toLowerCase()} ${drug}`,
      snippet: 'STANDyCALC® · Perfusiones y diluciones',
    })),
    {
      type: 'herramienta' as const,
      title: 'Dormicum (STANDyCALC®)',
      url: `/escalas/standycalc?drug=${encodeURIComponent('MIDAZOLAM')}`,
      content: 'standycalc dormicum midazolam',
      snippet: 'STANDyCALC® · Perfusiones y diluciones',
    },
    ...brandNames.map((brand) => ({
      type: 'herramienta' as const,
      title: `${brand} (STANDyCALC®)`,
      url: brandMap[brand]
        ? `/escalas/standycalc?drug=${encodeURIComponent(brandMap[brand])}`
        : '/escalas/standycalc',
      content: `standycalc ${brand.toLowerCase()} ${brand}`,
      snippet: 'STANDyCALC® · Perfusiones y diluciones',
    })),
  ];

  const unique = new Map<string, SearchItem>();
  for (const item of [...routeItems, ...standycalcExtraItems]) {
    const key = `${item.url}::${item.title}`;
    if (!unique.has(key)) unique.set(key, item);
  }

  return Array.from(unique.values());
}

type GvizCell = { v?: unknown; f?: unknown } | null;
type GvizRow = { c?: GvizCell[] } | null;
type GvizResponse = { table?: { rows?: GvizRow[] } } | null;

function parseGviz(text: string): GvizResponse {
  const json = text.substring(47).slice(0, -2);
  return JSON.parse(json) as GvizResponse;
}

function cellToString(cell: GvizCell): string {
  if (!cell) return '';
  return (cell.f ?? cell.v ?? '').toString();
}

async function loadSheetRows(
  sheetId: string,
  gid: string,
  type: SearchItem['type'],
  urlBase: string
): Promise<SearchItem[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${gid}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const text = await res.text();
  const gviz = parseGviz(text);
  const rows = gviz?.table?.rows ?? [];

  return rows.map((r) => {
    const c = r?.c ?? [];
    const title = cellToString(c[1]) || cellToString(c[0]) || 'Sin título';
    const tags = cellToString(c[2]);
    const link = cellToString(c[c.length - 1]);
    return {
      type,
      title,
      url: link || urlBase,
      content: `${cellToString(c[0])} ${title} ${tags}`,
      snippet: tags || cellToString(c[0]),
    };
  });
}

const cache = new Map<string, { ts: number; data: SearchItem[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getLatestMtime(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  const files = fs.readdirSync(dirPath);
  let latest = fs.statSync(dirPath).mtimeMs;
  for (const file of files) {
    const full = path.join(dirPath, file);
    const stat = fs.statSync(full);
    if (stat.mtimeMs > latest) latest = stat.mtimeMs;
  }
  return latest;
}

async function loadAllItems(queryText?: string): Promise<SearchItem[]> {
  const protocolosMtime = getLatestMtime(path.join(process.cwd(), 'content', 'protocolos'));
  const dietasMtime = getLatestMtime(path.join(process.cwd(), 'public', 'dietas_recom'));
  const key = `all:${protocolosMtime}:${dietasMtime}:${queryText ?? ''}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.ts < CACHE_TTL_MS) return cached.data;

  const [protocolosSheet, sesionesSheet] = await Promise.all([
    loadSheetRows('1bUcPfoqz28dDCJQtDPX-KO2b25u8pqypIkj1bJ9TsQs', '0', 'protocolo', '/protocolos'),
    loadSheetRows('1ej7zO2m93Fw1WxYZNRgzmiQhKWGIXkYV86p9ZDoDez8', '0', 'sesion', '/sesiones'),
  ]);

  const items = [
    ...loadPages(queryText),
    ...loadHorarios(),
    ...loadProtocolos(),
    ...loadDietas(),
    ...protocolosSheet,
    ...sesionesSheet,
  ];
  cache.set(key, { ts: now, data: items });
  return items;
}

function cleanSnippet(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function buildSnippet(item: SearchItem, query: string) {
  const explicitSnippet = cleanSnippet(item.snippet ?? '');
  if (explicitSnippet) return explicitSnippet;

  const source = cleanSnippet(`${item.title} ${item.content}`);
  if (!source) return '';

  const normalizedSource = normalize(source);
  const matchIndex = normalizedSource.indexOf(query);
  if (matchIndex < 0) return source.slice(0, 120);

  const start = Math.max(0, matchIndex - 40);
  const end = Math.min(source.length, matchIndex + query.length + 60);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < source.length ? '…' : '';
  return `${prefix}${source.slice(start, end).trim()}${suffix}`;
}

function exactMatchScore(item: SearchItem, query: string) {
  const normalizedTitle = normalize(item.title);
  const normalizedSnippet = normalize(item.snippet ?? '');
  const normalizedContent = normalize(item.content);

  if (normalizedTitle === query) return 2000;
  if (normalizedTitle.startsWith(query)) return 1400;
  if (normalizedTitle.includes(query)) return 1100;
  if (normalizedSnippet.startsWith(query)) return 700;
  if (normalizedSnippet.includes(query)) return 550;
  if (normalizedContent.startsWith(query)) return 450;
  if (normalizedContent.includes(query)) return 300;
  return 0;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  if (!q) {
    return Response.json({ results: [] });
  }

  const query = normalize(q);
  const items = [...(await loadAllItems(q)), ...loadTools()];

  const results = items
    .map((it) => {
      const hay = normalize(`${it.title} ${it.content}`);
      const idx = hay.indexOf(query);
      return { it, idx, score: exactMatchScore(it, query) };
    })
    .filter((x) => x.idx >= 0)
    .sort((a, b) => b.score - a.score || a.idx - b.idx || a.it.title.localeCompare(b.it.title, 'es'))
    .slice(0, 50)
    .map(({ it }) => ({
      type: it.type,
      title: it.title,
      url: it.url,
      snippet: buildSnippet(it, query),
    }));

  if (results.length > 0) {
    return Response.json({ results });
  }

  const fuzzyResults = items
    .map((it) => ({
      it,
      score: fuzzyMatchScore(it, q),
    }))
    .filter((entry): entry is { it: SearchItem; score: number } => entry.score !== null)
    .sort((a, b) => b.score - a.score || a.it.title.localeCompare(b.it.title, 'es'))
    .slice(0, 50)
    .map(({ it }) => ({
      type: it.type,
      title: it.title,
      url: it.url,
      snippet: buildSnippet(it, query),
    }));

  return Response.json({ results: fuzzyResults });
}
