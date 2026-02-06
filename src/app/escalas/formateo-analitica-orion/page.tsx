"use client"
// @ts-nocheck

import { useMemo, useState } from "react";
import InformeCopiable from "@/components/InformeCopiable";

type ParsedLine =
  | { kind: "raw"; text: string }
  | { kind: "result"; name: string; flag: string; valueUnit: string; interval: string };

function splitCols(s: string): string[] {
  const norm = s.replace(/\u00A0/g, " ").replace(/[ \t]+$/g, "");
  return norm
    .trim()
    .split(/\t+|\s{2,}/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function parseLine(line: string): ParsedLine {
  const original = line.replace(/\r/g, "");
  if (!original.trim()) return { kind: "raw", text: "" };

  if (/^(Paciente:|N[ºo]\s*petici[oó]n:|Fecha:|Fecha toma:)/i.test(original.trim())) {
    return { kind: "raw", text: original.trimEnd() };
  }

  let interval = "";
  let work = original.replace(/\u00A0/g, " ").trimEnd();

  const mInterval = work.match(/\[\s*[^[]*?\s*\]\s*$/);
  if (mInterval) {
    interval = mInterval[0].trim();
    work = work.slice(0, mInterval.index).trimEnd();
  }

  const rawCols = work.includes("\t") ? work.split(/\t+/) : work.split(/\s{2,}/);
  const cols = rawCols.map((c) => c.trim()).filter((c) => c.length > 0);
  const looksLikeValue = cols.length ? /[<>]?\s*\d|,\d/.test(cols[cols.length - 1]) : false;
  const isResult = (cols.length >= 2 && looksLikeValue) || interval.length > 0;

  if (!isResult) {
    return { kind: "raw", text: original.trimEnd() };
  }

  let valueUnit = "";
  let name = "";
  let flag = "";

  if (cols.length >= 3 && cols[1] === "*") {
    name = cols[0];
    flag = "*";
    valueUnit = cols.slice(2).join(" ");
  } else if (cols.length >= 2) {
    name = cols[0];
    valueUnit = cols.slice(1).join(" ");
  } else {
    return { kind: "raw", text: original.trimEnd() };
  }

  return {
    kind: "result",
    name: name.trim(),
    flag,
    valueUnit: valueUnit.trim(),
    interval: interval.replace(/^\[\s*|\s*\]$/g, "").trim(),
  };
}

function buildOutput(lines: string[], includeInterval: boolean): string {
  const parsed = lines.map((l) => parseLine(l));
  const resultados = parsed.filter((p) => p.kind === "result") as Array<
    Extract<ParsedLine, { kind: "result" }>
  >;

  const intervaloTexto = (p: Extract<ParsedLine, { kind: "result" }>) =>
    p.interval ? `[ ${p.interval} ]` : "";

  const maxLen = (vals: string[]) => vals.reduce((m, v) => Math.max(m, v.length), 0);
  const maxName = maxLen(resultados.map((p) => p.name));
  const maxFlag = Math.max(1, maxLen(resultados.map((p) => p.flag)));
  const maxValue = maxLen(resultados.map((p) => p.valueUnit));
  const maxInterval = maxLen(resultados.map((p) => intervaloTexto(p)));

  // Orion Clinic editor uses wider tab stops (approx. 18 spaces).
  // We avoid TAB characters and pad with spaces to match those tab stops.
  const tabSize = 18;
  const indentSpaces = tabSize;
  const roundTab = (n: number) => Math.max(tabSize, Math.ceil(n / tabSize) * tabSize);
  const col2 = roundTab(indentSpaces + maxName);
  const col3 = roundTab(col2 + maxFlag);
  const col4 = roundTab(col3 + maxValue);
  const col5 = roundTab(col4 + (maxInterval || 1));

  const advanceWithTab = (pos: number) => Math.floor(pos / tabSize + 1) * tabSize;
  const spacesToReach = (pos: number, target: number) => {
    let p = pos;
    let spaces = "";
    while (p < target || spaces.length === 0) {
      const next = advanceWithTab(p);
      const add = Math.max(1, next - p);
      spaces += " ".repeat(add);
      p = next;
    }
    return spaces;
  };

  const out: string[] = [];
  for (const p of parsed) {
    if (p.kind === "raw") {
      out.push(p.text);
      continue;
    }

    const interval = intervaloTexto(p);
    let line = `${" ".repeat(indentSpaces)}${p.name}`;
    line += spacesToReach(line.length, col2);
    line += p.flag;
    line += spacesToReach(line.length, col3);
    line += p.valueUnit;

    if (includeInterval) {
      line += spacesToReach(line.length, col4);
      line += interval;
      line += spacesToReach(line.length, col5);
    }

    out.push(line.trimEnd());
  }

  return out.join("\n");
}

export default function FormateoAnaliticaOrion() {
  const [input, setInput] = useState<string>("");
  const [includeInterval, setIncludeInterval] = useState<boolean>(true);

  const output = useMemo(() => {
    const lines = input.split(/\n/);
    return buildOutput(lines, includeInterval);
  }, [input, includeInterval]);
  const onClear = () => {
    setInput("");
  };

  return (
    <main className="escala-wrapper space-y-6 orion-analitica-page" style={{ padding: 24 }}>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Orion Clinic · Analítica
        </p>
        <h1 className="text-2xl font-semibold">Formateo Analítica Orion</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Convierte el resultado bruto de la analítica en columnas alineadas con TABs para
          pegarlo en el informe clínico (Tahoma 10).
        </p>
      </header>

      <section className="orion-card">
        <div className="orion-card-title">Configuración</div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={includeInterval}
            onChange={(e) => {
              setIncludeInterval(e.target.checked);
            }}
          />
          Incluir intervalos de normalidad como 4ª columna
        </label>
        <p className="orion-card-note">El pegado final depende de los tab stops del editor clínico.</p>
      </section>

      <section className="orion-grid">
        <div className="input-group">
          <label>Entrada (Analítica / Resultados laboratorio)</label>
          <textarea
            className="depurador-textarea orion-textarea"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            placeholder="Pega aquí la analítica..."
          />
        </div>
      </section>

      {output ? <InformeCopiable texto={output} /> : null}

      <button type="button" className="reset-btn orion-reset" onClick={onClear}>
        Limpiar texto
      </button>
    </main>
  );
}
