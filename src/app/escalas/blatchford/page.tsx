'use client';
// @ts-nocheck

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';
import CalcIcon from '@/components/CalcIcon';

type Opcion = {
  id: string;
  label: string;
  puntos: number;
};

type PopupId = 'bun' | null;
type UnidadId = 'mgdl' | 'mmoll' | 'gl' | 'mgl';
type Magnitud = 'urea' | 'bun';

const UNIDADES: Array<{ id: UnidadId; label: string }> = [
  { id: 'mgdl', label: 'mg/dL' },
  { id: 'mmoll', label: 'mmol/L' },
  { id: 'gl', label: 'g/L' },
  { id: 'mgl', label: 'mg/L' },
];

const PAS_OPCIONES: Opcion[] = [
  { id: 'pas_lt_90', label: '< 90', puntos: 3 },
  { id: 'pas_90_99', label: '90-99', puntos: 2 },
  { id: 'pas_100_109', label: '100-109', puntos: 1 },
  { id: 'pas_gt_110', label: '> 110', puntos: 0 },
];

const BUN_OPCIONES: Opcion[] = [
  { id: 'bun_lt_6_5', label: '< 6.5', puntos: 0 },
  { id: 'bun_6_5_7_9', label: '6.5-7.9', puntos: 2 },
  { id: 'bun_8_9_9', label: '8.0-9.9', puntos: 3 },
  { id: 'bun_10_24_9', label: '10.0-24.9', puntos: 4 },
  { id: 'bun_gte_25', label: '≥ 25', puntos: 6 },
];

const HB_HOMBRE_OPCIONES: Opcion[] = [
  { id: 'h_hb_lt_10', label: '< 10.0', puntos: 6 },
  { id: 'h_hb_10_11_9', label: '10.0-11.9', puntos: 3 },
  { id: 'h_hb_12_11_9', label: '12.0-12.9', puntos: 1 },
  { id: 'h_hb_gt_12_9', label: '> 12.9', puntos: 0 },
];

const HB_MUJER_OPCIONES: Opcion[] = [
  { id: 'm_hb_lt_10', label: '< 10.0', puntos: 6 },
  { id: 'm_hb_10_11_9', label: '10.0-11.9', puntos: 1 },
  { id: 'm_hb_gt_11_9', label: '> 11.9', puntos: 0 },
];

const OTRAS_VARIABLES: Opcion[] = [
  { id: 'fc_100', label: 'Frecuencia cardíaca > 100 lpm', puntos: 1 },
  { id: 'melenas', label: 'Melenas', puntos: 1 },
  { id: 'sincope', label: 'Síncope', puntos: 2 },
  { id: 'hepatopatia', label: 'Hepatopatía', puntos: 2 },
  { id: 'ic', label: 'Insuficiencia cardíaca', puntos: 2 },
];

function normalizeInput(raw: string): number | null {
  const clean = raw.replace(',', '.').replace(/\s+/g, '').trim();
  if (!clean) return null;
  const n = Number(clean);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function toUreaMgDl(valor: number, unidad: UnidadId, magnitud: Magnitud): number {
  let ureaMgDl = valor;

  if (magnitud === 'bun') {
    ureaMgDl = valor * 2.1428;
  }

  if (unidad === 'mgdl') return ureaMgDl;
  if (unidad === 'mmoll') return ureaMgDl * 6.01;
  if (unidad === 'gl') return ureaMgDl * 100;
  return ureaMgDl / 10;
}

function fromUreaMgDl(ureaMgDl: number, unidad: UnidadId, magnitud: Magnitud): number {
  let valueInUnit = ureaMgDl;

  if (unidad === 'mgdl') valueInUnit = ureaMgDl;
  else if (unidad === 'mmoll') valueInUnit = ureaMgDl / 6.01;
  else if (unidad === 'gl') valueInUnit = ureaMgDl / 100;
  else valueInUnit = ureaMgDl * 10;

  if (magnitud === 'bun') {
    return valueInUnit / 2.1428;
  }
  return valueInUnit;
}

function getBunOptionFromMmol(valueMmol: number): Opcion {
  if (valueMmol < 6.5) return BUN_OPCIONES[0];
  if (valueMmol < 8) return BUN_OPCIONES[1];
  if (valueMmol < 10) return BUN_OPCIONES[2];
  if (valueMmol < 25) return BUN_OPCIONES[3];
  return BUN_OPCIONES[4];
}

function getInterpretacion(total: number) {
  if (total <= 1) {
    return {
      color: 'verde',
      texto: 'Bajo riesgo (GBS 0-1): posible manejo ambulatorio si situación clínica estable y con seguimiento.',
    };
  }
  if (total <= 5) {
    return {
      color: 'amarillo',
      texto: 'Riesgo intermedio: valorar ingreso, monitorización y endoscopia precoz según evolución.',
    };
  }
  if (total <= 11) {
    return {
      color: 'naranja',
      texto: 'Riesgo alto: recomendado ingreso hospitalario y evaluación endoscópica prioritaria.',
    };
  }
  return {
    color: 'rojo',
    texto: 'Riesgo muy alto: probable necesidad de intervención urgente y manejo intensivo.',
  };
}

function getColorClassByPoints(puntos: number) {
  if (puntos <= 0) return 'activo-verde';
  if (puntos <= 1) return 'activo-amarillo';
  if (puntos <= 3) return 'activo-naranja';
  return 'activo-rojo';
}

export default function BlatchfordPage() {
  const [openPopup, setOpenPopup] = useState<PopupId>(null);
  const [pas, setPas] = useState<Opcion | null>(null);
  const [bun, setBun] = useState<Opcion | null>(null);
  const [sexo, setSexo] = useState<'hombre' | 'mujer' | null>(null);
  const [hbHombre, setHbHombre] = useState<Opcion | null>(null);
  const [hbMujer, setHbMujer] = useState<Opcion | null>(null);
  const [otras, setOtras] = useState<Record<string, boolean>>({});
  const [bunValor, setBunValor] = useState('');
  const [ureaValor, setUreaValor] = useState('');
  const [ureaUnidad, setUreaUnidad] = useState<UnidadId>('mgdl');
  const [bunUnidad, setBunUnidad] = useState<UnidadId>('mmoll');
  const [lastEditedBun, setLastEditedBun] = useState<Magnitud>('urea');

  const hb = sexo === 'hombre' ? hbHombre : sexo === 'mujer' ? hbMujer : null;

  const puntosOtras = useMemo(
    () =>
      OTRAS_VARIABLES.reduce((total, item) => {
        if (otras[item.id]) return total + item.puntos;
        return total;
      }, 0),
    [otras]
  );

  const puedeCalcular = Boolean(pas && bun && sexo && hb);
  const total = puedeCalcular ? pas!.puntos + bun!.puntos + hb!.puntos + puntosOtras : null;
  const interpretacion = total !== null ? getInterpretacion(total) : null;

  const calculoBunPopup = useMemo(() => {
    if (lastEditedBun === 'urea') {
      const valor = normalizeInput(ureaValor);
      if (valor === null) {
        if (!ureaValor.trim()) {
          return {
            urea: '',
            bun: '',
            error: '',
            bunMmol: null as number | null,
          };
        }
        return {
          urea: ureaValor,
          bun: '',
          error: 'Introduce un valor numérico válido',
          bunMmol: null as number | null,
        };
      }
      const baseUrea = toUreaMgDl(valor, ureaUnidad, 'urea');
      const bunConvertido = fromUreaMgDl(baseUrea, bunUnidad, 'bun');
      const bunMmol = fromUreaMgDl(baseUrea, 'mmoll', 'bun');
      return { urea: ureaValor, bun: String(round2(bunConvertido)), error: '', bunMmol };
    }

    const valor = normalizeInput(bunValor);
    if (valor === null) {
      if (!bunValor.trim()) {
        return {
          urea: '',
          bun: '',
          error: '',
          bunMmol: null as number | null,
        };
      }
      return {
        urea: '',
        bun: bunValor,
        error: 'Introduce un valor numérico válido',
        bunMmol: null as number | null,
      };
    }

    const baseUrea = toUreaMgDl(valor, bunUnidad, 'bun');
    const ureaConvertida = fromUreaMgDl(baseUrea, ureaUnidad, 'urea');
    const bunMmol = fromUreaMgDl(baseUrea, 'mmoll', 'bun');
    return { urea: String(round2(ureaConvertida)), bun: bunValor, error: '', bunMmol };
  }, [bunUnidad, bunValor, lastEditedBun, ureaUnidad, ureaValor]);

  const textoInforme = useMemo(() => {
    const otrasSeleccionadas = OTRAS_VARIABLES.filter((item) => otras[item.id]).map(
      (item) => `- ${item.label} (+${item.puntos})`
    );

    if (!puedeCalcular || total === null || !pas || !bun || !sexo || !hb) return null;

    return `Glasgow-Blatchford Score (GBS)
- PAS: ${pas.label} mmHg (+${pas.puntos})
- BUN: ${bun.label} mmol/L (+${bun.puntos})
- Sexo: ${sexo === 'hombre' ? 'Hombre' : 'Mujer'}
- Hemoglobina: ${hb.label} g/dL (+${hb.puntos})
${otrasSeleccionadas.length ? otrasSeleccionadas.join('\n') : '- Otras variables: ninguna'}

Total GBS: ${total} puntos
${interpretacion.texto}`;
  }, [pas, bun, sexo, hb, otras, total, interpretacion, puedeCalcular]);

  const toggleOtra = (id: string) => {
    setOtras((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const reset = () => {
    setOpenPopup(null);
    setPas(null);
    setBun(null);
    setSexo(null);
    setHbHombre(null);
    setHbMujer(null);
    setOtras({});
    setBunValor('');
    setUreaValor('');
    setUreaUnidad('mgdl');
    setBunUnidad('mmoll');
    setLastEditedBun('urea');
  };

  const aplicarBunPopup = () => {
    if (calculoBunPopup.error || calculoBunPopup.bunMmol === null) return;
    setBun(getBunOptionFromMmol(calculoBunPopup.bunMmol));
    setOpenPopup(null);
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">Blatchford Score (Glasgow-Blatchford, GBS)</h1>
      <p className="text-sm text-slate-700 leading-relaxed">
        Escala para estratificar riesgo en hemorragia digestiva alta desde Urgencias sin requerir
        endoscopia inicial.
      </p>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          PRESIÓN ARTERIAL SISTÓLICA (mmhg)
        </h2>
        <div className="criterios" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          {PAS_OPCIONES.map((opt) => (
            <button
              key={opt.id}
              className={`criterio-btn ${pas?.id === opt.id ? getColorClassByPoints(opt.puntos) : ''}`}
              onClick={() => setPas(opt)}
            >
              <span>{opt.label}</span>
              <span className="puntos">+{opt.puntos}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          BUN (mmol/l)
        </h2>
        <div className="criterio-con-calculo" style={{ gridTemplateColumns: '44px minmax(0, 1fr)' }}>
          <button
            className="calc-mini-btn"
            onClick={() => setOpenPopup('bun')}
            title="Calcular BUN"
            aria-label="Calcular BUN"
          >
            <CalcIcon className="calc-mini-icon" />
          </button>
          <div className="criterios" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 0 }}>
            {BUN_OPCIONES.map((opt) => (
              <button
                key={opt.id}
              className={`criterio-btn ${bun?.id === opt.id ? getColorClassByPoints(opt.puntos) : ''}`}
              onClick={() => setBun(opt)}
            >
                <span>{opt.label}</span>
                <span className="puntos">+{opt.puntos}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          HEMOGLOBINA (g/dl)
        </h2>
        <div className="selector-botones">
          <button
            className={`selector-btn ${sexo === 'hombre' ? 'activo' : ''}`}
            onClick={() => setSexo('hombre')}
          >
            Hombre
          </button>
          <button
            className={`selector-btn ${sexo === 'mujer' ? 'activo' : ''}`}
            onClick={() => setSexo('mujer')}
          >
            Mujer
          </button>
        </div>
        <div className="criterios" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: 0 }}>
          {(sexo === 'hombre' ? HB_HOMBRE_OPCIONES : sexo === 'mujer' ? HB_MUJER_OPCIONES : []).map((opt) => (
            <button
              key={opt.id}
              className={`criterio-btn ${hb?.id === opt.id ? getColorClassByPoints(opt.puntos) : ''}`}
              onClick={() => (sexo === 'hombre' ? setHbHombre(opt) : setHbMujer(opt))}
            >
              <span>{opt.label}</span>
              <span className="puntos">+{opt.puntos}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Otras variables
        </h2>
        <div className="criterios" style={{ gridTemplateColumns: '1fr' }}>
          {OTRAS_VARIABLES.map((item) => (
            <button
              key={item.id}
              className={`criterio-btn ${otras[item.id] ? getColorClassByPoints(item.puntos) : ''}`}
              onClick={() => toggleOtra(item.id)}
            >
              <span>{item.label}</span>
              <span className="puntos">+{item.puntos}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={reset}>
            Reiniciar escala
          </button>
        </div>
        {puedeCalcular && interpretacion && total !== null ? (
          <div className={`resultado ${interpretacion.color}`}>
            <div className="puntos-total">Total: {total} puntos</div>
            <div className="interpretacion">{interpretacion.texto}</div>
          </div>
        ) : (
          <div className="resultado amarillo">
            <div className="interpretacion">
              Selecciona PAS, BUN, sexo y hemoglobina para calcular la escala.
            </div>
          </div>
        )}
      </div>

      {textoInforme && <InformeCopiable texto={textoInforme} />}

      <section className="mt-8 space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          Diseñada para orientar la actitud inicial en Urgencias ante hemorragia digestiva alta, sin
          precisar endoscopia al ingreso.
        </p>
        <div className="space-y-2">
          <p className="font-semibold">Referencias:</p>
          <p>
            Stanley AJ, Ashley D, Dalton HR, et al. Outpatient management of patients with low-risk
            upper gastrointestinal haemorrhage: multicentre validation and prospective evaluation.
            Lancet. 2009;373(9657):42-47.
          </p>
          <p>
            Atkinson RJ. Usefulness of prognostic indices in upper gastrointestinal bleeding. Best
            Pract Res Clin Gastroenterol. 2008;22(2):233-242.
          </p>
          <p>
            Stanley AJ. Update on risk scoring systems for patients with upper gastrointestinal
            haemorrhage. World J Gastroenterol. 2012;18(22):2739-2744.
          </p>
        </div>
      </section>

      {openPopup === 'bun' && (
        <div className="escala-modal-overlay" onClick={() => setOpenPopup(null)}>
          <div className="escala-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="escala-modal-header">
              <strong>Conversor Urea/BUN</strong>
              <button className="selector-btn" onClick={() => setOpenPopup(null)}>
                Cerrar
              </button>
            </div>

            <div className="space-y-3">
              <div className="inputs-grid">
                <div className="input-group">
                  <label>Urea</label>
                  <div className="input-row">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={lastEditedBun === 'urea' ? ureaValor : calculoBunPopup.urea}
                      onChange={(e) => {
                        setLastEditedBun('urea');
                        setUreaValor(e.target.value);
                      }}
                      placeholder="Urea"
                    />
                    <select
                      value={ureaUnidad}
                      onChange={(e) => setUreaUnidad(e.target.value as UnidadId)}
                    >
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
                      value={lastEditedBun === 'bun' ? bunValor : calculoBunPopup.bun}
                      onChange={(e) => {
                        setLastEditedBun('bun');
                        setBunValor(e.target.value);
                      }}
                      placeholder="BUN*"
                    />
                    <select
                      value={bunUnidad}
                      onChange={(e) => setBunUnidad(e.target.value as UnidadId)}
                    >
                      {UNIDADES.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {calculoBunPopup.error && (
                <div className="resultado amarillo">
                  <div className="interpretacion">{calculoBunPopup.error}</div>
                </div>
              )}

              {(calculoBunPopup.urea || calculoBunPopup.bun) && !calculoBunPopup.error && (
                <div className="resultado amarillo">
                  <div className="puntos-total">
                    BUN equivalente: {round2(calculoBunPopup.bunMmol ?? 0)} mmol/L
                  </div>
                  <div className="interpretacion">
                    Tramo GBS aplicado: {getBunOptionFromMmol(calculoBunPopup.bunMmol ?? 0).label}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500">*BUN: Blood Urea Nitrogen</div>
              <button className="reset-btn" onClick={aplicarBunPopup}>
                Aplicar BUN a Blatchford
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
