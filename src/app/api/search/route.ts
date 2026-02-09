import fs from "fs";
import path from "path";
import matter from "gray-matter";

import { HORARIOS, MONTHS, MONTH_ALIASES, MONTH_LABELS } from "@/lib/horariosData";

type SearchItem = {
  type:
    | "page"
    | "protocolo"
    | "dieta"
    | "sesion"
    | "herramienta"
    | "formacion"
    | "horario";
  title: string;
  url: string;
  content: string;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const STANDY_STANDARD_DRUGS = [
  "AMIODARONA",
  "NALOXONA",
  "DOBUTAMINA",
  "NIMODIPINO",
  "DOPAMINA",
  "NITROGLICERINA",
  "FLECAINIDA",
  "NITROPRUSIATO",
  "FLUMAZENILO",
  "OCTREOTIDO",
  "FUROSEMIDA",
  "SODIO HIPERTONICO",
  "HEPARINA",
  "SOMATOSTATINA",
  "LABETALOL",
  "TEOFILINA",
  "MAGNESIO SULFATO",
  "VALPROICO",
  "MORFINA",
  "VERNAKALANT",
  "N-ACETILCISTEINA",
];

const STANDY_RESTRICTED_DRUGS = [
  "CISATRACURIO",
  "ESMOLOL",
  "FUROSEMIDA CONC",
  "LEVOSIMENDAN",
  "MIDAZOLAM",
  "NORADRENALINA",
  "PROCAINAMIDA",
  "SALBUTAMOL",
  "URAPIDIL",
];

const STANDY_ALL_DRUGS = [...STANDY_STANDARD_DRUGS, ...STANDY_RESTRICTED_DRUGS];

function loadProtocolos(): SearchItem[] {
  const dir = path.join(process.cwd(), "content", "protocolos");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  const isProd = process.env.NODE_ENV === "production";
  return files
    .map((file) => file.replace(/\.mdx$/, ""))
    .filter((slug) => !(isProd && slug === "ejemplo-componentes"))
    .map((slug) => {
      const full = path.join(dir, `${slug}.mdx`);
      const raw = fs.readFileSync(full, "utf8");
      const { data, content } = matter(raw);
      return {
        type: "protocolo",
        title: (data as { title?: string }).title ?? slug,
        url: `/protocolos/${slug}`,
        content: `${(data as { description?: string }).description ?? ""}\n${content}`,
      };
    });
}

function loadDietas(): SearchItem[] {
  const base = path.join(process.cwd(), "public", "dietas_recom");
  const indexPath = path.join(base, "index.json");
  if (!fs.existsSync(indexPath)) return [];
  const indexRaw = fs.readFileSync(indexPath, "utf8");
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
    const ruta = it.ruta ?? "";
    const id = it.id ?? it.titulo ?? "";
    const dietasUrl = id ? `/dietas?id=${encodeURIComponent(id)}` : "/dietas";
    let content = "";
    if (ruta) {
      const rel = ruta.replace(/^\/+/, "");
      const filePath = path.join(process.cwd(), "public", rel);
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, "utf8");
      }
    }
    return {
      type: "dieta",
      title: it.titulo ?? "Dietas y recomendaciones",
      url: dietasUrl,
      content: `${(it.tags ?? []).join(" ")} ${(it.sistemas ?? []).join(" ")} ${content}`,
    };
  });
}

function loadPages(): SearchItem[] {
  return [
    { type: "page", title: "Inicio", url: "/", content: "inicio recursos urgencias" },
    { type: "page", title: "Protocolos", url: "/protocolos", content: "protocolos" },
    { type: "page", title: "Sesiones", url: "/sesiones", content: "sesiones" },
    { type: "page", title: "Dietas", url: "/dietas", content: "dietas recomendaciones" },
    {
      type: "formacion",
      title: "Formación",
      url: "/formacion",
      content:
        "formación cursos masters rcp politrauma ecografía ventilación atls apls politrauma pediátrico transporte medicalizado uam semes winfocus ecocardioscopia ecografía pulmonar vmni",
    },
    { type: "page", title: "Inhaladores", url: "/inhaladores", content: "inhaladores" },
    { type: "page", title: "Herramientas", url: "/escalas", content: "escalas herramientas" },
    { type: "page", title: "Eventos", url: "/eventos", content: "eventos calendario agenda" },
  ];
}

function loadHorarios(): SearchItem[] {
  const items: SearchItem[] = [
    {
      type: "horario",
      title: "Horarios",
      url: "/horarios",
      content: "horarios turnos calendario cuadrante",
    },
  ];

  for (const entry of HORARIOS) {
    const year = entry.year;
    const yearStr = String(year);
    const yearShort = yearStr.slice(-2);

    items.push({
      type: "horario",
      title: `Horarios ${year}`,
      url: "/horarios",
      content: `horarios ${yearStr} ${yearShort}`,
    });

    MONTHS.forEach((month, idx) => {
      const url = entry.months[month];
      if (!url) return;

      const label = MONTH_LABELS[month];
      const aliases = MONTH_ALIASES[month];
      const monthNum = String(idx + 1).padStart(2, "0");

      const content = [
        "horarios",
        "turnos",
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
      ].join(" ");

      items.push({
        type: "horario",
        title: `Horarios ${label} ${year}`,
        url,
        content,
      });
    });
  }

  return items;
}

function loadStandycalcBrandNames(): string[] {
  const filePath = path.join(
    process.cwd(),
    "src",
    "app",
    "escalas",
    "standycalc",
    "standycalc-data.json"
  );
  if (!fs.existsSync(filePath)) return [];
  let data: { sheets?: Record<string, { cells?: Record<string, { v?: string }> }> } = {};
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return [];
  }
  const sheets = ["MEZCLAS ESTANDAR", "MEZCLAS RESTRINGIDAS"];
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
        const cleaned = inner.replace(/[®™]/g, "").trim();
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
        const cleaned = m.replace(/[®™]/g, "").trim();
        if (cleaned) names.add(cleaned);
      }
    }
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b, "es"));
}

function loadStandycalcBrandMap(): Record<string, string> {
  const filePath = path.join(
    process.cwd(),
    "src",
    "app",
    "escalas",
    "standycalc",
    "standycalc-data.json"
  );
  if (!fs.existsSync(filePath)) return {};
  let data: { sheets?: Record<string, { cells?: Record<string, { v?: string }> }> } = {};
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
  const sheets = ["MEZCLAS ESTANDAR", "MEZCLAS RESTRINGIDAS"];
  const drugHeaders: Record<number, string>[] = [];

  for (const sheetName of sheets) {
    const cells = data.sheets?.[sheetName]?.cells;
    if (!cells) continue;
    const headers: Record<number, string> = {};
    for (const [ref, cell] of Object.entries(cells)) {
      if (!ref.startsWith("B") || !cell?.v) continue;
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
      if (!text.includes("®") && !text.includes("™")) continue;
      const row = Number(ref.match(/\d+/)?.[0] ?? 0);
      if (!row) continue;
      const headerRow = headerRows
        .filter((r) => r <= row)
        .slice(-1)[0];
      if (!headerRow || row - headerRow > 6) continue;
      const drug = headers[headerRow];
      if (!drug) continue;
      const parenMatches = text.match(/\(([^)]+)\)/g) ?? [];
      const names: string[] = [];
      for (const match of parenMatches) {
        const inner = match.slice(1, -1);
        if (!/[®™]/.test(inner)) continue;
        const cleaned = inner.replace(/[®™]/g, "").trim();
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
        const cleaned = m.replace(/[®™]/g, "").trim();
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
  const brandNames = loadStandycalcBrandNames();
  const brandMap = loadStandycalcBrandMap();
  const brandContent = brandNames.join(" ");
  const items = [
    { title: "Depurador SIA", url: "/escalas/depuradorTtos" },
    {
      title: "STANDyCALC®",
      url: "/escalas/standycalc",
      content:
        "standycalc perfusion perfusiones dilucion diluciones farmacia farmacos fármacos mezclas infusion infusiones " +
        "amiodarona naloxona dobutamina nimodipino dopamina nitroglicerina flecainida nitroprusiato flumazenilo " +
        "octreotido furosemida sodio hipertonico heparina somatostatina labetalol teofilina magnesio sulfato " +
        "valproico morfina vernakalant n-acetilcisteina " +
        brandContent,
    },
    ...[
      "AMIODARONA",
      "NALOXONA",
      "DOBUTAMINA",
      "NIMODIPINO",
      "DOPAMINA",
      "NITROGLICERINA",
      "FLECAINIDA",
      "NITROPRUSIATO",
      "FLUMAZENILO",
      "OCTREOTIDO",
      "FUROSEMIDA",
      "SODIO HIPERTONICO",
      "HEPARINA",
      "SOMATOSTATINA",
      "LABETALOL",
      "TEOFILINA",
      "MAGNESIO SULFATO",
      "VALPROICO",
      "MORFINA",
      "VERNAKALANT",
      "N-ACETILCISTEINA",
      "CISATRACURIO",
      "ESMOLOL",
      "FUROSEMIDA CONC",
      "LEVOSIMENDAN",
      "MIDAZOLAM",
      "NORADRENALINA",
      "PROCAINAMIDA",
      "SALBUTAMOL",
      "URAPIDIL",
    ].map((drug) => ({
      title: `${drug} (STANDyCALC®)`,
      url: `/escalas/standycalc?drug=${encodeURIComponent(drug)}`,
      content: `standycalc ${drug.toLowerCase()} ${drug}`,
    })),
    {
      title: "Dormicum (STANDyCALC®)",
      url: `/escalas/standycalc?drug=${encodeURIComponent("MIDAZOLAM")}`,
      content: "standycalc dormicum midazolam",
    },
    ...brandNames.map((brand) => ({
      title: `${brand} (STANDyCALC®)`,
      url: brandMap[brand]
        ? `/escalas/standycalc?drug=${encodeURIComponent(brandMap[brand])}`
        : "/escalas/standycalc",
      content: `standycalc ${brand.toLowerCase()} ${brand}`,
    })),
    { title: "Inhaladores", url: "/inhaladores" },
    { title: "Anion GAP", url: "/escalas/anion-gap" },
    {
      title: "CHA2DS2-VA",
      url: "/escalas/cha2ds2va",
      content: "chads chadsva chads-vasc cha2ds2va",
    },
    { title: "CURB-65", url: "/escalas/curb65" },
    { title: "Glasgow", url: "/escalas/glasgow" },
    { title: "Gradiente A-a O2", url: "/escalas/gradiente-aa-o2" },
    { title: "HAS-BLED", url: "/escalas/hasbled" },
    { title: "Hipernatremia", url: "/escalas/hiperNa" },
    { title: "Hiponatremia", url: "/escalas/hiponatremia" },
    { title: "IDSA/ATS", url: "/escalas/idsa" },
    { title: "PaFi", url: "/escalas/pafi" },
    { title: "PSI", url: "/escalas/psi" },
    { title: "qSOFA", url: "/escalas/qsofa" },
    { title: "SaFi", url: "/escalas/safi" },
    { title: "SOFA", url: "/escalas/sofa" },
    { title: "TAm (PAM)", url: "/escalas/tam" },
    { title: "TIMI SCACEST", url: "/escalas/timi-scacest" },
    { title: "TIMI SCASEST", url: "/escalas/timi-scasest" },
    { title: "Wells – TVP", url: "/escalas/wells-tvp" },
  ];
  return items.map((it) => ({
    type: "herramienta",
    title: it.title,
    url: it.url,
    content: it.content ?? `herramientas escalas ${it.title}`,
  }));
}

type GvizCell = { v?: unknown; f?: unknown } | null;
type GvizRow = { c?: GvizCell[] } | null;
type GvizResponse = { table?: { rows?: GvizRow[] } } | null;

function parseGviz(text: string): GvizResponse {
  const json = text.substring(47).slice(0, -2);
  return JSON.parse(json) as GvizResponse;
}

function cellToString(cell: GvizCell): string {
  if (!cell) return "";
  return (cell.f ?? cell.v ?? "").toString();
}

async function loadSheetRows(
  sheetId: string,
  gid: string,
  type: SearchItem["type"],
  urlBase: string
): Promise<SearchItem[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const text = await res.text();
  const gviz = parseGviz(text);
  const rows = gviz?.table?.rows ?? [];

  return rows.map((r) => {
    const c = r?.c ?? [];
    const title = cellToString(c[1]) || cellToString(c[0]) || "Sin título";
    const tags = cellToString(c[2]);
    const link = cellToString(c[c.length - 1]);
    return {
      type,
      title,
      url: link || urlBase,
      content: `${cellToString(c[0])} ${title} ${tags}`,
    };
  });
}

const cache = new Map<string, { ts: number; data: SearchItem[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function loadAllItems(): Promise<SearchItem[]> {
  const key = "all";
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.ts < CACHE_TTL_MS) return cached.data;

  const [protocolosSheet, sesionesSheet] = await Promise.all([
    loadSheetRows("1bUcPfoqz28dDCJQtDPX-KO2b25u8pqypIkj1bJ9TsQs", "0", "protocolo", "/protocolos"),
    loadSheetRows("1ej7zO2m93Fw1WxYZNRgzmiQhKWGIXkYV86p9ZDoDez8", "0", "sesion", "/sesiones"),
  ]);

  const items = [
    ...loadPages(),
    ...loadHorarios(),
    ...loadProtocolos(),
    ...loadDietas(),
    ...protocolosSheet,
    ...sesionesSheet,
  ];
  cache.set(key, { ts: now, data: items });
  return items;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return Response.json({ results: [] });
  }

  const query = normalize(q);
  const items = [...(await loadAllItems()), ...loadTools()];

  const results = items
    .map((it) => {
      const hay = normalize(`${it.title} ${it.content}`);
      const idx = hay.indexOf(query);
      return { it, idx };
    })
    .filter((x) => x.idx >= 0)
    .slice(0, 50)
    .map(({ it }) => ({
      type: it.type,
      title: it.title,
      url: it.url,
    }));

  return Response.json({ results });
}
