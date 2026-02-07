'use client';
// @ts-nocheck

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type Opcion = {
  label: string;
  puntos: number;
  texto: string;
};

type Sistema = {
  id: string;
  titulo: string;
  subtitulo?: string;
  opciones: Opcion[];
};

type Oxigeno = {
  id: string;
  label: string;
  valor: number;
};

type SafiCalculoOk = {
  spfi: number;
  paFi: number;
  sofa: number;
};

type SafiCalculoError = { error: string };

type GcsOpcion = {
  id: string;
  label: string;
  puntos: number;
};

type TamCalculo = { map: number } | { error: string } | null;

const OXIGENO: Oxigeno[] = [
  { id: '21', label: 'Sin O2', valor: 21 },
  { id: '24', label: 'GN 1 lpm', valor: 24 },
  { id: '28', label: 'GN 2 lpm', valor: 28 },
  { id: '32', label: 'GN 3 lpm', valor: 32 },
  { id: '36', label: 'GN 4 lpm', valor: 36 },
  { id: '40', label: 'GN 5 lpm', valor: 40 },
  { id: '30', label: 'VMK 30%', valor: 30 },
  { id: '35', label: 'VMK 35%', valor: 35 },
  { id: '40b', label: 'VMK 40%', valor: 40 },
  { id: '50', label: 'VMK reservorio', valor: 50 },
];

const GCS_OCULAR: GcsOpcion[] = [
  { id: 'o4', label: 'Espontanea', puntos: 4 },
  { id: 'o3', label: 'Apertura a la orden', puntos: 3 },
  { id: 'o2', label: 'Apertura al dolor', puntos: 2 },
  { id: 'o1', label: 'Sin respuesta', puntos: 1 },
];

const GCS_VERBAL: GcsOpcion[] = [
  { id: 'v5', label: 'Orientada', puntos: 5 },
  { id: 'v4', label: 'Confusa', puntos: 4 },
  { id: 'v3', label: 'Inapropiada', puntos: 3 },
  { id: 'v2', label: 'Incomprensible', puntos: 2 },
  { id: 'v1', label: 'Sin respuesta', puntos: 1 },
];

const GCS_MOTORA: GcsOpcion[] = [
  { id: 'm6', label: 'Obedece ordenes', puntos: 6 },
  { id: 'm5', label: 'Localiza estimulo doloroso', puntos: 5 },
  { id: 'm4', label: 'Retirada al dolor', puntos: 4 },
  { id: 'm3', label: 'Flexion (decorticacion)', puntos: 3 },
  { id: 'm2', label: 'Extension (descerebracion)', puntos: 2 },
  { id: 'm1', label: 'Sin respuesta', puntos: 1 },
];

function calcularPaFiEquivalente(spo2: number, fio2: number) {
  const SpO2 = spo2 / 100;
  const FiO2 = fio2 / 100;

  const A = Math.pow(28.6025, 3);
  const B = 1 / SpO2;
  const C = B - 0.99;
  const D = A / C;
  const PAO2 = Math.pow(D, 1 / 3);
  const E = Math.round(PAO2 / FiO2);

  const B1 = Math.pow(SpO2, -1);
  const C1 = B1 - 1;
  const D1 = Math.pow(C1, -1);
  const RA = 11700 * D1;

  const E1 = Math.pow(50, 3) + Math.pow(RA, 2);
  const RB = Math.pow(E1, 0.5);
  const RBA = RB + RA;
  const RBA2 = RB - RA;
  const F1 = Math.pow(RBA, 1 / 3);
  const F2 = Math.pow(RBA2, 1 / 3);
  const F3 = F1 - F2;
  const F4 = Math.round(F3 / FiO2);

  return { paFi: F4, paFiAlt: E };
}

function getSofaRespiratorio(pafi: number) {
  if (pafi < 100) return 4;
  if (pafi >= 100 && pafi < 200) return 3;
  if (pafi >= 200 && pafi < 300) return 2;
  if (pafi >= 300 && pafi < 400) return 1;
  return 0;
}

function getSofaNeurologico(gcs: number) {
  if (gcs < 6) return 4;
  if (gcs >= 6 && gcs <= 9) return 3;
  if (gcs >= 10 && gcs <= 12) return 2;
  if (gcs >= 13 && gcs <= 14) return 1;
  return 0;
}

const SISTEMAS: Sistema[] = [
  {
    id: 'respiratorio',
    titulo: 'Respiratorio',
    subtitulo: 'PaFi (PaO2/FiO2)',
    opciones: [
      { label: 'PaFi >= 400 (+/- VM)', puntos: 0, texto: 'PaFi >= 400 (+/- VM)' },
      { label: 'PaFi < 400 (+/- VM)', puntos: 1, texto: 'PaFi < 400 (+/- VM)' },
      { label: 'PaFi < 300 (+/- VM)', puntos: 2, texto: 'PaFi < 300 (+/- VM)' },
      { label: 'PaFi < 200 con VM', puntos: 3, texto: 'PaFi < 200 con VM' },
      { label: 'PaFi < 100 con VM', puntos: 4, texto: 'PaFi < 100 con VM' },
    ],
  },
  {
    id: 'coagulacion',
    titulo: 'Coagulación',
    subtitulo: 'Plaquetas (10^3/uL)',
    opciones: [
      { label: 'Plaquetas > 150', puntos: 0, texto: 'Plaquetas > 150' },
      { label: 'Plaquetas 100-150', puntos: 1, texto: 'Plaquetas 100-150' },
      { label: 'Plaquetas 50-99', puntos: 2, texto: 'Plaquetas 50-99' },
      { label: 'Plaquetas 20-49', puntos: 3, texto: 'Plaquetas 20-49' },
      { label: 'Plaquetas < 20', puntos: 4, texto: 'Plaquetas < 20' },
    ],
  },
  {
    id: 'cardiovascular',
    titulo: 'Cardiovascular',
    subtitulo: 'PAM y fármacos vasoactivos',
    opciones: [
      { label: 'PAM >= 70 mmHg', puntos: 0, texto: 'PAM >= 70 mmHg' },
      { label: 'PAM < 70 mmHg', puntos: 1, texto: 'PAM < 70 mmHg' },
      {
        label: 'Dopamina < 5 o dobutamina (cualquier dosis)',
        puntos: 2,
        texto: 'Dopamina < 5 o dobutamina',
      },
      {
        label: 'Dopamina > 5 o adrenalina/noradrenalina < 0,1',
        puntos: 3,
        texto: 'Dopamina > 5 o Ad/Norad < 0,1',
      },
      {
        label: 'Dopamina > 15 o adrenalina/noradrenalina > 0,1',
        puntos: 4,
        texto: 'Dopamina > 15 o Ad/Norad > 0,1',
      },
    ],
  },
  {
    id: 'neurologico',
    titulo: 'Neurológico',
    subtitulo: 'Glasgow (GCS)',
    opciones: [
      { label: 'GCS 15', puntos: 0, texto: 'GCS 15' },
      { label: 'GCS 13-14', puntos: 1, texto: 'GCS 13-14' },
      { label: 'GCS 10-12', puntos: 2, texto: 'GCS 10-12' },
      { label: 'GCS 6-9', puntos: 3, texto: 'GCS 6-9' },
      { label: 'GCS < 6', puntos: 4, texto: 'GCS < 6' },
    ],
  },
  {
    id: 'hepatico',
    titulo: 'Hepático',
    subtitulo: 'Bilirrubina (mg/dL)',
    opciones: [
      { label: 'Bilirrubina < 1,2', puntos: 0, texto: 'Bilirrubina < 1,2' },
      { label: 'Bilirrubina 1,2-1,9', puntos: 1, texto: 'Bilirrubina 1,2-1,9' },
      { label: 'Bilirrubina 2,0-5,9', puntos: 2, texto: 'Bilirrubina 2,0-5,9' },
      { label: 'Bilirrubina 6,0-11,9', puntos: 3, texto: 'Bilirrubina 6,0-11,9' },
      { label: 'Bilirrubina > 12', puntos: 4, texto: 'Bilirrubina > 12' },
    ],
  },
  {
    id: 'renal',
    titulo: 'Renal',
    subtitulo: 'Creatinina (mg/dL) y diuresis',
    opciones: [
      { label: 'Creatinina < 1,2', puntos: 0, texto: 'Creatinina < 1,2' },
      { label: 'Creatinina 1,2-1,9', puntos: 1, texto: 'Creatinina 1,2-1,9' },
      { label: 'Creatinina 2,0-3,4', puntos: 2, texto: 'Creatinina 2,0-3,4' },
      {
        label: 'Creatinina 3,5-4,9 o diuresis < 500 mL/día',
        puntos: 3,
        texto: 'Creatinina 3,5-4,9 o diuresis < 500 mL/día',
      },
      {
        label: 'Creatinina > 5,0 o diuresis < 200 mL/día',
        puntos: 4,
        texto: 'Creatinina > 5,0 o diuresis < 200 mL/día',
      },
    ],
  },
];

export default function Sofa() {
  const [seleccion, setSeleccion] = useState<Record<string, number | null>>({});
  const [pafiOpen, setPafiOpen] = useState(false);
  const [pafiPo2, setPafiPo2] = useState('');
  const [pafiFio2, setPafiFio2] = useState('');
  const [pafiVm, setPafiVm] = useState(false);
  const [pafiOxigeno, setPafiOxigeno] = useState<Oxigeno>(OXIGENO[0]);
  const [safiOpen, setSafiOpen] = useState(false);
  const [safiSpo2, setSafiSpo2] = useState('');
  const [safiFio2, setSafiFio2] = useState('');
  const [safiOxigeno, setSafiOxigeno] = useState<Oxigeno>(OXIGENO[0]);
  const [gcsOpen, setGcsOpen] = useState(false);
  const [gcsOcular, setGcsOcular] = useState<GcsOpcion>(GCS_OCULAR[0]);
  const [gcsVerbal, setGcsVerbal] = useState<GcsOpcion>(GCS_VERBAL[0]);
  const [gcsMotora, setGcsMotora] = useState<GcsOpcion>(GCS_MOTORA[0]);
  const [tamOpen, setTamOpen] = useState(false);
  const [tamTas, setTamTas] = useState('');
  const [tamTad, setTamTad] = useState('');

  const total = useMemo(() => {
    return SISTEMAS.reduce((acc, s) => {
      const idx = seleccion[s.id];
      if (idx === undefined || idx === null) return acc;
      return acc + s.opciones[idx].puntos;
    }, 0);
  }, [seleccion]);

  const faltan = useMemo(() => {
    return SISTEMAS.filter((s) => seleccion[s.id] === undefined || seleccion[s.id] === null).map(
      (s) => s.titulo,
    );
  }, [seleccion]);

  const textoInforme = useMemo(() => {
    const alguna = Object.values(seleccion).some((v) => v !== undefined && v !== null);
    if (!alguna) return null;

    const detalles = SISTEMAS.map((s) => {
      const idx = seleccion[s.id];
      if (idx === undefined || idx === null) return `- ${s.titulo}: sin seleccionar`;
      const opt = s.opciones[idx];
      return `- ${s.titulo}: ${opt.texto} (${opt.puntos} puntos)`;
    }).join('\n');

    const faltanTxt = faltan.length ? `\nSistemas sin seleccionar: ${faltan.join(', ')}` : '';

    return `SOFA (Sepsis-related Organ Failure Assessment)\n${detalles}\n\nSOFA total: ${total} puntos${faltanTxt}`;
  }, [seleccion, total, faltan]);

  const setOpcion = (sistemaId: string, index: number) => {
    setSeleccion((prev) => ({ ...prev, [sistemaId]: index }));
  };

  const reset = () => setSeleccion({});

  const pafiCalculo = useMemo(() => {
    const pO2 = parseFloat(pafiPo2);
    const fO2 = parseFloat(pafiFio2);
    if (!pO2 || !fO2) return null;
    if (pO2 < 10 || fO2 < 21 || fO2 > 100) {
      return { error: 'Revisa valores de pO2 y/o FiO2 (21%-100%)' };
    }
    const ratio = Math.round((pO2 / fO2) * 100);
    return { ratio };
  }, [pafiPo2, pafiFio2]);

  const safiCalculo = useMemo<SafiCalculoOk | SafiCalculoError | null>(() => {
    const SpO2 = parseFloat(safiSpo2);
    const FiO2 = parseFloat(safiFio2);
    if (!SpO2 || !FiO2) return null;
    if (FiO2 < 21 || FiO2 > 100) {
      return { error: 'Revisa valores de FiO2 (entre 21 y 100%)' };
    }
    if (SpO2 < 85 || SpO2 > 99) {
      return { error: 'Pulsioximetria: valores entre 85 y 99%' };
    }
    const spfi = Math.round((SpO2 / FiO2) * 100);
    const { paFi } = calcularPaFiEquivalente(SpO2, FiO2);
    const sofa = getSofaRespiratorio(paFi);
    return { spfi, paFi, sofa };
  }, [safiSpo2, safiFio2]);

  const aplicarPafi = () => {
    if (!pafiCalculo || 'error' in pafiCalculo) return;
    const ratio = pafiCalculo.ratio;
    let idx = 0;
    if (pafiVm && ratio < 100) idx = 4;
    else if (pafiVm && ratio < 200) idx = 3;
    else if (ratio < 300) idx = 2;
    else if (ratio < 400) idx = 1;
    else idx = 0;
    setOpcion('respiratorio', idx);
    setPafiOpen(false);
  };

  const aplicarSafi = () => {
    if (!safiCalculo || 'error' in safiCalculo) return;
    setOpcion('respiratorio', safiCalculo.sofa);
    setSafiOpen(false);
  };

  const gcsTotal = useMemo(() => {
    return (gcsOcular?.puntos || 0) + (gcsVerbal?.puntos || 0) + (gcsMotora?.puntos || 0);
  }, [gcsOcular, gcsVerbal, gcsMotora]);

  const tamCalculo = useMemo<TamCalculo>(() => {
    const sp = parseFloat(tamTas);
    const dp = parseFloat(tamTad);
    if (!sp || !dp) return null;
    if (dp >= sp) return { error: '¿La diastolica mayor que la sistolica? Revisa los valores.' };
    const map = Math.round(dp - -((sp - dp) / 3));
    return { map };
  }, [tamTas, tamTad]);

  const aplicarGcs = () => {
    const sofa = getSofaNeurologico(gcsTotal);
    setOpcion('neurologico', sofa);
    setGcsOpen(false);
  };

  const aplicarTam = () => {
    if (!tamCalculo || 'error' in tamCalculo) return;
    const idx = tamCalculo.map < 70 ? 1 : 0;
    setOpcion('cardiovascular', idx);
    setTamOpen(false);
  };

  const resetPafi = () => {
    setPafiPo2('');
    setPafiFio2('');
    setPafiVm(false);
    setPafiOxigeno(OXIGENO[0]);
  };

  const resetSafi = () => {
    setSafiSpo2('');
    setSafiFio2('');
    setSafiOxigeno(OXIGENO[0]);
  };

  const resetGcs = () => {
    setGcsOcular(GCS_OCULAR[0]);
    setGcsVerbal(GCS_VERBAL[0]);
    setGcsMotora(GCS_MOTORA[0]);
  };

  const resetTam = () => {
    setTamTas('');
    setTamTad('');
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">
        SOFA (Sepsis-related Organ Failure Assessment)
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {[SISTEMAS.slice(0, 3), SISTEMAS.slice(3)].map((col, colIdx) => (
          <div key={`col-${colIdx}`} className="space-y-6">
            {col.map((s) => (
              <section key={s.id} className="space-y-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{s.titulo}</h2>
                  {s.subtitulo && (
                    <div className="text-sm text-slate-600">
                      <span>{s.subtitulo}</span>
                      {s.id === 'respiratorio' && (
                        <>
                          <button
                            type="button"
                            className="ml-2 underline underline-offset-2 text-slate-700"
                            onClick={() => setPafiOpen(true)}
                          >
                            Calcular PaFi
                          </button>
                          <span className="mx-1 text-slate-400">·</span>
                          <button
                            type="button"
                            className="underline underline-offset-2 text-slate-700"
                            onClick={() => setSafiOpen(true)}
                          >
                            Calcular SaFi
                          </button>
                        </>
                      )}
                      {s.id === 'neurologico' && (
                        <button
                          type="button"
                          className="ml-2 underline underline-offset-2 text-slate-700"
                          onClick={() => setGcsOpen(true)}
                        >
                          Calcular Glasgow
                        </button>
                      )}
                      {s.id === 'cardiovascular' && (
                        <button
                          type="button"
                          className="ml-2 underline underline-offset-2 text-slate-700"
                          onClick={() => setTamOpen(true)}
                        >
                          Calcular PAM (TAM)
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="criterios criterios-1col-mobile">
                  {s.opciones.map((o, idx) => {
                    const colorClass =
                      o.puntos === 0
                        ? 'activo-verde'
                        : o.puntos === 1
                          ? 'activo-amarillo'
                          : o.puntos === 2
                            ? 'activo-naranja'
                            : 'activo-rojo';
                    return (
                      <button
                        key={`${s.id}-${idx}`}
                        className={`criterio-btn ${seleccion[s.id] === idx ? colorClass : ''}`}
                        onClick={() => setOpcion(s.id, idx)}
                      >
                        <span>{o.label}</span>
                        <span className="puntos">{o.puntos}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ))}
      </div>

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={reset}>
            Reiniciar escala
          </button>
        </div>

        <div className={`resultado ${total <= 1 ? 'verde' : 'rojo'}`}>
          <div className="puntos-total">{total} puntos</div>
          {faltan.length > 0 && (
            <div className="interpretacion">
              Falta seleccionar: {faltan.join(', ')}
            </div>
          )}
        </div>
      </div>

      {textoInforme && faltan.length === 0 && <InformeCopiable texto={textoInforme} />}

      {pafiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">PaFi (PaO2/FiO2)</h3>
                <p className="text-sm text-slate-600">
                  Calcula el ratio y asigna automáticamente la puntuación respiratoria.
                </p>
              </div>
              <button type="button" className="reset-btn" onClick={() => setPafiOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="inputs-grid">
              <div className="input-group">
                <label>pO2</label>
                <div className="input-con-unidad">
                  <input
                    type="number"
                    min="0"
                    value={pafiPo2}
                    onChange={(e) => setPafiPo2(e.target.value)}
                  />
                  <span className="input-unidad">mmHg</span>
                </div>
              </div>

              <div className="input-group">
                <label>FiO2</label>
                <div className="input-con-unidad">
                  <input
                    type="number"
                    min="21"
                    max="100"
                    value={pafiFio2}
                    onChange={(e) => setPafiFio2(e.target.value)}
                  />
                  <span className="input-unidad">%</span>
                </div>
              </div>

              <div className="input-group input-group-full">
                <label>Oxígeno suplementario</label>
                <div className="selector-botones selector-botones-oxigeno">
                  {OXIGENO.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={`selector-btn ${pafiOxigeno.id === o.id ? 'activo' : ''}`}
                      onClick={() => {
                        setPafiOxigeno(o);
                        setPafiFio2(String(o.valor));
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pafiVm}
                onChange={(e) => setPafiVm(e.target.checked)}
              />
              Paciente con ventilación mecánica
            </label>

            {pafiCalculo && 'error' in pafiCalculo && (
              <div className="resultado rojo">
                <div className="puntos-total">{pafiCalculo.error}</div>
              </div>
            )}

            {pafiCalculo && !('error' in pafiCalculo) && (
              <div className="resultado azul">
                <div className="puntos-total">{pafiCalculo.ratio} mmHg</div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button className="reset-btn" onClick={resetPafi}>
                Borrar datos
              </button>
              <button
                className="reset-btn"
                onClick={aplicarPafi}
                disabled={!pafiCalculo || 'error' in pafiCalculo}
              >
                Aplicar a SOFA respiratorio
              </button>
            </div>
          </div>
        </div>
      )}

      {safiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">SaFi (SpO2/FiO2)</h3>
                <p className="text-sm text-slate-600">
                  Calcula la equivalencia PaFi y asigna la puntuacion SOFA respiratoria.
                </p>
              </div>
              <button type="button" className="reset-btn" onClick={() => setSafiOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="inputs-grid">
              <div className="input-group">
                <label>SpO2</label>
                <div className="input-con-unidad">
                  <input
                    type="number"
                    min="0"
                    value={safiSpo2}
                    onChange={(e) => setSafiSpo2(e.target.value)}
                  />
                  <span className="input-unidad">%</span>
                </div>
              </div>

              <div className="input-group">
                <label>FiO2</label>
                <div className="input-con-unidad">
                  <input
                    type="number"
                    min="21"
                    max="100"
                    value={safiFio2}
                    onChange={(e) => setSafiFio2(e.target.value)}
                  />
                  <span className="input-unidad">%</span>
                </div>
              </div>

              <div className="input-group input-group-full">
                <label>Oxigeno suplementario</label>
                <div className="selector-botones selector-botones-oxigeno">
                  {OXIGENO.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={`selector-btn ${safiOxigeno.id === o.id ? 'activo' : ''}`}
                      onClick={() => {
                        setSafiOxigeno(o);
                        setSafiFio2(String(o.valor));
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {safiCalculo && 'error' in safiCalculo && (
              <div className="resultado rojo">
                <div className="puntos-total">{safiCalculo.error}</div>
              </div>
            )}

            {safiCalculo && !('error' in safiCalculo) && (
              <div className="resultado azul">
                <div className="puntos-total">PaFi {safiCalculo.paFi} mmHg</div>
                <div className="interpretacion">
                  SpFi {safiCalculo.spfi} mmHg · SOFA {safiCalculo.sofa}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button className="reset-btn" onClick={resetSafi}>
                Borrar datos
              </button>
              <button
                className="reset-btn"
                onClick={aplicarSafi}
                disabled={!safiCalculo || 'error' in safiCalculo}
              >
                Aplicar a SOFA respiratorio
              </button>
            </div>
          </div>
        </div>
      )}

      {gcsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Glasgow Coma Scale</h3>
                <p className="text-sm text-slate-600">
                  Calcula GCS y asigna la puntuacion SOFA neurologica.
                </p>
              </div>
              <button type="button" className="reset-btn" onClick={() => setGcsOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="input-group">
              <label>Respuesta ocular ({gcsOcular.puntos})</label>
              <div className="selector-botones selector-botones-grid">
                {GCS_OCULAR.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`selector-btn ${gcsOcular.id === opt.id ? 'activo' : ''}`}
                    onClick={() => setGcsOcular(opt)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Respuesta verbal ({gcsVerbal.puntos})</label>
              <div className="selector-botones selector-botones-grid">
                {GCS_VERBAL.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`selector-btn ${gcsVerbal.id === opt.id ? 'activo' : ''}`}
                    onClick={() => setGcsVerbal(opt)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Respuesta motora ({gcsMotora.puntos})</label>
              <div className="selector-botones selector-botones-grid">
                {GCS_MOTORA.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`selector-btn ${gcsMotora.id === opt.id ? 'activo' : ''}`}
                    onClick={() => setGcsMotora(opt)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="resultado azul">
              <div className="puntos-total">{gcsTotal} puntos</div>
              <div className="interpretacion">SOFA neurologico {getSofaNeurologico(gcsTotal)}</div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="reset-btn" onClick={resetGcs}>
                Reiniciar
              </button>
              <button className="reset-btn" onClick={aplicarGcs}>
                Aplicar a SOFA neurologico
              </button>
            </div>
          </div>
        </div>
      )}

      {tamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">PAM (TAM)</h3>
                <p className="text-sm text-slate-600">
                  Calcula la presion arterial media para asignar SOFA cardiovascular.
                </p>
              </div>
              <button type="button" className="reset-btn" onClick={() => setTamOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="inputs-grid">
              <div className="input-group">
                <label>TAS</label>
                <div className="input-con-unidad">
                  <input
                    type="number"
                    min="0"
                    value={tamTas}
                    onChange={(e) => setTamTas(e.target.value)}
                  />
                  <span className="input-unidad">mmHg</span>
                </div>
              </div>

              <div className="input-group">
                <label>TAD</label>
                <div className="input-con-unidad">
                  <input
                    type="number"
                    min="0"
                    value={tamTad}
                    onChange={(e) => setTamTad(e.target.value)}
                  />
                  <span className="input-unidad">mmHg</span>
                </div>
              </div>
            </div>

            {tamCalculo && 'error' in tamCalculo && (
              <div className="resultado rojo">
                <div className="puntos-total">{tamCalculo.error}</div>
              </div>
            )}

            {tamCalculo && !('error' in tamCalculo) && (
              <div className="resultado azul">
                <div className="puntos-total">PAM {tamCalculo.map} mmHg</div>
                <div className="interpretacion">
                  SOFA cardiovascular {tamCalculo.map < 70 ? 1 : 0}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button className="reset-btn" onClick={resetTam}>
                Borrar datos
              </button>
              <button
                className="reset-btn"
                onClick={aplicarTam}
                disabled={!tamCalculo || 'error' in tamCalculo}
              >
                Aplicar a SOFA cardiovascular
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mt-6 space-y-3 text-sm text-slate-700 leading-relaxed">
        <p>
          La puntuación SOFA evalúa seis sistemas orgánicos de forma diaria. Cada sistema aporta de
          0 a 4 puntos; la suma total ayuda a estimar disfunción orgánica en pacientes con infección
          o sepsis.
        </p>
        <p>
          En la puntuación cardiovascular, las dosis de dopamina, adrenalina y noradrenalina se
          expresan en mcg/kg/min.
        </p>
      </section>
    </main>
  );
}
