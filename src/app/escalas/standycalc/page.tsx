'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import rawData from './standycalc-data.json';

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
  | { type: 'number'; value: number }
  | { type: 'cell'; sheet?: string; ref: string }
  | { type: 'unary'; op: '+' | '-'; expr: Node }
  | { type: 'binary'; op: '+' | '-' | '*' | '/' | '^'; left: Node; right: Node }
  | { type: 'compare'; op: '=' | '<>' | '<' | '<=' | '>' | '>='; left: Node; right: Node }
  | { type: 'func'; name: string; args: Node[] };

const workbook = rawData as Workbook;

function isNumericString(value: string) {
  return /^-?\d+(?:\.\d+)?$/.test(value.trim());
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    if (isNumericString(value)) return Number(value);
    return Number.NaN;
  }
  if (value == null) return 0;
  return Number.NaN;
}

function formatValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—';
    if (Number.isInteger(value)) return value.toString();
    return new Intl.NumberFormat('es-ES', {
      maximumFractionDigits: 4,
    }).format(value);
  }
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
}

function formatValueFixed(value: unknown, decimals: number): string {
  if (value == null) return '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat('es-ES', {
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

type SueroKey = keyof typeof SUEROS_VOLUMENES;

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
  const value = typeof mlh === 'number' ? mlh : Number(mlh);
  if (!Number.isFinite(value) || value <= 0) return null;
  return calcOrionFrequency(volumen / value);
}

function calcMlhFromDoseMgKgH(dose: number, peso: '' | number, concMgMl: number) {
  if (peso === '' || !Number.isFinite(concMgMl) || concMgMl <= 0) return null;
  const mlh = (dose * Number(peso)) / concMgMl;
  return Number.isFinite(mlh) ? mlh : null;
}

function calcMlhFromDoseUgKgMin(dose: number, peso: '' | number, concMgMl: number) {
  if (peso === '' || !Number.isFinite(concMgMl) || concMgMl <= 0) return null;
  const mgPerHour = (dose * Number(peso) * 60) / 1000;
  const mlh = mgPerHour / concMgMl;
  return Number.isFinite(mlh) ? mlh : null;
}

function normalizeCellRef(ref: string): string {
  return ref.replace(/\$/g, '').toUpperCase();
}

function colToIndex(col: string) {
  let idx = 0;
  for (const ch of col) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx;
}

function indexToCol(idx: number) {
  let s = '';
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
    return this.src[this.i] ?? '';
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
    const ops = ['>=', '<=', '<>', '=', '>', '<'] as const;
    for (const op of ops) {
      if (this.match(op)) {
        const right = this.parseAddSub();
        return { type: 'compare', op, left, right };
      }
    }
    return left;
  }

  private parseAddSub(): Node {
    let node = this.parseMulDiv();
    while (true) {
      this.skip();
      if (this.match('+')) {
        node = { type: 'binary', op: '+', left: node, right: this.parseMulDiv() };
        continue;
      }
      if (this.match('-')) {
        node = { type: 'binary', op: '-', left: node, right: this.parseMulDiv() };
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
      if (this.match('*')) {
        node = { type: 'binary', op: '*', left: node, right: this.parsePower() };
        continue;
      }
      if (this.match('/')) {
        node = { type: 'binary', op: '/', left: node, right: this.parsePower() };
        continue;
      }
      break;
    }
    return node;
  }

  private parsePower(): Node {
    let node = this.parseUnary();
    this.skip();
    if (this.match('^')) {
      node = { type: 'binary', op: '^', left: node, right: this.parsePower() };
    }
    return node;
  }

  private parseUnary(): Node {
    this.skip();
    if (this.match('+')) return { type: 'unary', op: '+', expr: this.parseUnary() };
    if (this.match('-')) return { type: 'unary', op: '-', expr: this.parseUnary() };
    return this.parsePrimary();
  }

  private parsePrimary(): Node {
    this.skip();
    if (this.match('(')) {
      const node = this.parseComparison();
      this.match(')');
      return node;
    }

    const cell = this.parseCellRef();
    if (cell) return cell;

    const num = this.parseNumber();
    if (num) return num;

    const ident = this.parseIdentifier();
    if (ident) {
      this.skip();
      if (this.match('(')) {
        const args: Node[] = [];
        this.skip();
        if (!this.match(')')) {
          while (true) {
            args.push(this.parseComparison());
            this.skip();
            if (this.match(')')) break;
            this.match(',');
          }
        }
        return { type: 'func', name: ident.toUpperCase(), args };
      }
    }

    return { type: 'number', value: 0 };
  }

  private parseNumber(): Node | null {
    this.skip();
    const match = this.src.slice(this.i).match(/^-?\d+(?:\.\d+)?/);
    if (!match) return null;
    this.i += match[0].length;
    return { type: 'number', value: Number(match[0]) };
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
      if (!this.match('!')) {
        this.i = start;
        return null;
      }
      const ref = this.parseCellOnly();
      if (!ref) {
        this.i = start;
        return null;
      }
      return { type: 'cell', sheet, ref };
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
      return { type: 'cell', sheet, ref };
    }

    const ref = this.parseCellOnly();
    if (ref) return { type: 'cell', ref };

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
  overrides: Record<string, Record<string, number | string | null>>
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
    if (cell.t !== 's' && isNumericString(raw)) value = Number(raw);
    if (raw === '#DIV/0!' || raw === '#VALUE!') value = Number.NaN;
    cache.set(key, value);
    return value;
  }

  function evalNode(node: Node, currentSheet: string): unknown {
    switch (node.type) {
      case 'number':
        return node.value;
      case 'cell': {
        const sheet = node.sheet ?? currentSheet;
        return getCellValue(sheet, node.ref);
      }
      case 'unary': {
        const value = toNumber(evalNode(node.expr, currentSheet));
        return node.op === '-' ? -value : value;
      }
      case 'binary': {
        const left = toNumber(evalNode(node.left, currentSheet));
        const right = toNumber(evalNode(node.right, currentSheet));
        switch (node.op) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            return right === 0 ? Number.NaN : left / right;
          case '^':
            return left ** right;
          default:
            return Number.NaN;
        }
      }
      case 'compare': {
        const left = toNumber(evalNode(node.left, currentSheet));
        const right = toNumber(evalNode(node.right, currentSheet));
        if (Number.isNaN(left) || Number.isNaN(right)) return false;
        switch (node.op) {
          case '=':
            return left === right;
          case '<>':
            return left !== right;
          case '>':
            return left > right;
          case '>=':
            return left >= right;
          case '<':
            return left < right;
          case '<=':
            return left <= right;
          default:
            return false;
        }
      }
      case 'func': {
        const name = node.name.toUpperCase();
        if (name === 'IF') {
          const [cond, a, b] = node.args;
          return evalNode(cond, currentSheet)
            ? evalNode(a, currentSheet)
            : evalNode(b, currentSheet);
        }
        if (name === 'AND') {
          return node.args.every((arg) => Boolean(evalNode(arg, currentSheet)));
        }
        if (name === 'SQRT') {
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
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '');
}

function isSectionHeader(value: string) {
  const label = normalizeLabel(value);
  if (label.startsWith('DOSIS') || label.startsWith('DILUCION') || label.startsWith('VELOCIDAD'))
    return false;
  return (
    label.includes('ESTANDAR') ||
    label.includes('BOLO') ||
    label.includes('CONCENTRADA') ||
    label.includes('EMERGENCIA') ||
    label.includes('CARGA') ||
    label.includes('MANTENIMIENTO')
  );
}

function getButtonLabel(sectionLabel: string, names: string[]) {
  const normalized = normalizeLabel(sectionLabel);
  const match = names.find((name) => normalized.includes(name));
  return match ?? sectionLabel;
}

const DISPLAY_LABELS: Record<string, string> = {
  'N-ACETILCISTEINA': 'N-ACETILCISTEÍNA',
  'SODIO HIPERTONICO': 'SODIO HIPERTÓNICO',
  'MAGNESIO SULFATO': 'MAGNESIO SULFATO',
  AMIODARONA: 'AMIODARONA',
  NALOXONA: 'NALOXONA',
  DOBUTAMINA: 'DOBUTAMINA',
  NIMODIPINO: 'NIMODIPINO',
  DOPAMINA: 'DOPAMINA',
  NITROGLICERINA: 'NITROGLICERINA',
  FLECAINIDA: 'FLECAINIDA',
  NITROPRUSIATO: 'NITROPRUSIATO',
  FLUMAZENILO: 'FLUMAZENILO',
  OCTREOTIDO: 'OCTREÓTIDO',
  FUROSEMIDA: 'FUROSEMIDA',
  HEPARINA: 'HEPARINA',
  SOMATOSTATINA: 'SOMATOSTATINA',
  LABETALOL: 'LABETALOL',
  TEOFILINA: 'TEOFILINA',
  VALPROICO: 'VALPROICO',
  MORFINA: 'MORFINA',
  VERNAKALANT: 'VERNAKALANT',
  CISATRACURIO: 'CISATRACURIO',
  ESMOLOL: 'ESMOLOL',
  'FUROSEMIDA CONC': 'FUROSEMIDA CONC.',
  LEVOSIMENDAN: 'LEVOSIMENDAN',
  MIDAZOLAM: 'MIDAZOLAM',
  NORADRENALINA: 'NORADRENALINA',
  PROCAINAMIDA: 'PROCAINAMIDA',
  SALBUTAMOL: 'SALBUTAMOL',
  URAPIDIL: 'URAPIDIL',
};

function getDisplayLabel(label: string) {
  return DISPLAY_LABELS[label] ?? label;
}

function StandyCalcClient() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'estandar' | 'restringidas' | 'instrucciones'>(
    'estandar'
  );
  const [peso, setPeso] = useState<'' | number>(70);
  const [talla, setTalla] = useState<'' | number>(170);
  const [dobuCustomDose, setDobuCustomDose] = useState('');
  const [dopaCustomDose, setDopaCustomDose] = useState('');
  const [flecaCustomDose, setFlecaCustomDose] = useState('');
  const [furoCustomDose, setFuroCustomDose] = useState('');
  const [furoConcMgH, setFuroConcMgH] = useState('');
  const [furoConcMgDia, setFuroConcMgDia] = useState('');
  const [midaCustomDose, setMidaCustomDose] = useState('');
  const [noraCustomDose, setNoraCustomDose] = useState('');
  const [procaCustomDose, setProcaCustomDose] = useState('');
  const [labeCustomDose, setLabeCustomDose] = useState('');
  const [morfCustomDose, setMorfCustomDose] = useState('');

  const overrides = useMemo(() => {
    const data: Record<string, Record<string, number | string | null>> = {
      'DATOS PACIENTE': {},
    };
    if (peso !== '') data['DATOS PACIENTE'].C13 = peso;
    if (talla !== '') data['DATOS PACIENTE'].C14 = talla;
    return data;
  }, [peso, talla]);

  const evaluator = useMemo(() => buildEvaluator(workbook, overrides), [overrides]);

  const datosSheet = workbook.sheets['DATOS PACIENTE'];
  const mezclasEstandar = workbook.sheets['MEZCLAS ESTANDAR'];
  const mezclasRestringidas = workbook.sheets['MEZCLAS RESTRINGIDAS'];
  const instrucciones = workbook.sheets['Instrucciones'];

  const estandarGrid = useMemo(() => buildGrid(mezclasEstandar), [mezclasEstandar]);
  const restringidasGrid = useMemo(() => buildGrid(mezclasRestringidas), [mezclasRestringidas]);

  const standardDrugNames = useMemo(
    () => [
      'N-ACETILCISTEINA',
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
    ],
    []
  );

  const enabledStandardCards = useMemo(
    () => [
      'AMIODARONA',
      'NALOXONA',
      'DOBUTAMINA',
      'DOPAMINA',
      'FLECAINIDA',
      'NIMODIPINO',
      'NITROGLICERINA',
      'NITROPRUSIATO',
      'FLUMAZENILO',
      'OCTREOTIDO',
      'FUROSEMIDA',
      'SODIO HIPERTONICO',
      'HEPARINA',
      'SOMATOSTATINA',
      'LABETALOL',
      'TEOFILINA',
      'MORFINA',
      'MAGNESIO SULFATO',
      'VALPROICO',
      'VERNAKALANT',
      'N-ACETILCISTEINA',
    ],
    []
  );

  const restrictedDrugNames = useMemo(
    () => [
      'CISATRACURIO',
      'ESMOLOL',
      'FUROSEMIDA CONC',
      'LEVOSIMENDAN',
      'MIDAZOLAM',
      'NORADRENALINA',
      'PROCAINAMIDA',
      'SALBUTAMOL',
      'URAPIDIL',
    ],
    []
  );

  const enabledRestrictedCards = useMemo<string[]>(
    () => [
      'CISATRACURIO',
      'ESMOLOL',
      'FUROSEMIDA CONC',
      'LEVOSIMENDAN',
      'MIDAZOLAM',
      'NORADRENALINA',
      'PROCAINAMIDA',
      'SALBUTAMOL',
      'URAPIDIL',
    ],
    []
  );

  const standardHeaders = useMemo(() => {
    const headers: { row: number; label: string; isAllowed: boolean }[] = [];
    Object.entries(mezclasEstandar.cells).forEach(([ref, cell]) => {
      if (!ref.startsWith('B') || !cell?.v) return;
      const row = Number(ref.slice(1));
      const label = String(cell.v);
      const normalized = normalizeLabel(label);
      const isDrugHeader = standardDrugNames.some((name) => normalized.includes(name));
      if (!isSectionHeader(label) && !isDrugHeader) return;
      const isAllowed = isDrugHeader;
      headers.push({ row, label: label.trim(), isAllowed });
    });
    headers.sort((a, b) => a.row - b.row);
    return headers;
  }, [mezclasEstandar, standardDrugNames]);

  const standardSections = useMemo(() => {
    const seen = new Set<string>();
    const filtered = standardHeaders.filter((header) => {
      if (!header.isAllowed) return false;
      const key = getButtonLabel(header.label, standardDrugNames);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return filtered.sort((a, b) =>
      getButtonLabel(a.label, standardDrugNames).localeCompare(
        getButtonLabel(b.label, standardDrugNames),
        'es'
      )
    );
  }, [standardHeaders, standardDrugNames]);

  const restrictedSections = useMemo(() => {
    const seen = new Set<string>();
    const headers: { row: number; label: string }[] = [];
    Object.entries(mezclasRestringidas.cells).forEach(([ref, cell]) => {
      if (!ref.startsWith('B') || !cell?.v) return;
      const row = Number(ref.slice(1));
      const label = String(cell.v);
      const normalized = normalizeLabel(label);
      const isDrugHeader = restrictedDrugNames.some((name) => normalized.includes(name));
      if (!isSectionHeader(label) && !isDrugHeader) return;
      if (!isDrugHeader) return;
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
    [standardSections, selectedStandard]
  );
  const selectedRestrictedSection = useMemo(
    () => restrictedSections.find((section) => section.row === selectedRestricted) ?? null,
    [restrictedSections, selectedRestricted]
  );
  const selectedStandardName = useMemo(
    () =>
      selectedStandardSection
        ? getButtonLabel(selectedStandardSection.label, standardDrugNames)
        : '',
    [selectedStandardSection, standardDrugNames]
  );
  const selectedRestrictedName = useMemo(
    () =>
      selectedRestrictedSection
        ? getButtonLabel(selectedRestrictedSection.label, restrictedDrugNames)
        : '',
    [selectedRestrictedSection, restrictedDrugNames]
  );

  const standardLookup = useMemo(
    () =>
      new Map(
        standardSections.map((section) => [
          getButtonLabel(section.label, standardDrugNames),
          section.row,
        ])
      ),
    [standardSections, standardDrugNames]
  );

  const restrictedLookup = useMemo(
    () =>
      new Map(
        restrictedSections.map((section) => [
          getButtonLabel(section.label, restrictedDrugNames),
          section.row,
        ])
      ),
    [restrictedSections, restrictedDrugNames]
  );

  const [searchNotice, setSearchNotice] = useState<string>('');

  useEffect(() => {
    const raw = searchParams.get('drug');
    if (!raw) return;
    const normalized = normalizeLabel(raw);
    const fromStandard = [...standardLookup.keys()].find((k) => normalizeLabel(k) === normalized);
    const fromRestricted = [...restrictedLookup.keys()].find(
      (k) => normalizeLabel(k) === normalized
    );
    if (fromStandard) {
      setActiveTab('estandar');
      if (enabledStandardCards.includes(fromStandard)) {
        setSelectedStandard(standardLookup.get(fromStandard) ?? null);
        setSearchNotice('');
      } else {
        setSelectedStandard(null);
        setSearchNotice(`"${fromStandard}" está en Mezclas estándar, pero aún no está habilitado.`);
      }
      return;
    }
    if (fromRestricted) {
      setActiveTab('restringidas');
      if (enabledRestrictedCards.includes(fromRestricted)) {
        setSelectedRestricted(restrictedLookup.get(fromRestricted) ?? null);
        setSearchNotice('');
      } else {
        setSelectedRestricted(null);
        setSearchNotice(
          `"${fromRestricted}" está en Mezclas restringidas, pero aún no está habilitado.`
        );
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

  const imc = evaluator.getCellValue('DATOS PACIENTE', 'C15');
  const sc = evaluator.getCellValue('DATOS PACIENTE', 'C16');
  const pesoIdeal = evaluator.getCellValue('DATOS PACIENTE', 'C17');

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
  const amio2VolumenMezcla =
    SUEROS_VOLUMENES[amio2Suero].llenado + amio2Ampollas * amioMlPorAmpolla;
  const amio2Concentracion = (amio2Ampollas * amioMgPorAmpolla) / amio2VolumenMezcla;
  const amioDia1 = [
    {
      dosis: 10,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E30'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I30'),
    },
    {
      dosis: 15,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E31'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I31'),
    },
    {
      dosis: 20,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E32'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I32'),
    },
  ];
  const amioSucesivos = [
    {
      dosis: 10,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E34'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I34'),
    },
    {
      dosis: 15,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E35'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I35'),
    },
    {
      dosis: 20,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E36'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I36'),
    },
  ];

  const naloxAmpollas = 5;
  const naloxMgPorAmpolla = 0.4;
  const naloxMlPorAmpolla = 1;
  const naloxSuero = 100;
  const naloxVolumenMezcla =
    SUEROS_VOLUMENES[naloxSuero].llenado + naloxAmpollas * naloxMlPorAmpolla;
  const naloxConcentracionMgMl = (naloxAmpollas * naloxMgPorAmpolla) / naloxVolumenMezcla;
  const naloxConcentracionUgMl = naloxConcentracionMgMl * 1000;
  const naloxVelocidades = [221, 222, 223, 224, 225, 226, 227].map((row) => ({
    dosis: evaluator.getCellValue('MEZCLAS ESTANDAR', `B${row}`),
  }));

  const dobuAmpollas = 2;
  const dobuMgPorAmpolla = 250;
  const dobuMlPorAmpolla = 20;
  const dobuSuero = 250;
  const dobuVolumenMezcla = SUEROS_VOLUMENES[dobuSuero].llenado + dobuAmpollas * dobuMlPorAmpolla;
  const dobuConcentracion = (dobuAmpollas * dobuMgPorAmpolla) / dobuVolumenMezcla;
  const dobuVelocidades = [
    {
      dosis: 2,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E46'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I46'),
    },
    {
      dosis: 10,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E47'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I47'),
    },
    {
      dosis: 15,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E48'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I48'),
    },
    {
      dosis: 18,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E49'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I49'),
    },
    {
      dosis: 20,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E50'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I50'),
    },
  ];
  const dobuCustomDoseNum = Number(dobuCustomDose);
  const dobuDoseCapped = Number.isFinite(dobuCustomDoseNum)
    ? Math.min(dobuCustomDoseNum, 40)
    : null;
  const dobuCustomMlh =
    dobuDoseCapped != null && peso !== ''
      ? (dobuDoseCapped * Number(peso) * 60) / 1000 / dobuConcentracion
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
    {
      dosis: 2,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E62'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I62'),
      texto: 'Dosis Dopa (vasodilatador renal)',
    },
    {
      dosis: 4,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E63'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I63'),
      texto: 'Dosis Dopa (vasodilatador renal)',
    },
    {
      dosis: 5,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E64'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I64'),
      texto: 'Dosis Beta (crono+, ino+, vasodilatador)',
    },
    {
      dosis: 14,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E65'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I65'),
      texto: 'Dosis Beta (crono+, ino+, vasodilatador)',
    },
    {
      dosis: 15,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E66'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I66'),
      texto: 'Dosis Alfa (vasoconstrictor)',
    },
    {
      dosis: 40,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E67'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I67'),
      texto: 'Dosis Alfa (vasoconstrictor)',
    },
  ];
  const dopaCustomDoseNum = Number(dopaCustomDose);
  const dopaDoseCapped = Number.isFinite(dopaCustomDoseNum)
    ? Math.min(dopaCustomDoseNum, 50)
    : null;
  const dopaCustomMlh =
    dopaDoseCapped != null && peso !== ''
      ? (dopaDoseCapped * Number(peso) * 60) / 1000 / dopaConcentracion
      : null;
  const dopaCustomHoras =
    dopaCustomMlh != null && dopaCustomMlh > 0 ? dopaVolumenMezcla / dopaCustomMlh : null;
  const dopaCustomFrecuencia = dopaCustomHoras != null ? calcOrionFrequency(dopaCustomHoras) : null;
  const dopaCustomZona =
    dopaDoseCapped == null
      ? null
      : dopaDoseCapped <= 4
        ? { color: '#ecfdf5', texto: 'Dosis Dopa (vasodilatador renal)' }
        : dopaDoseCapped <= 14
          ? { color: '#fff7ed', texto: 'Dosis Beta (crono+, ino+, vasodilatador)' }
          : { color: '#fff1f2', texto: 'Dosis Alfa (vasoconstrictor)' };

  const flecaAmpollas = 1;
  const flecaMgPorAmpolla = 150;
  const flecaMlPorAmpolla = 15;
  const flecaSuero = 100;
  const flecaVolumenMezcla =
    SUEROS_VOLUMENES[flecaSuero].llenado + flecaAmpollas * flecaMlPorAmpolla;
  const flecaConcentracion = (flecaAmpollas * flecaMgPorAmpolla) / flecaVolumenMezcla;
  const flecaCargaVolumen = evaluator.getCellValue('MEZCLAS ESTANDAR', 'E79');
  const flecaCargaVelocidad = evaluator.getCellValue('MEZCLAS ESTANDAR', 'G79');
  const flecaMantenimiento = [
    {
      dosis: 0.1,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E82'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I82'),
    },
    {
      dosis: 0.15,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E83'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I83'),
    },
    {
      dosis: 0.25,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E84'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I84'),
    },
    {
      dosis: 0.3,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E85'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I85'),
    },
  ];
  const flecaMaxMlh = evaluator.getCellValue('MEZCLAS ESTANDAR', 'O85');
  const flecaCustomDoseNum = Number(flecaCustomDose);
  const flecaDoseCapped = Number.isFinite(flecaCustomDoseNum)
    ? Math.min(flecaCustomDoseNum, 600)
    : null;
  const flecaCustomMlh = flecaDoseCapped != null ? flecaDoseCapped / 24 / flecaConcentracion : null;
  const flecaCustomHoras =
    flecaCustomMlh != null && flecaCustomMlh > 0 ? flecaVolumenMezcla / flecaCustomMlh : null;
  const flecaCustomFrecuencia =
    flecaCustomHoras != null ? calcOrionFrequency(flecaCustomHoras) : null;

  const nimodipinoConc = 0.2; // mg/mL (20 mg/100 mL)
  const nimodipinoDosisInicial = 15;
  const nimodipinoDosisMantenimiento = 30;
  const nimodipinoVelInicial =
    peso !== '' ? ((nimodipinoDosisInicial / 1000) * Number(peso)) / nimodipinoConc : null;
  const nimodipinoVelMantenimiento =
    peso !== '' ? ((nimodipinoDosisMantenimiento / 1000) * Number(peso)) / nimodipinoConc : null;
  const nimodipinoFrecuencia =
    nimodipinoVelMantenimiento != null ? calcOrionFromMlh(nimodipinoVelMantenimiento, 100) : null;

  const nitroAmpollas = 5;
  const nitroMgPorAmpolla = 5;
  const nitroMlPorAmpolla = 5;
  const nitroSuero = 250;
  const nitroVolumenMezcla =
    SUEROS_VOLUMENES[nitroSuero].llenado + nitroAmpollas * nitroMlPorAmpolla;
  const nitroConcentracion = (nitroAmpollas * nitroMgPorAmpolla) / nitroVolumenMezcla;
  const nitroVelocidades = [247, 248, 249, 250, 251, 252, 253, 254, 255].map((row) => ({
    dosis: evaluator.getCellValue('MEZCLAS ESTANDAR', `B${row}`),
    velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', `F${row}`),
    frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', `I${row}`),
  }));

  const nprAmpollas = 2;
  const nprMgPorVial = 50;
  const nprMlPorVial = 5;
  const nprSuero = 500;
  const nprVolumenMezcla = SUEROS_VOLUMENES[nprSuero].llenado + nprAmpollas * nprMlPorVial;
  const nprConcentracion = (nprAmpollas * nprMgPorVial * 1000) / nprVolumenMezcla; // µg/ml
  const nprVelocidades = [265, 266, 267, 268, 269, 270].map((row) => ({
    dosis: evaluator.getCellValue('MEZCLAS ESTANDAR', `B${row}`),
    velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', `E${row}`),
    frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', `I${row}`),
  }));

  const octreAmpollas = 5;
  const octreMgPorAmpolla = 0.1;
  const octreMlPorAmpolla = 1;
  const octreSuero = 100;
  const octreVolumenMezcla =
    SUEROS_VOLUMENES[octreSuero].llenado + octreAmpollas * octreMlPorAmpolla;
  const octreConcentracionUgMl = (octreAmpollas * octreMgPorAmpolla * 1000) / octreVolumenMezcla;
  const octreDosis = [280, 281, 282, 283].map((row) => ({
    dosis: evaluator.getCellValue('MEZCLAS ESTANDAR', `B${row}`),
  }));

  const flumaAmpollas = 5;
  const flumaMgPorAmpolla = 0.5;
  const flumaMlPorAmpolla = 5;
  const flumaSuero = 100;
  const flumaVolumenMezcla =
    SUEROS_VOLUMENES[flumaSuero].llenado + flumaAmpollas * flumaMlPorAmpolla;
  const flumaConcentracion = (flumaAmpollas * flumaMgPorAmpolla * 1000) / flumaVolumenMezcla; // µg/ml
  const flumaMantenimiento = [102, 103, 104, 105].map((row) => ({
    dosis: evaluator.getCellValue('MEZCLAS ESTANDAR', `B${row}`),
    velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', `E${row}`),
    frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', `I${row}`),
  }));

  const furoAmpollas = 5;
  const furoMgPorAmpolla = 20;
  const furoMlPorAmpolla = 2;
  const furoSuero = 100;
  const furoVolumenMezcla = SUEROS_VOLUMENES[furoSuero].llenado + furoAmpollas * furoMlPorAmpolla;
  const furoConcentracion = (furoAmpollas * furoMgPorAmpolla) / furoVolumenMezcla;
  const furoVelocidades = [115, 116, 117, 118, 119, 120].map((row) => ({
    dosis: evaluator.getCellValue('MEZCLAS ESTANDAR', `B${row}`),
    velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', `E${row}`),
    frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', `I${row}`),
  }));
  const furoCustomDoseNum = Number(furoCustomDose);
  const furoDoseCapped = Number.isFinite(furoCustomDoseNum)
    ? Math.min(furoCustomDoseNum, 1500)
    : null;
  const furoCustomMlh = furoDoseCapped != null ? furoDoseCapped / 24 / furoConcentracion : null;
  const furoCustomFrecuencia =
    furoCustomMlh != null ? calcOrionFromMlh(furoCustomMlh, furoVolumenMezcla) : null;

  const sodioAmpollas = 6;
  const sodioGPorAmpolla = 2;
  const sodioMlPorAmpolla = 10;
  const sodioSuero = 500;
  const sodioVolumenMezcla =
    SUEROS_VOLUMENES[sodioSuero].llenado + sodioAmpollas * sodioMlPorAmpolla;
  const sodioBaseG = (SUEROS_VOLUMENES[sodioSuero].llenado * 0.9) / 100;
  const sodioTotalMg = sodioAmpollas * sodioGPorAmpolla * 1000 + sodioBaseG * 1000;
  const sodioConcentracionMgMl = sodioTotalMg / sodioVolumenMezcla;
  const sodioConcentracionMeqMl = sodioConcentracionMgMl / 58.44;
  const sodioNaRows = [293, 294, 295, 296, 297, 298, 299].map((row) => {
    const na = evaluator.getCellValue('MEZCLAS ESTANDAR', `B${row}`);
    const naValue = Number(na);
    const pesoValue = peso === '' ? null : Number(peso);
    const deficit =
      pesoValue != null && Number.isFinite(naValue) ? (140 - naValue) * pesoValue * 0.5 : null;
    const denom =
      pesoValue != null && Number.isFinite(naValue)
        ? (sodioConcentracionMeqMl * 1000 - naValue) / (0.5 * pesoValue + 1)
        : null;
    const velocidad =
      denom != null && Number.isFinite(denom) && denom !== 0 ? 10000 / denom / 24 : null;
    return { na: naValue, deficit, velocidad };
  });

  const hepaVialUi = 5000;
  const hepaVialMl = 5;
  const hepaSuero = 500;
  const hepaVolumenMezcla = SUEROS_VOLUMENES[hepaSuero].llenado + hepaVialMl;
  const hepaUiMl =
    typeof evaluator.getCellValue('MEZCLAS ESTANDAR', 'I135') === 'number'
      ? (evaluator.getCellValue('MEZCLAS ESTANDAR', 'I135') as number)
      : hepaVialUi / hepaVialMl;
  const hepaCargaUi = peso === '' ? null : Number(peso) * 80;
  const hepaCargaMl = hepaCargaUi != null ? hepaCargaUi / (hepaVialUi / hepaVialMl) : null;
  const hepaCargaMin = peso === '' ? null : (Number(peso) * 80) / 2000;
  const hepaMantenimientoUiKgH = 18;
  const hepaMantenimientoMlh =
    peso === '' ? null : (Number(peso) * hepaMantenimientoUiKgH) / hepaUiMl;
  const hepaMantenimientoFreq = evaluator.getCellValue('MEZCLAS ESTANDAR', 'I139');

  const somaViales = 1;
  const somaMgPorVial = 3;
  const somaMlPorVial = 1;
  const somaSuero = 250;
  const somaVolumenMezcla = SUEROS_VOLUMENES[somaSuero].llenado + somaViales * somaMlPorVial;
  const somaConcentracionUgMl = (somaViales * somaMgPorVial * 1000) / somaVolumenMezcla;
  const somaHemorragiaDose = 3.5;
  const somaHemorragiaMlh =
    peso !== '' ? (somaHemorragiaDose * Number(peso)) / somaConcentracionUgMl : null;
  const somaHemorragiaFreq =
    somaHemorragiaMlh != null ? calcOrionFromMlh(somaHemorragiaMlh, somaVolumenMezcla) : null;
  const somaFistulaDosis = [250, 125];
  const somaFistulaRows = somaFistulaDosis.map((dose) => {
    const vel = somaConcentracionUgMl > 0 ? dose / somaConcentracionUgMl : null;
    const freq = vel != null ? calcOrionFromMlh(vel, somaVolumenMezcla) : null;
    return { dose, vel, freq };
  });

  const labeAmpollas = 5;
  const labeMgPorAmpolla = 100;
  const labeMlPorAmpolla = 20;
  const labeSuero = 250;
  const labeVolumenMezcla = SUEROS_VOLUMENES[labeSuero].llenado + labeAmpollas * labeMlPorAmpolla;
  const labeConcentracion = (labeAmpollas * labeMgPorAmpolla) / labeVolumenMezcla;
  const labeVelocidades = [164, 165, 166, 167, 168, 169].map((row) => ({
    dosis: evaluator.getCellValue('MEZCLAS ESTANDAR', `B${row}`),
    velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', `E${row}`),
    frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', `I${row}`),
  }));
  const labeCustomDoseNum = Number(labeCustomDose);
  const labeDoseCapped = Number.isFinite(labeCustomDoseNum)
    ? Math.min(labeCustomDoseNum, 160)
    : null;
  const labeCustomMlh = labeDoseCapped != null ? labeDoseCapped / labeConcentracion : null;
  const labeCustomFrecuencia =
    labeCustomMlh != null ? calcOrionFromMlh(labeCustomMlh, labeVolumenMezcla) : null;

  const teoAmpollas = 1;
  const teoMgPorAmpolla = 200;
  const teoMlPorAmpolla = 10;
  const teoSuero = 500;
  const teoVolumenMezcla = SUEROS_VOLUMENES[teoSuero].llenado + teoAmpollas * teoMlPorAmpolla;
  const teoConcentracionMgMl = (teoAmpollas * teoMgPorAmpolla) / teoVolumenMezcla;
  const teoPesoBase = peso === '' ? null : Math.min(Number(pesoIdeal ?? peso), Number(peso));
  const teoInicial = [
    { dosis: 2, nota: 'en 30 min, si PREVIAMENTE USADA' },
    { dosis: 4, nota: 'en 30 min, si NUNCA TEOFILINA' },
  ].map((item) => {
    const volumen =
      teoPesoBase != null && teoConcentracionMgMl > 0
        ? (item.dosis * teoPesoBase) / teoConcentracionMgMl
        : null;
    const velocidad = volumen != null ? (volumen / 30) * 60 : null;
    return { ...item, volumen, velocidad };
  });
  const teoMantenimiento = [
    {
      titulo: 'FUMADOR',
      filas: [
        { dosis: 0.8, nota: 'primeras 12 h' },
        { dosis: 0.65, nota: 'a partir de 13ª h' },
      ],
    },
    {
      titulo: 'NO FUMADOR',
      filas: [
        { dosis: 0.55, nota: 'primeras 12 h' },
        { dosis: 0.4, nota: 'a partir de 13ª h' },
      ],
    },
    {
      titulo: '>60 años',
      filas: [
        { dosis: 0.5, nota: 'primeras 12 h' },
        { dosis: 0.25, nota: 'a partir de 13ª h' },
      ],
    },
    {
      titulo: 'CARDIÓPATA/HEPATÓPATA',
      filas: [
        { dosis: 0.4, nota: 'primeras 12h' },
        { dosis: 0.15, nota: 'a partir de 13ª h' },
      ],
    },
  ].map((grupo) => ({
    ...grupo,
    filas: grupo.filas.map((fila) => {
      const vel =
        teoPesoBase != null && teoConcentracionMgMl > 0
          ? (fila.dosis * teoPesoBase) / teoConcentracionMgMl
          : null;
      const freq = vel != null ? calcOrionFromMlh(vel, teoVolumenMezcla) : null;
      return { ...fila, vel, freq };
    }),
  }));

  const magAmpollasTorsade = 1;
  const magGPorAmpolla = 1.5;
  const magMlPorAmpolla = 10;
  const magSueroTorsade = 100;
  const magVolumenTorsade =
    SUEROS_VOLUMENES[magSueroTorsade].llenado + magAmpollasTorsade * magMlPorAmpolla;
  const magConcentracionTorsade = (magAmpollasTorsade * magGPorAmpolla * 1000) / magVolumenTorsade;
  const magMecEqTorsade = evaluator.getCellValue('MEZCLAS ESTANDAR', 'I179');
  const magVelocidadTorsade = evaluator.getCellValue('MEZCLAS ESTANDAR', 'F182');

  const magAmpollasEclampsia = 16;
  const magSueroEclampsia = 500;
  const magVolumenEclampsia =
    SUEROS_VOLUMENES[magSueroEclampsia].llenado + magAmpollasEclampsia * magMlPorAmpolla;
  const magConcentracionEclampsia =
    (magAmpollasEclampsia * magGPorAmpolla * 1000) / magVolumenEclampsia;
  const magMecEqEclampsia = evaluator.getCellValue('MEZCLAS ESTANDAR', 'I186');
  const magEclampsiaDosis = [
    {
      dosis: 1,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E189'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I189'),
    },
    {
      dosis: 2,
      velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', 'E190'),
      frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', 'I190'),
    },
  ];

  const valpVialMg = 400;
  const valpVialMl = 4;
  const valpCargaDose = 15;
  const valpCargaVolumen =
    peso !== '' ? (valpCargaDose * Number(peso)) / (valpVialMg / valpVialMl) : null;
  const valpSuero = 100;
  const valpVolumenMezcla = SUEROS_VOLUMENES[valpSuero].llenado + valpVialMl;
  const valpConcentracionMgMl = valpVialMg / valpVolumenMezcla;
  const valpMantenimiento = [0.5, 1].map((dose) => {
    const vel = calcMlhFromDoseMgKgH(dose, peso, valpConcentracionMgMl);
    const freq = vel != null ? calcOrionFromMlh(vel, valpVolumenMezcla) : null;
    return { dose, vel, freq };
  });

  const vernaVialMg = 500;
  const vernaVialMl = 25;
  const vernaSuero = 100;
  const vernaVolumenMezcla = SUEROS_VOLUMENES[vernaSuero].llenado + vernaVialMl;
  const vernaConcentracionMgMl = vernaVialMg / vernaVolumenMezcla;
  const vernaDose1Mg = peso === '' ? null : Math.min(3 * Number(peso), 339);
  const vernaVol1 = vernaDose1Mg != null ? vernaDose1Mg / vernaConcentracionMgMl : null;
  const vernaVel1 = vernaVol1 != null ? (vernaVol1 / 10) * 60 : null;
  const vernaDose2Mg = peso === '' ? null : Math.min(2 * Number(peso), 226);
  const vernaVol2 = vernaDose2Mg != null ? vernaDose2Mg / vernaConcentracionMgMl : null;
  const vernaVel2 = vernaVol2 != null ? (vernaVol2 / 10) * 60 : null;

  const nacVialG = 5;
  const nacVialMl = 25;
  const nacDose1G = peso === '' ? null : Math.min(0.15 * Number(peso), 15);
  const nacDose2G = peso === '' ? null : Math.min(0.05 * Number(peso), 5);
  const nacDose3G = peso === '' ? null : Math.min(0.1 * Number(peso), 10);
  const nacMixesBase: Array<{
    label: string;
    doseG: number | null;
    suero: SueroKey;
    tiempoMin?: number;
    tiempoH?: number;
  }> = [
    { label: 'MEZCLA 1', doseG: nacDose1G, suero: 250, tiempoMin: 15 },
    { label: 'MEZCLA 2', doseG: nacDose2G, suero: 500, tiempoH: 4 },
    { label: 'MEZCLA 3', doseG: nacDose3G, suero: 1000, tiempoH: 16 },
  ];
  const nacMixes = nacMixesBase.map((mix) => {
    const doseG = mix.doseG;
    const volVialesMl = doseG != null ? doseG / (nacVialG / nacVialMl) : null;
    const nVialesRaw = volVialesMl != null ? volVialesMl / nacVialMl : null;
    const nViales = nVialesRaw != null ? Math.ceil(nVialesRaw) : null;
    const totalVol = volVialesMl != null ? SUEROS_VOLUMENES[mix.suero].llenado + volVialesMl : null;
    const concMgMl = doseG != null && totalVol != null ? (doseG * 1000) / totalVol : null;
    const velMlh =
      totalVol != null
        ? mix.tiempoMin
          ? totalVol / (mix.tiempoMin / 60)
          : totalVol / (mix.tiempoH as number)
        : null;
    const mgKgH =
      concMgMl != null && velMlh != null && peso !== '' ? (concMgMl * velMlh) / Number(peso) : null;
    const mgKg =
      concMgMl != null && velMlh != null && peso !== '' && mix.tiempoMin
        ? (concMgMl * velMlh) / Number(peso) / (60 / mix.tiempoMin)
        : null;
    return { ...mix, volVialesMl, nViales, totalVol, concMgMl, velMlh, mgKgH, mgKg };
  });

  const cisaBoloConcMgMl = 2;
  const cisaBoloDoseUgKg = 150;
  const cisaBoloVolMl =
    peso !== '' ? (cisaBoloDoseUgKg * Number(peso)) / (cisaBoloConcMgMl * 1000) : null;
  const cisaMantConcMgMl = 5;
  const cisaMantDoseUgKgMin = 3;
  const cisaMantVelMlh =
    peso !== '' ? (cisaMantDoseUgKgMin * Number(peso) * 60) / (cisaMantConcMgMl * 1000) : null;

  const esmoConcMgMl = 10;
  const esmoBolusDoseUgKg = 500;
  const esmoBolusVolMl =
    peso !== '' ? ((esmoBolusDoseUgKg / 1000) * Number(peso)) / esmoConcMgMl : null;
  const esmoMantenimientoDoses = [50, 100, 150, 200, 250, 300].map((dose) => {
    const vel = peso !== '' ? ((dose / 1000) * Number(peso) * 60) / esmoConcMgMl : null;
    return { dose, vel };
  });

  const furoConcAmpMg = 250;
  const furoConcAmpMl = 25;
  const furoConcSuero = 100;
  const furoConcVolumenMezcla = SUEROS_VOLUMENES[furoConcSuero].llenado + furoConcAmpMl;
  const furoConcMgMl = furoConcAmpMg / furoConcVolumenMezcla;
  const furoConcDoses = [0.1, 0.3, 0.5, 0.7, 0.9, 1].map((dose) => {
    const mgH = dose * 60;
    const vel = mgH / furoConcMgMl;
    return { dose, mgH, vel };
  });
  const furoConcMgHNum = Number(furoConcMgH);
  const furoConcMgDiaNum = Number(furoConcMgDia);
  const furoConcMgHCap = Number.isFinite(furoConcMgHNum)
    ? Math.min(furoConcMgHNum, 2000 / 24)
    : null;
  const furoConcMgDiaCap = Number.isFinite(furoConcMgDiaNum)
    ? Math.min(furoConcMgDiaNum, 2000)
    : null;
  const furoConcOverMax =
    (Number.isFinite(furoConcMgHNum) && furoConcMgHNum > 2000 / 24) ||
    (Number.isFinite(furoConcMgDiaNum) && furoConcMgDiaNum > 2000);
  const furoConcFromMgH =
    furoConcMgHCap != null
      ? { mgMin: furoConcMgHCap / 60, mlh: furoConcMgHCap / furoConcMgMl }
      : null;
  const furoConcFromMgDia =
    furoConcMgDiaCap != null
      ? { mgH: furoConcMgDiaCap / 24, mlh: furoConcMgDiaCap / 24 / furoConcMgMl }
      : null;

  const levoVialMg = 12.5;
  const levoVialMl = 5;
  const levoSuero = 500;
  const levoVolumenMezcla = SUEROS_VOLUMENES[levoSuero].llenado + levoVialMl;
  const levoConcUgMl = (levoVialMg * 1000) / levoVolumenMezcla;
  const levoCargaDoses = [6, 12].map((dose) => {
    const vol = peso !== '' ? (dose * Number(peso)) / levoConcUgMl : null;
    const vel = vol != null ? (vol / 10) * 60 : null;
    return { dose, vol, vel };
  });
  const levoMantenimientoDose = 0.1;
  const levoMantenimientoVel =
    peso !== '' ? (levoMantenimientoDose * Number(peso) * 60) / levoConcUgMl : null;

  const midaAmpollas = 5;
  const midaMgPorAmpolla = 15;
  const midaMlPorAmpolla = 3;
  const midaSuero = 100;
  const midaVolumenMezcla = SUEROS_VOLUMENES[midaSuero].llenado + midaAmpollas * midaMlPorAmpolla;
  const midaConcMgMl = (midaAmpollas * midaMgPorAmpolla) / midaVolumenMezcla;
  const midaDoses = [0.03, 0.05, 0.07, 0.09, 0.15, 0.2].map((dose) => {
    const vel = calcMlhFromDoseMgKgH(dose, peso, midaConcMgMl);
    return { dose, vel };
  });
  const midaCustomNum = Number(midaCustomDose);
  const midaCustomCap = Number.isFinite(midaCustomNum) ? Math.min(midaCustomNum, 2) : null;
  const midaCustomVel =
    midaCustomCap != null ? calcMlhFromDoseMgKgH(midaCustomCap, peso, midaConcMgMl) : null;

  const noraAmpollas = 2;
  const noraMgPorAmpolla = 10;
  const noraMlPorAmpolla = 10;
  const noraSuero = 100;
  const noraVolumenMezcla = SUEROS_VOLUMENES[noraSuero].llenado + noraAmpollas * noraMlPorAmpolla;
  const noraConcUgMl = (noraAmpollas * noraMgPorAmpolla * 1000) / noraVolumenMezcla;
  const noraConcMgMl = noraConcUgMl / 1000;
  const noraDosesBase = [0.1, 0.25, 0.5, 0.75, 1].map((dose) => {
    const bitartrato = dose * 2;
    const vel = calcMlhFromDoseUgKgMin(bitartrato, peso, noraConcMgMl);
    return { dose, bitartrato, vel };
  });
  const noraCustomNum = Number(noraCustomDose);
  const noraCustomBitartrato = Number.isFinite(noraCustomNum) ? noraCustomNum * 2 : null;
  const noraCustomVel =
    noraCustomBitartrato != null
      ? calcMlhFromDoseUgKgMin(noraCustomBitartrato, peso, noraConcMgMl)
      : null;

  const procaVialMg = 1000;
  const procaVialMl = 10;
  const procaSuero = 250;
  const procaVolumenMezcla = SUEROS_VOLUMENES[procaSuero].llenado + 5 * procaVialMl;
  const procaConcMgMl = (5 * procaVialMg) / procaVolumenMezcla;
  const procaCargaDose = 17;
  const procaCargaVel = calcMlhFromDoseMgKgH(procaCargaDose, peso, procaConcMgMl);
  const procaMantenimientoDoses = [2, 3, 5, 6].map((dose) => {
    const vel = (dose * 60) / procaConcMgMl;
    return { dose, vel };
  });
  const procaCustomNum = Number(procaCustomDose);
  const procaCustomCap = Number.isFinite(procaCustomNum) ? Math.min(procaCustomNum, 6) : null;
  const procaCustomVel = procaCustomCap != null ? (procaCustomCap * 60) / procaConcMgMl : null;

  const salbAmpollas = 10;
  const salbUgPorAmpolla = 500;
  const salbMlPorAmpolla = 1;
  const salbSuero = 250;
  const salbVolumenMezcla = SUEROS_VOLUMENES[salbSuero].llenado + salbAmpollas * salbMlPorAmpolla;
  const salbConcUgMl = (salbAmpollas * salbUgPorAmpolla) / salbVolumenMezcla;
  const salbDosisInicial = 4;
  const salbVolInicial = peso !== '' ? (salbDosisInicial * Number(peso)) / salbConcUgMl : null;
  const salbMantenimientoDoses = [4, 5, 6, 7, 8].map((dose) => {
    const vel = peso !== '' ? (dose * Number(peso)) / salbConcUgMl : null;
    return { dose, vel };
  });

  const uraAmpollas = 5;
  const uraMgPorAmpolla = 50;
  const uraMlPorAmpolla = 10;
  const uraSuero = 250;
  const uraVolumenMezcla = SUEROS_VOLUMENES[uraSuero].llenado + uraAmpollas * uraMlPorAmpolla;
  const uraConcMgMl = (uraAmpollas * uraMgPorAmpolla) / uraVolumenMezcla;
  const uraDoses = [2.5, 3, 4, 5, 7].map((dose) => {
    const vel = calcMlhFromDoseUgKgMin(dose, peso, uraConcMgMl);
    return { dose, vel };
  });

  const morfAmpollasBolo = 1;
  const morfMgPorAmpolla = 10;
  const morfMlPorAmpolla = 1;
  const morfSueroBolo = 9;
  const morfVolumenBolo = morfAmpollasBolo * morfMlPorAmpolla + morfSueroBolo;

  const morfAmpollas = 2;
  const morfSuero = 100;
  const morfVolumenMezcla = SUEROS_VOLUMENES[morfSuero].llenado + morfAmpollas * morfMlPorAmpolla;
  const morfConcentracion = (morfAmpollas * morfMgPorAmpolla) / morfVolumenMezcla;
  const morfMantenimiento = [206, 207, 208, 209].map((row) => ({
    dosis: evaluator.getCellValue('MEZCLAS ESTANDAR', `B${row}`),
    velocidad: evaluator.getCellValue('MEZCLAS ESTANDAR', `E${row}`),
    frecuencia: evaluator.getCellValue('MEZCLAS ESTANDAR', `I${row}`),
  }));
  const morfCustomDoseNum = Number(morfCustomDose);
  const morfCustomMlh = Number.isFinite(morfCustomDoseNum)
    ? morfCustomDoseNum / 24 / morfConcentracion
    : null;
  const morfCustomFrecuencia =
    morfCustomMlh != null ? calcOrionFromMlh(morfCustomMlh, morfVolumenMezcla) : null;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">STANDyCALC (FASE DE PRUEBAS)</h1>
        <p className="text-sm text-slate-600">
          Calculadora de mezclas para perfusión. Introduce los datos del paciente y revisa las
          tablas de mezclas estándar y restringidas.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Datos del paciente
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Peso (kg)</span>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              type="number"
              value={peso}
              onChange={(event) =>
                setPeso(event.target.value === '' ? '' : Number(event.target.value))
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Talla (cm)</span>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              type="number"
              value={talla}
              onChange={(event) =>
                setTalla(event.target.value === '' ? '' : Number(event.target.value))
              }
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
              activeTab === 'estandar'
                ? 'border-[#2b5d68] bg-[#2b5d68] text-white'
                : 'border-[#dfe9eb] text-[#2b5d68] hover:border-[#c7dadd] hover:bg-[#eef6f8]'
            }`}
            onClick={() => setActiveTab('estandar')}
          >
            Mezclas estándar
          </button>
          <button
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              activeTab === 'restringidas'
                ? 'border-rose-700 bg-rose-700 text-white'
                : 'border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50'
            }`}
            onClick={() => setActiveTab('restringidas')}
          >
            Mezclas restringidas
          </button>
          <button
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              activeTab === 'instrucciones'
                ? 'border-[#2b5d68] bg-[#2b5d68] text-white'
                : 'border-[#dfe9eb] text-[#2b5d68] hover:border-[#c7dadd] hover:bg-[#eef6f8]'
            }`}
            onClick={() => setActiveTab('instrucciones')}
          >
            Instrucciones
          </button>
        </div>

        {activeTab === 'estandar' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">MEZCLAS ESTÁNDAR</div>
            {searchNotice && activeTab === 'estandar' ? (
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
                          ? 'border-[#2b5d68] bg-[#2b5d68] text-white'
                          : 'border-[#dfe9eb] text-[#2b5d68] hover:border-[#c7dadd] hover:bg-[#eef6f8]'
                      } ${!isEnabled ? 'cursor-not-allowed opacity-40' : ''}`}
                      onClick={() => setSelectedStandard(section.row)}
                      disabled={!isEnabled}
                    >
                      {getDisplayLabel(label)}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selectedStandardName === 'AMIODARONA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      AMIODARONA ESTÁNDAR <span className="text-slate-500">(50 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Trangorex ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      150 mg / 3 mL
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
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    MEZCLA 1: DOSIS DE CARGA
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 2 ampollas +
                      100 mL SG5% (exclusivamente)
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(amioConcentracion, 2)} mg/mL
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Rango de velocidad:</span>{' '}
                    {formatValueFixed(amioVelocidadRapida, 0)} mL/h a{' '}
                    {formatValueFixed(amioVelocidadLenta, 0)} mL/h
                    <span className="text-slate-500"> (20 min a 2 h)</span>
                  </div>
                </div>

                <div className="relative mt-4 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/6_500r.svg"
                    alt="6 ampollas en 500 mL SG5%"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    MEZCLA 2: DOSIS DE MANTENIMIENTO
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 6 ampollas +
                      500 mL SG5% (exclusivamente)
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(amio2Concentracion, 2)} mg/mL
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Velocidad día 1
                    </div>
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

            {selectedStandardName === 'NALOXONA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      NALOXONA ESTÁNDAR <span className="text-slate-500">(20 µg/mL)</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      0,4 mg / 1 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/antidoto.svg"
                        alt="Antídoto"
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Antídoto</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/5_100v.svg"
                    alt="5 ampollas en 100 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas +
                      100 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(naloxConcentracionUgMl, 2)} µg/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {naloxVelocidades.map((item, idx) => {
                        const doseValue = Number(item.dosis);
                        const doseLabel = Number.isFinite(doseValue)
                          ? new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(
                              doseValue
                            )
                          : formatValue(item.dosis);
                        const vel =
                          Number.isFinite(doseValue) && naloxConcentracionMgMl > 0
                            ? calcMlhFromDoseUgKgMin(doseValue, peso, naloxConcentracionMgMl)
                            : null;
                        const freq = vel != null ? calcOrionFromMlh(vel, naloxVolumenMezcla) : null;
                        return (
                          <div
                            key={`nalox-${idx}`}
                            className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                          >
                            <div className="text-xs text-slate-500">{doseLabel} µg/kg/min</div>
                            <div className="mt-1 font-semibold text-slate-900">
                              {vel == null ? '—' : `${formatValueFixed(vel, 0)} mL/h`}
                            </div>
                            <div className="text-xs text-slate-500">
                              {freq == null
                                ? 'c/ — h (Orion)'
                                : `c/ ${formatValueFixed(freq, 0)} h (Orion)`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  También posible sin diluir
                  <br />
                  Rango dosis adultos{' '}
                  <span className="tooltip abbr-tooltip abbr-tooltip-no-circle font-semibold">
                    IVDL
                    <span className="tooltip-text">Intravenoso Directo Lento</span>
                  </span>
                  : 0,4-2 mg. Si precisa, repetir a intervalos
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'DOBUTAMINA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      DOBUTAMINA ESTÁNDAR <span className="text-slate-500">(12,5 mg/mL)</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      250 mg / 20 mL
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
                        className="h-15 w-15 object-contain"
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
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    DILUCIÓN
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 2 ampollas +
                      250 mL SF/G5% (nunca bicarbonato)
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(dobuConcentracion, 2)} mg/mL
                  </div>
                  <div className="text-xs text-slate-500">Ajustar según TA y FC</div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Velocidad
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {dobuVelocidades.map((item) => (
                        <div
                          key={`dobu-${item.dosis}`}
                          className={`rounded-lg border border-[#dfe9eb] px-3 py-2 ${
                            item.dosis === 2
                              ? 'bg-emerald-50'
                              : item.dosis === 10
                                ? 'bg-amber-50'
                                : item.dosis === 15
                                  ? 'bg-cyan-100'
                                  : item.dosis === 18
                                    ? 'bg-violet-100'
                                    : item.dosis === 20
                                      ? 'bg-rose-50'
                                      : 'bg-white'
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
                      className={`w-full sm:w-[360px] rounded-lg border bg-white p-3 ${
                        dobuCustomDoseNum > 40 ? 'border-rose-400' : 'border-[#dfe9eb]'
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
                            value={dobuCustomDose}
                            onChange={(event) => setDobuCustomDose(event.target.value)}
                          />
                          <span className="text-slate-500">µg/kg/min</span>
                        </label>
                        <div className="text-sm text-slate-700">
                          {dobuCustomMlh == null ? (
                            '—'
                          ) : (
                            <>
                              <span className="font-semibold text-slate-900">
                                {formatValueFixed(dobuCustomMlh, 0)} mL/h
                              </span>
                              {dobuCustomFrecuencia == null
                                ? ''
                                : `  c/ ${formatValueFixed(dobuCustomFrecuencia, 0)} h (Orion)`}
                            </>
                          )}
                        </div>
                      </div>
                      {dobuCustomDoseNum > 40 ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Se aplica máximo de 40 µg/kg/min.
                        </div>
                      ) : null}
                    </div>
                    {dobuCustomDoseNum > 40 ? (
                      <div className="text-xs font-semibold text-rose-600">
                        Dosis máxima sobrepasada
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  <span className="font-semibold">Dosis máxima:</span> 40 µg/kg/min
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'DOPAMINA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      DOPAMINA ESTÁNDAR <span className="text-slate-500">(40 mg/mL)</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      200 mg / 5 mL
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
                        className="h-15 w-15 object-contain"
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
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    DILUCIÓN
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 2 ampollas +
                      250 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(dopaConcentracion, 2)} mg/mL
                  </div>
                  <div className="text-xs text-slate-500">Ajustar según TA y FC</div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Velocidad
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {dopaVelocidades.map((item) => (
                        <div
                          key={`dopa-${item.dosis}`}
                          className={`rounded-lg border border-[#dfe9eb] px-3 py-2 ${
                            item.dosis === 2 || item.dosis === 4
                              ? 'bg-emerald-50'
                              : item.dosis === 5 || item.dosis === 14
                                ? 'bg-orange-50'
                                : item.dosis === 15 || item.dosis === 40
                                  ? 'bg-rose-50'
                                  : 'bg-white'
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
                                typeof rawFreq === 'number' && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, dopaVolumenMezcla);
                              return freq == null
                                ? 'c/ — h (Orion)'
                                : `c/ ${formatValueFixed(freq, 0)} h (Orion)`;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-start gap-3">
                    <div
                      className={`w-full sm:w-[360px] rounded-lg border bg-white p-3 ${
                        dopaCustomDoseNum > 50 ? 'border-rose-400' : 'border-[#dfe9eb]'
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
                            '—'
                          ) : (
                            <>
                              <span className="font-semibold text-slate-900">
                                {formatValueFixed(dopaCustomMlh, 0)} mL/h
                              </span>
                              {dopaCustomFrecuencia == null
                                ? ''
                                : `  c/ ${formatValueFixed(dopaCustomFrecuencia, 0)} h (Orion)`}
                            </>
                          )}
                        </div>
                        {dopaCustomZona ? (
                          <div className="text-xs text-slate-500">{dopaCustomZona.texto}</div>
                        ) : null}
                      </div>
                      {dopaCustomDoseNum > 50 ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Se aplica máximo de 50 µg/kg/min.
                        </div>
                      ) : null}
                    </div>
                    {dopaCustomDoseNum > 50 ? (
                      <div className="text-xs font-semibold text-rose-600">
                        Dosis máxima sobrepasada
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  <span className="font-semibold">Dosis máxima:</span> 50 µg/kg/min
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'FLECAINIDA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      FLECAINIDA ESTÁNDAR <span className="text-slate-500">(10 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Apocard ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      150 mg / 15 mL
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
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar FC</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/1_100r.svg"
                    alt="1 ampolla en 100 mL SG5%"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    DILUCIÓN
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 1 ampolla +
                      100 mL SG5% (exclusivamente)
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(flecaConcentracion, 2)} mg/mL
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de carga
                    </div>
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
                            const rawVel = calcMlhFromDoseMgKgH(
                              item.dosis,
                              peso,
                              flecaConcentracion
                            );
                            const cap =
                              typeof flecaMaxMlh === 'number' && Number.isFinite(flecaMaxMlh)
                                ? flecaMaxMlh
                                : null;
                            const vel =
                              rawVel != null && cap != null ? Math.min(rawVel, cap) : rawVel;
                            const freq =
                              vel != null ? calcOrionFromMlh(vel, flecaVolumenMezcla) : null;
                            return (
                              <>
                                <div className="mt-1 font-semibold text-slate-900">
                                  {vel == null ? '—' : `${formatValueFixed(vel, 0)} mL/h`}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {freq == null
                                    ? 'c/ — h (Orion)'
                                    : `c/ ${formatValueFixed(freq, 0)} h (Orion)`}
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
                      className={`w-full sm:w-[360px] rounded-lg border bg-white p-3 ${
                        flecaCustomDoseNum > 600 ? 'border-rose-400' : 'border-[#dfe9eb]'
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
                            '—  c/ — h (Orion)'
                          ) : (
                            <>
                              <span className="font-semibold text-slate-900">
                                {formatValueFixed(flecaCustomMlh, 0)} mL/h
                              </span>
                              {`  c/ ${formatValueFixed(flecaCustomFrecuencia ?? calcOrionFromMlh(flecaCustomMlh, flecaVolumenMezcla) ?? 0, 0)} h (Orion)`}
                            </>
                          )}
                        </div>
                      </div>
                      {flecaCustomDoseNum > 600 ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Se aplica máximo de 600 mg en 24 h.
                        </div>
                      ) : null}
                    </div>
                    {flecaCustomDoseNum > 600 ? (
                      <div className="text-xs font-semibold text-rose-600">
                        Dosis máxima sobrepasada
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  <span className="font-semibold">Dosis máxima:</span> 600 mg en 24 horas
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'NIMODIPINO' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      NIMODIPINO <span className="text-slate-500">(0,2 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Nimotop ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 20 mg
                      / 100 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/vasodilatador.svg"
                        alt="Vasodilatador"
                        className="h-14 w-14 object-contain"
                      />
                      <span className="tooltip-text">Vasodilatador</span>
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
                  <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    <span>NUNCA DILUIR</span>
                  </div>
                  <div className="text-xs text-slate-500">Dosis inicial durante 2 h</div>
                  <div className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                    <div className="text-xs text-slate-500">{nimodipinoDosisInicial} µg/kg/h</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {nimodipinoVelInicial == null
                        ? '—'
                        : `${formatValueFixed(nimodipinoVelInicial, 0)} mL/h`}
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-slate-500">Dosis de mantenimiento</div>
                  <div className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                    <div className="text-xs text-slate-500">
                      {nimodipinoDosisMantenimiento} µg/kg/h
                    </div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {nimodipinoVelMantenimiento == null
                        ? '—'
                        : `${formatValueFixed(nimodipinoVelMantenimiento, 0)} mL/h`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {nimodipinoFrecuencia == null
                        ? 'c/ — h (Orion)'
                        : `c/ ${formatValueFixed(nimodipinoFrecuencia, 0)} h (Orion)`}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'NITROGLICERINA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      NITROGLICERINA ESTÁNDAR <span className="text-slate-500">(1 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Solinitrina ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 5
                      mg / 5 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/vasodilatador.svg"
                        alt="Vasodilatador"
                        className="h-14 w-14 object-contain"
                      />
                      <span className="tooltip-text">Vasodilatador</span>
                    </span>
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/monitorizar_TA.svg"
                        alt="Monitorizar TA"
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar TA</span>
                    </span>
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/present_peq.svg"
                        alt="Presentación pequeña"
                        className="h-14 w-14 object-contain"
                      />
                      <span className="tooltip-text">Ojo! Presentación pequeña</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4 pr-24">
                  <img
                    src="/img/standycalc_icons/diluciones/5_250r.svg"
                    alt="5 ampollas en 250 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    DILUCIÓN
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas +
                      250 mL G5%/SF/RL
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(nitroConcentracion, 2)} mg/mL
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-rose-600">
                      ¡No utilizar en{' '}
                      <span className="tooltip abbr-tooltip abbr-tooltip-no-circle">
                        IVDL
                        <span className="tooltip-text">
                          Intravenosa Directa Lenta (bolus lento)
                        </span>
                      </span>
                      !
                    </span>{' '}
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
                          <div className="text-xs text-slate-500">
                            {formatValue(item.dosis)} µg/min
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(item.velocidad, 0)} mL/h
                          </div>
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const rawFreq = item.frecuencia;
                              const freq =
                                typeof rawFreq === 'number' && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, nitroVolumenMezcla);
                              return freq == null
                                ? 'c/ — h (Orion)'
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

            {selectedStandardName === 'NITROPRUSIATO' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      NITROPRUSIATO ESTÁNDAR <span className="text-slate-500">(200 µg/mL)</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 50 mg
                      + 5 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/vasodilatador.svg"
                        alt="Vasodilatador"
                        className="h-14 w-14 object-contain"
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
                        className="h-15 w-15 object-contain"
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

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4 pr-24">
                  <img
                    src="/img/standycalc_icons/diluciones/2_500r.svg"
                    alt="2 viales en 500 mL SG5%"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    DILUCIÓN
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 2 viales + 500
                      mL SG5% (exclusivamente)
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(nprConcentracion, 2)} µg/mL
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-rose-600">
                      ¡No utilizar en{' '}
                      <span className="tooltip abbr-tooltip abbr-tooltip-no-circle">
                        IVDL
                        <span className="tooltip-text">
                          Intravenosa Directa Lenta (bolus lento)
                        </span>
                      </span>
                      !
                    </span>{' '}
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
                          <div className="text-xs text-slate-500">
                            {formatValue(item.dosis)} µg/kg/min
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(item.velocidad, 0)} mL/h
                          </div>
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const rawFreq = item.frecuencia;
                              const freq =
                                typeof rawFreq === 'number' && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, nprVolumenMezcla);
                              return freq == null
                                ? 'c/ — h (Orion)'
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

            {selectedStandardName === 'FLUMAZENILO' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">FLUMAZENILO</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      0,5 mg / 5 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/antidoto.svg"
                        alt="Antídoto"
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Antídoto</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4 pr-24">
                  <span className="absolute right-4 top-4">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/bolo_lento.svg"
                        alt="Bolo IV directo lento"
                        className="h-20 w-20 object-contain"
                      />
                      <span className="tooltip-text">Bolo IV directo lento</span>
                    </span>
                  </span>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    BOLO INICIAL
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Dosis inicial:</span> 0,25 mg =
                    2,5 mL
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="tooltip abbr-tooltip abbr-tooltip-no-circle">
                      IVDL
                      <span className="tooltip-text">Intravenosa Directa Lenta (bolus lento)</span>
                    </span>{' '}
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
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas +
                      100 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
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
                          <div className="text-xs text-slate-500">
                            {formatValue(item.dosis)} mg/h
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(item.velocidad, 0)} mL/h
                          </div>
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const rawFreq = item.frecuencia;
                              const freq =
                                typeof rawFreq === 'number' && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, flumaVolumenMezcla);
                              return freq == null
                                ? 'c/ — h (Orion)'
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

            {selectedStandardName === 'OCTREOTIDO' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      OCTREÓTIDO ESTÁNDAR <span className="text-slate-500">(5 µg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Sandostatin ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      0,1 mg / 1 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/intestino.svg"
                        alt="Gastroenterológicos"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Gastroenterológicos</span>
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
                    src="/img/standycalc_icons/diluciones/5_100v.svg"
                    alt="5 ampollas en 100 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas +
                      100 mL SF
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(octreConcentracionUgMl, 2)} µg/mL
                  </div>

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="font-semibold uppercase tracking-wide">
                      Dosis de mantenimiento
                    </div>
                    <div>Durante 5 días PIVC</div>
                  </div>

                  <div className="grid gap-2 pt-2 text-sm text-slate-700 sm:grid-cols-2">
                    {octreDosis.map((item, idx) => {
                      const doseValue = Number(item.dosis);
                      const doseLabel = Number.isFinite(doseValue)
                        ? new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(
                            doseValue
                          )
                        : formatValue(item.dosis);
                      const vel =
                        Number.isFinite(doseValue) && octreConcentracionUgMl > 0
                          ? doseValue / octreConcentracionUgMl
                          : null;
                      const freq = vel != null ? calcOrionFromMlh(vel, octreVolumenMezcla) : null;
                      return (
                        <div
                          key={`octre-${idx}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{doseLabel} µg/h</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {vel == null ? '—' : `${formatValueFixed(vel, 0)} mL/h`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {freq == null
                              ? 'c/ — h (Orion)'
                              : `c/ ${formatValueFixed(freq, 0)} h (Orion)`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'FUROSEMIDA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      FUROSEMIDA ESTÁNDAR <span className="text-slate-500">(10 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Seguril ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 20
                      mg / 2 mL
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
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    DILUCIÓN
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas +
                      100 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
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
                          <div className="text-xs text-slate-500">
                            {formatValue(item.dosis)} mg/min
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(item.velocidad, 0)} mL/h
                          </div>
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const rawFreq = item.frecuencia;
                              const freq =
                                typeof rawFreq === 'number' && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, furoVolumenMezcla);
                              return freq == null
                                ? 'c/ — h (Orion)'
                                : `c/ ${formatValueFixed(freq, 0)} h (Orion)`;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-start gap-3">
                    <div
                      className={`w-full sm:w-[360px] rounded-lg border bg-white p-3 ${
                        furoCustomDoseNum > 1500 ? 'border-rose-400' : 'border-[#dfe9eb]'
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
                            '—  c/ — h (Orion)'
                          ) : (
                            <>
                              <span className="font-semibold text-slate-900">
                                {formatValueFixed(furoCustomMlh, 0)} mL/h
                              </span>
                              {`  c/ ${formatValueFixed(
                                furoCustomFrecuencia ??
                                  calcOrionFromMlh(furoCustomMlh, furoVolumenMezcla) ??
                                  0,
                                0
                              )} h (Orion)`}
                            </>
                          )}
                        </div>
                      </div>
                      {furoCustomDoseNum > 1500 ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Se aplica máximo de 1.500 mg en 24 h.
                        </div>
                      ) : null}
                    </div>
                    {furoCustomDoseNum > 1500 ? (
                      <div className="text-xs font-semibold text-rose-600">
                        Dosis máxima sobrepasada
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  <span className="font-semibold">Dosis máxima:</span> 1.500 mg en 24 horas
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'SODIO HIPERTONICO' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      SODIO HIPERTÓNICO ESTÁNDAR <span className="text-slate-500">(3%)</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      NaCl 20% = 2 g / 10 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/electrolito.svg"
                        alt="Electrolitos"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Electrolitos</span>
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
                        src="/img/standycalc_icons/monitorizar.svg"
                        alt="Monitorizar ritmo"
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar ritmo</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/6_500v.svg"
                    alt="6 ampollas en 500 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 6 ampollas +
                      500 mL SF
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(sodioConcentracionMgMl, 2)} mg/mL ={' '}
                    {formatValueFixed(sodioConcentracionMeqMl, 3)} mEq Na+/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Seleccionar velocidad en función de Na+ plasmático
                    </div>
                    <div className="mt-2 overflow-auto">
                      <table className="min-w-full border-collapse text-xs">
                        <thead className="text-slate-500">
                          <tr>
                            <th className="px-1 py-1 text-center">Na+ plasma</th>
                            <th className="px-1 py-1 text-center">Déficit Na+</th>
                            <th className="px-1 py-1 text-center">Velocidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sodioNaRows.map((row, idx) => (
                            <tr key={`sodio-${idx}`} className="border-t border-slate-100">
                              <td className="px-1 py-1 text-center">
                                {Number.isFinite(row.na) ? formatValueFixed(row.na, 0) : '—'} mmol/L
                              </td>
                              <td className="px-1 py-1 text-center">
                                {row.deficit == null
                                  ? '—'
                                  : `${formatValueFixed(row.deficit, 0)} mEq`}
                              </td>
                              <td className="px-1 py-1 text-center">
                                {row.velocidad == null
                                  ? '—'
                                  : `${formatValueFixed(row.velocidad, 0)} mL/h`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-4 w-full rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  Velocidad para las primeras 12h. Cálculo para un incremento plasmático máximo de
                  10 mEq Na+/l en 24 h (máx. recomendado)
                  <br />
                  Suspender al alcanzar un incremento de 10 mEq Na+/L
                  <div className="mt-1">
                    Ver detalle de reposición de hiponatremia en{' '}
                    <Link href="/escalas/hiponatremia" className="font-semibold underline">
                      Hiponatremia
                    </Link>
                    .
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'HEPARINA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      HEPARINA SÓDICA <span className="text-slate-500">(50 UI/mL)</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 1%
                      5.000 UI / 5 mL
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
                  <span className="absolute right-4 top-4">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/bolo_lento.svg"
                        alt="Bolo IV directo lento"
                        className="h-20 w-20 object-contain"
                      />
                      <span className="tooltip-text">Bolo IV directo lento</span>
                    </span>
                  </span>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    Dosis de carga
                  </div>
                  <div className="text-xs text-slate-500">
                    Vial 1%: 50 mg / 5 mL = 10 mg/mL (1000 mg/dL) = 5000 UI / 5 mL (1000 UI/mL)
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">80 UI/kg</span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">UI totales:</span>{' '}
                    {hepaCargaUi == null ? '—' : formatValueFixed(hepaCargaUi, 0)}
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Volumen vial:</span>{' '}
                    {hepaCargaMl == null ? '—' : `${formatValueFixed(hepaCargaMl, 1)} mL`}
                    <span className="text-slate-500"> (</span>
                    <span className="tooltip abbr-tooltip abbr-tooltip-no-circle text-slate-500">
                      IVDL
                      <span className="tooltip-text">Intravenosa Directa Lenta (bolus lento)</span>
                    </span>
                    <span className="text-slate-500">, </span>
                    <span className="text-slate-500">
                      {hepaCargaMin == null ? '—' : `${formatValueFixed(hepaCargaMin, 0)} min`}
                    </span>
                    <span className="text-slate-500">)</span>
                  </div>
                </div>

                <div className="relative mt-4 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/1_500v.svg"
                    alt="1 vial en 500 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    Estándar
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 1 vial 5% +
                      500 mL SF
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
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
                        {hepaMantenimientoMlh == null
                          ? '—'
                          : `${formatValueFixed(hepaMantenimientoMlh, 0)} mL/h`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {hepaMantenimientoFreq == null
                          ? 'c/ — h (Orion)'
                          : `c/ ${formatValueFixed(hepaMantenimientoFreq, 0)} h (Orion)`}{' '}
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
                          ['< 40', '3000 UI', 'No', 2, '6 h'],
                          ['40-49', '0 UI', 'No', 1, '6 h'],
                          ['50-70', '0 UI', 'No', 0, '24 h'],
                          ['71-85', '0 UI', 'No', -1, '24 h'],
                          ['86-100', '0 UI', '30 min', -2, '6 h'],
                          ['101-150', '0 UI', '60 min', -3, '6 h'],
                          ['> 150', '0 UI', '60 min', -6, '6 h'],
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

            {selectedStandardName === 'SOMATOSTATINA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      SOMATOSTATINA ESTÁNDAR <span className="text-slate-500">(12 µg/mL)</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 3 mg
                      + 1 mL SF
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/intestino.svg"
                        alt="Intestino"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Intestino</span>
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
                    src="/img/standycalc_icons/diluciones/1_250v.svg"
                    alt="1 vial en 250 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 1 vial + 250
                      mL SF
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(somaConcentracionUgMl, 2)} µg/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis mantenimiento
                    </div>
                    <div className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                      <div className="text-xs text-slate-500">HEMORRAGIA DIGESTIVA*</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {somaHemorragiaDose} µg/kg/h
                      </div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {somaHemorragiaMlh == null
                          ? '—'
                          : `${formatValueFixed(somaHemorragiaMlh, 0)} mL/h`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {somaHemorragiaFreq == null
                          ? 'c/ — h (Orion)'
                          : `c/ ${formatValueFixed(somaHemorragiaFreq, 0)} h (Orion)`}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      *Previamente administrar 1 ampolla de 0,25 mg en bolo{' '}
                      <span className="tooltip abbr-tooltip abbr-tooltip-no-circle">
                        IVDL
                        <span className="tooltip-text">Intravenoso Directo Lento</span>
                      </span>{' '}
                      en al menos 3 min.
                    </div>

                    <div className="pt-1 text-xs text-slate-500">FÍSTULA PANCREÁTICA</div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      {somaFistulaRows.map((row, idx) => (
                        <div
                          key={`soma-fistula-${idx}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{row.dose} µg/h</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {row.vel == null ? '—' : `${formatValueFixed(row.vel, 0)} mL/h`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {row.freq == null
                              ? 'c/ — h (Orion)'
                              : `c/ ${formatValueFixed(row.freq, 0)} h (Orion)`}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500">
                      *Reducir Velocidad a la mitad los dos últimos días de tto.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'LABETALOL' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      LABETALOL <span className="text-slate-500">(5 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Trandate ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      100 mg / 20 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/vasodilatador.svg"
                        alt="Vasodilatador"
                        className="h-14 w-14 object-contain"
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
                        src="/img/standycalc_icons/monitorizar_TA_FC.svg"
                        alt="Monitorizar TA y FC"
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar TA y FC</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <span className="absolute right-4 top-4">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/bolo_lento.svg"
                        alt="Bolo IV directo lento"
                        className="h-20 w-20 object-contain"
                      />
                      <span className="tooltip-text">Bolo IV directo lento</span>
                    </span>
                  </span>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    BOLO EMERGENCIA HTA
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Dosis:</span> 20 mg = 4 mL{' '}
                    <span className="text-slate-500">(</span>
                    <span className="tooltip abbr-tooltip abbr-tooltip-no-circle text-slate-500">
                      IVDL
                      <span className="tooltip-text">Intravenosa Directa Lenta (bolus lento)</span>
                    </span>
                    <span className="text-slate-500"> en 1 min)</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Repetir cada 5 min, si precisa, hasta D. máx: 200 mg.
                  </div>
                </div>

                <div className="relative mt-4 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/5_250r.svg"
                    alt="5 ampollas en 250 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas +
                      250 mL G5%/SF/RL (nunca bicarbonato)
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(labeConcentracion, 2)} mg/mL
                  </div>
                  <div className="text-xs text-slate-500">Ajustar según TA y FC</div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de mantenimiento
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {labeVelocidades.map((item, idx) => (
                        <div
                          key={`labe-${idx}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">
                            {formatValue(item.dosis)} µg/kg/min
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(item.velocidad, 0)} mL/h
                          </div>
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const rawFreq = item.frecuencia;
                              const freq =
                                typeof rawFreq === 'number' && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, labeVolumenMezcla);
                              return freq == null
                                ? 'c/ — h (Orion)'
                                : `c/ ${formatValueFixed(freq, 0)} h (Orion)`;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-start gap-3">
                    <div
                      className={`w-full sm:w-[360px] rounded-lg border bg-white p-3 ${
                        labeCustomDoseNum > 160 ? 'border-rose-400' : 'border-[#dfe9eb]'
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
                            value={labeCustomDose}
                            onChange={(event) => setLabeCustomDose(event.target.value)}
                          />
                          <span className="text-slate-500">mg/h</span>
                        </label>
                        <div className="text-sm text-slate-700">
                          {labeCustomMlh == null ? (
                            '—  c/ — h (Orion)'
                          ) : (
                            <>
                              <span className="font-semibold text-slate-900">
                                {formatValueFixed(labeCustomMlh, 0)} mL/h
                              </span>
                              {`  c/ ${formatValueFixed(
                                labeCustomFrecuencia ??
                                  calcOrionFromMlh(labeCustomMlh, labeVolumenMezcla) ??
                                  0,
                                0
                              )} h (Orion)`}
                            </>
                          )}
                        </div>
                      </div>
                      {labeCustomDoseNum > 160 ? (
                        <div className="mt-1 text-xs text-slate-500">
                          Se aplica máximo de 160 mg/h.
                        </div>
                      ) : null}
                    </div>
                    {labeCustomDoseNum > 160 ? (
                      <div className="text-xs font-semibold text-rose-600">
                        Dosis máxima sobrepasada
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  <span className="font-semibold">Dosis máxima:</span> 160 mg/h
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'TEOFILINA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      TEOFILINA ESTÁNDAR <span className="text-slate-500">(0,4 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Eufilina ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      200 mg / 10 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/broncodilatador.svg"
                        alt="Broncodilatador"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Broncodilatador</span>
                    </span>
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/monitorizar.svg"
                        alt="Monitorizar ritmo"
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar ritmo</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/1_500v.svg"
                    alt="1 ampolla en 500 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 1 ampolla +
                      500 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(teoConcentracionMgMl, 2)} mg/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis inicial
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      {teoInicial.map((row, idx) => (
                        <div
                          key={`teo-init-${idx}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{row.dosis} mg/kg ideal</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {row.velocidad == null
                              ? '—'
                              : `${formatValueFixed(row.velocidad, 0)} mL/h`}
                            {row.volumen == null
                              ? null
                              : ` (Volumen: ${formatValueFixed(row.volumen, 0)} mL)`}
                          </div>
                          <div className="text-xs text-slate-500">{row.nota}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis mantenimiento
                    </div>
                    <div className="space-y-3">
                      {teoMantenimiento.map((grupo) => (
                        <div key={grupo.titulo}>
                          <div className="text-xs font-semibold text-[#2b5d68]">{grupo.titulo}</div>
                          <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                            {grupo.filas.map((fila, idx) => (
                              <div
                                key={`${grupo.titulo}-${idx}`}
                                className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                              >
                                <div className="text-xs text-slate-500">
                                  {formatValueFixed(fila.dosis, 2)} mg/kg ideal/h
                                </div>
                                <div className="mt-1 font-semibold text-slate-900">
                                  {fila.vel == null ? '—' : `${formatValueFixed(fila.vel, 0)} mL/h`}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {fila.freq == null
                                    ? 'c/ — h (Orion)'
                                    : `c/ ${formatValueFixed(fila.freq, 0)} h (Orion)`}{' '}
                                  · {fila.nota}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'MORFINA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">MORFINA</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 10
                      mg / 1 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/analgesia_sedacion.svg"
                        alt="Analgesia y sedación"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Analgesia</span>
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
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/monitorizar.svg"
                        alt="Monitorizar ritmo"
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar ritmo</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4 pr-24">
                  <div className="absolute right-4 top-4 flex items-center gap-2">
                    <img
                      src="/img/standycalc_icons/diluciones/1_10v.svg"
                      alt="1 ampolla en 10 mL"
                      className="h-10 w-10"
                    />
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/bolo_lento.svg"
                        alt="Bolo IV directo lento"
                        className="h-20 w-20 object-contain"
                      />
                      <span className="tooltip-text">Bolo IV directo lento</span>
                    </span>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    MORFINA BOLO 1 mg/mL
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Dilución:</span> 1 ampolla + 9 mL
                    SF
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Dosis inicial </span>
                    <span className="tooltip abbr-tooltip abbr-tooltip-no-circle font-semibold text-slate-900">
                      IVDL
                      <span className="tooltip-text">Intravenoso directo lento</span>
                    </span>
                    <span className="font-semibold text-slate-900">:</span> 3 - 10 mg (3 - 10 mL)
                  </div>
                  <div className="text-xs text-slate-500">
                    Comenzar administrando 2-3 mL de la dilución. Repetir c/5 min, si precisa.
                  </div>
                </div>

                <div className="relative mt-4 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/2_100v.svg"
                    alt="2 ampollas en 100 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Dilución:</span> 2 ampollas + 100
                    mL SF/G5%
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(morfConcentracion * 1000, 1)} µg/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de mantenimiento
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      {morfMantenimiento.map((item, idx) => {
                        const dose = Number(item.dosis);
                        const vel = Number.isFinite(dose)
                          ? calcMlhFromDoseUgKgMin(dose, peso, morfConcentracion)
                          : null;
                        const freq = vel != null ? calcOrionFromMlh(vel, morfVolumenMezcla) : null;
                        return (
                          <div
                            key={`morf-${idx}`}
                            className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                          >
                            <div className="text-xs text-slate-500">
                              {formatValue(item.dosis)} µg/kg/min
                            </div>
                            <div className="mt-1 font-semibold text-slate-900">
                              {vel == null ? '—' : `${formatValueFixed(vel, 0)} mL/h`}
                            </div>
                            <div className="text-xs text-slate-500">
                              {freq == null
                                ? 'c/ — h (Orion)'
                                : `c/ ${formatValueFixed(freq, 0)} h (Orion)`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-start gap-3">
                    <div className="w-full sm:w-[360px] rounded-lg border bg-white p-3 border-[#dfe9eb]">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Personalizar dosis
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                        <label className="flex items-center gap-2">
                          <input
                            className="w-24 rounded-md border border-[#dfe9eb] px-2 py-1 text-sm"
                            type="number"
                            inputMode="decimal"
                            value={morfCustomDose}
                            onChange={(event) => setMorfCustomDose(event.target.value)}
                          />
                          <span className="text-slate-500">mg/día</span>
                        </label>
                        <div className="text-sm text-slate-700">
                          {morfCustomMlh == null ? (
                            '—  c/ — h (Orion)'
                          ) : (
                            <>
                              <span className="font-semibold text-slate-900">
                                {formatValueFixed(morfCustomMlh, 0)} mL/h
                              </span>
                              {`  c/ ${formatValueFixed(
                                morfCustomFrecuencia ??
                                  calcOrionFromMlh(morfCustomMlh, morfVolumenMezcla) ??
                                  0,
                                0
                              )} h (Orion)`}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'MAGNESIO SULFATO' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">MAGNESIO SULFATO</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      1,5 g / 10 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/electrolito.svg"
                        alt="Electrolito"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Electrolito</span>
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
                        src="/img/standycalc_icons/monitorizar.svg"
                        alt="Monitorizar ritmo"
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar ritmo</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/1_100v.svg"
                    alt="1 ampolla en 100 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    TORSADE DE POINTES
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 1 ampolla +
                      100 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(magConcentracionTorsade, 2)} mg/mL
                    <span className="text-slate-500">
                      {' '}
                      = {formatValueFixed(magMecEqTorsade, 3)} mEq Mg++/mL
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Velocidad:</span>{' '}
                    {formatValueFixed(magVelocidadTorsade, 0)} mL/h
                    <span className="text-slate-500"> (pasar en 10 min)</span>
                  </div>
                </div>

                <div className="relative mt-4 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/16_500v.svg"
                    alt="16 ampollas en 500 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ECLAMPSIA (Prevención y tto.)
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 16 ampollas +
                      500 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(magConcentracionEclampsia, 2)} mg/mL
                    <span className="text-slate-500">
                      {' '}
                      = {formatValueFixed(magMecEqEclampsia, 3)} mEq Mg++/mL
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      {magEclampsiaDosis.map((item, idx) => (
                        <div
                          key={`mag-${idx}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">
                            {formatValue(item.dosis)} g/h
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(item.velocidad, 0)} mL/h
                          </div>
                          <div className="text-xs text-slate-500">
                            {(() => {
                              const rawFreq = item.frecuencia;
                              const freq =
                                typeof rawFreq === 'number' && Number.isFinite(rawFreq)
                                  ? rawFreq
                                  : calcOrionFromMlh(item.velocidad, magVolumenEclampsia);
                              return freq == null
                                ? 'c/ — h (Orion)'
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

            {selectedStandardName === 'VALPROICO' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      VALPROICO ESTÁNDAR{' '}
                      <span className="text-slate-500">(estatus epilepticus)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Depakine ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 400
                      mg + 4 mL{' '}
                      <span className="tooltip abbr-tooltip abbr-tooltip-no-circle">
                        A.P.I.
                        <span className="tooltip-text">Agua para inyectable</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/anticonvulsivante.svg"
                        alt="Anticonvulsivante"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Anticonvulsivante</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4 pr-24">
                  <span className="absolute right-4 top-4">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/bolo_lento.svg"
                        alt="Bolo IV directo lento"
                        className="h-20 w-20 object-contain"
                      />
                      <span className="tooltip-text">Bolo IV directo lento</span>
                    </span>
                  </span>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    DOSIS DE CARGA
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Dosis:</span> 15 mg/kg
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Volumen:</span>{' '}
                    {valpCargaVolumen == null ? '—' : `${formatValueFixed(valpCargaVolumen, 1)} mL`}
                  </div>
                  <div className="text-xs text-slate-500">
                    Dosis inicial{' '}
                    <span className="tooltip abbr-tooltip abbr-tooltip-no-circle">
                      IVDL
                      <span className="tooltip-text">Intravenoso Directo Lento</span>
                    </span>{' '}
                    en 3-5 min (sin diluir)
                  </div>
                  <div className="text-xs text-slate-500">
                    Administrar dosis de carga si el paciente no estaba en tto.
                  </div>
                </div>

                <div className="relative mt-4 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/1_100v.svg"
                    alt="1 vial en 100 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    DOSIS DE MANTENIMIENTO
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 1 vial + 100
                      mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(valpConcentracionMgMl, 2)} mg/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de mantenimiento
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      {valpMantenimiento.map((row, idx) => (
                        <div
                          key={`valp-${idx}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{row.dose} mg/kg/h</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {row.vel == null ? '—' : `${formatValueFixed(row.vel, 0)} mL/h`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {row.freq == null
                              ? 'c/ — h (Orion)'
                              : `c/ ${formatValueFixed(row.freq, 0)} h (Orion)`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'VERNAKALANT' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      VERNAKALANT ESTÁNDAR <span className="text-slate-500">(4 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Brinavess ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 500
                      mg / 25 mL
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
                        src="/img/standycalc_icons/monitorizar_TA_FC.svg"
                        alt="Monitorizar TA y FC"
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar TA y FC</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/1_100v.svg"
                    alt="1 vial en 100 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 1 vial + 100
                      mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(vernaConcentracionMgMl, 2)} mg/mL
                  </div>
                  <div className="text-xs text-slate-500">Ajustar según TA y FC.</div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis primera perfusión
                    </div>
                    <div className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                      <div className="text-xs text-slate-500">3 mg/kg</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {vernaDose1Mg == null ? '—' : `${formatValueFixed(vernaDose1Mg, 0)} mg`}
                        {vernaVol1 == null ? null : ` = ${formatValueFixed(vernaVol1, 1)} mL`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {vernaVel1 == null
                          ? '— mL/h en 10 min'
                          : `${formatValueFixed(vernaVel1, 0)} mL/h en 10 min`}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis segunda perfusión
                    </div>
                    <div className="text-xs text-slate-500">
                      Opcional si no respuesta, 15 min tras fin de 1ª perfusión.
                    </div>
                    <div className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                      <div className="text-xs text-slate-500">2 mg/kg</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {vernaDose2Mg == null ? '—' : `${formatValueFixed(vernaDose2Mg, 0)} mg`}
                        {vernaVol2 == null ? null : ` = ${formatValueFixed(vernaVol2, 1)} mL`}
                      </div>
                      <div className="text-xs text-slate-500">
                        {vernaVel2 == null
                          ? '— mL/h en 10 min'
                          : `${formatValueFixed(vernaVel2, 0)} mL/h en 10 min`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedStandardName === 'N-ACETILCISTEINA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">N-ACETILCISTEÍNA</div>
                    <div className="mt-1 text-xs text-slate-500">Hidonac ® Antídoto</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 5 g /
                      25 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/antidoto.svg"
                        alt="Antídoto"
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Antídoto</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Administrar mezcla 1, 2 y 3 en este orden.
                </div>

                <div className="mt-4 space-y-4">
                  {nacMixes.map((mix) => (
                    <div
                      key={mix.label}
                      className="relative rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4"
                    >
                      <img
                        src="/img/standycalc_icons/diluciones/exclamacion_roja.svg"
                        alt="Atención"
                        className="absolute right-4 top-4 h-10 w-10"
                      />
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                        {mix.label}
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">Dosis:</span>{' '}
                        {mix.doseG == null ? '—' : `${formatValueFixed(mix.doseG, 2)} g`}{' '}
                        <span className="text-slate-500">
                          (
                          {mix.label === 'MEZCLA 1'
                            ? '150'
                            : mix.label === 'MEZCLA 2'
                              ? '50'
                              : '100'}{' '}
                          mg/kg)
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">Dilución:</span>{' '}
                        {mix.volVialesMl == null
                          ? '—'
                          : `${formatValueFixed(mix.volVialesMl, 1)} mL`}{' '}
                        de los viales + {mix.suero} mL G5% (exclusivamente)
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">Necesita:</span>{' '}
                        {mix.nViales == null
                          ? '—'
                          : `${formatValueFixed(mix.nViales, 0)} ${
                              mix.nViales === 1 ? 'vial' : 'viales'
                            }`}
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                        {mix.concMgMl == null ? '—' : `${formatValueFixed(mix.concMgMl, 2)} mg/mL`}
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">Velocidad:</span>{' '}
                        {mix.velMlh == null ? '—' : `${formatValueFixed(mix.velMlh, 0)} mL/h`}{' '}
                        durante {mix.tiempoMin ? `${mix.tiempoMin} min` : `${mix.tiempoH} h`}
                      </div>
                      {mix.mgKgH != null ? (
                        <div className="text-xs text-slate-500">
                          {formatValueFixed(mix.mgKgH, 2)} mg/kg/h
                          {mix.mgKg != null
                            ? ` · ${formatValueFixed(mix.mgKg, 2)} mg/kg en ${mix.tiempoMin} min`
                            : null}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-3 text-xs text-[#2b5d68]">
                  <div className="font-semibold">Puntos clave sobre PARACETAMOL (acetaminofén)</div>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    <li>
                      Fármaco potencialmente muy tóxico y con intervalo libre (la toxicidad es por
                      un metabolito que tarda horas en acumularse).
                    </li>
                    <li>
                      Dosis tóxicas: Niños: 140 mg/Kg. Adultos: 125 mg/Kg ó 100 mg/kg (sin o con
                      factores de riesgo).
                    </li>
                    <li>
                      El lavado gástrico y carbón activado son prioritarios. En niños administrar un
                      emético.
                    </li>
                    <li>
                      Indicar el antídoto N-Acetil-Cisteina (NAC) con paracetamolemia y nomograma de
                      Rümack.
                    </li>
                    <li>
                      Si no tiene paracetamolemia, indique NAC según dosis tóxica ingerida o
                      probabilidad de hepatotoxicidad.
                    </li>
                    <li>
                      Ante una duda razonable administre el antídoto. El embarazo no supone
                      contraindicación.
                    </li>
                    <li>
                      La hipersensibilidad a la NAC no justifica la suspensión del tratamiento.
                    </li>
                    <li>
                      El intoxicado recibirá hidratación parenteral, vitamina K y monitorización de
                      la función renal. No están indicadas la diuresis forzada ni la depuración
                      renal o extrarrenal.
                    </li>
                    <li>
                      Ingreso en UCI: intoxicados con hepatitis tóxica o insuficiencia
                      hepatocelular.
                    </li>
                    <li>
                      Casos especiales: a) ingesta de PCT en dosis tóxica única e intervalo de
                      atención &gt; 24 horas; b) intoxicación con hora de ingesta desconocida: c)
                      ingesta de dosis fraccionadas durante varias horas.
                    </li>
                    <li>
                      Criterios de trasplante hepático: a) encefalopatía severa; b) acidosis
                      metabólica; c) INR&gt;7; d) fracaso renal.
                    </li>
                  </ul>
                  <div className="mt-2">
                    Más información en{' '}
                    <a
                      href="https://www.murciasalud.es/toxiconet.php?iddoc=167341&idsec=4014"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold underline"
                    >
                      Toxiconet
                    </a>
                    .
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'restringidas' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              MEZCLAS RESTRINGIDAS
            </div>
            {searchNotice && activeTab === 'restringidas' ? (
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
                          ? 'border-[#2b5d68] bg-[#2b5d68] text-white'
                          : 'border-[#dfe9eb] text-[#2b5d68] hover:border-[#c7dadd] hover:bg-[#eef6f8]'
                      } ${!isEnabled ? 'cursor-not-allowed opacity-40' : ''}`}
                      onClick={() => setSelectedRestricted(section.row)}
                      disabled={!isEnabled}
                    >
                      {getDisplayLabel(label)}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selectedRestrictedName === 'CISATRACURIO' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">CISATRACURIO</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      Vial 20 mg / 10 mL (Dosis de carga)
                    </div>
                    <div className="text-sm text-slate-700">
                      Vial 150 mg / 30 mL (Dosis de mantenimiento)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/relajante_nm.svg"
                        alt="Relajante neuromuscular"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Relajante neuromuscular</span>
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

                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      <span>DOSIS DE CARGA</span>
                      <span className="text-rose-600">¡¡NO DILUIR!!</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 20 mg
                      / 10 mL
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Concentración real:</span> 2
                      mg/mL
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Dosis:</span> 150 µg/kg
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Volumen </span>
                      <span className="tooltip abbr-tooltip abbr-tooltip-no-circle font-semibold text-slate-900">
                        IVDL
                        <span className="tooltip-text">Intravenoso Directo Lento</span>
                      </span>
                      <span className="font-semibold text-slate-900">:</span>{' '}
                      {cisaBoloVolMl == null ? '—' : `${formatValueFixed(cisaBoloVolMl, 2)} mL`}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      <span>DOSIS DE MANTENIMIENTO</span>
                      <span className="text-rose-600">¡¡NO DILUIR!!</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 150
                      mg / 30 mL
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Concentración real:</span> 5
                      mg/mL
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Dosis:</span> 3 µg/kg/min
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Velocidad:</span>{' '}
                      {cisaMantVelMlh == null ? '—' : `${formatValueFixed(cisaMantVelMlh, 0)} mL/h`}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedRestrictedName === 'ESMOLOL' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">ESMOLOL</div>
                    <div className="mt-1 text-xs text-slate-500">Brevibloc ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 100
                      mg / 10 mL
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

                <div className="mt-4 text-xs text-slate-500">
                  Ciclo completo: Dosis inicial en bolo de 1 min + mínima dosis de mantenimiento
                  efectiva durante 4 min.
                </div>
                <div className="text-xs text-slate-500">
                  Si no alcanza efecto deseado, repetir ciclo completo incrementando la dosis de
                  mantenimiento en 50 µg/kg/min durante 4 min. (iniciar 1er ciclo a 50 µg/kg/min).
                </div>

                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      DOSIS INICIAL
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Dosis:</span> 500 µg/kg
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Volumen:</span>{' '}
                      {esmoBolusVolMl == null ? '—' : `${formatValueFixed(esmoBolusVolMl, 2)} mL`}
                    </div>
                    <div className="text-xs text-slate-500">
                      Dosis inicial{' '}
                      <span className="tooltip abbr-tooltip abbr-tooltip-no-circle">
                        IVDL
                        <span className="tooltip-text">Intravenoso Directo Lento</span>
                      </span>{' '}
                      en 1 min (sin diluir)
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      <span>DOSIS DE MANTENIMIENTO</span>
                      <span className="text-xs font-normal text-slate-500">
                        Iniciar a 50 µg/kg/min
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {esmoMantenimientoDoses.map((row) => (
                        <div
                          key={`esmo-${row.dose}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{row.dose} µg/kg/min</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {row.vel == null
                              ? '—'
                              : `${formatValueFixed(row.vel, 2)} mL/h (${formatValueFixed(
                                  row.vel * midaConcMgMl,
                                  2
                                )} mg/h)`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  No mantener más de 24 horas. Dosis máxima: 300 µg/kg/min
                </div>
              </div>
            ) : null}

            {selectedRestrictedName === 'FUROSEMIDA CONC' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      FUROSEMIDA CONCENTRADA <span className="text-slate-500">(2,5 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Seguril® ampolla grande</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      250 mg / 25 mL
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
                        src="/img/standycalc_icons/present_grande.svg"
                        alt="Presentación grande"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Presentación grande</span>
                    </span>
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/1_100v.svg"
                    alt="1 ampolla en 100 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 1 ampolla +
                      100 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(furoConcMgMl, 2)} mg/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de mantenimiento (0,1-1 mg/min)
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {furoConcDoses.map((row) => (
                        <div
                          key={`furo-conc-${row.dose}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{row.dose} mg/min</div>
                          <div className="text-xs text-slate-500">{row.mgH} mg/h</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {formatValueFixed(row.vel, 0)} mL/h
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`mt-3 rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 ${
                      furoConcOverMax ? 'border-rose-400' : 'border-[#dfe9eb]'
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Personaliza la dosis
                    </div>
                    <div className="mt-2 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            className="w-24 rounded-md border border-[#dfe9eb] px-2 py-1 text-sm"
                            type="number"
                            inputMode="decimal"
                            value={furoConcMgH}
                            onChange={(event) => setFuroConcMgH(event.target.value)}
                          />
                          <span className="text-slate-500">mg/h</span>
                        </label>
                        <div className="mt-2 text-xs text-slate-500">
                          {furoConcFromMgH == null
                            ? '—'
                            : `${formatValueFixed(furoConcFromMgH.mgMin, 2)} mg/min · ${formatValueFixed(
                                furoConcFromMgH.mlh,
                                0
                              )} mL/h`}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            className="w-28 rounded-md border border-[#dfe9eb] px-2 py-1 text-sm"
                            type="number"
                            inputMode="decimal"
                            value={furoConcMgDia}
                            onChange={(event) => setFuroConcMgDia(event.target.value)}
                          />
                          <span className="text-slate-500">mg/día</span>
                        </label>
                        <div className="mt-2 text-xs text-slate-500">
                          {furoConcFromMgDia == null
                            ? '—'
                            : `${formatValueFixed(furoConcFromMgDia.mgH, 2)} mg/h · ${formatValueFixed(
                                furoConcFromMgDia.mlh,
                                0
                              )} mL/h`}
                        </div>
                      </div>
                    </div>
                    {furoConcOverMax ? (
                      <div className="mt-2 text-xs font-semibold text-rose-600">
                        Dosis máxima sobrepasada
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  Dosis máxima: 2.000 mg/día
                </div>
              </div>
            ) : null}

            {selectedRestrictedName === 'LEVOSIMENDAN' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">LEVOSIMENDAN</div>
                    <div className="mt-1 text-xs text-slate-500">Simdax ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 12,5
                      mg / 5 mL
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
                  </div>
                </div>

                <div className="relative mt-5 space-y-3 rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                  <img
                    src="/img/standycalc_icons/diluciones/1_500v.svg"
                    alt="1 vial en 500 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 1 vial + 500
                      mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(levoConcUgMl, 2)} µg/mL
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de carga (10 min)
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      {levoCargaDoses.map((row) => (
                        <div
                          key={`levo-${row.dose}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{row.dose} µg/kg</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {row.vol == null ? '—' : `${formatValueFixed(row.vol, 1)} mL`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {row.vel == null
                              ? '— mL/h en 10 min'
                              : `${formatValueFixed(row.vel, 0)} mL/h en 10 min`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>Dosis de mantenimiento (máx 24 h)</span>
                      <span className="text-xs font-normal text-slate-500">Dosis única</span>
                    </div>
                    <div className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                      <div className="text-xs text-slate-500">0,1 µg/kg/min</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {levoMantenimientoVel == null
                          ? '—'
                          : `${formatValueFixed(levoMantenimientoVel, 0)} mL/h`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  Compatible en Y con furosemida, digoxina y NTG.
                </div>
              </div>
            ) : null}

            {selectedRestrictedName === 'MIDAZOLAM' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      MIDAZOLAM ESTÁNDAR <span className="text-slate-500">(0,6 mg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Dormicum ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 15
                      mg / 3 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/analgesia_sedacion.svg"
                        alt="Sedante"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Sedante</span>
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
                    src="/img/standycalc_icons/diluciones/5_100v.svg"
                    alt="5 ampollas en 100 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas +
                      100 mL SF/G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(midaConcMgMl, 2)} mg/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de mantenimiento
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {midaDoses.map((row) => (
                        <div
                          key={`mida-${row.dose}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{row.dose} mg/kg/h</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {row.vel == null ? '—' : `${formatValueFixed(row.vel, 0)} mL/h`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Personaliza la dosis
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                      <label className="flex items-center gap-2">
                        <input
                          className="w-24 rounded-md border border-[#dfe9eb] px-2 py-1 text-sm"
                          type="number"
                          inputMode="decimal"
                          value={midaCustomDose}
                          onChange={(event) => setMidaCustomDose(event.target.value)}
                        />
                        <span className="text-slate-500">mg/kg/h</span>
                      </label>
                      <div className="text-sm text-slate-700">
                        {midaCustomVel == null ? '—' : `${formatValueFixed(midaCustomVel, 2)} mL/h`}
                      </div>
                    </div>
                    {Number.isFinite(midaCustomNum) && midaCustomNum > 2 ? (
                      <div className="mt-1 text-xs font-semibold text-rose-600">
                        Dosis máxima sobrepasada
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  Dosis máxima: 2 mg/kg/h
                </div>
              </div>
            ) : null}

            {selectedRestrictedName === 'NORADRENALINA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      NORADRENALINA ESTÁNDAR <span className="text-slate-500">(0,2 mg/mL)</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 10
                      mg / 10 mL <span className="text-slate-500">(NA bitartrato)</span>
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
                    alt="2 ampollas en 100 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 2 ampollas +
                      100 mL G5%
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(noraConcUgMl, 2)} µg/mL
                  </div>
                  <div className="text-xs text-slate-500">1 mg NA bitartrato = 0,5 mg NA base</div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis NA base
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      {noraDosesBase.map((row) => (
                        <div
                          key={`nora-${row.dose}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{row.dose} µg/kg/min</div>
                          <div className="text-xs text-slate-500">
                            {row.bitartrato} µg/kg/min (bitartrato)
                          </div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {row.vel == null ? '—' : `${formatValueFixed(row.vel, 0)} mL/h`}
                          </div>
                          {row.dose === 0.1 ? (
                            <div className="text-xs text-slate-500">Dosis shock</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Personaliza la dosis
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                      <label className="flex items-center gap-2">
                        <input
                          className="w-24 rounded-md border border-[#dfe9eb] px-2 py-1 text-sm"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={noraCustomDose}
                          onChange={(event) => setNoraCustomDose(event.target.value)}
                        />
                        <span className="text-slate-500">µg/kg/min (NA base)</span>
                      </label>
                      <div className="text-sm text-slate-700">
                        {noraCustomBitartrato == null || noraCustomVel == null
                          ? '0,00 µg/kg/min (NA bitartrato) · 0 mL/h'
                          : `${formatValueFixed(
                              noraCustomBitartrato,
                              2
                            )} µg/kg/min (NA bitartrato) · ${formatValueFixed(
                              noraCustomVel,
                              0
                            )} mL/h`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedRestrictedName === 'PROCAINAMIDA' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">PROCAINAMIDA</div>
                    <div className="mt-1 text-xs text-slate-500">Biocoryl ®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Vial 1000
                      mg / 10 mL
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

                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      BOLO INICIAL
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Dosis:</span> 100–200 mg
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Volumen:</span> 1–2 mL
                    </div>
                    <div className="text-xs text-slate-500">
                      Dosis inicial{' '}
                      <span className="tooltip abbr-tooltip abbr-tooltip-no-circle">
                        IVDL
                        <span className="tooltip-text">Intravenoso Directo Lento</span>
                      </span>{' '}
                      en 2-4 min (sin diluir)
                    </div>
                    <div className="text-xs text-slate-500">
                      Repetir 100 mg (=1 mL) cada 5 min. D. máx: 1 g
                    </div>
                  </div>

                  <div className="relative rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                    <img
                      src="/img/standycalc_icons/diluciones/5_250r.svg"
                      alt="5 viales en 250 mL"
                      className="absolute right-4 top-4 h-10 w-10"
                    />
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      ESTÁNDAR
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                      <span>
                        <span className="font-semibold text-slate-900">Dilución:</span> 5 viales +
                        250 mL G5%
                      </span>
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                      {formatValueFixed(procaConcMgMl, 2)} mg/mL
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Dosis de carga en 60 min
                      </div>
                      <div className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                        <div className="text-xs text-slate-500">17 mg/kg/h</div>
                        <div className="mt-1 font-semibold text-slate-900">
                          {procaCargaVel == null
                            ? '—'
                            : `${formatValueFixed(procaCargaVel, 0)} mL/h`}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Dosis de mantenimiento (2-6 mg/min)
                      </div>
                      <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        {procaMantenimientoDoses.map((row) => (
                          <div
                            key={`proca-${row.dose}`}
                            className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                          >
                            <div className="text-xs text-slate-500">{row.dose} mg/min</div>
                            <div className="mt-1 font-semibold text-slate-900">
                              {formatValueFixed(row.vel, 0)} mL/h
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Personaliza la dosis
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                        <label className="flex items-center gap-2">
                          <input
                            className="w-20 rounded-md border border-[#dfe9eb] px-2 py-1 text-sm"
                            type="number"
                            inputMode="decimal"
                            value={procaCustomDose}
                            onChange={(event) => setProcaCustomDose(event.target.value)}
                          />
                          <span className="text-slate-500">mg/min</span>
                        </label>
                        <div className="text-sm text-slate-700">
                          {procaCustomVel == null
                            ? '—'
                            : `${formatValueFixed(procaCustomVel, 0)} mL/h`}
                        </div>
                      </div>
                      {Number.isFinite(procaCustomNum) && procaCustomNum > 6 ? (
                        <div className="mt-1 text-xs font-semibold text-rose-600">
                          Dosis máxima sobrepasada
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedRestrictedName === 'SALBUTAMOL' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">
                      SALBUTAMOL ESTÁNDAR <span className="text-slate-500">(20 µg/mL)</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Ventolin®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla
                      500 µg / 1 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/broncodilatador.svg"
                        alt="Broncodilatador"
                        className="h-10 w-10 object-contain"
                      />
                      <span className="tooltip-text">Broncodilatador</span>
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
                    src="/img/standycalc_icons/diluciones/10_250v.svg"
                    alt="10 ampollas en 250 mL"
                    className="absolute right-4 top-4 h-10 w-10"
                  />
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    ESTÁNDAR
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">Dilución:</span> 10 ampollas +
                      250 mL G5%/SF
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                    {formatValueFixed(salbConcUgMl, 2)} µg/mL
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis inicial (4 min)
                    </div>
                    <div className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2 text-sm text-slate-700">
                      <div className="text-xs text-slate-500">4 µg/kg</div>
                      <div className="mt-1 font-semibold text-slate-900">
                        {salbVolInicial == null ? '—' : `${formatValueFixed(salbVolInicial, 1)} mL`}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosis de mantenimiento (4-8 µg/kg/h)
                    </div>
                    <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                      {salbMantenimientoDoses.map((row) => (
                        <div
                          key={`salb-${row.dose}`}
                          className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                        >
                          <div className="text-xs text-slate-500">{row.dose} µg/kg/h</div>
                          <div className="mt-1 font-semibold text-slate-900">
                            {row.vel == null ? '—' : `${formatValueFixed(row.vel, 0)} mL/h`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedRestrictedName === 'URAPIDIL' ? (
              <div className="mt-5 rounded-2xl border border-[#dfe9eb] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2b5d68]">URAPIDIL</div>
                    <div className="mt-1 text-xs text-slate-500">Elgadil®</div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Presentación:</span> Ampolla 50
                      mg / 10 mL
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tooltip tooltip-icon">
                      <img
                        src="/img/standycalc_icons/grupos_terapeuticos/vasodilatador.svg"
                        alt="Vasodilatador"
                        className="h-14 w-14 object-contain"
                      />
                      <span className="tooltip-text">Vasodilatador</span>
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
                        className="h-15 w-15 object-contain"
                      />
                      <span className="tooltip-text">Monitorizar TA y FC</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      BOLO EMERGENCIA HTA
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Dosis:</span> 25 mg
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Volumen:</span> 5 mL
                    </div>
                    <div className="text-xs text-slate-500">
                      Dosis inicial{' '}
                      <span className="tooltip abbr-tooltip abbr-tooltip-no-circle">
                        IVDL
                        <span className="tooltip-text">Intravenoso Directo Lento</span>
                      </span>{' '}
                      en 1 min (sin diluir)
                    </div>
                    <div className="text-xs text-slate-500">
                      Repetir cada 5 min, si precisa. D. máx: 100 mg
                    </div>
                  </div>

                  <div className="relative rounded-xl border border-[#dfe9eb] bg-[#f7fbfc] p-4">
                    <img
                      src="/img/standycalc_icons/diluciones/5_250r.svg"
                      alt="5 ampollas en 250 mL"
                      className="absolute right-4 top-4 h-10 w-10"
                    />
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      ESTÁNDAR
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                      <span>
                        <span className="font-semibold text-slate-900">Dilución:</span> 5 ampollas +
                        250 mL SF/G5%
                      </span>
                    </div>
                    <div className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Concentración real:</span>{' '}
                      {formatValueFixed(uraConcMgMl, 2)} mg/mL
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Dosis de mantenimiento (2,5-7 µg/kg/min)
                      </div>
                      <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                        {uraDoses.map((row) => (
                          <div
                            key={`ura-${row.dose}`}
                            className="rounded-lg border border-[#dfe9eb] bg-white px-3 py-2"
                          >
                            <div className="text-xs text-slate-500">{row.dose} µg/kg/min</div>
                            <div className="mt-1 font-semibold text-slate-900">
                              {row.vel == null ? '—' : `${formatValueFixed(row.vel, 0)} mL/h`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#eef6f8] px-4 py-2 text-xs text-[#2b5d68]">
                  No mantener más de 7 días
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'instrucciones' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">INSTRUCCIONES</div>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="rounded-xl border border-[#dfe9eb] bg-white p-4">
                <div className="text-sm font-semibold text-[#2b5d68]">
                  Guía de perfusiones intravenosas estándar v1.1.
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <div>
                    Herramienta para la estandarización de las concentraciones de mezclas IV más
                    utilizadas y/o con mayor riesgo en materia de seguridad del paciente.
                  </div>
                  <div>
                    Calculadora de dosis y velocidades de infusión según parámetros del paciente y
                    concentraciones estándar.
                  </div>
                  <div>Elabora: FAR-UMED</div>
                  <div>Aprueba: Comisión de Seguridad.</div>
                  <div>Última revisión: marzo 2020</div>
                  <div>Adaptación para web en fase beta</div>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                  ¡IMPORTANTE!
                </div>
                <div className="mt-2 space-y-2 text-sm text-rose-800">
                  <div>
                    Los cálculos para la obtención de las velocidades de infusión dependen de la
                    CONCENTRACIÓN.
                  </div>
                  <div>
                    Para todas las mezclas que requieren dilución (en SF, G5%, etc.) consideran:
                  </div>
                  <ul className="list-disc pl-5">
                    <li>
                      Volumen real de las bolsas de fluidos empleadas (incluyendo el sobrellenado)
                    </li>
                    <li>
                      NO manipulación por parte de enfermería, es decir, NO deberán retirar volumen
                      de fluido de la bolsa de partida.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-[#dfe9eb] bg-white p-4 space-y-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    Datos paciente
                  </div>
                  <div className="mt-1">
                    DATOS PACIENTE. IMPRESCINDIBLE rellenar para obtener los resultados de cálculo
                    de dosis por peso y velocidad de infusión asociado a éste y a la concentración
                    estándar.
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    Mezclas estándar
                  </div>
                  <div className="mt-1">
                    MEZCLAS ESTÁNDAR. Se encuentran las perfusiones estandarizadas de uso frecuente
                    y disponible en TODAS LAS UNIDADES del Hospital, ordenadas alfabéticamente por
                    principio activo. Estas perfusiones están configuradas para la inclusión en el
                    tratamiento activo del paciente en Orion Clinic desde
                    Terapéutica-Esquemas-Sección-MEZCLAS ESTÁNDAR (visible para todos los
                    prescriptores). Incluye N-ACETILCISTEÍNA. Antídoto para tratar la intoxicación
                    por paracetamol. Disponible en Orion Clinic desde
                    Terapéutica-Esquemas-Sección-MEZCLAS ESTÁNDAR (visible para todos los
                    prescriptores).
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                    Mezclas restringidas
                  </div>
                  <div className="mt-1">
                    MEZCLAS RESTRINGIDAS. Se encuentran perfusiones estandarizadas de uso
                    restringido a UNIDADES CON MONITORIZACIÓN (UCI, URGENCIAS, QUIRÓFANO,
                    HEMODINÁMICA y ARRITMIAS), ordenadas alfabéticamente por principio activo. Estas
                    perfusiones están configuradas para la inclusión en el tratamiento activo del
                    paciente en Orion Clinic desde Terapéutica-Esquemas-Sección-MECLAS RESTRINGIDAS
                    (visibles sólo para prescriptores de las Unidades con Monitorización continua).
                  </div>
                </div>

                <div className="mt-2 overflow-hidden rounded-lg border border-[#dfe9eb] bg-[#f7fbfc] p-3">
                  <img src="/img/standycalc_icons/ejem1.svg" alt="Ejemplo 1" className="w-full" />
                </div>
              </div>

              <div className="rounded-xl border border-[#dfe9eb] bg-white p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                  Prescripción en Orion Clinic
                </div>
                <div>
                  Para facilitar la prescripción electrónica de las mezclas estandarizadas, se han
                  creado carpetas con Esquemas de Sección dentro de Orion Clinic Terapéutica,
                  ordenados alfabéticamente por principio activo. De esta forma, queda fijada la
                  dosis de principio activo, el tipo y volumen de diluyente, e incluso observaciones
                  de preparación y administración para el personal de enfermería. La introducción de
                  estos esquemas es sencilla y basta con introducir una fecha de inicio para que
                  queden en el tratamiento del paciente. Sin embargo, el médico prescriptor DEBE
                  indicar la velocidad a la que quiere que se administre, así como la frecuencia
                  asociada para el recambio de tal mezcla. En el caso de que el esquema seleccionado
                  contenga más de una línea de prescripción, deberá además, modificar la hora de
                  inicio de la segunda mezcla, para garantizar que se administra al finalizar la
                  primera del esquema.
                </div>
                <div className="mt-2 overflow-hidden rounded-lg border border-[#dfe9eb] bg-[#f7fbfc] p-3">
                  <img src="/img/standycalc_icons/ejem3.svg" alt="Ejemplo 3" className="w-full" />
                </div>
                <div>
                  STANDyCALC® facilita precisamente la Velocidad (en ml/h) calculada para la/s dosis
                  recomendadas. Además, para perfusiones continuas proporciona el campo FrOC
                  (Frecuencia recomendada para la prescripción en Orion Clinic), calculada como la
                  frecuencia máxima de recambio de la mezcla. Es imprescindible indicarla en Orion
                  Clinic para evitar la indeseada y brusca interrupción de ciertos principios
                  activos (p.ej. aminas vasoactivas). De esta forma, aparecerá en Orion Clinic el
                  check de enfermería para su recambio antes de que finalice la perfusión en curso y
                  se garantiza la dispensación de las unidades de medicamento necesarias para su
                  reposición en el carro de unidosis diario.
                </div>
                <div className="mt-2 overflow-hidden rounded-lg border border-[#dfe9eb] bg-[#f7fbfc] p-3">
                  <img src="/img/standycalc_icons/ejem2.svg" alt="Ejemplo 2" className="w-full" />
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
