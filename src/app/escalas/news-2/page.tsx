'use client';
// @ts-nocheck

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type Option = {
  id: string;
  label: string;
  points: number;
};

const FR_OPTIONS: Option[] = [
  { id: 'fr_lte_8', label: '≤8', points: 3 },
  { id: 'fr_9_11', label: '9-11', points: 1 },
  { id: 'fr_12_20', label: '12-20', points: 0 },
  { id: 'fr_21_24', label: '21-24', points: 2 },
  { id: 'fr_gte_25', label: '≥25', points: 3 },
];

const PAS_OPTIONS: Option[] = [
  { id: 'pas_lte_90', label: '≤90', points: 3 },
  { id: 'pas_91_100', label: '91-100', points: 2 },
  { id: 'pas_101_110', label: '101-110', points: 1 },
  { id: 'pas_111_219', label: '111-219', points: 0 },
  { id: 'pas_gte_220', label: '≥220', points: 3 },
];

const CONSCIENCE_OPTIONS: Option[] = [
  { id: 'alerta', label: 'Alerta', points: 0 },
  { id: 'alterado', label: 'Alterado (CVPU)', points: 3 },
];

const FC_OPTIONS: Option[] = [
  { id: 'fc_lte_40', label: '≤40', points: 3 },
  { id: 'fc_41_50', label: '41-50', points: 1 },
  { id: 'fc_51_90', label: '51-90', points: 0 },
  { id: 'fc_91_110', label: '91-110', points: 1 },
  { id: 'fc_111_130', label: '111-130', points: 2 },
  { id: 'fc_gte_131', label: '≥131', points: 3 },
];

const TEMP_OPTIONS: Option[] = [
  { id: 'temp_lte_35', label: '≤35.0', points: 3 },
  { id: 'temp_35_1_36', label: '35.1-36.0', points: 1 },
  { id: 'temp_36_1_38', label: '36.1-38.0', points: 0 },
  { id: 'temp_38_1_39', label: '38.1-39.0', points: 1 },
  { id: 'temp_gte_39_1', label: '≥39.1', points: 2 },
];

function normalizeInput(raw: string): number | null {
  const clean = raw.replace(',', '.').replace(/\s+/g, '').trim();
  if (!clean) return null;
  const n = Number(clean);
  if (Number.isNaN(n)) return null;
  return n;
}

function clampSpo2(value: number) {
  if (value < 40) return 40;
  if (value > 100) return 100;
  return value;
}

function getSpo2Points(spo2: number, hipercapnia: boolean, oxigeno: boolean): number {
  if (!hipercapnia) {
    if (spo2 >= 96) return 0;
    if (spo2 >= 94) return 1;
    if (spo2 >= 92) return 2;
    return 3;
  }

  if (!oxigeno) {
    if (spo2 >= 88) return 0;
    if (spo2 >= 86) return 1;
    if (spo2 >= 84) return 2;
    return 3;
  }

  if (spo2 >= 97 || spo2 <= 83) return 3;
  if ((spo2 >= 95 && spo2 <= 96) || (spo2 >= 84 && spo2 <= 85)) return 2;
  if ((spo2 >= 93 && spo2 <= 94) || (spo2 >= 86 && spo2 <= 87)) return 1;
  return 0;
}

function getInterpretacion(total: number) {
  if (total >= 7) {
    return { color: 'rojo', texto: 'Emergencia' };
  }
  if (total >= 5) {
    return { color: 'naranja', texto: 'ACTIVACIÓN CÓDIGO SEPSIS' };
  }
  if (total >= 3) {
    return { color: 'amarillo', texto: 'Urgente' };
  }
  return { color: 'verde', texto: 'Vigilancia' };
}

export default function News2Page() {
  const [hipercapnia, setHipercapnia] = useState<'si' | 'no'>('no');
  const [oxigeno, setOxigeno] = useState<'si' | 'no'>('no');
  const [spo2, setSpo2] = useState('');

  const [fr, setFr] = useState<Option | null>(null);
  const [pas, setPas] = useState<Option | null>(null);
  const [conciencia, setConciencia] = useState<Option | null>(null);
  const [fc, setFc] = useState<Option | null>(null);
  const [temp, setTemp] = useState<Option | null>(null);

  const spo2Num = normalizeInput(spo2);
  const spo2Valida = spo2Num !== null && spo2Num >= 40 && spo2Num <= 100;

  const faltanDatos = !fr || !pas || !conciencia || !fc || !temp || !spo2Valida;

  const hipercapniaActiva = hipercapnia === 'si';
  const oxigenoActivo = oxigeno === 'si';

  const spo2Points = useMemo(() => {
    if (!spo2Valida || spo2Num === null) return null;
    return getSpo2Points(spo2Num, hipercapniaActiva, oxigenoActivo);
  }, [spo2Num, spo2Valida, hipercapniaActiva, oxigenoActivo]);

  const oxygenPoints = oxigenoActivo ? 2 : 0;

  const total = useMemo(() => {
    if (faltanDatos || spo2Points === null) return null;
    return (
      fr.points +
      pas.points +
      conciencia.points +
      fc.points +
      temp.points +
      oxygenPoints +
      spo2Points
    );
  }, [faltanDatos, spo2Points, fr, pas, conciencia, fc, temp, oxygenPoints]);

  const isolated3 = useMemo(() => {
    if (spo2Points === null || !fr || !pas || !conciencia || !fc || !temp) return false;
    return [
      spo2Points,
      oxygenPoints,
      fr.points,
      pas.points,
      conciencia.points,
      fc.points,
      temp.points,
    ].some((value) => value >= 3);
  }, [spo2Points, oxygenPoints, fr, pas, conciencia, fc, temp]);

  const interpretacion = total === null ? null : getInterpretacion(total);

  const textoInforme = useMemo(() => {
    if (total === null || spo2Points === null) return null;

    return `NEWS-2\n- FRA hipercapnico: ${hipercapniaActiva ? 'Sí' : 'No'}\n- Oxígeno suplementario: ${oxigenoActivo ? 'Sí (+2)' : 'No (+0)'}\n- Saturación O2: ${spo2Num}% (${spo2Points} puntos)\n- Frecuencia respiratoria: ${fr?.label} (${fr?.points} puntos)\n- PAS: ${pas?.label} (${pas?.points} puntos)\n- Nivel de conciencia: ${conciencia?.label} (${conciencia?.points} puntos)\n- Frecuencia cardíaca: ${fc?.label} (${fc?.points} puntos)\n- Temperatura: ${temp?.label} (${temp?.points} puntos)\n\nTotal NEWS-2: ${total} puntos\nValor aislado ≥3: ${isolated3 ? 'Sí' : 'No'}\n${interpretacion?.texto ?? ''}`;
  }, [
    total,
    spo2Points,
    hipercapniaActiva,
    oxigenoActivo,
    spo2Num,
    fr,
    pas,
    conciencia,
    fc,
    temp,
    isolated3,
    interpretacion,
  ]);

  const reset = () => {
    setHipercapnia('no');
    setOxigeno('no');
    setSpo2('');
    setFr(null);
    setPas(null);
    setConciencia(null);
    setFc(null);
    setTemp(null);
  };

  const changeSpo2By = (delta: number) => {
    const base = spo2Num ?? 96;
    const next = clampSpo2(Math.round(base + delta));
    setSpo2(String(next));
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">NEWS-2 (National Early Warning Score)</h1>

      <p className="text-sm text-slate-700 leading-relaxed">
        Sistema de alerta temprana para identificar pacientes con sospecha de Sepsis. Se usa como
        complemento al{' '}
        <a href="/escalas/qsofa" className="text-blue-600 hover:underline">
          qSOFA
        </a>
        . Su objetivo es detectar alteraciones fisiológicas y activar una respuesta clínica precoz.
      </p>

      <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`criterio-btn ${hipercapniaActiva ? 'activo-rojo' : 'activo-verde'}`}
            onClick={() => setHipercapnia((prev) => (prev === 'si' ? 'no' : 'si'))}
          >
            <span>Hipercapnia basal</span>
            <span className="puntos">{hipercapniaActiva ? 'Sí' : 'No'}</span>
          </button>

          <button
            type="button"
            className={`criterio-btn ${oxigenoActivo ? 'activo-naranja' : 'activo-verde'}`}
            onClick={() => setOxigeno((prev) => (prev === 'si' ? 'no' : 'si'))}
          >
            <span>O₂ suplementario</span>
            <span className="puntos">{oxigenoActivo ? 'Sí (+2)' : 'No (+0)'}</span>
          </button>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Saturación de oxígeno (SpO₂ %)
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              onClick={() => changeSpo2By(-1)}
              aria-label="Disminuir SpO2"
            >
              -1
            </button>
            <input
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              inputMode="numeric"
              placeholder="Ej: 95"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-center"
            />
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              onClick={() => changeSpo2By(1)}
              aria-label="Aumentar SpO2"
            >
              +1
            </button>
          </div>
          {spo2.trim() && !spo2Valida && (
            <span className="mt-1 block text-xs text-red-700">
              Introduce un valor válido entre 40 y 100.
            </span>
          )}
        </label>

        <Selector
          title="Frecuencia respiratoria (rpm)"
          options={FR_OPTIONS}
          selected={fr}
          onSelect={setFr}
        />
        <Selector
          title="Presión arterial sistólica (mmHg)"
          options={PAS_OPTIONS}
          selected={pas}
          onSelect={setPas}
        />
        <Selector
          title="Nivel de conciencia"
          options={CONSCIENCE_OPTIONS}
          selected={conciencia}
          onSelect={setConciencia}
        />
        <Selector
          title="Frecuencia cardíaca (lpm)"
          options={FC_OPTIONS}
          selected={fc}
          onSelect={setFc}
        />
        <Selector
          title="Temperatura (ºC)"
          options={TEMP_OPTIONS}
          selected={temp}
          onSelect={setTemp}
        />
      </section>

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={reset}>
            Reiniciar escala
          </button>
        </div>

        <div className={`resultado ${interpretacion?.color ?? 'amarillo'}`}>
          <div className="puntos-total">
            {total === null ? 'Completa los datos' : `${total} puntos`}
          </div>
          <div className="interpretacion">
            {total === null
              ? 'Faltan datos para calcular NEWS-2.'
              : `${interpretacion?.texto} ${isolated3 ? 'Existe al menos un valor aislado ≥3.' : ''}`}
          </div>
        </div>
      </div>

      {textoInforme && <InformeCopiable texto={textoInforme} />}

      <section className="mt-8 space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>
          Algoritmo de decisión hospitalaria adaptado por puntuación total NEWS-2:
          <br />
          - NEWS-2 ≥ 7 o valor aislado ≥ 3: avisar directamente UCI (salvo LET establecido).
          <br />
          - NEWS-2 5-6: avisar médico de guardia.
          <br />- NEWS-2 ≤ 4: observar y repetir constantes cada 8 horas.
        </p>
        <p>
          Referencia: Arévalo-Buitrago P, Morales-Cané I, Olivares Luque E, Godino-Rubio M,
          Rodríguez-Borrego MA, López-Soto PJ. Validación en España de la escala National Early
          Warning Score 2 (NEWS-2) para la detección precoz en urgencias de pacientes en riesgo de
          deterioro. Emergencias. 2022;34:452-7. DOI: https://doi.org/10.55633/s3me/E09.2022
        </p>
      </section>
    </main>
  );
}

function Selector({ title, options, selected, onSelect }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const colorClass =
            option.points === 0
              ? 'activo-verde'
              : option.points === 1
                ? 'activo-amarillo'
                : option.points === 2
                  ? 'activo-naranja'
                  : 'activo-rojo';

          return (
            <button
              key={option.id}
              type="button"
              className={`criterio-btn ${selected?.id === option.id ? colorClass : ''}`}
              onClick={() => onSelect(option)}
            >
              <span>{option.label}</span>
              <span className="puntos">{option.points}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
