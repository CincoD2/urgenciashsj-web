"use client";

import { useMemo, useState } from "react";
import InformeCopiable from "@/components/InformeCopiable";

type OutputMode = "lineas" | "parrafos";
type VisualFontProfile = "tahoma" | "helvetica";

type LabEntry = {
  group: string;
  name: string;
  flag: "*" | "";
  result: string;
  unit: string;
  reference: string;
  confidenceNote: string;
};

type ParsedPayload = {
  requestLine: string;
  groups: Array<{ name: string; entries: LabEntry[] }>;
};

const GROUP_LABELS: Array<{ needle: string; label: string }> = [
  { needle: "HEMOGRAMA", label: "Hemograma" },
  { needle: "HEMATIMETRIA", label: "Hemograma" },
  { needle: "COAGULACION", label: "Coagulación" },
  { needle: "HEMOSTASIA", label: "Coagulación" },
  { needle: "BIOQUIMICA GENERAL", label: "Bioquímica" },
  { needle: "BIOQUIMICA ORINA", label: "Bioquímica orina" },
  { needle: "GLICOSILADAS", label: "Glicosiladas" },
  { needle: "INMUNOANALISIS", label: "Inmunoanálisis" },
  { needle: "GASOMETRIA VENOSA", label: "Gasometría venosa" },
  { needle: "GASOMETRIA ARTERIAL", label: "Gasometría arterial" },
  { needle: "GASOMETRIAS", label: "Gasometrías" },
  { needle: "MICROBIOLOGIA MOLECULAR", label: "Microbiología molecular" },
  {
    needle: "MICROBIOLOGIA BACTERIOLOGIA",
    label: "Microbiología bacteriología",
  },
  { needle: "MICROBIOLOGIA SEROLOGIA", label: "Microbiología serología" },
  { needle: "DETECCION DE ANTIGENOS", label: "Detección de antígenos" },
  { needle: "SEROLOGIA DE VIH", label: "Serología VIH" },
  { needle: "SEROLOGIA DE SIFILIS", label: "Serología sífilis" },
  { needle: "LABORATORIO EXTERNO", label: "Laboratorio externo" },
  { needle: "ORINAS", label: "Orina" },
  { needle: "SEDIMENTO", label: "Orina" },
  { needle: "ANORMALES", label: "Orina" },
  { needle: "CRIBADO", label: "Cribado" },
];

function normalizeLine(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/\u00A0/g, " ")
    .trimEnd();
}

function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isPatientLine(line: string): boolean {
  return /^\s*Paciente:/i.test(line);
}

function isRequestLine(line: string): boolean {
  return /N[º°o]\s*petici[oó]n\s*:/i.test(line);
}

function isConfidenceLine(line: string): boolean {
  const key = normalizeForMatch(line);
  return (
    key.includes("INDICE DE CONFIANZA") ||
    key.includes("INTERVALO DE CONFIANZA") ||
    key.includes("PROBABILIDAD DEL")
  );
}

function splitColumns(line: string): string[] {
  return line
    .trim()
    .split(/\t+|\s{2,}/)
    .map((col) => col.trim())
    .filter(Boolean);
}

function looksNumericToken(token: string): boolean {
  return /^([<>]=?|=)?\s*-?\d+(?:[.,]\d+)?$/.test(token.trim());
}

function looksLikeReferenceToken(token: string): boolean {
  const t = token.trim();
  if (!t) return false;
  if (/^\[.*\]$/.test(t) || /^\[/.test(t)) return true;
  if (/^[<>]=?\s*-?\d+(?:[.,]\d+)?/.test(t)) return true;
  if (/^-?\d+(?:[.,]\d+)?\s*-\s*-?\d+(?:[.,]\d+)?$/.test(t)) return true;
  if (/^-?\d+(?:[.,]\d+)?\s*-\s*-?\d+(?:[.,]\d+)?\s+\S+/.test(t)) return true;
  if (/^(Deseable|Valores|Negativo|Positivo|Normal|Inferior|Superior)/i.test(t))
    return true;
  return false;
}

function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.length > 80) return false;
  if (trimmed.includes("\t")) return false;
  if (/^[-*]/.test(trimmed)) return false;
  if (/\d/.test(trimmed)) return false;
  if (
    isPatientLine(trimmed) ||
    isRequestLine(trimmed) ||
    isConfidenceLine(trimmed)
  )
    return false;

  const letters = trimmed.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  if (!letters) return false;
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, "").length;
  return upper / letters.length >= 0.65;
}

function detectGroup(headings: string[]): string {
  for (let i = headings.length - 1; i >= 0; i -= 1) {
    const normalized = normalizeForMatch(headings[i]);
    const found = GROUP_LABELS.find((rule) => normalized.includes(rule.needle));
    if (found) return found.label;
  }

  const fallback = headings[headings.length - 1] || "Otros";
  return toTitleCase(fallback);
}

function parseResultAndUnit(valueUnitRaw: string): {
  result: string;
  unit: string;
} {
  const valueUnit = valueUnitRaw.replace(/\s+/g, " ").trim();
  const numeric = valueUnit.match(/^([<>]=?|=)?\s*(-?\d+(?:[.,]\d+)?)(.*)$/);

  if (numeric) {
    const sign = numeric[1]?.trim();
    const value = numeric[2].trim();
    const unit = numeric[3].trim();
    return { result: sign ? `${sign} ${value}` : value, unit };
  }

  return { result: valueUnit, unit: "" };
}

function parseResultLine(line: string, group: string): LabEntry | null {
  const cols = splitColumns(line);
  if (cols.length < 2) return null;

  const name = cols[0];
  if (!name || name.length < 2) return null;

  let index = 1;
  let flag: "*" | "" = "";
  if (cols[1] === "*") {
    flag = "*";
    index = 2;
  }

  const tailCols = cols.slice(index);
  if (tailCols.length === 0) return null;

  let referenceStart = tailCols.length;
  if (
    tailCols.length >= 2 &&
    looksLikeReferenceToken(tailCols[tailCols.length - 1])
  ) {
    referenceStart = tailCols.length - 1;
  }

  const valueCols = tailCols.slice(0, referenceStart);
  let reference = tailCols.slice(referenceStart).join(" ").trim();
  if (valueCols.length === 0) return null;

  let valueUnitRaw = "";
  if (valueCols.length === 1) {
    valueUnitRaw = valueCols[0];
  } else if (looksNumericToken(valueCols[0])) {
    valueUnitRaw = `${valueCols[0]} ${valueCols.slice(1).join(" ")}`.trim();
  } else {
    valueUnitRaw = valueCols.join(" ").trim();
  }

  if (!reference) {
    const trailingRange = valueUnitRaw.match(/(.*?)(\s*\[[^\]]+\]\s*)$/);
    if (trailingRange) {
      valueUnitRaw = trailingRange[1].trim();
      reference = trailingRange[2].trim();
    }
  }

  const parsed = parseResultAndUnit(valueUnitRaw);
  if (!parsed.result) return null;

  return {
    group,
    name: name.replace(/\s+/g, " ").trim(),
    flag,
    result: parsed.result,
    unit: parsed.unit,
    reference,
    confidenceNote: "",
  };
}

function canAppendContinuation(entry: LabEntry): boolean {
  if (entry.unit) return false;
  const value = entry.result.trim();
  if (!value) return false;
  if (looksNumericToken(value)) return false;
  return true;
}

function looksLikeUnitToken(token: string): boolean {
  const t = token.trim();
  if (!t) return false;
  if (t === "%") return true;
  if (/^10e\d+\/L$/i.test(t)) return true;
  if (/^(Seg|Ratio|upH|fL|pg)$/i.test(t)) return true;
  if (/[A-Za-zµ].*\//.test(t)) return true;
  if (
    /^(mmol\/L|mg\/dL|g\/dL|U\/L|mEq\/L|mmHg|ng\/mL|mcU\/mL|mU\/mL|pg\/mL)$/i.test(
      t,
    )
  ) {
    return true;
  }
  return false;
}

function parseDetachedUnitOrReferenceLine(
  line: string,
): { unit: string; reference: string } | null {
  const cols = splitColumns(line);
  if (cols.length === 0 || cols.length > 3) return null;

  const first = cols[0].trim();
  const rest = cols.slice(1).join(" ").trim();

  if (!first) return null;

  if (looksLikeReferenceToken(first)) {
    return { unit: "", reference: first };
  }

  if (!looksLikeUnitToken(first)) return null;

  if (!rest) return { unit: first, reference: "" };

  if (looksLikeReferenceToken(rest)) {
    return { unit: first, reference: rest };
  }

  // Keep strict: if the remainder is not a reference, do not hijack the line.
  return null;
}

function parseInput(input: string): ParsedPayload {
  const lines = input.split(/\n/).map(normalizeLine);
  const headings: string[] = [];

  let requestLine = "";
  let lastEntry: LabEntry | null = null;

  const orderedGroups: Array<{ name: string; entries: LabEntry[] }> = [];
  const groupsMap = new Map<string, { name: string; entries: LabEntry[] }>();

  const ensureGroup = (name: string) => {
    if (!groupsMap.has(name)) {
      const bucket = { name, entries: [] as LabEntry[] };
      groupsMap.set(name, bucket);
      orderedGroups.push(bucket);
    }
    return groupsMap.get(name)!;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (isPatientLine(line)) continue;
    if (isRequestLine(line)) {
      if (!requestLine) requestLine = line;
      continue;
    }

    if (isConfidenceLine(line) && lastEntry) {
      lastEntry.confidenceNote = line;
      continue;
    }

    if (looksLikeHeading(line)) {
      headings.push(line);
      if (headings.length > 8) headings.shift();
      continue;
    }

    const detached = parseDetachedUnitOrReferenceLine(rawLine);
    if (lastEntry && detached) {
      if (detached.unit) {
        lastEntry.unit = lastEntry.unit
          ? `${lastEntry.unit} ${detached.unit}`.trim()
          : detached.unit;
      }
      if (detached.reference) {
        lastEntry.reference = lastEntry.reference
          ? `${lastEntry.reference} ${detached.reference}`.trim()
          : detached.reference;
      }
      continue;
    }

    const group = detectGroup(headings);
    const parsedResult = parseResultLine(rawLine, group);
    if (parsedResult) {
      ensureGroup(group).entries.push(parsedResult);
      lastEntry = parsedResult;
      continue;
    }

    if (lastEntry && canAppendContinuation(lastEntry)) {
      lastEntry.result = `${lastEntry.result}\n${line}`.trim();
    }
  }

  return {
    requestLine,
    groups: orderedGroups.filter((group) => group.entries.length > 0),
  };
}

function canonicalAntibiogramLabel(label: string): string {
  const key = normalizeForMatch(label);
  if (key.includes("EXPOSICION INCREMENTADA"))
    return "Sensible con exposición incrementada";
  if (key.includes("RESISTENTE")) return "Resistente";
  return "Sensible";
}

function joinWithY(items: string[]): string {
  const vals = items.map((x) => x.trim()).filter(Boolean);
  if (vals.length === 0) return "";
  if (vals.length === 1) return vals[0];
  if (vals.length === 2) return `${vals[0]} y ${vals[1]}`;
  return `${vals.slice(0, -1).join(", ")} y ${vals[vals.length - 1]}`;
}

function normalizeNarrative(text: string): string {
  let out = text.replace(/\r/g, "").replace(/\s+/g, " ").trim();
  out = out.replace(/\)\s+Se observan/gi, "). Se observan");
  out = out.replace(/\.\s*\./g, ".");
  if (out && !/[.!?]$/.test(out)) out += ".";
  return out;
}

function formatCultureResult(rawResult: string): string {
  const lines = rawResult
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";

  const isMarker = (line: string) => {
    const key = normalizeForMatch(line);
    return (
      key === "SENSIBLE" ||
      key.startsWith("SENSIBLE CON EXPOSICION INCREMENTADA") ||
      key === "RESISTENTE"
    );
  };

  if (!lines.some((line) => isMarker(line))) {
    return normalizeNarrative(lines.join(" "));
  }

  let germen = "";
  const sections = new Map<string, string[]>();
  let current: string | null = null;

  for (const line of lines) {
    if (isMarker(line)) {
      current = canonicalAntibiogramLabel(line);
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }

    if (!current) {
      germen = germen ? `${germen} ${line}` : line;
      continue;
    }

    sections.get(current)!.push(line);
  }

  const out: string[] = [];
  const germenLine = germen.replace(/\s+/g, " ").trim();
  if (germenLine) out.push(germenLine);

  const sectionOrder = [
    "Sensible",
    "Sensible con exposición incrementada",
    "Resistente",
  ] as const;
  for (const label of sectionOrder) {
    const atbs = sections.get(label) ?? [];
    if (!atbs.length) continue;
    const joined = joinWithY(atbs);
    if (!joined) continue;
    if (label === "Sensible") out.push(`   Sensible a: ${joined}`);
    else if (label === "Sensible con exposición incrementada")
      out.push(`   Sensible con exposición incrementada a ${joined}`);
    else out.push(`   Resistente a ${joined}.`);
  }

  return out.join("\n");
}

function formatResultForOutput(entry: LabEntry): string {
  const nameKey = normalizeForMatch(entry.name);
  if (nameKey.includes("CULTIVO")) return formatCultureResult(entry.result);

  const raw = entry.result.replace(/\s+/g, " ").trim();
  if (entry.unit) return raw;
  if (/^([<>]=?|=)?\s*-?\d+(?:[.,]\d+)?$/.test(raw)) return raw;
  return normalizeNarrative(raw);
}

function formatEntryNameForOutput(name: string): string {
  return name
    .replace(/\bTINCION\b/gi, "TINCIÓN")
    .replace(/\s+/g, " ")
    .trim();
}

function isMicrobiologyGroup(group: string): boolean {
  return normalizeForMatch(group).includes("MICROBIOLOGIA");
}

function indentMultiline(text: string, indent: string): string {
  return text
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");
}

function formatEntryLine(
  entry: LabEntry,
  includeReference: boolean,
  includeConfidence: boolean,
): string {
  const displayResult = entry.unit
    ? formatResultForOutput(entry)
        .replace(/\s*\n+\s*/g, " ")
        .trim()
    : formatResultForOutput(entry);
  const displayName = formatEntryNameForOutput(entry.name);
  const isMicro = isMicrobiologyGroup(entry.group);

  const chunks = [isMicro ? `- ${displayName}:` : displayName];
  if (entry.flag) chunks.push(entry.flag);

  const resultAndUnit = [displayResult, entry.unit].filter(Boolean).join(" ");
  if (resultAndUnit) chunks.push(resultAndUnit);

  let text = chunks.join(" ").replace(/\s+/g, " ").trim();
  if (entry.unit) text = text.replace(/\s*\n+\s*/g, " ").trim();
  if (includeReference && entry.reference) text += ` ${entry.reference}`;
  if (includeConfidence && entry.confidenceNote)
    text += ` (${entry.confidenceNote})`;

  return text;
}

function formatEntryLineColumns(
  entry: LabEntry,
  includeReference: boolean,
  includeConfidence: boolean,
  indent: string,
  nameColumnTarget: number,
  valueColumnTarget: number,
): string {
  const displayResult = formatResultForOutput(entry)
    .replace(/\s*\n+\s*/g, " ")
    .trim();
  const displayUnit = entry.unit.replace(/\s+/g, " ").trim();
  const valueAndUnit = displayUnit
    ? `${displayResult} ${displayUnit}`
    : displayResult;

  const baseNameSpaces = Math.max(1, nameColumnTarget - entry.name.length);
  const isLongName = entry.name.length >= "VOLUMEN CORPUSCULAR MEDIO".length;
  const nameSpaces = Math.max(1, baseNameSpaces - (isLongName ? 4 : 0));
  let text = `${indent}${entry.name}${" ".repeat(nameSpaces)}\t`;
  text += entry.flag ? "* \t" : " \t";
  text += valueAndUnit;

  if (includeReference && entry.reference) {
    const valueSpaces = Math.max(1, valueColumnTarget - valueAndUnit.length);
    text += `${" ".repeat(valueSpaces)}\t${entry.reference}`;
  }
  if (includeConfidence && entry.confidenceNote) {
    const sep = text.endsWith(" ") ? "" : " ";
    text += `${sep}(${entry.confidenceNote})`;
  }

  return text.trimEnd();
}

function buildOutput(
  input: string,
  mode: OutputMode,
  includeReference: boolean,
  includeConfidence: boolean,
  includeRequestLine: boolean,
  useColumns: boolean,
  fontProfile: VisualFontProfile,
): string {
  const parsed = parseInput(input);
  const out: string[] = [];

  const formatGroupTitleLines = (name: string) => name.toUpperCase();
  const formatGroupTitleParagraph = (name: string) => `- ${name.toUpperCase()}`;
  const paramIndent = "  ";
  const entriesForColumns = parsed.groups
    .flatMap((group) => group.entries)
    .filter((entry) => !isMicrobiologyGroup(entry.group));
  const nameColumnTarget =
    Math.max(
      "VOLUMEN CORPUSCULAR MEDIO".length,
      entriesForColumns.reduce(
        (max, entry) => Math.max(max, entry.name.length),
        0,
      ),
    ) + 6;
  const valueColumnTarget =
    Math.max(
      10,
      entriesForColumns.reduce((max, entry) => {
        const result = formatResultForOutput(entry)
          .replace(/\s*\n+\s*/g, " ")
          .trim();
        const unit = entry.unit.replace(/\s+/g, " ").trim();
        const valueAndUnit = unit ? `${result} ${unit}` : result;
        return Math.max(max, valueAndUnit.length);
      }, 0),
    ) + 8;

  void fontProfile;

  if (includeRequestLine && parsed.requestLine) {
    out.push(parsed.requestLine);
    out.push("");
  }

  for (const group of parsed.groups) {
    if (mode === "lineas") {
      out.push(formatGroupTitleLines(group.name));
      for (const entry of group.entries) {
        if (useColumns && !isMicrobiologyGroup(entry.group)) {
          out.push(
            formatEntryLineColumns(
              entry,
              includeReference,
              includeConfidence,
              paramIndent,
              nameColumnTarget,
              valueColumnTarget,
            ).replace(/\s*\n+\s*/g, " "),
          );
        } else {
          out.push(
            indentMultiline(
              formatEntryLine(entry, includeReference, includeConfidence),
              paramIndent,
            ),
          );
        }
      }
      out.push("");
      continue;
    }

    const joined = group.entries
      .map((entry) =>
        formatEntryLine(entry, includeReference, includeConfidence),
      )
      .join("; ");
    out.push(`${formatGroupTitleParagraph(group.name)}: ${joined}`);
    out.push("");
  }

  while (out.length > 0 && !out[out.length - 1]) out.pop();
  return out.join("\n");
}

export default function FormateoAnaliticaOrion() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<OutputMode>("lineas");
  const [useColumns, setUseColumns] = useState(false);
  const fontProfile: VisualFontProfile = "helvetica";
  const [includeReference, setIncludeReference] = useState(true);
  const [includeRequestLine, setIncludeRequestLine] = useState(true);
  const includeConfidence = false;

  const output = useMemo(
    () =>
      buildOutput(
        input,
        mode,
        includeReference,
        includeConfidence,
        includeRequestLine,
        useColumns,
        fontProfile,
      ),
    [input, mode, includeReference, includeRequestLine, useColumns],
  );

  return (
    <main
      className="escala-wrapper space-y-4 orion-analitica-page"
      style={{ padding: 18 }}
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Formateo Analítica Orion</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Detecta parámetro, asterisco, resultado, unidad y referencia. Puedes
          formatear por líneas o en párrafos agrupados por bloques de
          laboratorio.
        </p>
      </header>

      <section className="orion-grid">
        <div className="input-group">
          <label>Pega aquí la analítica de GestLab:</label>
          <textarea
            className="depurador-textarea orion-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pega aquí la analítica..."
            style={{ minHeight: 200 }}
          />
          <div className="mt-1">
            <button
              type="button"
              className="reset-btn orion-reset"
              onClick={() => setInput("")}
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      <section className="orion-card space-y-2">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Vista
            </p>
            <button
              type="button"
              className={`selector-btn selector-btn-compact w-full ${mode === "lineas" ? "activo" : ""}`}
              onClick={() =>
                setMode((prev) => (prev === "lineas" ? "parrafos" : "lineas"))
              }
            >
              {mode === "lineas" ? "LÍNEA" : "PÁRRAFO"}
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Columnas
            </p>
            <button
              type="button"
              className={`selector-btn selector-btn-compact w-full ${useColumns ? "activo" : ""}`}
              disabled={mode !== "lineas"}
              onClick={() => setUseColumns((prev) => !prev)}
            >
              {useColumns ? "SÍ" : "NO"}
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Rangos
            </p>
            <button
              type="button"
              className={`selector-btn selector-btn-compact w-full ${includeReference ? "activo" : ""}`}
              onClick={() => setIncludeReference((prev) => !prev)}
            >
              {includeReference ? "SÍ" : "NO"}
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cabecero
            </p>
            <button
              type="button"
              className={`selector-btn selector-btn-compact w-full ${includeRequestLine ? "activo" : ""}`}
              onClick={() => setIncludeRequestLine((prev) => !prev)}
            >
              {includeRequestLine ? "SÍ" : "NO"}
            </button>
          </div>
        </div>
      </section>

      {output ? <InformeCopiable texto={output} /> : null}
    </main>
  );
}
