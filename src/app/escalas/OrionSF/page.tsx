'use client';
// @ts-nocheck

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Papa from 'papaparse';
import InformeCopiable from '@/components/InformeCopiable';
import AboutModal from '@/components/AboutModal';

type InputKind = 'auto' | 'tratamiento' | 'analitica';
type DetectedKind = 'tratamiento' | 'analitica' | 'ambiguo' | 'desconocido';
type OutputMode = 'lineas' | 'parrafos';
type VisualFontProfile = 'tahoma' | 'helvetica';

type Regla = {
  patron: string;
  reemplazo: string;
  tipo: string;
  flags: string;
};

type Medicamento = {
  id: string;
  nombre: string;
  bloque: string[];
};

type LabEntry = {
  group: string;
  name: string;
  flag: '*' | '';
  result: string;
  unit: string;
  reference: string;
  confidenceNote: string;
};

type ParsedPayload = {
  requestLine: string;
  groups: Array<{ name: string; entries: LabEntry[] }>;
};

const REGLAS_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-HP_OCXjtFN6cCrpBgViv59ufFzUBerAK5jvTSLoT27zC_ux_3YTpX4oQcmCNIZg7blWaBANXtUkF/pub?output=csv';

const RX_TERA = /^Terapia\/Medicamento:\s*(.*)\s*$/i;
const RX_POSO = /^Posolog[ií]a\/Observaciones:\s*(.*)\s*$/i;

const COLUMN_FORMAT = {
  NAME_EXTRA_SPACES: 6,
  LONG_NAME_THRESHOLD: 'VOLUMEN CORPUSCULAR MEDIO'.length,
  LONG_NAME_REDUCTION: 4,
  VALUE_EXTRA_SPACES: 8,
  TAB: '\t',
  FLAG_WITH_ASTERISK: '* \t',
  FLAG_EMPTY: ' \t',
} as const;

const GROUP_LABELS: Array<{ needle: string; label: string }> = [
  { needle: 'HEMOGRAMA', label: 'Hemograma' },
  { needle: 'HEMATIMETRIA', label: 'Hemograma' },
  { needle: 'COAGULACION', label: 'Coagulación' },
  { needle: 'HEMOSTASIA', label: 'Coagulación' },
  { needle: 'BIOQUIMICA GENERAL', label: 'Bioquímica' },
  { needle: 'BIOQUIMICA ORINA', label: 'Bioquímica orina' },
  { needle: 'GLICOSILADAS', label: 'Glicosiladas' },
  { needle: 'INMUNOANALISIS', label: 'Inmunoanálisis' },
  { needle: 'GASOMETRIA VENOSA', label: 'Gasometría venosa' },
  { needle: 'GASOMETRIA ARTERIAL', label: 'Gasometría arterial' },
  { needle: 'GASOMETRIAS', label: 'Gasometrías' },
  { needle: 'MICROBIOLOGIA MOLECULAR', label: 'Microbiología molecular' },
  { needle: 'MICROBIOLOGIA BACTERIOLOGIA', label: 'Microbiología bacteriología' },
  { needle: 'MICROBIOLOGIA SEROLOGIA', label: 'Microbiología serología' },
  { needle: 'DETECCION DE ANTIGENOS', label: 'Detección de antígenos' },
  { needle: 'SEROLOGIA DE VIH', label: 'Serología VIH' },
  { needle: 'SEROLOGIA DE SIFILIS', label: 'Serología sífilis' },
  { needle: 'LABORATORIO EXTERNO', label: 'Laboratorio externo' },
  { needle: 'ORINAS', label: 'Orina' },
  { needle: 'SEDIMENTO', label: 'Orina' },
  { needle: 'ANORMALES', label: 'Orina' },
  { needle: 'CRIBADO', label: 'Cribado' },
];

function normEspacios(s: string) {
  return (s || '').replace(/\s{2,}/g, ' ').trim();
}

function normalizeLine(text: string): string {
  return text.replace(/\r/g, '').replace(/\u00A0/g, ' ').trimEnd();
}

function normalizeForMatch(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function spaces(count: number): string {
  return ' '.repeat(Math.max(0, count));
}

function normalizarUnidades(s: string) {
  if (!s) return s;
  return s
    .replace(/(\d+(?:[.,]\d+)?)\s*MG\b/gi, '$1mg')
    .replace(/(\d+(?:[.,]\d+)?)\s*MCG\b/gi, '$1mcg')
    .replace(/(\d+(?:[.,]\d+)?)\s*ML\b/gi, '$1mL')
    .replace(/(\d+(?:[.,]\d+)?)\s*INH\b/gi, '$1inh')
    .replace(/(\d+(?:[.,]\d+)?)\s*L\b/gi, '$1L')
    .replace(/(\d+(?:[.,]\d+)?)\s*INHAL\b/gi, '$1inh');
}

function limpiarNombreMedicamento(raw: string) {
  let s = normEspacios(raw);
  const tieneFM = /^\(FM\)\s*/i.test(s);
  if (tieneFM) s = s.replace(/^\(FM\)\s*/i, '');
  s = s.replace(/\([^)]*\)/g, ' ');
  s = normEspacios(s);
  s = s.replace(/\s*\/\s*/g, '/').replace(/\s*\+\s*/g, ' + ').replace(/\s*,\s*/g, ',');
  s = s.replace(/\s+\d+\s*(COMPR|COMPR\.|COMP|CAPS|TAB|SOBR|PARCH|AMP|VIAL|JER|FRAS|ENV|TUB|CART)\b.*$/gi, '');
  s = s.replace(/\s+\d+\s*(PULSAC(IONES)?|PULSACIONES|DOSIS)\b.*$/gi, '');
  s = s.replace(/\s+(SUSP|SOLUC|SOL)\s+PARA\s+INHALAC.*$/gi, '');
  s = s.replace(/\s+ENV(ASE)?\s+A\s+PRESION.*$/gi, '');
  s = s.replace(/\s+ENV\s+PRESION.*$/gi, '');
  s = s.replace(/\s+\b(EFG|REC\s*PEL|RE\s*PE|GASTRORRESIST(ENTES)?|LIBERAC(ION)?\s*PROLON)\b.*$/gi, '');
  s = s.replace(/\s*\/\s*\d+\s+[A-ZÁÉÍÓÚÑ0-9 .,+/()-]+$/gi, '');
  s = s.replace(/\s+\d+\s*(COMPRIMIDOS?|CAPSULAS?|C[ÁA]PSULAS?|TABLETAS?|SOBRES?|PARCHES?|AMPOLLAS?|VIALES?|JERINGAS?|FRASCOS?|ENVASES?|TUBOS?)\b.*$/gi, '');
  s = s.replace(/\s+\b(RECUBIERTOS?|RECUB\.?|PEL(I)?C(ULA)?|GASTRORRESISTENTES?|EFERVESCENTES?|LIBERACI[ÓO]N|MODIFICADA|UNIDOSIS|MONODOSIS|COLIRIO|SUSPENSI[ÓO]N|SOLUCI[ÓO]N|POMADA|UNG[ÜU]ENTO|OFTALMICA|TRANSDERMICOS?|INHALAD(OR)?|DOSIS|POLVO|NEBULIZADOR|GRANULADO|PARA\s+SOLUCI[ÓO]N\s+ORAL)\b.*$/gi, '');
  s = s.replace(/\b(\d+)\s*COMPRIMIDOS?\b/gi, '$1cp');
  s = s.replace(/\b(\d+)\s*C0MPR\b/gi, '$1cp');
  s = s.replace(/\/\s*$/g, '');
  s = normEspacios(s);
  if (tieneFM) s = `(FM) ${s}`;
  s = normalizarUnidades(s);
  return s.replace(/\s{2,}/g, ' ').trim();
}

function limpiarPosologia(raw: string) {
  let s = (raw || '').replace(/\r/g, '').trim();
  s = s.split(/\ba\s+continuaci[óo]n\b/gi)[0];
  s = s.replace(/\bCR[ÓO]NICO\b/gi, '');
  s = s.replace(/\bdurante\s+\d+\s+d[ií]as?\b/gi, '');
  s = s.replace(/\bexcepto\b.*$/i, '');
  s = s.replace(/\bcuando\b.*$/i, '');
  s = s.replace(/día\/s/gi, 'días');
  s = s.replace(/\b2\s*y\s*MEDIO\b/gi, '2,5');
  s = s.replace(/\b1\s*y\s*MEDIO\b/gi, '1,5');
  s = s.replace(/\bCOMPRIMIDO(S)?\b/gi, 'cp');
  s = s.replace(/\bC[ÁA]PSULA(S)?\b/gi, 'cáps');
  s = s.replace(/\bSOBRE(S)?\b/gi, 'sobre');
  s = s.replace(/\bTIRA(S)?\s+REACTIVA(S)?\b/gi, 'tira');
  s = s.replace(/\bENVASE(S)?\b/gi, 'env.');
  s = s.replace(/\bGOTA(S)?\b/gi, 'gota');
  s = s.replace(/\bPULSACI[ÓO]N(ES)?\b/gi, 'inh');
  s = s.replace(/\bPARCHE(S)?\b/gi, 'parche');
  s = s.replace(/\bAMPOLLA(S)?\b/gi, 'amp');
  s = s.replace(/\bJERINGA(S)?\b/gi, 'iny');
  s = s.replace(/\bVIAL(ES)?\b/gi, 'vial');
  s = s.replace(/\bPULVERIZACI[ÓO]N(ES)?\b/gi, 'inh');
  s = s.replace(/\bCARTUCHO\/PLUMA\b/gi, 'iny');
  s = s.replace(/\b(MONODOSIS|UNIDOSIS|OFTALMICO|OFT[ÁA]LMICA)\b/gi, '');
  s = s.replace(/\bcada\s+12\s+horas?\b/gi, '/12h');
  s = s.replace(/\bcada\s+8\s+horas?\b/gi, '/8h');
  s = s.replace(/\bcada\s+6\s+horas?\b/gi, '/6h');
  s = s.replace(/\bcada\s+24\s+horas?\b/gi, 'diario');
  s = s.replace(/\bcada\s+d[ií]a\b/gi, 'diario');
  s = s.replace(/\bcada\s+7\s+d[ií]as?\b/gi, 'semanal');
  s = s.replace(/\bcada\s+30\s+d[ií]as?\b/gi, 'mensual');
  s = s.replace(/\bcada\s+28\s+d[ií]as?\b/gi, '/28 días');
  s = s.replace(/\bcada\s+14\s+d[ií]as?\b/gi, '/14 días');
  s = s.replace(/\bcada\s+3\s+d[ií]as?\b/gi, '/3 días');
  s = s.replace(/\bpor\s+la\s+ma[ñn]ana\b/gi, 'por la mañana');
  s = s.replace(/\bpor\s+la\s+noche\b/gi, 'por la noche');
  s = s.replace(/\ben\s+el\s+desayuno\b/gi, 'en el desayuno');
  s = normEspacios(s);
  s = s.replace(/\s*\/\s*/g, '/').replace(/\/(\d+)\s*h/gi, '/$1h');

  const m = s.match(/^(\d+(?:[.,]\d+)?)\s*(cp|cáps|sobre|tira|env\.|gota|inh|parche|amp|iny|vial)\s*(.*)$/i);
  if (!m) return s;
  const qty = m[1].replace('.', ',');
  const unit = m[2];
  const rest = (m[3] || '').trim();
  if (!rest) return `${qty} ${unit}`.trim();
  if (/^diario(s)?$/i.test(rest)) return `${qty} ${unit} diario`;
  if (/^semanal(es)?$/i.test(rest)) {
    const plural = qty === '1' || qty === '1,0' ? 'semanal' : 'semanales';
    return `${qty} ${unit}/${plural}`;
  }
  if (/^mensual(es)?$/i.test(rest)) return `${qty} ${unit}/mensual`;
  if (rest.startsWith('/')) return `${qty} ${unit}${rest}`;
  if (/\bdiario(s)?\b/i.test(rest)) return `${qty} ${unit} diario`;
  return normEspacios(`${qty} ${unit} ${rest}`);
}

function depurarTratamiento(textoOriginal: string, multilinea: boolean) {
  const fechaActual = new Date().toLocaleDateString('es-ES');
  const lineas = (textoOriginal || '').replace(/\r/g, '').split('\n').map((l) => l.trimEnd());
  const items = [];
  let medActual = null;
  let posoActual = '';

  for (let i = 0; i < lineas.length; i += 1) {
    const l = lineas[i].trim();
    if (!l) continue;
    const m1 = l.match(RX_TERA);
    if (m1) {
      if (medActual) items.push({ med: medActual, poso: posoActual || '' });
      medActual = m1[1] || '';
      posoActual = '';
      continue;
    }
    const m2 = l.match(RX_POSO);
    if (m2) {
      posoActual = m2[1] || '';
      continue;
    }
    if (medActual && posoActual && !/^Profesional\b/i.test(l) && !/^Fecha\b/i.test(l)) {
      posoActual = `${posoActual} ${l}`.trim();
    }
  }

  if (medActual) items.push({ med: medActual, poso: posoActual || '' });

  const itemsLimpios = items
    .map(({ med, poso }) => {
      const medL = limpiarNombreMedicamento(med);
      const posoL = limpiarPosologia(poso);
      if (!medL) return null;
      return { med: medL, poso: posoL };
    })
    .filter((item): item is { med: string; poso: string } => item !== null);

  const header = `Tratamiento (por SIA a fecha ${fechaActual}):`;
  if (!itemsLimpios.length) return header;
  if (multilinea) return header + '\n' + itemsLimpios.map(({ med, poso }) => `- ${med}${poso ? ` (${poso})` : ''}`).join('\n');
  return header + ' ' + itemsLimpios.map(({ med, poso }) => `${med}${poso ? ` (${poso})` : ''}`).join('; ');
}

function extraerMedicamentos(textoOriginal: string): Medicamento[] {
  const lineas = textoOriginal.split('\n');
  const lista: Medicamento[] = [];
  for (let i = 0; i < lineas.length; i += 1) {
    const linea = lineas[i];
    if (linea.startsWith('Terapia/Medicamento:')) {
      const nombre = linea.replace('Terapia/Medicamento:', '').trim();
      const bloque = [linea];
      if (lineas[i + 1] && lineas[i + 1].startsWith('Posología/Observaciones:')) bloque.push(lineas[i + 1]);
      lista.push({ id: `${i}-${nombre}`, nombre, bloque });
    }
  }
  return lista;
}

function isPatientLine(line: string): boolean {
  return /^\s*Paciente:/i.test(line);
}

function isRequestLine(line: string): boolean {
  return /N[º°o]\s*petici[oó]n\s*:/i.test(line);
}

function isConfidenceLine(line: string): boolean {
  const key = normalizeForMatch(line);
  return key.includes('INDICE DE CONFIANZA') || key.includes('INTERVALO DE CONFIANZA') || key.includes('PROBABILIDAD DEL');
}

function splitColumns(line: string): string[] {
  return line.trim().split(/\t+|\s{2,}/).map((col) => col.trim()).filter(Boolean);
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
  if (/^(Deseable|Valores|Negativo|Positivo|Normal|Inferior|Superior)/i.test(t)) return true;
  return false;
}

function isGasometryGroup(group: string): boolean {
  return normalizeForMatch(group).includes('GASOMETRIA');
}

function isIgnorableLabToken(token: string): boolean {
  return normalizeForMatch(token) === 'VALIDADO TECNICAMENTE';
}

function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 80 || trimmed.includes('\t') || /^[-*]/.test(trimmed) || /\d/.test(trimmed)) return false;
  if (isPatientLine(trimmed) || isRequestLine(trimmed) || isConfidenceLine(trimmed)) return false;
  const letters = trimmed.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
  if (!letters) return false;
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').length;
  return upper / letters.length >= 0.65;
}

function detectGroup(headings: string[]): string {
  for (let i = headings.length - 1; i >= 0; i -= 1) {
    const normalized = normalizeForMatch(headings[i]);
    const found = GROUP_LABELS.find((rule) => normalized.includes(rule.needle));
    if (found) return found.label;
  }
  const fallback = headings[headings.length - 1] || 'Otros';
  return toTitleCase(fallback);
}

function parseResultAndUnit(valueUnitRaw: string): { result: string; unit: string } {
  const valueUnit = valueUnitRaw.replace(/\s+/g, ' ').trim();
  const numeric = valueUnit.match(/^([<>]=?|=)?\s*(-?\d+(?:[.,]\d+)?)(.*)$/);
  if (numeric) {
    const sign = numeric[1]?.trim();
    const value = numeric[2].trim();
    const unit = numeric[3].trim();
    return { result: sign ? `${sign} ${value}` : value, unit };
  }
  return { result: valueUnit, unit: '' };
}

function parseResultLine(line: string, group: string): LabEntry | null {
  const cols = splitColumns(line);
  if (cols.length < 2) return null;
  const name = cols[0];
  if (!name || name.length < 2) return null;

  let index = 1;
  let flag: '*' | '' = '';
  if (cols[1] === '*') {
    flag = '*';
    index = 2;
  }

  const tailCols = cols.slice(index).filter((col) => !isIgnorableLabToken(col));
  if (!tailCols.length) return null;

  let referenceStart = tailCols.length;
  if (tailCols.length >= 2 && looksLikeReferenceToken(tailCols[tailCols.length - 1])) referenceStart = tailCols.length - 1;

  const valueCols = tailCols.slice(0, referenceStart);
  let reference = tailCols.slice(referenceStart).join(' ').trim();
  if (!valueCols.length) return null;

  let valueUnitRaw = '';
  if (valueCols.length === 1) valueUnitRaw = valueCols[0];
  else if (looksNumericToken(valueCols[0])) valueUnitRaw = `${valueCols[0]} ${valueCols.slice(1).join(' ')}`.trim();
  else valueUnitRaw = valueCols.join(' ').trim();

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
    name: name.replace(/\s+/g, ' ').trim(),
    flag,
    result: parsed.result,
    unit: parsed.unit,
    reference,
    confidenceNote: '',
  };
}

function canAppendContinuation(entry: LabEntry): boolean {
  if (entry.unit) return false;
  const value = entry.result.trim();
  if (!value || looksNumericToken(value)) return false;
  return true;
}

function looksLikeUnitToken(token: string): boolean {
  const t = token.trim();
  if (!t) return false;
  if (t === '%') return true;
  if (/^10e\d+\/L$/i.test(t)) return true;
  if (/^(Seg|Ratio|upH|fL|pg)$/i.test(t)) return true;
  if (/[A-Za-zµ].*\//.test(t)) return true;
  if (/^(mmol\/L|mg\/dL|g\/dL|U\/L|mEq\/L|mmHg|ng\/mL|mcU\/mL|mU\/mL|pg\/mL)$/i.test(t)) return true;
  return false;
}

function parseDetachedUnitOrReferenceLine(line: string): { unit: string; reference: string } | null {
  const cols = splitColumns(line);
  if (cols.length === 0 || cols.length > 3) return null;
  const first = cols[0].trim();
  const rest = cols.slice(1).join(' ').trim();
  if (!first) return null;
  if (looksLikeReferenceToken(first)) return { unit: '', reference: first };
  if (!looksLikeUnitToken(first)) return null;
  if (!rest) return { unit: first, reference: '' };
  if (looksLikeReferenceToken(rest)) return { unit: first, reference: rest };
  return null;
}

function parseInput(input: string): ParsedPayload {
  const lines = input.split(/\n/).map(normalizeLine);
  const headings: string[] = [];
  let requestLine = '';
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
      const isBilirrubinaTotal = normalizeForMatch(lastEntry.name) === 'BILIRRUBINA TOTAL';
      const hasAnuladaIncidencia = normalizeForMatch(lastEntry.result).includes('ANULADA POR INCIDENCIA');
      if (isBilirrubinaTotal && hasAnuladaIncidencia) {
        lastEntry.result = '<1,4';
        lastEntry.unit = 'mg/dL';
        lastEntry.flag = '';
      } else {
        lastEntry.confidenceNote = line;
      }
      continue;
    }

    if (looksLikeHeading(line)) {
      headings.push(line);
      if (headings.length > 8) headings.shift();
      continue;
    }

    const detached = parseDetachedUnitOrReferenceLine(rawLine);
    if (lastEntry && detached) {
      if (detached.unit) lastEntry.unit = lastEntry.unit ? `${lastEntry.unit} ${detached.unit}`.trim() : detached.unit;
      if (detached.reference) lastEntry.reference = lastEntry.reference ? `${lastEntry.reference} ${detached.reference}`.trim() : detached.reference;
      continue;
    }

    const group = detectGroup(headings);
    const parsedResult = parseResultLine(rawLine, group);
    if (parsedResult) {
      ensureGroup(group).entries.push(parsedResult);
      lastEntry = parsedResult;
      continue;
    }

    if (lastEntry && canAppendContinuation(lastEntry)) lastEntry.result = `${lastEntry.result}\n${line}`.trim();
  }

  return {
    requestLine,
    groups: orderedGroups.filter((group) => group.entries.length > 0),
  };
}

function canonicalAntibiogramLabel(label: string): string {
  const key = normalizeForMatch(label);
  if (key.includes('EXPOSICION INCREMENTADA')) return 'Sensible con exposición incrementada';
  if (key.includes('RESISTENTE')) return 'Resistente';
  return 'Sensible';
}

function joinWithY(items: string[]): string {
  const vals = items.map((x) => x.trim()).filter(Boolean);
  if (vals.length === 0) return '';
  if (vals.length === 1) return vals[0];
  if (vals.length === 2) return `${vals[0]} y ${vals[1]}`;
  return `${vals.slice(0, -1).join(', ')} y ${vals[vals.length - 1]}`;
}

function normalizeNarrative(text: string): string {
  let out = text.replace(/\r/g, '').replace(/\s+/g, ' ').trim();
  out = out.replace(/\)\s+Se observan/gi, '). Se observan');
  out = out.replace(/\.\s*\./g, '.');
  if (out && !/[.!?]$/.test(out)) out += '.';
  return out;
}

function formatCultureResult(rawResult: string): string {
  const lines = rawResult.replace(/\r/g, '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
  if (!lines.length) return '';

  const isMarker = (line: string) => {
    const key = normalizeForMatch(line);
    return key === 'SENSIBLE' || key.startsWith('SENSIBLE CON EXPOSICION INCREMENTADA') || key === 'RESISTENTE';
  };

  if (!lines.some((line) => isMarker(line))) return normalizeNarrative(lines.join(' '));

  let germen = '';
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
  const germenLine = germen.replace(/\s+/g, ' ').trim();
  if (germenLine) out.push(germenLine);

  for (const label of ['Sensible', 'Sensible con exposición incrementada', 'Resistente'] as const) {
    const atbs = sections.get(label) ?? [];
    if (!atbs.length) continue;
    const joined = joinWithY(atbs);
    if (!joined) continue;
    if (label === 'Sensible') out.push(`   Sensible a: ${joined}`);
    else if (label === 'Sensible con exposición incrementada') out.push(`   Sensible con exposición incrementada a ${joined}`);
    else out.push(`   Resistente a ${joined}.`);
  }

  return out.join('\n');
}

function formatResultForOutput(entry: LabEntry): string {
  const nameKey = normalizeForMatch(entry.name);
  if (nameKey.includes('CULTIVO')) return formatCultureResult(entry.result);
  const raw = entry.result.replace(/\s+/g, ' ').trim();
  if (entry.unit) return raw;
  if (/^([<>]=?|=)?\s*-?\d+(?:[.,]\d+)?$/.test(raw)) return raw;
  return normalizeNarrative(raw);
}

function formatEntryNameForOutput(entry: LabEntry): string {
  let out = entry.name.replace(/\bTINCION\b/gi, 'TINCIÓN').replace(/\s+/g, ' ').trim();
  if (isGasometryGroup(entry.group)) {
    out = out
      .replace(/\bvenoso\b/gi, '')
      .replace(/\bvenosa\b/gi, '')
      .replace(/\barterial\b/gi, '')
      .replace(/\(\s*gasometr[ií]a[^)]*\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return out;
}

function isMicrobiologyGroup(group: string): boolean {
  return normalizeForMatch(group).includes('MICROBIOLOGIA');
}

function indentMultiline(text: string, indent: string): string {
  return text.split('\n').map((line) => `${indent}${line}`).join('\n');
}

function formatEntryLine(entry: LabEntry, includeReference: boolean, includeConfidence: boolean): string {
  const displayResult = entry.unit ? formatResultForOutput(entry).replace(/\s*\n+\s*/g, ' ').trim() : formatResultForOutput(entry);
  const displayName = formatEntryNameForOutput(entry);
  const isMicro = isMicrobiologyGroup(entry.group);
  const chunks = [isMicro ? `- ${displayName}:` : displayName];
  if (entry.flag) chunks.push(entry.flag);
  const resultAndUnit = [displayResult, entry.unit].filter(Boolean).join(' ');
  if (resultAndUnit) chunks.push(resultAndUnit);
  let text = chunks.join(' ').replace(/\s+/g, ' ').trim();
  if (entry.unit) text = text.replace(/\s*\n+\s*/g, ' ').trim();
  if (includeReference && entry.reference) text += ` ${entry.reference}`;
  if (includeConfidence && entry.confidenceNote) text += ` (${entry.confidenceNote})`;
  return text;
}

function formatEntryLineColumns(entry: LabEntry, includeReference: boolean, includeConfidence: boolean, indent: string, nameColumnTarget: number, valueColumnTarget: number): string {
  const displayResult = formatResultForOutput(entry).replace(/\s*\n+\s*/g, ' ').trim();
  const displayUnit = entry.unit.replace(/\s+/g, ' ').trim();
  const valueAndUnit = displayUnit ? `${displayResult} ${displayUnit}` : displayResult;
  const displayName = formatEntryNameForOutput(entry);
  const baseNameSpaces = Math.max(1, nameColumnTarget - displayName.length);
  const isLongName = displayName.length >= COLUMN_FORMAT.LONG_NAME_THRESHOLD;
  const nameSpaces = Math.max(1, baseNameSpaces - (isLongName ? COLUMN_FORMAT.LONG_NAME_REDUCTION : 0));
  const nameGap = `${spaces(nameSpaces)}${COLUMN_FORMAT.TAB}`;
  const flagChunk = entry.flag ? COLUMN_FORMAT.FLAG_WITH_ASTERISK : COLUMN_FORMAT.FLAG_EMPTY;
  let text = `${indent}${displayName}${nameGap}${flagChunk}`;
  text += valueAndUnit;
  if (includeReference && entry.reference) {
    const valueSpaces = Math.max(1, valueColumnTarget - valueAndUnit.length);
    const valueGap = `${spaces(valueSpaces)}${COLUMN_FORMAT.TAB}`;
    text += `${valueGap}${entry.reference}`;
  }
  if (includeConfidence && entry.confidenceNote) {
    const sep = text.endsWith(' ') ? '' : ' ';
    text += `${sep}(${entry.confidenceNote})`;
  }
  return text.trimEnd();
}

function buildAnaliticaOutput(input: string, mode: OutputMode, includeReference: boolean, includeConfidence: boolean, includeRequestLine: boolean, useColumns: boolean, fontProfile: VisualFontProfile): string {
  const parsed = parseInput(input);
  const out: string[] = [];
  const paramIndent = '  ';
  const entriesForColumns = parsed.groups.flatMap((group) => group.entries).filter((entry) => !isMicrobiologyGroup(entry.group));
  const nameColumnTarget =
    Math.max(
      'VOLUMEN CORPUSCULAR MEDIO'.length,
      entriesForColumns.reduce((max, entry) => Math.max(max, formatEntryNameForOutput(entry).length), 0)
    ) + COLUMN_FORMAT.NAME_EXTRA_SPACES;
  const valueColumnTarget =
    Math.max(
      10,
      entriesForColumns.reduce((max, entry) => {
        const result = formatResultForOutput(entry).replace(/\s*\n+\s*/g, ' ').trim();
        const unit = entry.unit.replace(/\s+/g, ' ').trim();
        const valueAndUnit = unit ? `${result} ${unit}` : result;
        return Math.max(max, valueAndUnit.length);
      }, 0)
    ) + COLUMN_FORMAT.VALUE_EXTRA_SPACES;

  void fontProfile;

  if (includeRequestLine && parsed.requestLine) {
    out.push(parsed.requestLine);
    out.push('');
  }

  for (const group of parsed.groups) {
    if (mode === 'lineas') {
      out.push(group.name.toUpperCase());
      for (const entry of group.entries) {
        if (useColumns && !isMicrobiologyGroup(entry.group)) {
          out.push(formatEntryLineColumns(entry, includeReference, includeConfidence, paramIndent, nameColumnTarget, valueColumnTarget).replace(/\s*\n+\s*/g, ' '));
        } else {
          out.push(indentMultiline(formatEntryLine(entry, includeReference, includeConfidence), paramIndent));
        }
      }
      out.push('');
      continue;
    }

    const joined = group.entries.map((entry) => formatEntryLine(entry, includeReference, includeConfidence)).join('; ');
    out.push(`- ${group.name.toUpperCase()}: ${joined}`);
    out.push('');
  }

  while (out.length > 0 && !out[out.length - 1]) out.pop();
  return out.join('\n');
}

function detectarTipoEntrada(input: string): { detected: DetectedKind; treatmentScore: number; analyticScore: number } {
  const texto = input || '';
  const lines = texto.split(/\n/);
  const treatmentMarkers =
    (texto.match(/Terapia\/Medicamento:/gi) || []).length * 3 +
    (texto.match(/Posolog[ií]a\/Observaciones:/gi) || []).length * 2;

  let analyticMarkers = 0;
  if (/^\s*Paciente:/im.test(texto)) analyticMarkers += 3;
  if (/N[º°o]\s*petici[oó]n\s*:/i.test(texto)) analyticMarkers += 3;
  if (GROUP_LABELS.some((rule) => normalizeForMatch(texto).includes(rule.needle))) analyticMarkers += 2;
  analyticMarkers += lines.filter((line) => splitColumns(line).length >= 3 && /\d/.test(line)).length;
  analyticMarkers += lines.filter((line) => looksLikeHeading(line)).length;

  if (treatmentMarkers === 0 && analyticMarkers === 0) return { detected: 'desconocido', treatmentScore: 0, analyticScore: 0 };
  if (treatmentMarkers > 0 && analyticMarkers === 0) return { detected: 'tratamiento', treatmentScore: treatmentMarkers, analyticScore: analyticMarkers };
  if (analyticMarkers > 0 && treatmentMarkers === 0) return { detected: 'analitica', treatmentScore: treatmentMarkers, analyticScore: analyticMarkers };
  if (treatmentMarkers >= analyticMarkers * 1.5) return { detected: 'tratamiento', treatmentScore: treatmentMarkers, analyticScore: analyticMarkers };
  if (analyticMarkers >= treatmentMarkers * 1.5) return { detected: 'analitica', treatmentScore: treatmentMarkers, analyticScore: analyticMarkers };
  return { detected: 'ambiguo', treatmentScore: treatmentMarkers, analyticScore: analyticMarkers };
}

function getResolvedKind(mode: InputKind, detected: DetectedKind): 'tratamiento' | 'analitica' | null {
  if (mode === 'tratamiento' || mode === 'analitica') return mode;
  if (detected === 'tratamiento' || detected === 'analitica') return detected;
  return null;
}

function getDetectionLabel(detected: DetectedKind) {
  if (detected === 'tratamiento') return 'Tratamiento detectado';
  if (detected === 'analitica') return 'Analítica detectada';
  if (detected === 'ambiguo') return 'Entrada ambigua';
  return 'Sin tipo claro';
}

function getInitialInputKind(value: string | null): InputKind {
  if (value === 'tratamiento' || value === 'analitica' || value === 'auto') {
    return value;
  }
  return 'auto';
}

export default function OrionUnificadoPage() {
  const searchParams = useSearchParams();
  const requestedKind = searchParams.get('kind');
  const [texto, setTexto] = useState('');
  const [inputKind, setInputKind] = useState<InputKind>(() => getInitialInputKind(requestedKind));
  const [aboutOpen, setAboutOpen] = useState(false);
  const [variasLineas, setVariasLineas] = useState(false);
  const [seleccion, setSeleccion] = useState<Record<string, boolean>>({});
  const [reglas, setReglas] = useState<Regla[]>([]);
  const [reglasListas, setReglasListas] = useState(false);
  const [reglasCargando, setReglasCargando] = useState(false);
  const [mode, setMode] = useState<OutputMode>('lineas');
  const [useColumns, setUseColumns] = useState(false);
  const [includeReference, setIncludeReference] = useState(true);
  const [includeRequestLine, setIncludeRequestLine] = useState(true);
  const includeConfidence = false;
  const fontProfile: VisualFontProfile = 'helvetica';

  const detection = useMemo(() => detectarTipoEntrada(texto), [texto]);
  const resolvedKind = useMemo(() => getResolvedKind(inputKind, detection.detected), [inputKind, detection.detected]);
  const medicamentos = useMemo(
    () => (resolvedKind === 'tratamiento' && texto.trim() ? extraerMedicamentos(texto) : []),
    [texto, resolvedKind]
  );

  const cargarReglas = useCallback(() => {
    setReglasCargando(true);
    setReglasListas(false);
    const url = `${REGLAS_URL}${REGLAS_URL.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results: { data?: Array<{ patron?: string; reemplazo?: string; tipo?: string; flags?: string }> }) => {
        const rows = (results.data || [])
          .map((r) => ({
            patron: (r.patron || '').trim(),
            reemplazo: (r.reemplazo ?? '').toString(),
            tipo: (r.tipo || 'regex').trim().toLowerCase(),
            flags: (r.flags || 'g').trim(),
          }))
          .filter((r) => r.patron);
        setReglas(rows);
        setReglasListas(true);
        setReglasCargando(false);
      },
      error: () => {
        setReglas([]);
        setReglasListas(true);
        setReglasCargando(false);
      },
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => cargarReglas(), 0);
    return () => window.clearTimeout(timer);
  }, [cargarReglas]);

  useEffect(() => {
    void reglas;
  }, [reglas]);

  const textoTratamientoFiltrado = useMemo(() => {
    if (!medicamentos.length) return texto;
    const activos = medicamentos.filter((m) => seleccion[m.id] ?? true);
    if (!activos.length) return '';
    return activos.map((m) => m.bloque.join('\n')).join('\n');
  }, [texto, medicamentos, seleccion]);

  const resultado = useMemo(() => {
    if (!texto.trim()) return '';
    if (resolvedKind === 'tratamiento') return depurarTratamiento(textoTratamientoFiltrado, variasLineas);
    if (resolvedKind === 'analitica') {
      return buildAnaliticaOutput(texto, mode, includeReference, includeConfidence, includeRequestLine, useColumns, fontProfile);
    }
    return '';
  }, [texto, resolvedKind, textoTratamientoFiltrado, variasLineas, mode, includeReference, includeConfidence, includeRequestLine, useColumns]);

  const detectionBadgeClass =
    detection.detected === 'tratamiento'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : detection.detected === 'analitica'
        ? 'bg-sky-50 text-sky-700 border-sky-200'
        : detection.detected === 'ambiguo'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-slate-50 text-slate-600 border-slate-200';

  if (!reglasListas && !reglasCargando) return <p>Cargando reglas…</p>;

  return (
    <main className="escala-wrapper space-y-4 orion-analitica-page" style={{ padding: 18 }}>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Orion Smart Formatter</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Detecta si el texto pegado parece una analítica de GestLab o un tratamiento de SIA y activa los controles correspondientes. Integra el antiguo depurador de tratamientos SIA para que el acceso histórico siga llevando al mismo flujo. Si la detección no es concluyente, puedes forzar el modo. Si ves algún fallo raro, alguna salida regulera o un “esto me lo ha dejado fino filipino”, puedes reportarlo desde{' '}
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
          >
            Acerca de esta web
          </button>
          .
        </p>
      </header>

      <section className="orion-grid">
        <div className="input-group">
          <label>Pega aquí el texto de Orion / GestLab:</label>
          <textarea
            className="depurador-textarea orion-textarea"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pega aquí una analítica o un listado de tratamiento..."
            style={{ minHeight: 220 }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${detectionBadgeClass}`}>
              {getDetectionLabel(detection.detected)}
            </span>
            <span className="text-xs text-slate-500">score tto {detection.treatmentScore} | score analítica {detection.analyticScore}</span>
            <button
              type="button"
              className="reset-btn orion-reset"
              onClick={() => {
                setTexto('');
                setSeleccion({});
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      <section className="orion-card space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modo</p>
          <div className="orion-mode-selector">
            <button
              type="button"
              className={`orion-mode-option ${inputKind === 'auto' ? 'activo' : ''}`}
              onClick={() => setInputKind('auto')}
            >
              Auto
            </button>
            <button
              type="button"
              className={`orion-mode-option ${inputKind === 'tratamiento' ? 'activo' : ''}`}
              onClick={() => setInputKind('tratamiento')}
            >
              Tratamiento
            </button>
            <button
              type="button"
              className={`orion-mode-option ${inputKind === 'analitica' ? 'activo' : ''}`}
              onClick={() => setInputKind('analitica')}
            >
              Analítica
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {resolvedKind === 'tratamiento' ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Multilínea</p>
              <button type="button" className={`selector-btn selector-btn-compact w-full ${variasLineas ? 'activo' : ''}`} onClick={() => setVariasLineas((prev) => !prev)}>
                {variasLineas ? 'SÍ' : 'NO'}
              </button>
            </div>
          ) : null}

          {resolvedKind === 'analitica' ? (
            <>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vista</p>
                <button type="button" className={`selector-btn selector-btn-compact w-full ${mode === 'lineas' ? 'activo' : ''}`} onClick={() => setMode((prev) => (prev === 'lineas' ? 'parrafos' : 'lineas'))}>
                  {mode === 'lineas' ? 'LÍNEA' : 'PÁRRAFO'}
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Columnas</p>
                <button type="button" className={`selector-btn selector-btn-compact w-full ${mode === 'lineas' && useColumns ? 'activo' : ''}`} disabled={mode !== 'lineas'} onClick={() => setUseColumns((prev) => !prev)}>
                  {useColumns ? 'SÍ' : 'NO'}
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rangos</p>
                <button type="button" className={`selector-btn selector-btn-compact w-full ${includeReference ? 'activo' : ''}`} onClick={() => setIncludeReference((prev) => !prev)}>
                  {includeReference ? 'SÍ' : 'NO'}
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Encabezado</p>
                <button type="button" className={`selector-btn selector-btn-compact w-full ${includeRequestLine ? 'activo' : ''}`} onClick={() => setIncludeRequestLine((prev) => !prev)}>
                  {includeRequestLine ? 'SÍ' : 'NO'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {resolvedKind === 'tratamiento' && medicamentos.length ? (
        <section className="depurador-lista">
          <div className="depurador-lista-titulo">Medicamentos detectados ({medicamentos.length})</div>
          <div className="depurador-lista-items">
            {medicamentos.map((m) => (
              <label key={m.id} className="depurador-item">
                <input
                  type="checkbox"
                  checked={seleccion[m.id] ?? true}
                  onChange={() =>
                    setSeleccion((prev) => ({
                      ...prev,
                      [m.id]: !(prev[m.id] ?? true),
                    }))
                  }
                />
                <span>{m.nombre || 'Sin nombre'}</span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {resolvedKind === null && texto.trim() ? (
        <section className="orion-card">
          <p className="text-sm text-slate-600">
            No he podido clasificar con suficiente confianza el texto pegado. Puedes forzar el modo arriba y revisar el resultado.
          </p>
        </section>
      ) : null}

      {resultado ? <InformeCopiable texto={resultado} /> : null}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </main>
  );
}
