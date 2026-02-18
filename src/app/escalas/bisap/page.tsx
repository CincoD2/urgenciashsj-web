'use client';

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';
import CalcIcon from '@/components/CalcIcon';

type PopupId = 'sirs' | 'bun' | 'glasgow' | null;
type UnidadId = 'mgdl' | 'mmoll' | 'gl' | 'mgl';
type Magnitud = 'urea' | 'bun';
type Opcion = {
  id: string;
  label: string;
  puntos: number;
};

const UNIDADES: Array<{ id: UnidadId; label: string }> = [
  { id: 'mgdl', label: 'mg/dL' },
  { id: 'mmoll', label: 'mmol/L' },
  { id: 'gl', label: 'g/L' },
  { id: 'mgl', label: 'mg/L' },
];

const GCS_OCULAR: Opcion[] = [
  { id: 'o4', label: 'Espontánea', puntos: 4 },
  { id: 'o3', label: 'Apertura a la orden', puntos: 3 },
  { id: 'o2', label: 'Apertura al dolor', puntos: 2 },
  { id: 'o1', label: 'Sin respuesta', puntos: 1 },
];

const GCS_VERBAL: Opcion[] = [
  { id: 'v5', label: 'Orientada', puntos: 5 },
  { id: 'v4', label: 'Confusa', puntos: 4 },
  { id: 'v3', label: 'Inapropiada', puntos: 3 },
  { id: 'v2', label: 'Incomprensible', puntos: 2 },
  { id: 'v1', label: 'Sin respuesta', puntos: 1 },
];

const GCS_MOTORA: Opcion[] = [
  { id: 'm6', label: 'Obedece órdenes', puntos: 6 },
  { id: 'm5', label: 'Localiza estímulo doloroso', puntos: 5 },
  { id: 'm4', label: 'Retirada al dolor', puntos: 4 },
  { id: 'm3', label: 'Flexión (decorticación)', puntos: 3 },
  { id: 'm2', label: 'Extensión (descerebración)', puntos: 2 },
  { id: 'm1', label: 'Sin respuesta', puntos: 1 },
];

const SIRS_CRITERIOS = [
  {
    id: 'temperatura',
    label: 'Temperatura <= 35 o >= 38.5 ºC',
    texto: 'Temperatura <=35 o >=38.5 ºC',
  },
  { id: 'fc', label: 'Frecuencia cardíaca > 90 lpm', texto: 'Frecuencia cardíaca >90 lpm' },
  {
    id: 'fr_paco2',
    label: 'Frecuencia respiratoria > 20 rpm o PaCO2 < 32 mmHg',
    texto: 'Frecuencia respiratoria >20 rpm o PaCO2 <32 mmHg',
  },
  {
    id: 'leucocitos',
    label: 'Leucocitos > 12.000/mm3 o < 4.000/mm3 o > 10% cayados',
    texto: 'Leucocitos >12.000/mm3 o <4.000/mm3 o >10% cayados',
  },
];

function getInterpretacionSirs(puntuacion: number) {
  if (puntuacion === 0) {
    return {
      texto: 'Sin criterios SIRS.',
      color: 'verde',
    };
  }
  if (puntuacion === 1) {
    return {
      texto: 'SIRS con 1 criterio.',
      color: 'amarillo',
    };
  }
  if (puntuacion === 2) {
    return {
      texto: 'SIRS con 2 criterios.',
      color: 'naranja',
    };
  }
  if (puntuacion > 2) {
    return {
      texto:
        'Más de 2 criterios SIRS: se recomienda ingreso en UCI, independiente del resto de parámetros valorados en BISAP.',
      color: 'rojo',
    };
  }
  return { texto: '', color: 'amarillo' };
}

function getInterpretacionGlasgow(total: number) {
  if (total === 15) return { texto: 'Sin lesión cerebral', color: 'verde' };
  if (total < 8) return { texto: 'Lesión cerebral severa. Considerar IOT.', color: 'rojo' };
  if (total < 13) return { texto: 'Lesión cerebral moderada', color: 'naranja' };
  return { texto: 'Lesión cerebral leve', color: 'amarillo' };
}

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

export default function BisapPage() {
  const [openPopup, setOpenPopup] = useState<PopupId>(null);

  const [bunPositivo, setBunPositivo] = useState(false);
  const [concienciaAlterada, setConcienciaAlterada] = useState(false);
  const [sirsPositivo, setSirsPositivo] = useState(false);
  const [edadPositiva, setEdadPositiva] = useState(false);
  const [derramePleural, setDerramePleural] = useState(false);

  const [bunValor, setBunValor] = useState('');
  const [ureaValor, setUreaValor] = useState('');
  const [ureaUnidad, setUreaUnidad] = useState<UnidadId>('mgdl');
  const [bunUnidad, setBunUnidad] = useState<UnidadId>('mgdl');
  const [lastEditedBun, setLastEditedBun] = useState<Magnitud>('urea');

  const [sirsSeleccion, setSirsSeleccion] = useState<Record<string, boolean>>({});

  const [glasgowO, setGlasgowO] = useState<Opcion>(GCS_OCULAR[0]);
  const [glasgowV, setGlasgowV] = useState<Opcion>(GCS_VERBAL[0]);
  const [glasgowM, setGlasgowM] = useState<Opcion>(GCS_MOTORA[0]);

  const sirsPuntos = useMemo(
    () => Object.values(sirsSeleccion).filter(Boolean).length,
    [sirsSeleccion]
  );
  const interpretacionSirs = useMemo(() => getInterpretacionSirs(sirsPuntos), [sirsPuntos]);

  const glasgowTotal = useMemo(
    () => (glasgowO?.puntos || 0) + (glasgowV?.puntos || 0) + (glasgowM?.puntos || 0),
    [glasgowO, glasgowV, glasgowM]
  );
  const interpretacionGlasgow = useMemo(
    () => getInterpretacionGlasgow(glasgowTotal),
    [glasgowTotal]
  );

  const puntos = useMemo(() => {
    let total = 0;
    if (edadPositiva) total += 1;
    if (bunPositivo) total += 1;
    if (derramePleural) total += 1;
    if (sirsPositivo) total += 1;
    if (concienciaAlterada) total += 1;
    return total;
  }, [edadPositiva, bunPositivo, derramePleural, sirsPositivo, concienciaAlterada]);

  const haySeleccion =
    bunPositivo || concienciaAlterada || sirsPositivo || edadPositiva || derramePleural;

  const mortalidad = useMemo(() => {
    if (puntos === 0) return '0.1%';
    if (puntos === 1) return '0.4%';
    if (puntos === 2) return '1.6%';
    if (puntos === 3) return '3.6%';
    if (puntos === 4) return '7.4%';
    return '9.5%';
  }, [puntos]);

  const clasificacion = useMemo(() => {
    if (puntos === 0) {
      return {
        texto: 'Pancreatitis Aguda leve, bajo riesgo. Ningún criterio BISAP.',
        color: 'verde',
      };
    }
    if (puntos <= 2) {
      return { texto: 'Pancreatitis Aguda leve, bajo riesgo.', color: 'amarillo' };
    }
    return {
      texto: 'Pancreatitis Aguda grave, alto riesgo. Considerar ingreso en UCI.',
      color: 'rojo',
    };
  }, [puntos]);

  const calculoBunPopup = useMemo(() => {
    if (lastEditedBun === 'urea') {
      const valor = normalizeInput(ureaValor);
      if (valor === null) {
        if (!ureaValor.trim())
          return { urea: '', bun: '', error: '', bunMgdl: null as number | null };
        return {
          urea: ureaValor,
          bun: '',
          error: 'Introduce un valor numérico válido',
          bunMgdl: null as number | null,
        };
      }
      const baseUrea = toUreaMgDl(valor, ureaUnidad, 'urea');
      const bun = fromUreaMgDl(baseUrea, bunUnidad, 'bun');
      const bunMgdl = fromUreaMgDl(baseUrea, 'mgdl', 'bun');
      return { urea: ureaValor, bun: String(round2(bun)), error: '', bunMgdl };
    }

    const valor = normalizeInput(bunValor);
    if (valor === null) {
      if (!bunValor.trim()) return { urea: '', bun: '', error: '', bunMgdl: null as number | null };
      return {
        urea: '',
        bun: bunValor,
        error: 'Introduce un valor numérico válido',
        bunMgdl: null as number | null,
      };
    }
    const baseUrea = toUreaMgDl(valor, bunUnidad, 'bun');
    const urea = fromUreaMgDl(baseUrea, ureaUnidad, 'urea');
    const bunMgdl = fromUreaMgDl(baseUrea, 'mgdl', 'bun');
    return { urea: String(round2(urea)), bun: bunValor, error: '', bunMgdl };
  }, [bunUnidad, bunValor, lastEditedBun, ureaUnidad, ureaValor]);

  const textoInforme = useMemo(() => {
    return `BISAP (Pancreatitis aguda, primeras 24 h)
- BUN >25 mg/dL: ${bunPositivo ? 'Sí' : 'No'}
- Alteración de conciencia: ${concienciaAlterada ? 'Sí' : 'No'}
- SIRS >=2 criterios: ${sirsPositivo ? 'Sí' : 'No'}
- Edad >60 años: ${edadPositiva ? 'Sí' : 'No'}
- Derrame pleural: ${derramePleural ? 'Sí' : 'No'}

Total BISAP: ${puntos}
Mortalidad estimada: ${mortalidad}
${clasificacion.texto}`;
  }, [
    bunPositivo,
    concienciaAlterada,
    sirsPositivo,
    edadPositiva,
    derramePleural,
    puntos,
    mortalidad,
    clasificacion,
  ]);

  const aplicarBunPopup = () => {
    if (calculoBunPopup.bunMgdl === null || calculoBunPopup.error) return;
    setBunPositivo(calculoBunPopup.bunMgdl > 25);
    setOpenPopup(null);
  };

  const aplicarSirsPopup = () => {
    setSirsPositivo(sirsPuntos >= 2);
    setOpenPopup(null);
  };

  const aplicarGlasgowPopup = () => {
    setConcienciaAlterada(glasgowTotal < 15);
    setOpenPopup(null);
  };

  const reset = () => {
    setBunPositivo(false);
    setConcienciaAlterada(false);
    setSirsPositivo(false);
    setEdadPositiva(false);
    setDerramePleural(false);
    setBunValor('');
    setUreaValor('');
    setUreaUnidad('mgdl');
    setBunUnidad('mgdl');
    setLastEditedBun('urea');
    setSirsSeleccion({});
    setGlasgowO(GCS_OCULAR[0]);
    setGlasgowV(GCS_VERBAL[0]);
    setGlasgowM(GCS_MOTORA[0]);
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">BISAP Score (Pancreatitis Aguda)</h1>
      <p className="text-sm text-slate-700">
        Estratifica gravedad en Pancreatitis Aguda durante las primeras 24 horas de ingreso.
      </p>

      <div className="criterios" style={{ gridTemplateColumns: '1fr' }}>
        <div className="criterio-con-calculo">
          <button
            className="calc-mini-btn"
            onClick={() => setOpenPopup('bun')}
            title="Calcular BUN"
            aria-label="Calcular BUN"
          >
            <CalcIcon className="calc-mini-icon" />
          </button>
          <button
            className={`criterio-btn ${bunPositivo ? 'activo-rojo' : ''}`}
            onClick={() => setBunPositivo((v) => !v)}
          >
            <span>BUN {'>'} 25 mg/dL</span>
            <span className="puntos">+1</span>
          </button>
        </div>

        <div className="criterio-con-calculo">
          <button
            className="calc-mini-btn"
            onClick={() => setOpenPopup('glasgow')}
            title="Calcular Glasgow"
            aria-label="Calcular Glasgow"
          >
            <CalcIcon className="calc-mini-icon" />
          </button>
          <button
            className={`criterio-btn ${concienciaAlterada ? 'activo-rojo' : ''}`}
            onClick={() => setConcienciaAlterada((v) => !v)}
          >
            <span>Alteración de la conciencia</span>
            <span className="puntos">+1</span>
          </button>
        </div>

        <div className="criterio-con-calculo">
          <button
            className="calc-mini-btn"
            onClick={() => setOpenPopup('sirs')}
            title="Calcular SIRS"
            aria-label="Calcular SIRS"
          >
            <CalcIcon className="calc-mini-icon" />
          </button>
          <button
            className={`criterio-btn ${sirsPositivo ? 'activo-rojo' : ''}`}
            onClick={() => setSirsPositivo((v) => !v)}
          >
            <span>SIRS ({'≥'} 2 criterios)</span>
            <span className="puntos">+1</span>
          </button>
        </div>

        <button
          className={`criterio-btn ${edadPositiva ? 'activo-rojo' : ''}`}
          onClick={() => setEdadPositiva((v) => !v)}
        >
          <span>Edad {'>'} 60 años</span>
          <span className="puntos">+1</span>
        </button>

        <button
          className={`criterio-btn ${derramePleural ? 'activo-rojo' : ''}`}
          onClick={() => setDerramePleural((v) => !v)}
        >
          <span>Derrame pleural</span>
          <span className="puntos">+1</span>
        </button>
      </div>

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={reset}>
            Reiniciar escala
          </button>
        </div>
        <div className={`resultado ${clasificacion.color}`}>
          <div className="puntos-total">Total: {puntos} puntos</div>
          <div className="interpretacion">
            Mortalidad: {mortalidad}. {clasificacion.texto}
          </div>
        </div>
      </div>

      {haySeleccion && <InformeCopiable texto={textoInforme} />}

      <section className="mt-8 space-y-4 text-sm text-slate-700 leading-relaxed">
        <div className="space-y-2">
          <p className="font-semibold">Referencias:</p>
          <p>
            Wu BU, Johannes RS, Sun X, et alThe early prediction of mortality in acute pancreatitis:
            a large population-based studyGut 2008;57:1698-1703.
          </p>
        </div>
      </section>

      {openPopup && (
        <div className="escala-modal-overlay" onClick={() => setOpenPopup(null)}>
          <div className="escala-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="escala-modal-header">
              <strong>
                {openPopup === 'sirs'
                  ? 'Escala SIRS'
                  : openPopup === 'bun'
                    ? 'Conversor Urea/BUN'
                    : 'Escala Glasgow'}
              </strong>
              <button className="selector-btn" onClick={() => setOpenPopup(null)}>
                Cerrar
              </button>
            </div>

            {openPopup === 'sirs' && (
              <div className="space-y-3">
                <div className="criterios" style={{ gridTemplateColumns: '1fr', marginBottom: 0 }}>
                  {SIRS_CRITERIOS.map((c) => (
                    <button
                      key={c.id}
                      className={`criterio-btn ${sirsSeleccion[c.id] ? 'activo-rojo' : ''}`}
                      onClick={() => setSirsSeleccion((p) => ({ ...p, [c.id]: !p[c.id] }))}
                    >
                      <span>{c.label}</span>
                      <span className="puntos">+1</span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 12 }} className={`resultado ${interpretacionSirs.color}`}>
                  <div className="puntos-total">{sirsPuntos} criterios</div>
                  <div className="interpretacion">{interpretacionSirs.texto}</div>
                </div>
                <div className={`resultado ${sirsPuntos >= 2 ? 'rojo' : 'amarillo'}`}>
                  <div className="interpretacion">
                    {sirsPuntos >= 2
                      ? 'SIRS positivo para BISAP (+1)'
                      : 'SIRS no positivo para BISAP'}
                  </div>
                </div>
                <button className="reset-btn" onClick={() => setSirsSeleccion({})}>
                  Reiniciar escala SIRS
                </button>
                <button className="reset-btn" onClick={aplicarSirsPopup}>
                  Aplicar SIRS a BISAP
                </button>
              </div>
            )}

            {openPopup === 'bun' && (
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
                  <div
                    className={`resultado ${(calculoBunPopup.bunMgdl ?? 0) > 25 ? 'rojo' : 'amarillo'}`}
                  >
                    <div className="puntos-total">
                      BUN equivalente: {round2(calculoBunPopup.bunMgdl ?? 0)} mg/dL
                    </div>
                    <div className="interpretacion">
                      {(calculoBunPopup.bunMgdl ?? 0) > 25
                        ? 'Cumple criterio BISAP (+1)'
                        : 'No cumple criterio BISAP'}
                    </div>
                  </div>
                )}
                <div className="text-xs text-slate-500">*BUN: Blood Urea Nitrogen</div>
                <button className="reset-btn" onClick={aplicarBunPopup}>
                  Aplicar BUN a BISAP
                </button>
              </div>
            )}

            {openPopup === 'glasgow' && (
              <div className="space-y-3">
                <div className="input-group">
                  <label>Respuesta ocular ({glasgowO.puntos})</label>
                  <div className="selector-botones selector-botones-grid">
                    {GCS_OCULAR.map((opt) => (
                      <button
                        key={opt.id}
                        className={`selector-btn ${glasgowO.id === opt.id ? 'activo' : ''}`}
                        onClick={() => setGlasgowO(opt)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Respuesta verbal ({glasgowV.puntos})</label>
                  <div className="selector-botones selector-botones-grid">
                    {GCS_VERBAL.map((opt) => (
                      <button
                        key={opt.id}
                        className={`selector-btn ${glasgowV.id === opt.id ? 'activo' : ''}`}
                        onClick={() => setGlasgowV(opt)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Respuesta motora ({glasgowM.puntos})</label>
                  <div className="selector-botones selector-botones-grid">
                    {GCS_MOTORA.map((opt) => (
                      <button
                        key={opt.id}
                        className={`selector-btn ${glasgowM.id === opt.id ? 'activo' : ''}`}
                        onClick={() => setGlasgowM(opt)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`resultado ${glasgowTotal < 15 ? 'rojo' : 'verde'}`}>
                  <div className="puntos-total">Glasgow: {glasgowTotal}</div>
                  <div className="interpretacion">{interpretacionGlasgow.texto}</div>
                </div>
                <div className={`resultado ${glasgowTotal < 15 ? 'rojo' : 'verde'}`}>
                  <div className="interpretacion">
                    {glasgowTotal < 15
                      ? 'Alteración de conciencia para BISAP (+1)'
                      : 'Sin alteración de conciencia para BISAP'}
                  </div>
                </div>
                <button
                  className="reset-btn"
                  onClick={() => {
                    setGlasgowO(GCS_OCULAR[0]);
                    setGlasgowV(GCS_VERBAL[0]);
                    setGlasgowM(GCS_MOTORA[0]);
                  }}
                >
                  Reiniciar escala Glasgow
                </button>
                <button className="reset-btn" onClick={aplicarGlasgowPopup}>
                  Aplicar Glasgow a BISAP
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
