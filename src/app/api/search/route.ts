import fs from "fs";
import path from "path";
import matter from "gray-matter";

type SearchItem = {
  type: "page" | "protocolo" | "dieta" | "sesion" | "herramienta" | "formacion";
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

function loadProtocolos(): SearchItem[] {
  const dir = path.join(process.cwd(), "content", "protocolos");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => {
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, "utf8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.mdx$/, "");
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
  let index: Array<{ titulo?: string; ruta?: string; tags?: string[]; sistemas?: string[] }> = [];
  try {
    index = JSON.parse(indexRaw);
  } catch {
    return [];
  }
  return index.map((it) => {
    const ruta = it.ruta ?? "";
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
      url: ruta || "/dietas",
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

function loadTools(): SearchItem[] {
  const items = [
    { title: "Depurador SIA", url: "/escalas/depuradorTtos" },
    { title: "Inhaladores", url: "/inhaladores" },
    { title: "Anion GAP", url: "/escalas/anion-gap" },
    { title: "CHA2DS2-VASc", url: "/escalas/chads2vasc" },
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
    { title: "TAm (PAM)", url: "/escalas/tam" },
    { title: "TIMI SCACEST", url: "/escalas/timi-scacest" },
    { title: "TIMI SCASEST", url: "/escalas/timi-scasest" },
    { title: "Wells – TVP", url: "/escalas/wells-tvp" },
  ];
  return items.map((it) => ({
    type: "herramienta",
    title: it.title,
    url: it.url,
    content: `herramientas escalas ${it.title}`,
  }));
}

function parseGviz(text: string) {
  const json = text.substring(47).slice(0, -2);
  return JSON.parse(json);
}

function cellToString(cell: any): string {
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

  return rows.map((r: any) => {
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

  const items = [...loadPages(), ...loadProtocolos(), ...loadDietas(), ...protocolosSheet, ...sesionesSheet];
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
