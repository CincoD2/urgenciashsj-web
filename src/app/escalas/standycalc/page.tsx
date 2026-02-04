"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import rawData from "./standycalc-data.json";

// @ts-nocheck

type Cell = {
  v?: string;
  f?: string;
  t?: string;
};

type Sheet = {
  cells: Record<string, Cell>;
};

type Workbook = {
  sheets: Record<string, Sheet>;
};

type Node =
  | { type: "number"; value: number }
  | { type: "cell"; sheet?: string; ref: string }
  | { type: "unary"; op: "+" | "-"; expr: Node }
  | { type: "binary"; op: "+" | "-" | "*" | "/" | "^"; left: Node; right: Node }
  | { type: "compare"; op: "=" | "<>" | "<" | "<=" | ">" | ">="; left: Node; right: Node }
  | { type: "func"; name: string; args: Node[] };

const workbook = rawData as Workbook;

function isNumericString(value: string) {
  return /^-?\d+(?:\.\d+)?$/.test(value.trim());
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    if (isNumericString(value)) return Number(value);
    return Number.NaN;
  }
  if (value == null) return 0;
  return Number.NaN;
}

function formatValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    if (Number.isInteger(value)) return value.toString();
    return new Intl.NumberFormat("es-ES", {
      maximumFractionDigits: 4,
    }).format(value);
  }
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

function formatValueFixed(value: unknown, decimals: number): string {
  if (value == null) return "";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
  return formatValue(value);
}

const SUEROS_VOLUMENES = {
  50: { llenado: 59, aire: 20, adicional: 80.5, residual: 0.9 },
  100: { llenado: 111, aire: 12, adicional: 77, residual: 1 },
  250: { llenado: 271, aire: 20, adicional: 167, residual: 1.3 },
  500: { llenado: 530, aire: 15, adicional: 295.1, residual: 2.5 },
  1000: { llenado: 1047, aire: 15, adicional: 236.5, residual: 4.4 },
} as const;

function calcOrionFrequency(hours: number) {
  if (!Number.isFinite(hours)) return null;
  if (hours >= 1 && hours < 2) return 1;
  if (hours >= 2 && hours < 3) return 2;
  if (hours >= 3 && hours < 4) return 3;
  if (hours >= 4 && hours < 6) return 4;
  if (hours >= 6 && hours < 8) return 6;
  if (hours >= 8 && hours < 12) return 8;
  if (hours >= 12 && hours < 24) return 12;
  return 24;
}

function calcOrionFromMlh(mlh: unknown, volumen: number) {
  const value = typeof mlh === "number" ? mlh : Number(mlh);
  if (!Number.isFinite(value) || value <= 0) return null;
  return calcOrionFrequency(volumen / value);
}

function calcMlhFromDoseMgKgH(dose: number, peso: "" | number, concMgMl: number) {
  if (peso === "" || !Number.isFinite(concMgMl) || concMgMl <= 0) return null;
  const mlh = (dose * Number(peso)) / concMgMl;
  return Number.isFinite(mlh) ? mlh : null;
}

function normalizeCellRef(ref: string): string {
  return ref.replace(/\$/g, "").toUpperCase();
}

function colToIndex(col: string) {
  let idx = 0;
  for (const ch of col) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx;
}

function indexToCol(idx: number) {
  let s = "";
  let n = idx;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

class FormulaParser {
  private i = 0;
  constructor(private src: string) {}

  parse(): Node {
    const expr = this.parseComparison();
    this.skip();
    return expr;
  }

  private skip() {
    while (this.i < this.src.length && /\s/.test(this.src[this.i])) this.i += 1;
  }

  private peek() {
    return this.src[this.i] ?? "";
  }

  private match(str: string) {
    if (this.src.slice(this.i, this.i + str.length) === str) {
      this.i += str.length;
      return true;
    }
    return false;
  }

  private parseComparison(): Node {
    let left = this.parseAddSub();
    this.skip();
    const ops = [">=", "<=", "<>", "=", ">", "<"] as const;
    for (const op of ops) {
      if (this.match(op)) {
        const right = this.parseAddSub();
        return { type: "compare", op, left, right };
      }
    }
    return left;
  }

  private parseAddSub(): Node {
    let node = this.parseMulDiv();
    while (true) {
      this.skip();
      if (this.match("+")) {
        node = { type: "binary", op: "+", left: node, right: this.parseMulDiv() };
        continue;
      }
      if (this.match("-")) {
        node = { type: "binary", op: "-", left: node, right: this.parseMulDiv() };
        continue;
      }
      break;
    }
    return node;
  }

  private parseMulDiv(): Node {
    let node = this.parsePower();
    while (true) {
      this.skip();
      if (this.match("*")) {
        node = { type: "binary", op: "*", left: node, right: this.parsePower() };
        continue;
      }
      if (this.match("/")) {
        node = { type: "binary", op: "/", left: node, right: this.parsePower() };
        continue;
      }
      break;
    }
    return node;
  }

  private parsePower(): Node {
    let node = this.parseUnary();
    this.skip();
    if (this.match("^")) {
      node = { type: "binary", op: "^", left: node, right: this.parsePower() };
    }
    return node;
  }

  private parseUnary(): Node {
    this.skip();
    if (this.match("+")) return { type: "unary", op: "+", expr: this.parseUnary() };
    if (this.match("-")) return { type: "unary", op: "-", expr: this.parseUnary() };
    return this.parsePrimary();
  }

  private parsePrimary(): Node {
    this.skip();
    if (this.match("(")) {
      const node = this.parseComparison();
      this.match(")");
      return node;
    }

    const cell = this.parseCellRef();
    if (cell) return cell;

    const num = this.parseNumber();
    if (num) return num;

    const ident = this.parseIdentifier();
    if (ident) {
      this.skip();
      if (this.match("(")) {
        const args: Node[] = [];
        this.skip();
        if (!this.match(")")) {
          while (true) {
            args.push(this.parseComparison());
            this.skip();
            if (this.match(")")) break;
            this.match(",");
          }
        }
        return { type: "func", name: ident.toUpperCase(), args };
      }
    }

    return { type: "number", value: 0 };
  }

  private parseNumber(): Node | null {
    this.skip();
    const match = this.src.slice(this.i).match(/^-?\d+(?:\.\d+)?/);
    if (!match) return null;
    this.i += match[0].length;
    return { type: "number", value: Number(match[0]) };
  }

  private parseIdentifier(): string | null {
    this.skip();
    const match = this.src.slice(this.i).match(/^[A-Z_][A-Z0-9_]*/i);
    if (!match) return null;
    this.i += match[0].length;
    return match[0];
  }

  private parseCellRef(): Node | null {
    this.skip();
    const start = this.i;

    if (this.peek() === "'") {
      this.i += 1;
      const end = this.src.indexOf("'", this.i);
      if (end === -1) {
        this.i = start;
        return null;
      }
      const sheet = this.src.slice(this.i, end);
      this.i = end + 1;
      if (!this.match("!")) {
        this.i = start;
        return null;
      }
      const ref = this.parseCellOnly();
      if (!ref) {
        this.i = start;
        return null;
      }
      return { type: "cell", sheet, ref };
    }

    const sheetMatch = this.src.slice(this.i).match(/^([A-Z0-9_]+)!/);
    if (sheetMatch) {
      const sheet = sheetMatch[1];
      this.i += sheetMatch[0].length;
      const ref = this.parseCellOnly();
      if (!ref) {
        this.i = start;
        return null;
      }
      return { type: "cell", sheet, ref };
    }

    const ref = this.parseCellOnly();
    if (ref) return { type: "cell", ref };

    return null;
  }

  private parseCellOnly(): string | null {
    const match = this.src.slice(this.i).match(/^\$?[A-Z]+\$?\d+/);
    if (!match) return null;
    this.i += match[0].length;
    return normalizeCellRef(match[0]);
  }
}

function buildEvaluator(
  workbook: Workbook,
  overrides: Record<string, Record<string, number | string | null>>,
) {
  const cache = new Map<string, unknown>();

  function getCellValue(sheetName: string, ref: string): unknown {
    const key = `${sheetName}!${normalizeCellRef(ref)}`;
    if (cache.has(key)) return cache.get(key);

    const override = overrides[sheetName]?.[normalizeCellRef(ref)];
    if (override !== undefined) {
      cache.set(key, override);
      return override;
    }

    const sheet = workbook.sheets[sheetName];
    const cell = sheet?.cells?.[normalizeCellRef(ref)];
    if (!cell) {
      cache.set(key, 0);
      return 0;
    }

    if (cell.f) {
      const parser = new FormulaParser(cell.f);
      const node = parser.parse();
      const value = evalNode(node, sheetName);
      cache.set(key, value);
      return value;
    }

    if (cell.v == null) {
      cache.set(key, 0);
      return 0;
    }

    const raw = cell.v;
    let value: unknown = raw;
    if (cell.t !== "s" && isNumericString(raw)) value = Number(raw);
    if (raw === "#DIV/0!" || raw === "#VALUE!") value = Number.NaN;
    cache.set(key, value);
    return value;
  }

  function evalNode(node: Node, currentSheet: string): unknown {
    switch (node.type) {
      case "number":
        return node.value;
      case "cell": {
        const sheet = node.sheet ?? currentSheet;
        return getCellValue(sheet, node.ref);
      }
      case "unary": {
        const value = toNumber(evalNode(node.expr, currentSheet));
        return node.op === "-" ? -value : value;
      }
      case "binary": {
        const left = toNumber(evalNode(node.left, currentSheet));
        const right = toNumber(evalNode(node.right, currentSheet));
        switch (node.op) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/":
            return right === 0 ? Number.NaN : left / right;
          case "^":
            return left ** right;
          default:
            return Number.NaN;
        }
      }
      case "compare": {
        const left = toNumber(evalNode(node.left, currentSheet));
        const right = toNumber(evalNode(node.right, currentSheet));
        if (Number.isNaN(left) || Number.isNaN(right)) return false;
        switch (node.op) {
          case "=":
            return left === right;
          case "<>":
            return left !== right;
          case ">":
            return left > right;
          case ">=":
            return left >= right;
          case "<":
            return left < right;
          case "<=":
            return left <= right;
          default:
            return false;
        }
      }
      case "func": {
        const name = node.name.toUpperCase();
        if (name === "IF") {
          const [cond, a, b] = node.args;
          return evalNode(cond, currentSheet) ? evalNode(a, currentSheet) : evalNode(b, currentSheet);
        }
        if (name === "AND") {
          return node.args.every((arg) => Boolean(evalNode(arg, currentSheet)));
        }
        if (name === "SQRT") {
          const value = toNumber(evalNode(node.args[0], currentSheet));
          return Math.sqrt(value);
        }
        return Number.NaN;
      }
      default:
        return Number.NaN;
    }
  }

  return { getCellValue };
}

function getUsedRange(sheet: Sheet) {
  const refs = Object.keys(sheet.cells);
  let minRow = Infinity;
  let maxRow = 0;
  let minCol = Infinity;
  let maxCol = 0;
  for (const ref of refs) {
    const match = ref.match(/([A-Z]+)(\d+)/);
    if (!match) continue;
    const col = colToIndex(match[1]);
    const row = Number(match[2]);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
  }
  if (!refs.length) return null;
  return { minRow, maxRow, minCol, maxCol };
}

function buildGrid(sheet: Sheet) {
  const range = getUsedRange(sheet);
  if (!range) return { rows: [], cols: [] };
  const cols = [] as string[];
  for (let c = range.minCol; c <= range.maxCol; c += 1) cols.push(indexToCol(c));
  const rows = [] as number[];
  for (let r = range.minRow; r <= range.maxRow; r += 1) rows.push(r);
  return { rows, cols };
}

function normalizeLabel(value: string) {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "");
}

function isSectionHeader(value: string) {
  const label = normalizeLabel(value);
  if (label.startsWith("DOSIS") || label.startsWith("DILUCION") || label.startsWith("VELOCIDAD")) return false;
  return (
    label.includes("ESTANDAR") ||
    label.includes("BOLO") ||
    label.includes("CONCENTRADA") ||
    label.includes("EMERGENCIA") ||
    label.includes("CARGA") ||
    label.includes("MANTENIMIENTO")
  );
}

function getButtonLabel(sectionLabel: string, names: string[]) {
  const normalized = normalizeLabel(sectionLabel);
  const match = names.find((name) => normalized.includes(name));
  return match ?? sectionLabel;
}

function StandyCalcClient() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"estandar" | "restringidas" | "instrucciones">(
    "estandar",
  );
  const [peso, setPeso] = useState<"" | number>(70);
  const [talla, setTalla] = useState<"" | number>(170);
  const [dobuCustomDose, setDobuCustomDose] = useState("");
  const [dopaCustomDose, setDopaCustomDose] = useState("");
  const [flecaCustomDose, setFlecaCustomDose] = useState("");
  const [furoCustomDose, setFuroCustomDose] = useState("");

  const overrides = useMemo(() => {
    const data: Record<string, Record<string, number | string | null>> = {
      "DATOS PACIENTE": {},
    };
    if (peso !== "") data["DATOS PACIENTE"].C13 = peso;
    if (talla !== "") data["DATOS PACIENTE"].C14 = talla;
    return data;
  }, [peso, talla]);

  const evaluator = useMemo(() => buildEvaluator(workbook, overrides), [overrides]);

  const datosSheet = workbook.sheets["DATOS PACIENTE"];
  const mezclasEstandar = workbook.sheets["MEZCLAS ESTANDAR"];
  const mezclasRestringidas = workbook.sheets["MEZCLAS RESTRINGIDAS"];
  const instrucciones = workbook.sheets["Instrucciones"];

  const estandarGrid = useMemo(() => buildGrid(mezclasEstandar), [mezclasEstandar]);
  const restringidasGrid = useMemo(() => buildGrid(mezclasRestringidas), [mezclasRestringidas]);

  const standardDrugNames = useMemo(
    () => [
      "N-ACETILCISTEINA",
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
    ],
    [],
  );

  const enabledStandardCards = useMemo(
    () => [
      "AMIODARONA",
      "DOBUTAMINA",
      "DOPAMINA",
      "FLECAINIDA",
      "NITROGLICERINA",
      "NITROPRUSIATO",
      "FLUMAZENILO",
      "FUROSEMIDA",
      "HEPARINA",
    ],
    [],
  );

  const restrictedDrugNames = useMemo(
    () => [
      "CISATRACURIO",
      "ESMOLOL",
      "FUROSEMIDA CONC",
      "LEVOSIMENDAN",
      "MIDAZOLAM",
      "NORADRENALINA",
      "PROCAINAMIDA",
      "SALBUTAMOL",
      "URAPIDIL",
    ],
    [],
  );

  const enabledRestrictedCards = useMemo<string[]>(() => [], []);

  const standardHeaders = useMemo(() => {
    const headers: { row: number; label: string; isAllowed: boolean }[] = [];
    Object.entries(mezclasEstandar.cells).forEach(([ref, cell]) => {
      if (!ref.startsWith("B") || !cell?.v) return;
      const row = Number(ref.slice(1));
      const label = String(cell.v);
      if (!isSectionHeader(label)) return;
      const normalized = normalizeLabel(label);
      const isAllowed = standardDrugNames.some((name) => normalized.includes(name));
      headers.push({ row, label: label.trim(), isAllowed });
    });
    headers.sort((a, b) => a.row - b.row);
    return headers;
  }, [mezclasEstandar, standardDrugNames]);

  const standardSections = useMemo(() => {
    const seen = new Set<string>();
    return standardHeaders.filter((header) => {
      if (!header.isAllowed) return false;
      const key = getButtonLabel(header.label, standardDrugNames);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [standardHeaders, standardDrugNames]);

  const restrictedSections = useMemo(() => {
    const seen = new Set<string>();
    const headers: { row: number; label: string }[] = [];
    Object.entries(mezclasRestringidas.cells).forEach(([ref, cell]) => {
      if (!ref.startsWith("B") || !cell?.v) return;
      const row = Number(ref.slice(1));
      const label = String(cell.v);
      if (!isSectionHeader(label)) return;
      const normalized = normalizeLabel(label);
      if (!restrictedDrugNames.some((name) => normalized.includes(name))) return;
      const display = getButtonLabel(label, restrictedDrugNames);
      if (seen.has(display)) return;
      seen.add(display);
      headers.push({ row, label: label.trim() });
    });
    headers.sort((a, b) => a.row - b.row);
    return headers;
  }, [mezclasRestringidas, restrictedDrugNames]);

  const [selectedStandard, setSelectedStandard] = useState<number | null>(null);
  const [selectedRestricted, setSelectedRestricted] = useState<number | null>(null);
  const selectedStandardSection = useMemo(
    () => standardSections.find((section) => section.row === selectedStandard) ?? null,
    [standardSections, selectedStandard],
  );
  const selectedStandardName = useMemo(
    () =>
      selectedStandardSection
        ? getButtonLabel(selectedStandardSection.label, standardDrugNames)
        : "",
    [selectedStandardSection, standardDrugNames],
  );

  const standardLookup = useMemo(
    () =>
      new Map(
        standardSections.map((section) => [
          getButtonLabel(section.label, standardDrugNames),
          section.row,
        ]),
      ),
    [standardSections, standardDrugNames],
  );

  const restrictedLookup = useMemo(
    () =>
      new Map(
        restrictedSections.map((section) => [
          getButtonLabel(section.label, restrictedDrugNames),
          section.row,
        ]),
      ),
    [restrictedSections, restrictedDrugNames],
  );

  const [searchNotice, setSearchNotice] = useState<string>("");

  useEffect(() => {
    const raw = searchParams.get("drug");
    if (!raw) return;
    const normalized = normalizeLabel(raw);
    const fromStandard = [...standardLookup.keys()].find((k) => normalizeLabel(k) === normalized);
    const fromRestricted = [...restrictedLookup.keys()].find((k) => normalizeLabel(k) === normalized);
    if (fromStandard) {
      setActiveTab("estandar");
      if (enabledStandardCards.includes(fromStandard)) {
        setSelectedStandard(standardLookup.get(fromStandard) ?? null);
        setSearchNotice("");
      } else {
        setSelectedStandard(null);
        setSearchNotice(`"${fromStandard}" está en Mezclas estándar, pero aún no está habilitado.`);
      }
      return;
    }
    if (fromRestricted) {
      setActiveTab("restringidas");
      if (enabledRestrictedCards.includes(fromRestricted)) {
        setSelectedRestricted(restrictedLookup.get(fromRestricted) ?? null);
        setSearchNotice("");
      } else {
        setSelectedRestricted(null);
        setSearchNotice(`"${fromRestricted}" está en Mezclas restringidas, pero aún no está habilitado.`);
      }
      return;
    }
    setSearchNotice(`No se ha encontrado "${raw}".`);
  }, [
    searchParams,
    standardLookup,
    restrictedLookup,
    enabledStandardCards,
    enabledRestrictedCards,
  ]);

  // No default selection for restricted mixes.

  const standardRowSet = useMemo(() => {
    const rows = new Set<number>();
    const endRow = estandarGrid.rows.length ? estandarGrid.rows[estandarGrid.rows.length - 1] : 0;
    for (let i = 0; i < standardSections.length; i += 1) {
      const current = standardSections[i];
      const next = standardSections[i + 1];
      if (selectedStandard !== current.row) continue;
      const from = current.row;
      const to = (next ? next.row - 1 : endRow) || from;
      for (let r = from; r <= to; r += 1) rows.add(r);
    }
    return rows;
  }, [standardSections, selectedStandard, estandarGrid.rows]);

  const restrictedRowSet = useMemo(() => {
    const rows = new Set<number>();
    const endRow = restringidasGrid.rows.length
      ? restringidasGrid.rows[restringidasGrid.rows.length - 1]
      : 0;
    for (let i = 0; i < restrictedSections.length; i += 1) {
      const current = restrictedSections[i];
      const next = restrictedSections[i + 1];
      if (selectedRestricted !== current.row) continue;
      const from = current.row;
      const to = (next ? next.row - 1 : endRow) || from;
      for (let r = from; r <= to; r += 1) rows.add(r);
    }
    return rows;
  }, [restrictedSections, selectedRestricted, restringidasGrid.rows]);

  const imc = evaluator.getCellValue("DATOS PACIENTE", "C15");
  const sc = evaluator.getCellValue("DATOS PACIENTE", "C16");
  const pesoIdeal = evaluator.getCellValue("DATOS PACIENTE", "C17");

  const amioAmpollas = 2;
  const amioMgPorAmpolla = 150;
  const amioMlPorAmpolla = 3;
  const amioSuero = 100;
  const amioVolumenMezcla = SUEROS_VOLUMENES[amioSuero].llenado + amioAmpollas * amioMlPorAmpolla;
  const amioConcentracion = (amioAmpollas * amioMgPorAmpolla) / amioVolumenMezcla;
  const amioVelocidadRapida = amioVolumenMezcla / (20 / 60);
  const amioVelocidadLenta = amioVolumenMezcla / 2;
  const amio2Ampollas = 6;
  const amio2Suero = 500;
  const amio2VolumenMezcla = SUEROS_VOLUMENES[amio2Suero].llenado + amio2Ampollas * amioMlPorAmpolla;
  const amio2Concentracion = (amio2Ampollas * amioMgPorAmpolla) / amio2VolumenMezcla;
  const amioDia1 = [
    { dosis: 10, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E30"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I30") },
    { dosis: 15, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E31"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I31") },
    { dosis: 20, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E32"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I32") },
  ];
  const amioSucesivos = [
    { dosis: 10, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E34"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I34") },
    { dosis: 15, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E35"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I35") },
    { dosis: 20, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E36"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I36") },
  ];

  const dobuAmpollas = 2;
  const dobuMgPorAmpolla = 250;
  const dobuMlPorAmpolla = 20;
  const dobuSuero = 250;
  const dobuVolumenMezcla = SUEROS_VOLUMENES[dobuSuero].llenado + dobuAmpollas * dobuMlPorAmpolla;
  const dobuConcentracion = (dobuAmpollas * dobuMgPorAmpolla) / dobuVolumenMezcla;
  const dobuVelocidades = [
    { dosis: 2, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E46"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I46") },
    { dosis: 10, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E47"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I47") },
    { dosis: 15, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E48"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I48") },
    { dosis: 18, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E49"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I49") },
    { dosis: 20, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E50"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I50") },
  ];
  const dobuCustomDoseNum = Number(dobuCustomDose);
  const dobuDoseCapped = Number.isFinite(dobuCustomDoseNum) ? Math.min(dobuCustomDoseNum, 40) : null;
  const dobuCustomMlh =
    dobuDoseCapped != null && peso !== ""
      ? ((dobuDoseCapped * Number(peso) * 60) / 1000) / dobuConcentracion
      : null;
  const dobuCustomHoras =
    dobuCustomMlh != null && dobuCustomMlh > 0 ? dobuVolumenMezcla / dobuCustomMlh : null;
  const dobuCustomFrecuencia = dobuCustomHoras != null ? calcOrionFrequency(dobuCustomHoras) : null;

  const dopaAmpollas = 2;
  const dopaMgPorAmpolla = 200;
  const dopaMlPorAmpolla = 5;
  const dopaSuero = 250;
  const dopaVolumenMezcla = SUEROS_VOLUMENES[dopaSuero].llenado + dopaAmpollas * dopaMlPorAmpolla;
  const dopaConcentracion = (dopaAmpollas * dopaMgPorAmpolla) / dopaVolumenMezcla;
  const dopaVelocidades = [
    { dosis: 2, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E62"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I62"), texto: "Dosis Dopa (vasodilatador renal)" },
    { dosis: 4, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E63"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I63"), texto: "Dosis Dopa (vasodilatador renal)" },
    { dosis: 5, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E64"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I64"), texto: "Dosis Beta (crono+, ino+, vasodilatador)" },
    { dosis: 14, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E65"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I65"), texto: "Dosis Beta (crono+, ino+, vasodilatador)" },
    { dosis: 15, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E66"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I66"), texto: "Dosis Alfa (vasoconstrictor)" },
    { dosis: 40, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E67"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I67"), texto: "Dosis Alfa (vasoconstrictor)" },
  ];
  const dopaCustomDoseNum = Number(dopaCustomDose);
  const dopaDoseCapped = Number.isFinite(dopaCustomDoseNum) ? Math.min(dopaCustomDoseNum, 50) : null;
  const dopaCustomMlh =
    dopaDoseCapped != null && peso !== ""
      ? ((dopaDoseCapped * Number(peso) * 60) / 1000) / dopaConcentracion
      : null;
  const dopaCustomHoras =
    dopaCustomMlh != null && dopaCustomMlh > 0 ? dopaVolumenMezcla / dopaCustomMlh : null;
  const dopaCustomFrecuencia = dopaCustomHoras != null ? calcOrionFrequency(dopaCustomHoras) : null;
  const dopaCustomZona =
    dopaDoseCapped == null
      ? null
      : dopaDoseCapped <= 4
        ? { color: "#ecfdf5", texto: "Dosis Dopa (vasodilatador renal)" }
        : dopaDoseCapped <= 14
          ? { color: "#fff7ed", texto: "Dosis Beta (crono+, ino+, vasodilatador)" }
          : { color: "#fff1f2", texto: "Dosis Alfa (vasoconstrictor)" };

  const flecaAmpollas = 1;
  const flecaMgPorAmpolla = 150;
  const flecaMlPorAmpolla = 15;
  const flecaSuero = 100;
  const flecaVolumenMezcla = SUEROS_VOLUMENES[flecaSuero].llenado + flecaAmpollas * flecaMlPorAmpolla;
  const flecaConcentracion = (flecaAmpollas * flecaMgPorAmpolla) / flecaVolumenMezcla;
  const flecaCargaVolumen = evaluator.getCellValue("MEZCLAS ESTANDAR", "E79");
  const flecaCargaVelocidad = evaluator.getCellValue("MEZCLAS ESTANDAR", "G79");
  const flecaMantenimiento = [
    { dosis: 0.1, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E82"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I82") },
    { dosis: 0.15, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E83"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I83") },
    { dosis: 0.25, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E84"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I84") },
    { dosis: 0.3, velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", "E85"), frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", "I85") },
  ];
  const flecaMaxMlh = evaluator.getCellValue("MEZCLAS ESTANDAR", "O85");
  const flecaCustomDoseNum = Number(flecaCustomDose);
  const flecaDoseCapped = Number.isFinite(flecaCustomDoseNum) ? Math.min(flecaCustomDoseNum, 600) : null;
  const flecaCustomMlh =
    flecaDoseCapped != null ? (flecaDoseCapped / 24) / flecaConcentracion : null;
  const flecaCustomHoras =
    flecaCustomMlh != null && flecaCustomMlh > 0 ? flecaVolumenMezcla / flecaCustomMlh : null;
  const flecaCustomFrecuencia = flecaCustomHoras != null ? calcOrionFrequency(flecaCustomHoras) : null;

  const nitroAmpollas = 5;
  const nitroMgPorAmpolla = 5;
  const nitroMlPorAmpolla = 5;
  const nitroSuero = 250;
  const nitroVolumenMezcla = SUEROS_VOLUMENES[nitroSuero].llenado + nitroAmpollas * nitroMlPorAmpolla;
  const nitroConcentracion = (nitroAmpollas * nitroMgPorAmpolla) / nitroVolumenMezcla;
  const nitroVelocidades = [247, 248, 249, 250, 251, 252, 253, 254, 255].map((row) => ({
    dosis: evaluator.getCellValue("MEZCLAS ESTANDAR", `B${row}`),
    velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", `F${row}`),
    frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", `I${row}`),
  }));

  const nprAmpollas = 2;
  const nprMgPorVial = 50;
  const nprMlPorVial = 5;
  const nprSuero = 500;
  const nprVolumenMezcla = SUEROS_VOLUMENES[nprSuero].llenado + nprAmpollas * nprMlPorVial;
  const nprConcentracion = ((nprAmpollas * nprMgPorVial) * 1000) / nprVolumenMezcla; // µg/ml
  const nprVelocidades = [265, 266, 267, 268, 269, 270].map((row) => ({
    dosis: evaluator.getCellValue("MEZCLAS ESTANDAR", `B${row}`),
    velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", `E${row}`),
    frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", `I${row}`),
  }));

  const flumaAmpollas = 5;
  const flumaMgPorAmpolla = 0.5;
  const flumaMlPorAmpolla = 5;
  const flumaSuero = 100;
  const flumaVolumenMezcla = SUEROS_VOLUMENES[flumaSuero].llenado + flumaAmpollas * flumaMlPorAmpolla;
  const flumaConcentracion = (flumaAmpollas * flumaMgPorAmpolla * 1000) / flumaVolumenMezcla; // µg/ml
  const flumaMantenimiento = [102, 103, 104, 105].map((row) => ({
    dosis: evaluator.getCellValue("MEZCLAS ESTANDAR", `B${row}`),
    velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", `E${row}`),
    frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", `I${row}`),
  }));

  const furoAmpollas = 5;
  const furoMgPorAmpolla = 20;
  const furoMlPorAmpolla = 2;
  const furoSuero = 100;
  const furoVolumenMezcla = SUEROS_VOLUMENES[furoSuero].llenado + furoAmpollas * furoMlPorAmpolla;
  const furoConcentracion = (furoAmpollas * furoMgPorAmpolla) / furoVolumenMezcla;
  const furoVelocidades = [115, 116, 117, 118, 119, 120].map((row) => ({
    dosis: evaluator.getCellValue("MEZCLAS ESTANDAR", `B${row}`),
    velocidad: evaluator.getCellValue("MEZCLAS ESTANDAR", `E${row}`),
    frecuencia: evaluator.getCellValue("MEZCLAS ESTANDAR", `I${row}`),
  }));
  const furoCustomDoseNum = Number(furoCustomDose);
  const furoDoseCapped = Number.isFinite(furoCustomDoseNum) ? Math.min(furoCustomDoseNum, 1500) : null;
  const furoCustomMlh =
    furoDoseCapped != null ? (furoDoseCapped / 24) / furoConcentracion : null;
  const furoCustomFrecuencia = furoCustomMlh != null ? calcOrionFromMlh(furoCustomMlh, furoVolumenMezcla) : null;

  const hepaVialUi = 5000;
  const hepaVialMl = 5;
  const hepaSuero = 500;
  const hepaVolumenMezcla = SUEROS_VOLUMENES[hepaSuero].llenado + hepaVialMl;
  const hepaUiMl =
    typeof evaluator.getCellValue("MEZCLAS ESTANDAR", "I135") === "number"
      ? (evaluator.getCellValue("MEZCLAS ESTANDAR", "I135") as number)
      : hepaVialUi / hepaVialMl;
  const hepaCargaUi = peso === "" ? null : Number(peso) * 80;
  const hepaCargaMl = hepaCargaUi != null ? hepaCargaUi / (hepaVialUi / hepaVialMl) : null;
  const hepaCargaMin = peso === "" ? null : (Number(peso) * 80) / 2000;
  const hepaMantenimientoUiKgH = 18;
  const hepaMantenimientoMlh =
    peso === "" ? null : (Number(peso) * hepaMantenimientoUiKgH) / hepaUiMl;
  const hepaMantenimientoFreq = evaluator.getCellValue("MEZCLAS ESTANDAR", "I139");

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">STANDyCALC</h1>
        <p className="text-sm text-slate-600">
          Calculadora de mezclas para perfusión. Introduce los datos del paciente y revisa las tablas de mezclas
          estándar y restringidas.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Datos del paciente</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Peso (kg)</span>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              type="number"
              value={peso}
              onChange={(event) => setPeso(event.target.value === "" ? "" : Number(event.target.value))}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Talla (cm)</span>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              type="number"
              value={talla}
              onChange={(event) => setTalla(event.target.value === "" ? "" : Number(event.target.value))}
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center text-xs uppercase tracking-wide text-slate-500">
              <span>IMC</span>
              <span className="tooltip">
                ?<span className="tooltip-text">Índice de Masa Corporal</span>
              </span>
            </div>
            <div className="text-lg font-semibold text-slate-900">
              {formatValueFixed(imc, 1)}
              <span className="ml-2 text-xs font-medium text-slate-500">kg/m²</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center text-xs uppercase tracking-wide text-slate-500">
              <span>SC</span>
              <span className="tooltip">
                ?<span className="tooltip-text">Superficie Corporal</span>
              </span>
            </div>
            <div className="text-lg font-semibold text-slate-900">
              {formatValueFixed(sc, 2)}
              <span className="ml-2 text-xs font-medium text-slate-500">m²</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Peso ideal</div>
            <div className="text-lg font-semibold text-slate-900">
              {formatValue(pesoIdeal)}
              <span className="ml-2 text-xs font-medium text-slate-500">kg</span>
            </div>
          </div>
        </div>

      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              activeTab === "estandar"
                ? "border-[#2b5d68] bg-[#2b5d68] text-white"
                : "border-[#dfe9eb] text-[#2b5d68] hover:border-[#c7dadd] hover:bg-[#eef6f8]"
            }`}
            onClick={() => setActiveTab("estandar")}
          >
            Mezclas estándar
          </button>
          <button
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              activeTab === "restringidas"
                ? "border-rose-700 bg-rose-700 text-white"
                : "border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50"
            }`}
            onClick={() => setActiveTab("restringidas")}
          >
            Mezclas restringidas
          </button>
          <button
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              activeTab === "instrucciones"
                ? "border-[#2b5d68] bg-[#2b5d68] text-white"
                : "border-[#dfe9eb] text-[#2b5d68] hover:border-[#c7dadd] hover:bg-[#eef6f8]"
            }`}
            onClick={() => setActiveTab("instrucciones")}
          >
            Instrucciones
          </button>
        </div>

        {activeTab === "estandar" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">MEZCLAS ESTÁNDAR</div>
            {searchNotice && activeTab === "estandar" ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {searchNotice}
              </div>
            ) : null}
            {standardSections.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {standardSections.map((section) => {
                  const label = getButtonLabel(section.label, standardDrugNames);
                  const isEnabled = enabledStandardCards.includes(label);
                  return (
                    <button
                      key={section.row}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        selectedStandard === section.row
                          ? "border-[#2b5d68] bg-[#2b5d68] text-white"
                          : "border-[#dfe9eb] text-[#2b5d68] hover:border-[#c7dadd] hover:bg-[#eef6f8]"
                      } ${!isEnabled ? "cursor-not-allowed opacity-40" : ""}`}
                      onClick={() => setSelectedStandard(section.row)}
                      disabled={!isEnabled}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selectedStandardName === "AMIODARONA" ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#2b5d68]">
                    AMIODARONA ESTÁNDAR <span className="text-slate-500">(50 mg/mL)</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Trangorex ®</div>
                  <div className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 150 mg / 3 mL
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tooltip tooltip-icon">
                    <img
                      src="/img/standycalc_icons/grupos_terapeuticos/antiarritmico.svg"
                      alt="Antiarrítmico"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="tooltip-text">Antiarrítmico</span>
                  </span>
                  <a
                    href="https://www.ismp-espana.org/ficheros/Medicamentos%20alto%20riesgo%202012.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="tooltip tooltip-icon"
                  >
                    <img
                      src="/img/standycalc_icons/alto_riesgo.svg"
                      alt="Alto riesgo"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="tooltip-text">Alto riesgo</span>
                  </a>
                </div>
              </div>

              <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                <img
                  src="/img/standycalc_icons/diluciones/2_100r.svg"
                  alt="2 ampollas en 100 mL SG5%"
                  className="absolute right-4 top-4 h-8 w-8"
                />
                <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                  MEZCLA 1: DOSIS DE CARGA
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                  <span>
                    <span className="font-semibold text-slate-900">Dilución:</span> 2 ampollas + 100 mL SG5%
                    (exclusivamente)
                  </span>
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Concentración real:</span>{" "}
                  {formatValueFixed(amioConcentracion, 2)} mg/mL
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Rango de velocidad:</span>{" "}
                  {formatValueFixed(amioVelocidadRapida, 0)} mL/h a {formatValueFixed(amioVelocidadLenta, 0)} mL/h
                  <span className="text-slate-500"> (20 min a 2 h)</span>
                </div>
              </div>

              <div className="relative mt-4 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                <img
                  src="/img/standycalc_icons/diluciones/6_500r.svg"
                  alt="6 ampollas en 500 mL SG5%"
                  className="absolute right-4 top-4 h-8 w-8"
                />
                <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                  MEZCLA 2: DOSIS DE MANTENIMIENTO
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                  <span>
                    <span className="font-semibold text-slate-900">Dilución:</span> 6 ampollas + 500 mL SG5%
                    (exclusivamente)
                  </span>
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Concentración real:</span>{" "}
                  {formatValueFixed(amio2Concentracion, 2)} mg/mL
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Velocidad día 1</div>
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                    {amioDia1.map((item) => (
                      <div
                        key={`amio-d1-${item.dosis}`}
                        className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                      >
                        <div className="text-xs text-slate-500">{item.dosis} mg/kg/24 h</div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {formatValueFixed(item.velocidad, 0)} mL/h
                        </div>
                        <div className="text-xs text-slate-500">
                          c/ {formatValueFixed(item.frecuencia, 0)} h (Orion)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Velocidad días sucesivos
                  </div>
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                    {amioSucesivos.map((item) => (
                      <div
                        key={`amio-ds-${item.dosis}`}
                        className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                      >
                        <div className="text-xs text-slate-500">{item.dosis} mg/kg/24 h</div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {formatValueFixed(item.velocidad, 0)} mL/h
                        </div>
                        <div className="text-xs text-slate-500">
                          c/ {formatValueFixed(item.frecuencia, 0)} h (Orion)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                <span className="font-semibold">Dosis máxima:</span> 1200 mg en 24 horas
              </div>
              </div>
            ) : null}

            {selectedStandardName === "DOBUTAMINA" ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#2b5d68]">
                    DOBUTAMINA ESTÁNDAR <span className="text-slate-500">(12,5 mg/mL)</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 250 mg / 20 mL
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tooltip tooltip-icon">
                    <img
                      src="/img/standycalc_icons/grupos_terapeuticos/inotropico.svg"
                      alt="Inotrópico"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="tooltip-text">Inotrópico</span>
                  </span>
                  <a
                    href="https://www.ismp-espana.org/ficheros/Medicamentos%20alto%20riesgo%202012.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="tooltip tooltip-icon"
                  >
                    <img
                      src="/img/standycalc_icons/alto_riesgo.svg"
                      alt="Alto riesgo"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="tooltip-text">Alto riesgo</span>
                  </a>
                  <span className="tooltip tooltip-icon">
                    <img
                      src="/img/standycalc_icons/monitorizar_TA_FC.svg"
                      alt="Monitorizar TA y FC"
                      className="h-12 w-12 object-contain"
                    />
                    <span className="tooltip-text">Monitorizar TA y FC</span>
                  </span>
                  <a
                    href="https://www.stabilis.org/index.php?codeLangue=SP-sp"
                    target="_blank"
                    rel="noreferrer"
                    className="tooltip tooltip-icon"
                  >
                    <img
                      src="/img/standycalc_icons/fotosensible.svg"
                      alt="Fotosensible"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="tooltip-text">Fotosensible</span>
                  </a>
                </div>
              </div>

              <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                <img
                  src="/img/standycalc_icons/diluciones/2_250v.svg"
                  alt="2 ampollas en 250 mL"
                  className="absolute right-4 top-4 h-8 w-8"
                />
                <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">DILUCIÓN</div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                  <span>
                    <span className="font-semibold text-slate-900">Dilución:</span> 2 ampollas + 250 mL SF/G5%
                    (nunca bicarbonato)
                  </span>
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Concentración real:</span>{" "}
                  {formatValueFixed(dobuConcentracion, 2)} mg/mL
                </div>
                <div className="text-xs text-slate-500">Ajustar según TA y FC</div>

                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Velocidad</div>
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                    {dobuVelocidades.map((item) => (
                      <div
                        key={`dobu-${item.dosis}`}
                        className={`rounded-lg border border-[#dfe9eb] px-3 py-2 ${
                          item.dosis === 2
                            ? "bg-emerald-50"
                            : item.dosis === 10
                              ? "bg-amber-50"
                              : item.dosis === 15
                                ? "bg-cyan-100"
                                : item.dosis === 18
                                  ? "bg-violet-100"
                                  : item.dosis === 20
                                    ? "bg-rose-50"
                                    : "bg-white"
                        }`}
                      >
                        <div className="text-xs text-slate-500">{item.dosis} µg/kg/min</div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {formatValueFixed(item.velocidad, 0)} mL/h
                        </div>
                        <div className="text-xs text-slate-500">
                          c/ {formatValueFixed(item.frecuencia, 0)} h (Orion)
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500">Rango habitual: 2-20 µg/kg/min</div>
                </div>

                <div className="mt-2 flex flex-wrap items-start gap-3">
                  <div
                    className={`rounded-lg border p-3 ${
                      dobuCustomDoseNum > 40 ? "border-rose-400" : "border-[#dfe9eb]"
                    }`}
                    style={{ backgroundColor: dopaCustomZona?.color ?? "#ffffff" }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Personalizar dosis
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                      <label className="flex items-center gap-2">
                        <input
                          className="w-24 rounded-md border border-[#dfe9eb] px-2 py-1 text-sm"
                          type="number"
                          inputMode="decimal"
                          value={dobuCustomDose}
                          onChange={(event) => setDobuCustomDose(event.target.value)}
                        />
                        <span className="text-slate-500">µg/kg/min</span>
                      </label>
                      <div className="text-sm text-slate-700">
                        {dobuCustomMlh == null ? (
                          "—"
                        ) : (
                          <>
                            <span className="font-semibold text-slate-900">
                              {formatValueFixed(dobuCustomMlh, 0)} mL/h
                            </span>
                            {dobuCustomFrecuencia == null
                              ? ""
                              : `  c/ ${formatValueFixed(dobuCustomFrecuencia, 0)} h (Orion)`}
                          </>
                        )}
                      </div>
                    </div>
                    {dobuCustomDoseNum > 40 ? (
                      <div className="mt-1 text-xs text-slate-500">Se aplica máximo de 40 µg/kg/min.</div>
                    ) : null}
                  </div>
                  {dobuCustomDoseNum > 40 ? (
                    <div className="text-xs font-semibold text-rose-600">Dosis máxima sobrepasada</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                <span className="font-semibold">Dosis máxima:</span> 40 µg/kg/min
              </div>
              </div>
            ) : null}

            {selectedStandardName === "DOPAMINA" ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#2b5d68]">
                    DOPAMINA ESTÁNDAR <span className="text-slate-500">(40 mg/mL)</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 200 mg / 5 mL
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tooltip tooltip-icon">
                    <img
                      src="/img/standycalc_icons/grupos_terapeuticos/inotropico.svg"
                      alt="Inotrópico"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="tooltip-text">Inotrópico</span>
                  </span>
                  <a
                    href="https://www.ismp-espana.org/ficheros/Medicamentos%20alto%20riesgo%202012.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="tooltip tooltip-icon"
                  >
                    <img
                      src="/img/standycalc_icons/alto_riesgo.svg"
                      alt="Alto riesgo"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="tooltip-text">Alto riesgo</span>
                  </a>
                  <span className="tooltip tooltip-icon">
                    <img
                      src="/img/standycalc_icons/monitorizar_TA_FC.svg"
                      alt="Monitorizar TA y FC"
                      className="h-12 w-12 object-contain"
                    />
                    <span className="tooltip-text">Monitorizar TA y FC</span>
                  </span>
                  <a
                    href="https://www.stabilis.org/index.php?codeLangue=SP-sp"
                    target="_blank"
                    rel="noreferrer"
                    className="tooltip tooltip-icon"
                  >
                    <img
                      src="/img/standycalc_icons/fotosensible.svg"
                      alt="Fotosensible"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="tooltip-text">Fotosensible</span>
                  </a>
                </div>
              </div>

              <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                <img
                  src="/img/standycalc_icons/diluciones/2_250v.svg"
                  alt="2 ampollas en 250 mL"
                  className="absolute right-4 top-4 h-8 w-8"
                />
                <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">DILUCIÓN</div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                  <span>
                    <span className="font-semibold text-slate-900">Dilución:</span> 2 ampollas + 250 mL SF/G5%
                  </span>
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Concentración real:</span>{" "}
                  {formatValueFixed(dopaConcentracion, 2)} mg/mL
                </div>
                <div className="text-xs text-slate-500">Ajustar según TA y FC</div>

                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Velocidad</div>
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                    {dopaVelocidades.map((item) => (
                      <div
                        key={`dopa-${item.dosis}`}
                        className={`rounded-lg border border-[#dfe9eb] px-3 py-2 ${
                          item.dosis === 2 || item.dosis === 4
                            ? "bg-emerald-50"
                            : item.dosis === 5 || item.dosis === 14
                              ? "bg-orange-50"
                              : item.dosis === 15 || item.dosis === 40
                                ? "bg-rose-50"
                                : "bg-white"
                        }`}
                      >
                        <div className="text-xs text-slate-500">
                          {item.dosis} µg/kg/min
                          <span className="ml-2 text-slate-500">{item.texto}</span>
                        </div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {formatValueFixed(item.velocidad, 0)} mL/h
                        </div>
                        <div className="text-xs text-slate-500">
                          {(() => {
                            const rawFreq = item.frecuencia;
                            const freq =
                              typeof rawFreq === "number" && Number.isFinite(rawFreq)
                                ? rawFreq
                                : calcOrionFromMlh(item.velocidad, dopaVolumenMezcla);
                            return freq == null
                              ? "c/ — h (Orion)"
                              : `c/ ${formatValueFixed(freq, 0)} h (Orion)`;
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-start gap-3">
                  <div
                    className={`rounded-lg border bg-white p-3 ${
                      dopaCustomDoseNum > 50 ? "border-rose-400" : "border-[#dfe9eb]"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Personalizar dosis
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                      <label className="flex items-center gap-2">
                        <input
                          className="w-24 rounded-md border border-[#dfe9eb] px-2 py-1 text-sm"
                          type="number"
                          inputMode="decimal"
                          value={dopaCustomDose}
                          onChange={(event) => setDopaCustomDose(event.target.value)}
                        />
                        <span className="text-slate-500">µg/kg/min</span>
                      </label>
                      <div className="text-sm text-slate-700">
                        {dopaCustomMlh == null ? (
                          "—"
                        ) : (
                          <>
                            <span className="font-semibold text-slate-900">
                              {formatValueFixed(dopaCustomMlh, 0)} mL/h
                            </span>
                            {dopaCustomFrecuencia == null
                              ? ""
                              : `  c/ ${formatValueFixed(dopaCustomFrecuencia, 0)} h (Orion)`}
                          </>
                        )}
                      </div>
                      {dopaCustomZona ? <div className="text-xs text-slate-500">{dopaCustomZona.texto}</div> : null}
                    </div>
                    {dopaCustomDoseNum > 50 ? (
                      <div className="mt-1 text-xs text-slate-500">Se aplica máximo de 50 µg/kg/min.</div>
                    ) : null}
                  </div>
                  {dopaCustomDoseNum > 50 ? (
                    <div className="text-xs font-semibold text-rose-600">Dosis máxima sobrepasada</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                <span className="font-semibold">Dosis máxima:</span> 50 µg/kg/min
              </div>
              </div>
            ) : null}

            {selectedStandardName === "FLECAINIDA" ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#2b5d68]">
                    FLECAINIDA ESTÁNDAR <span className="text-slate-500">(10 mg/mL)</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Apocard ®</div>
                  <div className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 150 mg / 15 mL
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tooltip tooltip-icon">
                    <img
                      src="/img/standycalc_icons/grupos_terapeuticos/antiarritmico.svg"
                      alt="Antiarrítmico"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="tooltip-text">Antiarrítmico</span>
                  </span>
                  <a
                    href="https://www.ismp-espana.org/ficheros/Medicamentos%20alto%20riesgo%202012.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="tooltip tooltip-icon"
                  >
                    <img
                      src="/img/standycalc_icons/alto_riesgo.svg"
                      alt="Alto riesgo"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="tooltip-text">Alto riesgo</span>
                  </a>
                  <span className="tooltip tooltip-icon">
                    <img
                      src="/img/standycalc_icons/monitorizar_FC.svg"
                      alt="Monitorizar FC"
                      className="h-12 w-12 object-contain"
                    />
                    <span className="tooltip-text">Monitorizar FC</span>
                  </span>
                </div>
              </div>

              <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                <img
                  src="/img/standycalc_icons/diluciones/1_100r.svg"
                  alt="1 ampolla en 100 mL SG5%"
                  className="absolute right-4 top-4 h-8 w-8"
                />
                <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">DILUCIÓN</div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                  <span>
                    <span className="font-semibold text-slate-900">Dilución:</span> 1 ampolla + 100 mL SG5%
                    (exclusivamente)
                  </span>
                </div>
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Concentración real:</span>{" "}
                  {formatValueFixed(flecaConcentracion, 2)} mg/mL
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dosis de carga</div>
                  <div className="rounded-lg border border-[#dfe9eb] bg-rose-50 px-3 py-2 text-sm text-slate-700">
                    <div className="text-xs text-slate-500">2 mg/kg</div>
                    <div className="mt-1">
                      <span className="font-semibold text-slate-900">
                        {formatValueFixed(flecaCargaVolumen, 0)} mL
                      </span>
                      <span className="text-slate-500"> (en 10 min)</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Velocidad: {formatValueFixed(flecaCargaVelocidad, 0)} mL/h
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dosis de mantenimiento
                  </div>
                  <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    {flecaMantenimiento.map((item) => (
                      <div
                        key={`fleca-${item.dosis}`}
                        className="rounded-lg border border-[#dfe9eb] bg-emerald-50 px-3 py-2"
                      >
                        <div className="text-xs text-slate-500">{item.dosis} mg/kg/h</div>
                        {(() => {
                          const rawVel = calcMlhFromDoseMgKgH(item.dosis, peso, flecaConcentracion);
                          const cap =
                            typeof flecaMaxMlh === "number" && Number.isFinite(flecaMaxMlh) ? flecaMaxMlh : null;
                          const vel = rawVel != null && cap != null ? Math.min(rawVel, cap) : rawVel;
                          const freq = vel != null ? calcOrionFromMlh(vel, flecaVolumenMezcla) : null;
                          return (
                            <>
                              <div className="mt-1 font-semibold text-slate-900">
                                {vel == null ? "—" : `${formatValueFixed(vel, 0)} mL/h`}
                              </div>
                              <div className="text-xs text-slate-500">
                                {freq == null ? "c/ — h (Orion)" : `c/ ${formatValueFixed(freq, 0)} h (Orion)`}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-start gap-3">
                  <div
                    className={`rounded-lg border bg-white p-3 ${
                      flecaCustomDoseNum > 600 ? "border-rose-400" : "border-[#dfe9eb]"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Personalizar dosis
                    </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <label className="flex items-center gap-2">
                      <input
                        className="w-24 rounded-md border border-[#dfe9eb] px-2 py-1 text-sm"
                        type="number"
                        inputMode="decimal"
                        value={flecaCustomDose}
                        onChange={(event) => setFlecaCustomDose(event.target.value)}
                      />
                      <span className="text-slate-500">mg/día</span>
                    </label>
                    <div className="text-sm text-slate-700">
                      {flecaCustomMlh == null ? (
                        "—  c/ — h (Orion)"
                      ) : (
                        <>
                          <span className="font-semibold text-slate-900">{formatValueFixed(flecaCustomMlh, 0)} mL/h</span>
                          {`  c/ ${formatValueFixed(flecaCustomFrecuencia ?? calcOrionFromMlh(flecaCustomMlh, flecaVolumenMezcla) ?? 0, 0)} h (Orion)`}
                        </>
                      )}
                    </div>
                    </div>
                    {flecaCustomDoseNum > 600 ? (
                      <div className="mt-1 text-xs text-slate-500">Se aplica máximo de 600 mg en 24 h.</div>
                    ) : null}
                  </div>
                  {flecaCustomDoseNum > 600 ? (
                    <div className="text-xs font-semibold text-rose-600">Dosis máxima sobrepasada</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                <span className="font-semibold">Dosis máxima:</span> 600 mg en 24 horas
              </div>
              </div>
            ) : null}

            {selectedStandardName === "NITROGLICERINA" ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      NITROGLICERINA ESTÁNDAR <span className="text-slate-500">(1 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Solinitrina ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 5 mg / 5 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/vasodilatador.svg"
                        alt="Vasodilatador"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Vasodilatador</span>
                    </span>
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/monitorizar_TA.svg"
                        alt="Monitorizar TA"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar TA</span>
                    </span>
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/present_peq.svg"
                        alt="Presentación pequeña"
                        className="h-12 w-12 object-contain"
                      />
                      <span className="tooltip-text">Ojo! Presentación pequeña</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/5_250r.svg"
                    alt="5 ampollas en 250 mL"
                    className="absolute right-4 top-4 h-8 w-8"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">DILUCIÓN</div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas + 250 mL G5%/SF/RL
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{" "}
                    {formatValueFixed(nitroConcentracion, 2)} mg/mL
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-rose-600">
                      ¡No utilizar en{" "}
                      <span className="tooltip abbr-tooltip">
                        IVDL<span className="tooltip-text">Intravenosa Directa Lenta (bolus lento)</span>
                      </span>
                      !
                    </span>{" "}
                    Ajustar según TA.
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de mantenimiento (10-200 µg/min)
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {nitroVelocidades.map((item, idx) => (
                        <div
                          key={`nitro-${idx}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{formatValue(item.dosis)} µg/min</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(item.velocidad, 0)} mL/h
                          </div>
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const rawFreq = item.frecuencia;
                              const freq =
                                typeof rawFreq === "number" && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, nitroVolumenMezcla);
                              return freq == null
                                ? "c/ — h (Orion)"
                                : `c/ ${formatValueFixed(freq, 0)} h (Orion)`;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === "NITROPRUSIATO" ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      NITROPRUSIATO ESTÁNDAR <span className="text-slate-500">(200 µg/mL)</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 50 mg + 5 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/vasodilatador.svg"
                        alt="Vasodilatador"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Vasodilatador</span>
                    </span>
                    <a
                      href="https://www.ismp-espana.org/ficheros/Medicamentos%20alto%20riesgo%202012.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="tooltip tooltip-icon"
                    >
                      <img
                        src="/img/standycalc_icons/alto_riesgo.svg"
                        alt="Alto riesgo"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Alto riesgo</span>
                    </a>
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/monitorizar_TA.svg"
                        alt="Monitorizar TA"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar TA</span>
                    </span>
                    <a
                      href="https://www.stabilis.org/index.php?codeLangue=SP-sp"
                      target="_blank"
                      rel="noreferrer"
                      className="tooltip tooltip-icon"
                    >
                      <img
                        src="/img/standycalc_icons/fotosensible.svg"
                        alt="Fotosensible"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Fotosensible</span>
                    </a>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/2_500r.svg"
                    alt="2 viales en 500 mL SG5%"
                    className="absolute right-4 top-4 h-8 w-8"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">DILUCIÓN</div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 2 viales + 500 mL SG5%
                      (exclusivamente)
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{" "}
                    {formatValueFixed(nprConcentracion, 2)} µg/mL
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-rose-600">
                      ¡No utilizar en{" "}
                      <span className="tooltip abbr-tooltip">
                        IVDL<span className="tooltip-text">Intravenosa Directa Lenta (bolus lento)</span>
                      </span>
                      !
                    </span>{" "}
                    Ajustar según TA.
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de mantenimiento
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {nprVelocidades.map((item, idx) => (
                        <div
                          key={`npr-${idx}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{formatValue(item.dosis)} µg/kg/min</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(item.velocidad, 0)} mL/h
                          </div>
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const rawFreq = item.frecuencia;
                              const freq =
                                typeof rawFreq === "number" && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, nprVolumenMezcla);
                              return freq == null
                                ? "c/ — h (Orion)"
                                : `c/ ${formatValueFixed(freq, 0)} h (Orion)`;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                    <span className="font-semibold">Dosis máxima:</span> 8 µg/kg/min o hipotensión
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === "FLUMAZENILO" ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">FLUMAZENILO</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 0,5 mg / 5 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/antidoto.svg"
                        alt="Antídoto"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Antídoto</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/bolo_lento.svg"
                    alt="Bolo lento"
                    className="absolute right-4 top-4 h-20 w-20"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">BOLO INICIAL</div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Dosis inicial:</span> 0,25 mg = 2,5 mL
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="tooltip abbr-tooltip">
                      IVDL<span className="tooltip-text">Intravenosa Directa Lenta (bolus lento)</span>
                    </span>{" "}
                    en 15 s (sin diluir)
                  </div>
                  <div className="text-xs text-slate-500">
                    Si no respuesta: repetir dosis cada 1 min (máx 2 mg = 20 mL)
                  </div>
                </div>

                <div className="relative mt-4 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/5_100v.svg"
                    alt="5 ampollas en 100 mL"
                    className="absolute right-4 top-4 h-8 w-8"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">ESTÁNDAR</div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas + 100 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{" "}
                    {formatValueFixed(flumaConcentracion, 2)} µg/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis mantenimiento
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      {flumaMantenimiento.map((item, idx) => (
                        <div
                          key={`fluma-${idx}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{formatValue(item.dosis)} mg/h</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(item.velocidad, 0)} mL/h
                          </div>
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const rawFreq = item.frecuencia;
                              const freq =
                                typeof rawFreq === "number" && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, flumaVolumenMezcla);
                              return freq == null
                                ? "c/ — h (Orion)"
                                : `c/ ${formatValueFixed(freq, 0)} h (Orion)`;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === "FUROSEMIDA" ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      FUROSEMIDA ESTÁNDAR <span className="text-slate-500">(10 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Seguril ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 20 mg / 2 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/diuretico.svg"
                        alt="Diurético"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Diurético</span>
                    </span>
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/present_peq.svg"
                        alt="Presentación pequeña"
                        className="h-12 w-12 object-contain"
                      />
                      <span className="tooltip-text">Ojo! Presentación pequeña</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/5_100v.svg"
                    alt="5 ampollas en 100 mL"
                    className="absolute right-4 top-4 h-8 w-8"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">DILUCIÓN</div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas + 100 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{" "}
                    {formatValueFixed(furoConcentracion, 2)} mg/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de mantenimiento
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {furoVelocidades.map((item, idx) => (
                        <div
                          key={`furo-${idx}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{formatValue(item.dosis)} mg/min</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(item.velocidad, 0)} mL/h
                          </div>
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const rawFreq = item.frecuencia;
                              const freq =
                                typeof rawFreq === "number" && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, furoVolumenMezcla);
                              return freq == null
                                ? "c/ — h (Orion)"
                                : `c/ ${formatValueFixed(freq, 0)} h (Orion)`;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-start gap-3">
                    <div
                      className={`rounded-lg border bg-white p-3 ${
                        furoCustomDoseNum > 1500 ? "border-rose-400" : "border-[#dfe9eb]"
                      }`}
                    >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Personalizar dosis
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                      <label className="flex items-center gap-2">
                        <input
                          className="w-24 rounded-md border border-[#dfe9eb] px-2 py-1 text-sm"
                          type="number"
                          inputMode="decimal"
                          value={furoCustomDose}
                          onChange={(event) => setFuroCustomDose(event.target.value)}
                        />
                        <span className="text-slate-500">mg/día</span>
                      </label>
                      <div className="text-sm text-slate-700">
                        {furoCustomMlh == null ? (
                          "—  c/ — h (Orion)"
                        ) : (
                          <>
                            <span className="font-semibold text-slate-900">
                              {formatValueFixed(furoCustomMlh, 0)} mL/h
                            </span>
                            {`  c/ ${formatValueFixed(
                              furoCustomFrecuencia ?? calcOrionFromMlh(furoCustomMlh, furoVolumenMezcla) ?? 0,
                              0,
                            )} h (Orion)`}
                          </>
                        )}
                      </div>
                    </div>
                      {furoCustomDoseNum > 1500 ? (
                        <div className="mt-1 text-xs text-slate-500">Se aplica máximo de 1.500 mg en 24 h.</div>
                      ) : null}
                    </div>
                    {furoCustomDoseNum > 1500 ? (
                      <div className="text-xs font-semibold text-rose-600">Dosis máxima sobrepasada</div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  <span className="font-semibold">Dosis máxima:</span> 1.500 mg en 24 horas
                </div>
              </div>
            ) : null}

            {selectedStandardName === "HEPARINA" ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      HEPARINA SÓDICA <span className="text-slate-500">(50 UI/mL)</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 1% 5.000 UI / 5 mL
                      <span className="text-slate-500"> · </span>
                      Vial 5% 25.000 UI / 5 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/anticoagulante.svg"
                        alt="Anticoagulante"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Anticoagulante</span>
                    </span>
                    <a
                      href="https://www.ismp-espana.org/ficheros/Medicamentos%20alto%20riesgo%202012.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="tooltip tooltip-icon"
                    >
                      <img
                        src="/img/standycalc_icons/alto_riesgo.svg"
                        alt="Alto riesgo"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Alto riesgo</span>
                    </a>
                    <a
                      href="https://www.stabilis.org/index.php?codeLangue=SP-sp"
                      target="_blank"
                      rel="noreferrer"
                      className="tooltip tooltip-icon"
                    >
                      <img
                        src="/img/standycalc_icons/fotosensible.svg"
                        alt="Fotosensible"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Fotosensible</span>
                    </a>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/bolo_lento.svg"
                    alt="Bolo lento"
                    className="absolute right-4 top-4 h-8 w-8"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">Dosis de carga</div>
                  <div className="text-xs text-slate-500">
                    Vial 1%: 50 mg / 5 mL = 10 mg/mL (1000 mg/dL) = 5000 UI / 5 mL (1000 UI/mL)
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">80 UI/kg</span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">UI totales:</span>{" "}
                    {hepaCargaUi == null ? "—" : formatValueFixed(hepaCargaUi, 0)}
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Volumen vial:</span>{" "}
                    {hepaCargaMl == null ? "—" : `${formatValueFixed(hepaCargaMl, 1)} mL`}
                    <span className="text-slate-500"> (</span>
                    <span className="tooltip abbr-tooltip abbr-tooltip-no-circle text-slate-500">
                      IVDL<span className="tooltip-text">Intravenosa Directa Lenta (bolus lento)</span>
                    </span>
                    <span className="text-slate-500">, </span>
                    <span className="text-slate-500">
                      {hepaCargaMin == null ? "—" : `${formatValueFixed(hepaCargaMin, 0)} min`}
                    </span>
                    <span className="text-slate-500">)</span>
                  </div>
                </div>

                <div className="relative mt-4 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/1_500v.svg"
                    alt="1 vial en 500 mL"
                    className="absolute right-4 top-4 h-8 w-8"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">Estándar</div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 1 vial 5% + 500 mL SF
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{" "}
                    {formatValueFixed(hepaUiMl, 2)} UI/mL
                  </div>
                  <div className="text-xs text-slate-500">
                    Vial 5%: 250 mg / 5 mL = 50 mg/mL (5000 mg/dL) = 25000 UI / 5 mL (5000 UI/mL)
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de mantenimiento
                    </div>
                    <div className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                      <div className="text-xs text-slate-500">18 UI/kg/h</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {hepaMantenimientoMlh == null ? "—" : `${formatValueFixed(hepaMantenimientoMlh, 0)} mL/h`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {hepaMantenimientoFreq == null
                          ? "c/ — h (Orion)"
                          : `c/ ${formatValueFixed(hepaMantenimientoFreq, 0)} h (Orion)`}{" "}
                        Siempre
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Ajuste según control APTT a las 4 horas:
                  </div>
                  <div className="mt-2 overflow-auto">
                    <table className="min-w-full border-collapse text-xs">
                      <thead className="text-slate-500">
                        <tr>
                          <th className="px-1 py-1 text-center">APTT</th>
                          <th className="px-1 py-1 text-center">Bolo</th>
                          <th className="px-1 py-1 text-center">STOP perfusión</th>
                          <th className="px-1 py-1 text-center">Nueva veloc.</th>
                          <th className="px-1 py-1 text-center">Control</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["< 40", "3000 UI", "No", 2, "6 h"],
                          ["40-49", "0 UI", "No", 1, "6 h"],
                          ["50-70", "0 UI", "No", 0, "24 h"],
                          ["71-85", "0 UI", "No", -1, "24 h"],
                          ["86-100", "0 UI", "30 min", -2, "6 h"],
                          ["101-150", "0 UI", "60 min", -3, "6 h"],
                          ["> 150", "0 UI", "60 min", -6, "6 h"],
                        ].map((row) => (
                          <tr key={row[0]} className="border-t border-slate-100">
                            <td className="px-1 py-1 text-center">{row[0]}</td>
                            <td className="px-1 py-1 text-center">{row[1]}</td>
                            <td className="px-1 py-1 text-center">{row[2]}</td>
                            <td className="px-1 py-1 text-center">
                              {hepaMantenimientoMlh == null
                                ? `${row[3]} mL/h`
                                : `${formatValueFixed(hepaMantenimientoMlh + (row[3] as number), 0)} mL/h`}
                            </td>
                            <td className="px-1 py-1 text-center">{row[4]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}

          </div>
        ) : null}

        {activeTab === "restringidas" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">MEZCLAS RESTRINGIDAS</div>
            {searchNotice && activeTab === "restringidas" ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {searchNotice}
              </div>
            ) : null}
            {restrictedSections.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {restrictedSections.map((section) => {
                  const label = getButtonLabel(section.label, restrictedDrugNames);
                  const isEnabled = enabledRestrictedCards.includes(label);
                  return (
                    <button
                      key={section.row}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        selectedRestricted === section.row
                          ? "border-[#2b5d68] bg-[#2b5d68] text-white"
                          : "border-[#dfe9eb] text-[#2b5d68] hover:border-[#c7dadd] hover:bg-[#eef6f8]"
                      } ${!isEnabled ? "cursor-not-allowed opacity-40" : ""}`}
                      onClick={() => setSelectedRestricted(section.row)}
                      disabled={!isEnabled}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "instrucciones" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">INSTRUCCIONES</div>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="rounded-xl border border-[#dfe9eb] bg-white p-4">
                <div className="text-sm font-semibold text-[#2b5d68]">
                  Guía de perfusiones intravenosas estándar v1.1.
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <div>
                    Herramienta para la estandarización de las concentraciones de mezclas IV más utilizadas y/o con
                    mayor riesgo en materia de seguridad del paciente.
                  </div>
                  <div>
                    Calculadora de dosis y velocidades de infusión según parámetros del paciente y concentraciones
                    estándar.
                  </div>
                  <div>Elabora: FAR-UMED</div>
                  <div>Aprueba: Comisión de Seguridad.</div>
                  <div>Última revisión: marzo 2020</div>
                  <div>Adaptación para web en fase beta</div>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">¡IMPORTANTE!</div>
                <div className="mt-2 space-y-2 text-sm text-rose-800">
                  <div>
                    Los cálculos para la obtención de las velocidades de infusión dependen de la CONCENTRACIÓN.
                  </div>
                  <div>Para todas las mezclas que requieren dilución (en SF, G5%, etc.) consideran:</div>
                  <ul className="list-disc pl-5">
                    <li>Volumen real de las bolsas de fluidos empleadas (incluyendo el sobrellenado)</li>
                    <li>
                      NO manipulación por parte de enfermería, es decir, NO deberán retirar volumen de fluido de la
                      bolsa de partida.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-[#dfe9eb] bg-white p-4 space-y-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">Datos paciente</div>
                  <div className="mt-1">
                    DATOS PACIENTE. IMPRESCINDIBLE rellenar para obtener los resultados de cálculo de dosis por peso y
                    velocidad de infusión asociado a éste y a la concentración estándar.
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">Mezclas estándar</div>
                  <div className="mt-1">
                    MEZCLAS ESTÁNDAR. Se encuentran las perfusiones estandarizadas de uso frecuente y disponible en
                    TODAS LAS UNIDADES del Hospital, ordenadas alfabéticamente por principio activo. Estas perfusiones
                    están configuradas para la inclusión en el tratamiento activo del paciente en Orion Clinic desde
                    Terapéutica-Esquemas-Sección-MEZCLAS ESTÁNDAR (visible para todos los prescriptores). Incluye
                    N-ACETILCISTEÍNA. Antídoto para tratar la intoxicación por paracetamol. Disponible en Orion Clinic
                    desde Terapéutica-Esquemas-Sección-MEZCLAS ESTÁNDAR (visible para todos los prescriptores).
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">Mezclas restringidas</div>
                  <div className="mt-1">
                    MEZCLAS RESTRINGIDAS. Se encuentran perfusiones estandarizadas de uso restringido a UNIDADES CON
                    MONITORIZACIÓN (UCI, URGENCIAS, QUIRÓFANO, HEMODINÁMICA y ARRITMIAS), ordenadas alfabéticamente por
                    principio activo. Estas perfusiones están configuradas para la inclusión en el tratamiento activo
                    del paciente en Orion Clinic desde Terapéutica-Esquemas-Sección-MECLAS RESTRINGIDAS (visibles sólo
                    para prescriptores de las Unidades con Monitorización continua).
                  </div>
                </div>

                <div className="mt-2 overflow-hidden rounded-lg border border-[#dfe9eb] bg-[#f7fbfc] p-3">
                  <img
                    src="/img/standycalc_icons/ejem1.svg"
                    alt="Ejemplo 1"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#dfe9eb] bg-white p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                  Prescripción en Orion Clinic
                </div>
                <div>
                  Para facilitar la prescripción electrónica de las mezclas estandarizadas, se han creado carpetas con
                  Esquemas de Sección dentro de Orion Clinic Terapéutica, ordenados alfabéticamente por principio activo.
                  De esta forma, queda fijada la dosis de principio activo, el tipo y volumen de diluyente, e incluso
                  observaciones de preparación y administración para el personal de enfermería. La introducción de estos
                  esquemas es sencilla y basta con introducir una fecha de inicio para que queden en el tratamiento del
                  paciente. Sin embargo, el médico prescriptor DEBE indicar la velocidad a la que quiere que se
                  administre, así como la frecuencia asociada para el recambio de tal mezcla. En el caso de que el
                  esquema seleccionado contenga más de una línea de prescripción, deberá además, modificar la hora de
                  inicio de la segunda mezcla, para garantizar que se administra al finalizar la primera del esquema.
                </div>
                <div className="mt-2 overflow-hidden rounded-lg border border-[#dfe9eb] bg-[#f7fbfc] p-3">
                  <img
                    src="/img/standycalc_icons/ejem3.svg"
                    alt="Ejemplo 3"
                    className="w-full"
                  />
                </div>
                <div>
                  STANDyCALC® facilita precisamente la Velocidad (en ml/h) calculada para la/s dosis recomendadas.
                  Además, para perfusiones continuas proporciona el campo FrOC (Frecuencia recomendada para la
                  prescripción en Orion Clinic), calculada como la frecuencia máxima de recambio de la mezcla. Es
                  imprescindible indicarla en Orion Clinic para evitar la indeseada y brusca interrupción de ciertos
                  principios activos (p.ej. aminas vasoactivas). De esta forma, aparecerá en Orion Clinic el check de
                  enfermería para su recambio antes de que finalice la perfusión en curso y se garantiza la dispensación
                  de las unidades de medicamento necesarias para su reposición en el carro de unidosis diario.
                </div>
                <div className="mt-2 overflow-hidden rounded-lg border border-[#dfe9eb] bg-[#f7fbfc] p-3">
                  <img
                    src="/img/standycalc_icons/ejem2.svg"
                    alt="Ejemplo 2"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default function StandyCalcPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Cargando STANDyCALC…</div>}>
      <StandyCalcClient />
    </Suspense>
  );
}
