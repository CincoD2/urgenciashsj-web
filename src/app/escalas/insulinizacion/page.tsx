'use client';
// @ts-nocheck

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';
import PdfDownloadButton from '@/components/PdfDownloadButton';

type SituacionPrandial = 'ayunas' | 'ingesta';

type DiagnosticoId =
  | 'dm1_inicio'
  | 'dm1_conocida'
  | 'dm2_solo_dieta_o_1_oral_glu_lt_150'
  | 'dm2_dieta_o_1_oral_glu_ge_150'
  | 'dm2_2_orales_o_insulina_previa'
  | 'hiper_no_conocida_glu_lt_150'
  | 'hiper_no_conocida_glu_ge_150';

const DIAGNOSTICOS: Array<{ id: DiagnosticoId; label: string }> = [
  { id: 'dm1_inicio', label: 'DM-1 de inicio' },
  { id: 'dm1_conocida', label: 'DM-1 conocida' },
  {
    id: 'dm2_solo_dieta_o_1_oral_glu_lt_150',
    label: 'DM-2 con solo dieta previa o 1 fármaco oral y glucemia al ingreso <150',
  },
  {
    id: 'dm2_dieta_o_1_oral_glu_ge_150',
    label: 'DM-2 con dieta previa o 1 fármaco oral y glucemia al ingreso ≥150',
  },
  {
    id: 'dm2_2_orales_o_insulina_previa',
    label: 'DM-2 con 2 o más fármacos orales, o insulina previa',
  },
  {
    id: 'hiper_no_conocida_glu_lt_150',
    label: 'Hiperglucemia no conocida y glucemia al ingreso <150',
  },
  {
    id: 'hiper_no_conocida_glu_ge_150',
    label: 'Hiperglucemia no conocida y glucemia al ingreso ≥150',
  },
];

const SITUACIONES: Array<{ id: SituacionPrandial; label: string }> = [
  { id: 'ayunas', label: 'Ayunas' },
  { id: 'ingesta', label: 'Ingesta' },
];

const DIAGNOSTICOS_DM1 = DIAGNOSTICOS.filter((d) => d.id.startsWith('dm1_'));
const DIAGNOSTICOS_DM2 = DIAGNOSTICOS.filter((d) => d.id.startsWith('dm2_'));
const DIAGNOSTICOS_HIPER = DIAGNOSTICOS.filter((d) => d.id.startsWith('hiper_'));

function parsePesoEntero(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function getPautaInicial(diagnostico: DiagnosticoId, situacion: SituacionPrandial): string {
  if (diagnostico === 'dm1_inicio') {
    return situacion === 'ayunas'
      ? 'Basal + Corrección (c/ 6h)'
      : 'Basal + Prandial + Corrección (De, Co, Ce, 24:00)';
  }

  if (diagnostico === 'dm1_conocida') {
    return situacion === 'ayunas'
      ? 'Basal + Corrección (c/ 6h)'
      : 'Basal + Prandial + Corrección (De, Co, Ce ± 24:00)';
  }

  if (
    diagnostico === 'dm2_solo_dieta_o_1_oral_glu_lt_150' ||
    diagnostico === 'hiper_no_conocida_glu_lt_150'
  ) {
    return situacion === 'ayunas' ? 'Corrección (c/ 8h)' : 'Corrección (De, Co, Ce)';
  }

  return situacion === 'ayunas'
    ? 'Basal + Corrección (c/ 6-8h)'
    : 'Basal + Prandial + Corrección (De, Co, Ce ± 24:00)';
}

function getDosisBasal(peso: number): number {
  if (peso < 60) return 12;
  if (peso <= 65) return 14;
  if (peso <= 70) return 16;
  if (peso <= 75) return 18;
  if (peso <= 80) return 22;
  if (peso <= 85) return 26;
  if (peso <= 90) return 28;
  if (peso <= 95) return 30;
  if (peso <= 100) return 32;
  return 34;
}

function getDosisPrandialPorComida(peso: number): number {
  if (peso < 60) return 2;
  if (peso <= 70) return 3;
  if (peso <= 80) return 4;
  if (peso <= 90) return 5;
  return 6;
}

function getPautaCorreccionPorPeso(peso: number): 1 | 2 | 3 | 4 {
  if (peso <= 60) return 1;
  if (peso <= 90) return 2;
  if (peso <= 150) return 3;
  return 4;
}

function getPautaCorreccionTexto(pauta: 1 | 2 | 3 | 4, usaPrandial: boolean) {
  const dosisPorPauta = {
    1: { n71_80: -1, n151_200: 1, n201_250: 2, n251_300: 3, n301_350: 4, g350: 5 },
    2: { n71_80: -1, n151_200: 2, n201_250: 4, n251_300: 6, n301_350: 8, g350: 10 },
    3: { n71_80: -2, n151_200: 3, n201_250: 6, n251_300: 9, n301_350: 12, g350: 15 },
    4: { n71_80: -2, n151_200: 4, n201_250: 8, n251_300: 12, n301_350: 16, g350: 20 },
  }[pauta];

  const fmtConSigno = (n: number) => `${n > 0 ? '+' : ''}${n}`;
  const fmtSinSigno = (n: number) => `${Math.abs(n)}`;

  if (usaPrandial) {
    return [
      'Si Glucemia ≤70 mg/dL: Protocolo de Hipoglucemia',
      `Si Glucemia 71-80 mg/dL: ${fmtConSigno(dosisPorPauta.n71_80)} UI sobre la dosis de insulina prandial calculada`,
      'Si Glucemia < 150 mg/dL: 0 UI sobre la dosis de insulina prandial calculada',
      `Si Glucemia 151-200 mg/dL: ${fmtConSigno(dosisPorPauta.n151_200)} UI sobre la dosis de insulina prandial calculada`,
      `Si Glucemia 201-250 mg/dL: ${fmtConSigno(dosisPorPauta.n201_250)} UI sobre la dosis de insulina prandial calculada`,
      `Si Glucemia 251-300 mg/dL: ${fmtConSigno(dosisPorPauta.n251_300)} UI sobre la dosis de insulina prandial calculada`,
      `Si Glucemia 301-350 mg/dL: ${fmtConSigno(dosisPorPauta.n301_350)} UI sobre la dosis de insulina prandial calculada`,
      `Si Glucemia >350 mg/dL: ${fmtConSigno(dosisPorPauta.g350)} UI sobre la dosis de insulina prandial calculada`,
    ].join('\n');
  }

  return [
    'Si Glucemia ≤70 mg/dL: Protocolo de Hipoglucemia',
    'Si Glucemia 71-150 mg/dL: 0 UI IR sc (Aspart/Lispro)',
    `Si Glucemia 151-200 mg/dL: ${fmtSinSigno(dosisPorPauta.n151_200)} UI IR sc (Aspart/Lispro)`,
    `Si Glucemia 201-250 mg/dL: ${fmtSinSigno(dosisPorPauta.n201_250)} UI IR sc (Aspart/Lispro)`,
    `Si Glucemia 251-300 mg/dL: ${fmtSinSigno(dosisPorPauta.n251_300)} UI IR sc (Aspart/Lispro)`,
    `Si Glucemia 301-350 mg/dL: ${fmtSinSigno(dosisPorPauta.n301_350)} UI IR sc (Aspart/Lispro)`,
    `Si Glucemia >350 mg/dL: ${fmtSinSigno(dosisPorPauta.g350)} UI IR sc (Aspart/Lispro)`,
  ].join('\n');
}

function getPeriodicidadCorreccion(pautaInicial: string): string | null {
  const match = pautaInicial.match(/Corrección\s*\(([^)]+)\)/i);
  return match ? match[1] : null;
}

export default function InsulinizacionEscala() {
  const [diagnostico, setDiagnostico] = useState<DiagnosticoId | null>(null);
  const [situacionPrandial, setSituacionPrandial] = useState<SituacionPrandial | null>(null);
  const [peso, setPeso] = useState('70');

  const pesoNum = useMemo(() => parsePesoEntero(peso), [peso]);

  const calculo = useMemo(() => {
    if (!diagnostico || !situacionPrandial) {
      return {
        listo: false,
        color: 'amarillo',
        titulo: 'Faltan datos para calcular la pauta',
        detalle: 'Selecciona diagnóstico al ingreso y situación prandial.',
      };
    }

    if (!peso.trim()) {
      return {
        listo: false,
        color: 'amarillo',
        titulo: 'Falta peso para calcular la pauta',
        detalle: 'Introduce peso en Kg (entero, sin decimales).',
      };
    }

    if (pesoNum === null) {
      return {
        listo: false,
        color: 'rojo',
        titulo: 'Peso no válido',
        detalle: 'El peso debe ser un número entero positivo, sin decimales.',
      };
    }

    const pautaInicial = getPautaInicial(diagnostico, situacionPrandial);
    const dosisBasal = getDosisBasal(pesoNum);
    const dosisPrandial = getDosisPrandialPorComida(pesoNum);
    const pautaCorreccion = getPautaCorreccionPorPeso(pesoNum);

    const usaBasal = pautaInicial.includes('Basal');
    const usaPrandial = pautaInicial.includes('Prandial') && situacionPrandial === 'ingesta';
    const pautaCorreccionTexto = getPautaCorreccionTexto(pautaCorreccion, usaPrandial);
    const periodicidadCorreccion = getPeriodicidadCorreccion(pautaInicial);
    const requiereInterconsultaEndocrino = pautaCorreccion >= 3;

    return {
      listo: true,
      color: 'verde',
      pautaInicial,
      dosisBasal,
      dosisPrandial,
      pautaCorreccion,
      pautaCorreccionTexto,
      periodicidadCorreccion,
      requiereInterconsultaEndocrino,
      usaBasal,
      usaPrandial,
    };
  }, [diagnostico, peso, pesoNum, situacionPrandial]);

  const textoInforme = useMemo(() => {
    if (!calculo.listo || pesoNum === null) return null;

    const diagnosticoLabel = DIAGNOSTICOS.find((d) => d.id === diagnostico)?.label ?? diagnostico;
    const situacionLabel =
      SITUACIONES.find((s) => s.id === situacionPrandial)?.label ?? situacionPrandial;

    const lineasPauta: string[] = [];
    if (calculo.usaBasal) {
      lineasPauta.push(`- INSULINA BASAL (Glargina/Detemir/NPH): ${calculo.dosisBasal} UI diarias`);
    }
    if (calculo.usaPrandial) {
      lineasPauta.push(
        `- INSULINA PRANDIAL (Aspart/Lispro): ${calculo.dosisPrandial} UI de De,Co,Ce ± 24h`
      );
    }
    lineasPauta.push(
      `- PAUTA CORRECTORA ${calculo.pautaCorreccion}${
        calculo.periodicidadCorreccion ? ` (${calculo.periodicidadCorreccion})` : ''
      }${calculo.requiereInterconsultaEndocrino ? ' (Hoja de Interconsulta a Endocrino)' : ''}:`
    );
    lineasPauta.push(
      (calculo.pautaCorreccionTexto ?? '')
        .split('\n')
        .map((linea: string) => `  ${linea}`)
        .join('\n')
    );
    return `Insulinización al ingreso
- Diagnóstico al ingreso: ${diagnosticoLabel}
- Situación prandial: ${situacionLabel}
- Peso: ${pesoNum} kg

Pauta de Insulinización recomendada:

${lineasPauta.join('\n')}`;
  }, [calculo, diagnostico, pesoNum, situacionPrandial]);

  const reset = () => {
    setDiagnostico(null);
    setSituacionPrandial(null);
    setPeso('70');
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Insulinización al ingreso</h1>
        <PdfDownloadButton href="/pdfs/20260221 Insulinización para ingreso.pdf" />
      </div>
      <p className="text-sm text-slate-700">
        Calculadora basada en el{' '}
        <a href="/protocolos/insulinizacion">
          protocolo elaborado por el Servicio de Endocrinología y Nutrición del Hospital
          Universitario San Juan de Alicante para la insulinización al ingreso hospitalario de
          pacientes con Diabetes o hiperglucemia
        </a>
        . Establece pautas basal-prandial-corrección según tipo de diabetes, situación prandial y
        glucemia, e incluye algoritmo de corrección y manejo de hipoglucemia.
      </p>
      <div
        className="rounded-lg border p-4 text-sm"
        style={{
          borderColor: 'var(--muted-bg)',
          background: 'rgba(223, 233, 235, 0.3)',
          color: 'var(--foreground)',
        }}
      >
        La pauta de corrección (PAUTA 1-4) se asigna por peso. Si hay dosis total diaria conocida,
        prioriza la columna de dosis total del protocolo.
      </div>
      <div className="inputs-grid">
        <div className="input-group input-group-full">
          <label>Diagnóstico al ingreso</label>
          <div className="criterios" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 10 }}>
            {DIAGNOSTICOS_DM1.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`criterio-btn ${diagnostico === d.id ? 'activo-verde' : ''}`}
                onClick={() => setDiagnostico(d.id)}
              >
                <span>{d.label}</span>
              </button>
            ))}
          </div>
          <div
            className="criterios"
            style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 0 }}
          >
            {DIAGNOSTICOS_DM2.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`criterio-btn ${diagnostico === d.id ? 'activo-verde' : ''}`}
                onClick={() => setDiagnostico(d.id)}
              >
                <span>{d.label}</span>
              </button>
            ))}
          </div>
          <div
            className="criterios"
            style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0, marginTop: 10 }}
          >
            {DIAGNOSTICOS_HIPER.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`criterio-btn ${diagnostico === d.id ? 'activo-verde' : ''}`}
                onClick={() => setDiagnostico(d.id)}
              >
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>Situación prandial</label>
          <div className="criterios" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
            {SITUACIONES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`criterio-btn ${situacionPrandial === s.id ? 'activo-verde' : ''}`}
                onClick={() => setSituacionPrandial(s.id)}
              >
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>Peso</label>
          <div className="input-con-unidad">
            <input
              type="number"
              min="0"
              step="5"
              placeholder="Ej: 78"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
            />
            <span className="input-unidad">kg</span>
          </div>
        </div>
      </div>

      <button className="reset-btn" onClick={reset}>
        Borrar datos
      </button>

      <div className={`resultado ${calculo.color}`}>
        {!calculo.listo ? (
          <>
            <div className="puntos-total">{calculo.titulo}</div>
            <div className="interpretacion">{calculo.detalle}</div>
          </>
        ) : (
          <>
            <div className="puntos-total">Pauta inicial: {calculo.pautaInicial}</div>
            <div className="interpretacion">
              Pauta de corrección sugerida por peso: PAUTA {calculo.pautaCorreccion}
            </div>
            {calculo.requiereInterconsultaEndocrino && (
              <div className="resultado-subtexto">
                Aviso: PAUTA {calculo.pautaCorreccion}. Realizar Hoja de Interconsulta a Endocrino.
              </div>
            )}
            <div className="resultado-subtexto">
              Dosis basal orientativa:{' '}
              {calculo.usaBasal ? `${calculo.dosisBasal} UI/día` : 'No indicada'}
            </div>
            <div className="resultado-subtexto">
              Dosis prandial orientativa:{' '}
              {calculo.usaPrandial ? `${calculo.dosisPrandial} UI/comida` : 'No indicada'}
            </div>
          </>
        )}
      </div>

      {textoInforme && <InformeCopiable texto={textoInforme} />}
    </main>
  );
}
