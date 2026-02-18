"use client";

import { useMemo, useState } from "react";
import InformeCopiable from "@/components/InformeCopiable";

type UnidadId = "mgdl" | "mmoll" | "gl" | "mgl";
type Magnitud = "urea" | "bun";

const UNIDADES: Array<{ id: UnidadId; label: string }> = [
  { id: "mgdl", label: "mg/dL" },
  { id: "mmoll", label: "mmol/L" },
  { id: "gl", label: "g/L" },
  { id: "mgl", label: "mg/L" },
];

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeInput(raw: string): number | null {
  const clean = raw.replace(",", ".").replace(/\s+/g, "").trim();
  if (!clean) return null;
  const n = Number(clean);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

function toUreaMgDl(valor: number, unidad: UnidadId, magnitud: Magnitud): number {
  let ureaMgDl = valor;

  if (magnitud === "bun") {
    ureaMgDl = valor * 2.1428;
  }

  if (unidad === "mgdl") return ureaMgDl;
  if (unidad === "mmoll") return ureaMgDl * 6.01;
  if (unidad === "gl") return ureaMgDl * 100;
  return ureaMgDl / 10;
}

function fromUreaMgDl(ureaMgDl: number, unidad: UnidadId, magnitud: Magnitud): number {
  let valueInUnit = ureaMgDl;

  if (unidad === "mgdl") valueInUnit = ureaMgDl;
  else if (unidad === "mmoll") valueInUnit = ureaMgDl / 6.01;
  else if (unidad === "gl") valueInUnit = ureaMgDl / 100;
  else valueInUnit = ureaMgDl * 10;

  if (magnitud === "bun") {
    return valueInUnit / 2.1428;
  }
  return valueInUnit;
}

export default function UreaBunPage() {
  const [ureaValue, setUreaValue] = useState("");
  const [ureaUnit, setUreaUnit] = useState<UnidadId>("mgdl");
  const [bunValue, setBunValue] = useState("");
  const [bunUnit, setBunUnit] = useState<UnidadId>("mgdl");
  const [lastEdited, setLastEdited] = useState<Magnitud>("urea");

  const unitLabelUrea = useMemo(() => UNIDADES.find((u) => u.id === ureaUnit)?.label ?? "mg/dL", [ureaUnit]);
  const unitLabelBun = useMemo(() => UNIDADES.find((u) => u.id === bunUnit)?.label ?? "mg/dL", [bunUnit]);

  const calculo = useMemo(() => {
    if (lastEdited === "urea") {
      const valor = normalizeInput(ureaValue);
      if (valor === null) {
        if (!ureaValue.trim()) return { urea: "", bun: "", error: "" };
        return { urea: ureaValue, bun: "", error: "Introduce un valor numérico válido" };
      }
      const baseUrea = toUreaMgDl(valor, ureaUnit, "urea");
      const bun = fromUreaMgDl(baseUrea, bunUnit, "bun");
      return { urea: ureaValue, bun: String(round2(bun)), error: "" };
    }

    const valor = normalizeInput(bunValue);
    if (valor === null) {
      if (!bunValue.trim()) return { urea: "", bun: "", error: "" };
      return { urea: "", bun: bunValue, error: "Introduce un valor numérico válido" };
    }
    const baseUrea = toUreaMgDl(valor, bunUnit, "bun");
    const urea = fromUreaMgDl(baseUrea, ureaUnit, "urea");
    return { urea: String(round2(urea)), bun: bunValue, error: "" };
  }, [bunUnit, bunValue, lastEdited, ureaUnit, ureaValue]);

  const reset = () => {
    setUreaValue("");
    setUreaUnit("mgdl");
    setBunValue("");
    setBunUnit("mgdl");
    setLastEdited("urea");
  };

  const textoInforme = useMemo(() => {
    if (!calculo.urea && !calculo.bun) return "";
    return `CONVERSOR UREA - BUN*

Entrada:
- Urea: ${calculo.urea || "-"} ${unitLabelUrea}
- BUN*: ${calculo.bun || "-"} ${unitLabelBun}

Resultado:
- Conversión bidireccional actualizada automáticamente

Fórmulas:
- BUN* = Urea / 2.1428
- Urea = 2.1428 × BUN*
- Urea (mmol/L) = 0.357 × BUN* (mg/dL)

*BUN: Blood Urea Nitrogen`;
  }, [calculo.bun, calculo.urea, unitLabelBun, unitLabelUrea]);

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">Conversor Urea - BUN*</h1>

      <div className="inputs-grid">
        <div className="input-group">
          <label>Urea</label>
          <div className="input-row">
            <input
              type="text"
              inputMode="decimal"
              value={lastEdited === "urea" ? ureaValue : calculo.urea}
              onChange={(e) => {
                setLastEdited("urea");
                setUreaValue(e.target.value);
              }}
              placeholder="Urea"
            />
            <select value={ureaUnit} onChange={(e) => setUreaUnit(e.target.value as UnidadId)}>
              {UNIDADES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>BUN*</label>
          <div className="input-row">
            <input
              type="text"
              inputMode="decimal"
              value={lastEdited === "bun" ? bunValue : calculo.bun}
              onChange={(e) => {
                setLastEdited("bun");
                setBunValue(e.target.value);
              }}
              placeholder="BUN*"
            />
            <select value={bunUnit} onChange={(e) => setBunUnit(e.target.value as UnidadId)}>
              {UNIDADES.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      <button className="reset-btn" onClick={reset}>
        Borrar datos
      </button>

      {calculo.error && (
        <div className="resultado amarillo">
          <div className="interpretacion">{calculo.error}</div>
        </div>
      )}

      {(calculo.urea || calculo.bun) && !calculo.error && (
        <div className="resultado verde">
          <div className="puntos-total">
            Urea: {calculo.urea || "-"} {unitLabelUrea}
          </div>
          <div className="interpretacion">
            BUN*: {calculo.bun || "-"} {unitLabelBun}
          </div>
        </div>
      )}

      <div className="resultado amarillo">
        <div className="interpretacion">
          Fórmulas: BUN* = Urea / 2.1428 | Urea = 2.1428 × BUN* | Urea (mmol/L) = 0.357 × BUN* (mg/dL)
        </div>
      </div>

      <div className="text-xs text-slate-500">*BUN: Blood Urea Nitrogen</div>

      {textoInforme && <InformeCopiable texto={textoInforme} />}
    </main>
  );
}
