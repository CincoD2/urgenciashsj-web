'use client';

import Image from 'next/image';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type Criterio = {
  id: string;
  label: string;
  texto: string;
};

const HIPOVOLEMIA_CRITERIOS: Criterio[] = [
  {
    id: 'creat_urea_basal',
    label: 'Creatinina basal >1.1 mg/dL o urea >43 mg/dL',
    texto: 'Creatinina basal >1.1 mg/dL o urea >43 mg/dL',
  },
  { id: 'hematocrito', label: 'Hematocrito >44%', texto: 'Hematocrito >44%' },
  {
    id: 'aumento_previo',
    label: 'Aumento de creatinina y/o urea previas',
    texto: 'Aumento de creatinina y/o urea previas',
  },
  { id: 'diuresis', label: 'Diuresis <0.75 mL/kg/h', texto: 'Diuresis <0.75 mL/kg/h' },
  {
    id: 'tas',
    label: 'TAS <90 mmHg sin otra etiología',
    texto: 'TAS <90 mmHg sin otra etiología',
  },
  {
    id: 'deshidratacion',
    label: 'Signos/síntomas de deshidratación',
    texto: 'Signos/síntomas de deshidratación',
  },
];

function normalizeInput(raw: string): number | null {
  const clean = raw.replace(',', '.').replace(/\s+/g, '').trim();
  if (!clean) return null;
  const n = Number(clean);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function roundTo5NearestTieDown(value: number) {
  const lower = Math.floor(value / 5) * 5;
  const upper = lower + 5;
  const diffLower = value - lower;
  const diffUpper = upper - value;
  if (Math.abs(diffLower - diffUpper) < 1e-9) return lower;
  return diffLower < diffUpper ? lower : upper;
}

export default function WaterfallPage() {
  const [pesoInicial, setPesoInicial] = useState('70');
  const [hipovolemiaInicialSel, setHipovolemiaInicialSel] = useState<Record<string, boolean>>({});

  const [dolorMenor5Sucesiva, setDolorMenor5Sucesiva] = useState(false);
  const [aptoOralSucesiva, setAptoOralSucesiva] = useState(false);
  const [horaValoracionSucesiva, setHoraValoracionSucesiva] = useState<
    '12h' | '24h' | '48h' | '72h'
  >('12h');

  const [hipovolemiaSucesivaSel, setHipovolemiaSucesivaSel] = useState<Record<string, boolean>>({});
  const [sobrecargaImagen, setSobrecargaImagen] = useState(false);
  const [sobrecargaSintomas, setSobrecargaSintomas] = useState(false);
  const [sobrecargaSignos, setSobrecargaSignos] = useState(false);

  const pesoInicialNum = normalizeInput(pesoInicial);
  const pesoActivoSucesiva = pesoInicialNum;

  const hipovolemiaInicial = useMemo(
    () => HIPOVOLEMIA_CRITERIOS.some((c) => hipovolemiaInicialSel[c.id]),
    [hipovolemiaInicialSel]
  );

  const boloInicialMl = pesoInicialNum ? round1(pesoInicialNum * 10) : null;
  const boloInicialMlH = pesoInicialNum ? round1((pesoInicialNum * 10) / 2) : null;
  const infusionInicialMlH = pesoInicialNum ? round1(pesoInicialNum * 1.5) : null;
  const infusionInicial12hMl = infusionInicialMlH ? round1(infusionInicialMlH * 12) : null;
  const aporteClKBoloInicial =
    hipovolemiaInicial && boloInicialMl !== null ? (boloInicialMl / 1000) * 4 : 0;
  const aporteClKRlInicial12h =
    infusionInicial12hMl !== null ? (infusionInicial12hMl / 1000) * 4 : null;
  const objetivoClK12h = 20;
  const aporteTotalRlInicial12hRaw =
    aporteClKRlInicial12h !== null ? aporteClKRlInicial12h + aporteClKBoloInicial : null;
  const clKComplementarioInicial12hRaw =
    aporteTotalRlInicial12hRaw !== null
      ? round1(Math.max(0, objetivoClK12h - aporteTotalRlInicial12hRaw))
      : null;
  const clKComplementarioInicial12h =
    clKComplementarioInicial12hRaw !== null
      ? roundTo5NearestTieDown(clKComplementarioInicial12hRaw)
      : null;
  const aporteClKExactoTexto =
    aporteTotalRlInicial12hRaw !== null
      ? aporteTotalRlInicial12hRaw.toFixed(2).replace('.', ',')
      : '-';

  const pautaInicial = useMemo(() => {
    if (!pesoInicialNum) {
      return { color: 'amarillo', texto: 'Introduce peso para calcular la pauta inicial.' };
    }
    if (hipovolemiaInicial) {
      return {
        color: 'rojo',
        texto: `Bolo inicial: ${boloInicialMl ?? '-'} mL de RL en 2 h a ${boloInicialMlH ?? '-'} mL/h (sin ClK). Perfusión: ${infusionInicial12hMl ?? '-'} mL de RL a ${infusionInicialMlH ?? '-'} mL/h (12 h) + ${clKComplementarioInicial12h ?? '-'} mEq de ClK en 12 h. Aporte de ClK por RL (bolo + perfusión): ${aporteClKExactoTexto} mEq.`,
      };
    }
    return {
      color: 'verde',
      texto: `Perfusión: ${infusionInicial12hMl ?? '-'} mL de RL a ${infusionInicialMlH ?? '-'} mL/h (12 h) + ${clKComplementarioInicial12h ?? '-'} mEq de ClK en 12 h. Aporte de ClK por RL (perfusión): ${aporteClKExactoTexto} mEq.`,
    };
  }, [
    aporteClKExactoTexto,
    boloInicialMl,
    boloInicialMlH,
    clKComplementarioInicial12h,
    hipovolemiaInicial,
    infusionInicial12hMl,
    infusionInicialMlH,
    pesoInicialNum,
  ]);

  const crit1 = sobrecargaImagen;
  const crit2 = sobrecargaSintomas;
  const crit3 = sobrecargaSignos;
  const criteriosSobrecarga = [crit1, crit2, crit3].filter(Boolean).length;

  const sobrecargaConfirmada = criteriosSobrecarga >= 2;
  const sobrecargaSospecha = criteriosSobrecarga >= 1;
  const hipovolemiaSucesiva = useMemo(
    () => HIPOVOLEMIA_CRITERIOS.some((c) => hipovolemiaSucesivaSel[c.id]),
    [hipovolemiaSucesivaSel]
  );
  const bloquearHipovolemia = sobrecargaSospecha;
  const bloquearSobrecarga = hipovolemiaSucesiva;

  const estadoSucesivo = useMemo(() => {
    if (sobrecargaConfirmada) return 'sobrecarga_confirmada';
    if (sobrecargaSospecha) return 'sobrecarga_sospecha';
    if (hipovolemiaSucesiva) return 'hipovolemia';
    return 'normovolemia';
  }, [hipovolemiaSucesiva, sobrecargaConfirmada, sobrecargaSospecha]);

  const boloSucesivoMl = pesoActivoSucesiva ? round1(pesoActivoSucesiva * 10) : null;
  const boloSucesivoMlH = pesoActivoSucesiva ? round1((pesoActivoSucesiva * 10) / 2) : null;
  const infusionSucesivaMlH = pesoActivoSucesiva ? round1(pesoActivoSucesiva * 1.5) : null;
  const infusionSucesiva12hMl = infusionSucesivaMlH ? round1(infusionSucesivaMlH * 12) : null;

  const toleranciaOral8h = dolorMenor5Sucesiva && aptoOralSucesiva;

  const pautaSucesiva = useMemo(() => {
    if (!pesoActivoSucesiva) {
      return {
        color: 'amarillo',
        texto: 'Introduce peso para calcular la pauta sucesiva.',
      };
    }
    if (estadoSucesivo === 'sobrecarga_confirmada') {
      return {
        color: 'rojo',
        texto:
          'Sobrecarga confirmada: disminuir o suspender fluidos intravenosos y tratar la sobrecarga.',
      };
    }
    if (estadoSucesivo === 'sobrecarga_sospecha') {
      return {
        color: 'naranja',
        texto:
          'Sospecha de sobrecarga: reducir ritmo de fluidos intravenosos y reevaluar clínica/hemodinámica.',
      };
    }
    if (estadoSucesivo === 'hipovolemia') {
      return {
        color: 'rojo',
        texto: `Hipovolemia en reevaluación: bolo RL (2 h) a ${boloSucesivoMlH} mL/h (total ${boloSucesivoMl} mL), repetible si TAS<90 o diuresis<0.5; luego perfusión RL (12 h) a ${infusionSucesivaMlH} mL/h (total ${infusionSucesiva12hMl} mL).`,
      };
    }
    if (toleranciaOral8h) {
      return {
        color: 'verde',
        texto: `Normovolemia: mantener perfusión RL a 1,5 mL/kg/h (${infusionSucesivaMlH} mL/h). Tras tolerancia oral durante 8 h, suspender fluidos intravenosos.`,
      };
    }
    return {
      color: 'verde',
      texto: `Normovolemia: mantener perfusión RL a 1,5 mL/kg/h (${infusionSucesivaMlH} mL/h), valorar tolerancia oral durante 8 h y, si tolera, suspender fluidos intravenosos.`,
    };
  }, [
    boloSucesivoMl,
    boloSucesivoMlH,
    estadoSucesivo,
    infusionSucesiva12hMl,
    infusionSucesivaMlH,
    pesoActivoSucesiva,
    toleranciaOral8h,
  ]);

  const informeInicial = useMemo(() => {
    if (!pesoInicial.trim() && !hipovolemiaInicial) return null;
    const criteriosHipovolemia = HIPOVOLEMIA_CRITERIOS.filter(
      (c) => hipovolemiaInicialSel[c.id]
    ).map((c) => c.texto);
    const lineaBolo = hipovolemiaInicial
      ? `- Bolo inicial: ${boloInicialMl ?? '-'} mL de RL en 2 h a ${boloInicialMlH ?? '-'} mL/h (sin ClK).\n`
      : '';

    return `Waterfall - Valoración inicial en Urgencias

Peso: ${pesoInicialNum ?? '-'} kg
${criteriosHipovolemia.length ? `Criterio/s de hipovolemia: ${criteriosHipovolemia.join('; ')}.` : 'Sin criterios de hipovolemia.'}

Pauta inicial:
${lineaBolo}- Perfusión de ${infusionInicial12hMl ?? '-'} mL de Ringer Lactato a ${infusionInicialMlH ?? '-'} mL/h (a pasar en 12 horas) + ${clKComplementarioInicial12h ?? '-'} mEq de ClK en 12 horas.
- Aporte de ClK por RL ${hipovolemiaInicial ? '(bolo + perfusión)' : '(perfusión)'}: ${aporteClKExactoTexto} mEq.

Control clínico y analítico a las 12h`;
  }, [
    aporteClKExactoTexto,
    boloInicialMl,
    boloInicialMlH,
    clKComplementarioInicial12h,
    hipovolemiaInicial,
    hipovolemiaInicialSel,
    infusionInicial12hMl,
    infusionInicialMlH,
    pesoInicial,
    pesoInicialNum,
  ]);

  const informeSucesivo = useMemo(() => {
    const criteriosHipovolemiaSeleccionados = HIPOVOLEMIA_CRITERIOS.filter(
      (c) => hipovolemiaSucesivaSel[c.id]
    );
    const primerCriterioHipovolemia = criteriosHipovolemiaSeleccionados[0]?.texto;

    const criteriosSobrecargaSeleccionados: string[] = [];
    if (crit1) criteriosSobrecargaSeleccionados.push('Criterios de imagen de IC');
    if (crit2) criteriosSobrecargaSeleccionados.push('Síntomas de IC (Disnea)');
    if (crit3) criteriosSobrecargaSeleccionados.push('Signos de IC');
    const primerCriterioSobrecarga = criteriosSobrecargaSeleccionados[0];

    let resumenCriterios = 'Sin criterios de hipovolemia/sobrecarga de fluidos.';
    if (hipovolemiaSucesiva && primerCriterioHipovolemia) {
      resumenCriterios = `Criterio de hipovolemia: ${primerCriterioHipovolemia}.`;
    } else if (sobrecargaConfirmada) {
      resumenCriterios = `Criterio de sobrecarga de fluidos: ${primerCriterioSobrecarga}.`;
    } else if (sobrecargaSospecha) {
      resumenCriterios = `Sospecha de sobrecarga de fluidos: ${primerCriterioSobrecarga}.`;
    }

    let proximaReevaluacion =
      'Reevaluación clínico-analítica individualizada según estado clínico.';
    if (horaValoracionSucesiva === '12h')
      proximaReevaluacion = 'Se recomienda la siguiente reevaluación clínico-analítica a las 12h.';
    else if (horaValoracionSucesiva === '24h')
      proximaReevaluacion = 'Se recomienda la siguiente reevaluación clínico-analítica a las 24h.';
    else if (horaValoracionSucesiva === '48h')
      proximaReevaluacion = 'Se recomienda la siguiente reevaluación clínico-analítica a las 24h.';

    const recomendacionDieta =
      dolorMenor5Sucesiva && aptoOralSucesiva
        ? 'Valorar iniciar tolerancia oral.'
        : 'Se recomienda mantener dieta absoluta.';

    return `Waterfall - Valoración sucesiva a las ${horaValoracionSucesiva} de Pancreatitis Aguda

Peso: ${pesoActivoSucesiva ?? '-'} Kg
${dolorMenor5Sucesiva ? 'Dolor EVA <5' : 'Dolor EVA >=5'} y ${
      aptoOralSucesiva ? 'apto para vía oral' : 'no apto para vía oral'
    }.

${resumenCriterios}

Pauta:
${pautaSucesiva.texto}
- ${recomendacionDieta}
- ${proximaReevaluacion}
- Individualizar siempre según estado clínico y requerimientos concretos de cada paciente.`;
  }, [
    aptoOralSucesiva,
    crit1,
    crit2,
    crit3,
    dolorMenor5Sucesiva,
    horaValoracionSucesiva,
    hipovolemiaSucesiva,
    hipovolemiaSucesivaSel,
    pesoActivoSucesiva,
    pautaSucesiva.texto,
    sobrecargaConfirmada,
    sobrecargaSospecha,
  ]);

  const toggle = (id: string, setter: Dispatch<SetStateAction<Record<string, boolean>>>) => {
    setter((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const reset = () => {
    setPesoInicial('70');
    setHipovolemiaInicialSel({});
    setDolorMenor5Sucesiva(false);
    setAptoOralSucesiva(false);
    setHoraValoracionSucesiva('12h');
    setHipovolemiaSucesivaSel({});
    setSobrecargaImagen(false);
    setSobrecargaSintomas(false);
    setSobrecargaSignos(false);
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold text-[#2b5d68]">
        Waterfall - Fluidoterapia en Pancreatitis Aguda
      </h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Valoración inicial
        </h2>
        <div className="inputs-grid">
          <div className="input-group">
            <label>Peso inicial (kg)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={pesoInicial}
              onChange={(e) => setPesoInicial(e.target.value)}
              placeholder="Ej: 70"
            />
          </div>
        </div>
        <p className="text-sm text-slate-700">
          Selecciona criterios de hipovolemia al ingreso (&gt;=1 criterio = hipovolemia).
        </p>
        <div className="criterios">
          {HIPOVOLEMIA_CRITERIOS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`criterio-btn ${hipovolemiaInicialSel[c.id] ? 'activo-rojo' : ''}`}
              onClick={() => toggle(c.id, setHipovolemiaInicialSel)}
            >
              <span>{c.label}</span>
              <span className="puntos">{hipovolemiaInicialSel[c.id] ? 'Sí' : 'No'}</span>
            </button>
          ))}
        </div>
        <div className={`resultado ${pautaInicial.color}`}>
          <div className="puntos-total">Pauta inicial</div>
          <div className="interpretacion">{pautaInicial.texto}</div>
        </div>
        {informeInicial && <InformeCopiable texto={informeInicial} />}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Valoración sucesiva
        </h2>
        <div className="input-group">
          <label>Hora de valoración</label>
          <select
            value={horaValoracionSucesiva}
            onChange={(e) =>
              setHoraValoracionSucesiva(e.target.value as '12h' | '24h' | '48h' | '72h')
            }
          >
            <option value="12h">12h</option>
            <option value="24h">24h</option>
            <option value="48h">48h</option>
            <option value="72h">72h</option>
          </select>
        </div>
        <div className="criterios waterfall-dolor-tolerancia">
          <button
            type="button"
            className={`criterio-btn ${dolorMenor5Sucesiva ? 'activo-verde' : ''}`}
            onClick={() => setDolorMenor5Sucesiva((v) => !v)}
          >
            <span>Dolor EVA &lt; 5</span>
            <span className="puntos">{dolorMenor5Sucesiva ? 'Sí' : 'No'}</span>
          </button>
          <button
            type="button"
            className={`criterio-btn ${aptoOralSucesiva ? 'activo-verde' : ''}`}
            onClick={() => setAptoOralSucesiva((v) => !v)}
          >
            <span>Tolerancia oral en reevaluación</span>
            <span className="puntos">{aptoOralSucesiva ? 'Sí' : 'No'}</span>
          </button>
        </div>

        <h3 className="text-sm font-semibold text-[#2b5d68]">Hipovolemia en reevaluación</h3>
        <div className="criterios">
          {HIPOVOLEMIA_CRITERIOS.map((c) => (
            <button
              key={`s-${c.id}`}
              type="button"
              className={`criterio-btn ${hipovolemiaSucesivaSel[c.id] ? 'activo-rojo' : ''} ${
                bloquearHipovolemia ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => toggle(c.id, setHipovolemiaSucesivaSel)}
              disabled={bloquearHipovolemia}
            >
              <span>{c.label}</span>
              <span className="puntos">{hipovolemiaSucesivaSel[c.id] ? 'Sí' : 'No'}</span>
            </button>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-[#2b5d68]">Sobrecarga de fluidos</h3>
        <div className="criterios waterfall-sobrecarga">
          <button
            type="button"
            className={`criterio-btn ${sobrecargaImagen ? 'activo-naranja' : ''} ${
              bloquearSobrecarga ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => setSobrecargaImagen((v) => !v)}
            disabled={bloquearSobrecarga}
          >
            <span>
              <strong>Criterios de imagen de IC</strong>
              <br />
              Ecocardio y/o
              <br />
              RX y/o
              <br />
              Cateterismo
            </span>
            <span className="puntos">{sobrecargaImagen ? 'Sí' : 'No'}</span>
          </button>
          <button
            type="button"
            className={`criterio-btn ${sobrecargaSintomas ? 'activo-naranja' : ''} ${
              bloquearSobrecarga ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => setSobrecargaSintomas((v) => !v)}
            disabled={bloquearSobrecarga}
          >
            <span>
              <strong>Síntomas de IC</strong>
              <br />
              Disnea
            </span>
            <span className="puntos">{sobrecargaSintomas ? 'Sí' : 'No'}</span>
          </button>
          <button
            type="button"
            className={`criterio-btn ${sobrecargaSignos ? 'activo-naranja' : ''} ${
              bloquearSobrecarga ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => setSobrecargaSignos((v) => !v)}
            disabled={bloquearSobrecarga}
          >
            <span>
              <strong>Signos de IC</strong>
              <br />
              Edemas y/o
              <br />
              Crepitantes y/o
              <br />
              Ingurgitación Yugular
            </span>
            <span className="puntos">{sobrecargaSignos ? 'Sí' : 'No'}</span>
          </button>
        </div>

        <div className={`resultado ${pautaSucesiva.color}`}>
          <div className="puntos-total">Pauta sucesiva</div>
          <div className="interpretacion">{pautaSucesiva.texto}</div>
        </div>
        {informeSucesivo && <InformeCopiable texto={informeSucesivo} />}
      </section>

      <div className="acciones-escala">
        <button className="reset-btn" onClick={reset}>
          Reiniciar escala
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Referencia</h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          de-Madaria, E., Buxbaum, J. L., Maisonneuve, P., García García de Paredes, A., Zapater,
          P., Guilabert, L., Vaillo-Rocamora, A., Rodríguez-Gandía, M. Á., Donate-Ortega, J.,
          Lozada-Hernández, E. E., Collazo Moreno, A. J. R., Lira-Aguilar, A., Llovet, L. P., Mehta,
          R., Tandel, R., Navarro, P., Sánchez-Pardo, A. M., Sánchez-Marin, C., Cobreros, M., ...
          Bolado, F. (2022). Aggressive or Moderate Fluid Resuscitation in Acute Pancreatitis. New
          England Journal of Medicine, 387(11), 989-1000.{' '}
          <a
            href="https://doi.org/10.1056/NEJMoa2202884"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#2b5d68] underline"
          >
            https://doi.org/10.1056/NEJMoa2202884
          </a>
        </p>
        <div className="rounded-xl border border-[#dfe9eb] bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Algoritmo de referencia
          </div>
          <Image
            src="/img/waterfall-reference.jpg"
            alt="Algoritmo de fluidoterapia en pancreatitis aguda (base WATERFALL)"
            className="mt-2 w-full rounded-lg border border-[#dfe9eb]"
            width={1200}
            height={760}
            unoptimized
          />
        </div>
      </section>
    </main>
  );
}
