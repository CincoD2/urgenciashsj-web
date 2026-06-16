'use client';
// @ts-nocheck

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type Opcion = {
  id: string;
  label: string;
  puntos: number;
};

const LOC_NIVEL: Opcion[] = [
  { id: '1a0', label: 'Alerta', puntos: 0 },
  { id: '1a1', label: 'Somnoliento, responde a estímulos verbales', puntos: 1 },
  { id: '1a2', label: 'Estuporoso (requiere estimulación repetida)', puntos: 2 },
  { id: '1a3', label: 'Coma', puntos: 3 },
];

const LOC_PREGUNTAS: Opcion[] = [
  { id: '1b0', label: 'Responde bien a ambas', puntos: 0 },
  { id: '1b1', label: 'Responde a una bien', puntos: 1 },
  { id: '1b2', label: 'No responde a ninguna bien', puntos: 2 },
];

const LOC_ORDENES: Opcion[] = [
  { id: '1c0', label: 'Bien a ambas', puntos: 0 },
  { id: '1c1', label: 'Hace una bien', puntos: 1 },
  { id: '1c2', label: 'No hace ninguna bien', puntos: 2 },
];

const GAZE: Opcion[] = [
  { id: '2_0', label: 'Normal', puntos: 0 },
  { id: '2_1', label: 'Parálisis parcial. No parálisis forzada', puntos: 1 },
  { id: '2_2', label: 'Parálisis o desviación forzada', puntos: 2 },
];

const VISUAL: Opcion[] = [
  { id: '3_0', label: 'Sin defectos', puntos: 0 },
  { id: '3_1', label: 'Hemianopsia parcial', puntos: 1 },
  { id: '3_2', label: 'Hemianopsia completa', puntos: 2 },
  { id: '3_3', label: 'Hemianopsia bilateral o ceguera', puntos: 3 },
];

const FACIAL: Opcion[] = [
  { id: '4_0', label: 'Normal y simétrico', puntos: 0 },
  { id: '4_1', label: 'Asimetría mínima', puntos: 1 },
  { id: '4_2', label: 'Debilidad facial menor (Hemicara inferior)', puntos: 2 },
  { id: '4_3', label: 'Parálisis hemilateral completa', puntos: 3 },
];

const MOTOR_ARM: Opcion[] = [
  { id: '5_0', label: 'Mantiene posición 10 segundos', puntos: 0 },
  { id: '5_1', label: 'Claudica en menos de 10 seg sin golpear', puntos: 1 },
  { id: '5_2', label: 'Claudica rápidamente', puntos: 2 },
  { id: '5_3', label: 'No vence a la gravedad', puntos: 3 },
  { id: '5_4', label: 'Sin movimiento', puntos: 4 },
];

const MOTOR_LEG: Opcion[] = [
  { id: '6_0', label: 'Mantiene posición 5 segundos', puntos: 0 },
  { id: '6_1', label: 'Claudica en menos de 5 seg sin golpear', puntos: 1 },
  { id: '6_2', label: 'Claudica rápidamente', puntos: 2 },
  { id: '6_3', label: 'No vence a la gravedad', puntos: 3 },
  { id: '6_4', label: 'Sin movimiento', puntos: 4 },
];

const ATAXIA: Opcion[] = [
  { id: '7_0', label: 'Dismetría ausente / no valorable', puntos: 0 },
  { id: '7_1', label: 'Dismetría en una extremidad', puntos: 1 },
  { id: '7_2', label: 'Dismetría en 2 extremidades', puntos: 2 },
];

const SENSORY: Opcion[] = [
  { id: '8_0', label: 'Sensibilidad normal', puntos: 0 },
  { id: '8_1', label: 'Leve hipoestesia', puntos: 1 },
  { id: '8_2', label: 'Alteración grave (anestesia)', puntos: 2 },
];

const LANGUAGE: Opcion[] = [
  { id: '9_0', label: 'Lenguaje normal', puntos: 0 },
  { id: '9_1', label: 'Afasia leve o moderada (fluencia alterada)', puntos: 1 },
  { id: '9_2', label: 'Afasia grave', puntos: 2 },
  { id: '9_3', label: 'Mutismo (Afasia global)', puntos: 3 },
];

const DYSARTHRIA: Opcion[] = [
  { id: '10_0', label: 'Normal / no valorable', puntos: 0 },
  { id: '10_1', label: 'Disartria leve o moderada (se entiende)', puntos: 1 },
  { id: '10_2', label: 'Disartria grave', puntos: 2 },
];

const EXTINCTION: Opcion[] = [
  { id: '11_0', label: 'Sin alteraciones', puntos: 0 },
  { id: '11_1', label: 'Visual, táctil, auditiva, espacial o personal', puntos: 1 },
  { id: '11_2', label: 'Más de un tipo (inatención grave)', puntos: 2 },
];

function getInterpretacion(total: number) {
  if (total === 0) {
    return { texto: 'Sin déficit neurológico', color: 'verde' };
  }
  if (total <= 4) {
    return { texto: 'Ictus menor', color: 'amarillo' };
  }
  if (total <= 15) {
    return { texto: 'Ictus moderado', color: 'naranja' };
  }
  if (total <= 20) {
    return { texto: 'Ictus moderado-severo', color: 'naranja' };
  }
  return { texto: 'Ictus severo', color: 'rojo' };
}

function Selector({
  titulo,
  valor,
  opciones,
  onChange,
  opcionesClassName = '',
}: {
  titulo: string;
  valor: Opcion | null;
  opciones: Opcion[];
  onChange: (opt: Opcion) => void;
  opcionesClassName?: string;
}) {
  return (
    <div className="input-group">
      {titulo && (
        <label>
          {titulo} ({valor?.puntos ?? '—'})
        </label>
      )}
      <div className={`selector-botones selector-botones-grid selector-botones-1col ${opcionesClassName}`}>
        {opciones.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`selector-btn ${valor?.id === opt.id ? 'activo' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NIHSS() {
  const [locNivel, setLocNivel] = useState<Opcion | null>(null);
  const [locPreguntas, setLocPreguntas] = useState<Opcion | null>(null);
  const [locOrdenes, setLocOrdenes] = useState<Opcion | null>(null);
  const [gaze, setGaze] = useState<Opcion | null>(null);
  const [visual, setVisual] = useState<Opcion | null>(null);
  const [facial, setFacial] = useState<Opcion | null>(null);
  const [armDer, setArmDer] = useState<Opcion | null>(null);
  const [armIzq, setArmIzq] = useState<Opcion | null>(null);
  const [legDer, setLegDer] = useState<Opcion | null>(null);
  const [legIzq, setLegIzq] = useState<Opcion | null>(null);
  const [ataxia, setAtaxia] = useState<Opcion | null>(null);
  const [sensory, setSensory] = useState<Opcion | null>(null);
  const [language, setLanguage] = useState<Opcion | null>(null);
  const [dysarthria, setDysarthria] = useState<Opcion | null>(null);
  const [extinction, setExtinction] = useState<Opcion | null>(null);

  const total = useMemo(() => {
    return (
      (locNivel?.puntos ?? 0) +
      (locPreguntas?.puntos ?? 0) +
      (locOrdenes?.puntos ?? 0) +
      (gaze?.puntos ?? 0) +
      (visual?.puntos ?? 0) +
      (facial?.puntos ?? 0) +
      (armDer?.puntos ?? 0) +
      (armIzq?.puntos ?? 0) +
      (legDer?.puntos ?? 0) +
      (legIzq?.puntos ?? 0) +
      (ataxia?.puntos ?? 0) +
      (sensory?.puntos ?? 0) +
      (language?.puntos ?? 0) +
      (dysarthria?.puntos ?? 0) +
      (extinction?.puntos ?? 0)
    );
  }, [
    locNivel,
    locPreguntas,
    locOrdenes,
    gaze,
    visual,
    facial,
    armDer,
    armIzq,
    legDer,
    legIzq,
    ataxia,
    sensory,
    language,
    dysarthria,
    extinction,
  ]);

  const interpretacion = useMemo(() => getInterpretacion(total), [total]);
  const armSubtotal = useMemo(() => (armDer?.puntos ?? 0) + (armIzq?.puntos ?? 0), [armDer, armIzq]);
  const legSubtotal = useMemo(() => (legDer?.puntos ?? 0) + (legIzq?.puntos ?? 0), [legDer, legIzq]);
  const armSubtotalLabel = armDer || armIzq ? String(armSubtotal) : '—';
  const legSubtotalLabel = legDer || legIzq ? String(legSubtotal) : '—';
  const hasSelections = useMemo(() => {
    return Boolean(
      locNivel ||
        locPreguntas ||
        locOrdenes ||
        gaze ||
        visual ||
        facial ||
        armDer ||
        armIzq ||
        legDer ||
        legIzq ||
        ataxia ||
        sensory ||
        language ||
        dysarthria ||
        extinction
    );
  }, [
    locNivel,
    locPreguntas,
    locOrdenes,
    gaze,
    visual,
    facial,
    armDer,
    armIzq,
    legDer,
    legIzq,
    ataxia,
    sensory,
    language,
    dysarthria,
    extinction,
  ]);

  const textoInforme = useMemo(() => {
    const lineas: string[] = [];
    let tieneCeros = false;

    const pushLinea = (titulo: string, opcion: Opcion | null) => {
      if (!opcion) return;
      if (opcion.puntos === 0) {
        tieneCeros = true;
        return;
      }
      lineas.push(`- ${titulo}: ${opcion.label} (${opcion.puntos})`);
    };

    pushLinea('1a Nivel de consciencia', locNivel);
    pushLinea('1b Orientación', locPreguntas);
    pushLinea('1c Órdenes', locOrdenes);
    pushLinea('2 Mirada conjugada', gaze);
    pushLinea('3 Campos visuales', visual);
    pushLinea('4 Movimientos faciales', facial);
    pushLinea('5a MSD', armDer);
    pushLinea('5b MSI', armIzq);
    pushLinea('6a MID', legDer);
    pushLinea('6b MII', legIzq);

    pushLinea('7 Dismetría', ataxia);
    pushLinea('8 Sensibilidad', sensory);
    pushLinea('9 Lenguaje', language);
    pushLinea('10 Disartria', dysarthria);
    pushLinea('11 Extinción e inatención', extinction);

    if (tieneCeros) {
      lineas.push('- Resto sin déficits');
    }

    return (
      `NIHSS\n` +
      `${lineas.join('\n')}\n\n` +
      `Puntuación total: ${total}/42\n${interpretacion.texto}`
    );
  }, [
    locNivel,
    locPreguntas,
    locOrdenes,
    gaze,
    visual,
    facial,
    armDer,
    armIzq,
    legDer,
    legIzq,
    ataxia,
    sensory,
    language,
    dysarthria,
    extinction,
    total,
    interpretacion,
  ]);

  const reset = () => {
    setLocNivel(null);
    setLocPreguntas(null);
    setLocOrdenes(null);
    setGaze(null);
    setVisual(null);
    setFacial(null);
    setArmDer(null);
    setArmIzq(null);
    setLegDer(null);
    setLegIzq(null);
    setAtaxia(null);
    setSensory(null);
    setLanguage(null);
    setDysarthria(null);
    setExtinction(null);
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">Escala NIHSS</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Selector titulo="1a. Nivel de conciencia" valor={locNivel} opciones={LOC_NIVEL} onChange={setLocNivel} />
        <Selector
          titulo="1b. Orientación (mes y edad)"
          valor={locPreguntas}
          opciones={LOC_PREGUNTAS}
          onChange={setLocPreguntas}
        />
        <Selector titulo="1c. Dar dos órdenes motoras" valor={locOrdenes} opciones={LOC_ORDENES} onChange={setLocOrdenes} />
        <Selector titulo="2. Mirada conjugada" valor={gaze} opciones={GAZE} onChange={setGaze} />
        <Selector titulo="3. Campos visuales" valor={visual} opciones={VISUAL} onChange={setVisual} />
        <Selector titulo="4. Movimientos faciales" valor={facial} opciones={FACIAL} onChange={setFacial} />

        <div className="input-group nihss-pares-card">
          <div className="nihss-pares-head">
            <label className="text-sm font-semibold text-slate-700">
              5. Función motora miembro superior ({armSubtotalLabel})
            </label>
          </div>
          <div className="nihss-pares-grid">
            <div className="nihss-pares-side">
              <div className="nihss-pares-side-title">MSD</div>
              <Selector titulo="" valor={armDer} opciones={MOTOR_ARM} onChange={setArmDer} opcionesClassName="nihss-pares-options" />
            </div>
            <div className="nihss-pares-side">
              <div className="nihss-pares-side-title">MSI</div>
              <Selector titulo="" valor={armIzq} opciones={MOTOR_ARM} onChange={setArmIzq} opcionesClassName="nihss-pares-options" />
            </div>
          </div>
        </div>

        <div className="input-group nihss-pares-card">
          <div className="nihss-pares-head">
            <label className="text-sm font-semibold text-slate-700">
              6. Función motora miembro inferior ({legSubtotalLabel})
            </label>
          </div>
          <div className="nihss-pares-grid">
            <div className="nihss-pares-side">
              <div className="nihss-pares-side-title">MID</div>
              <Selector titulo="" valor={legDer} opciones={MOTOR_LEG} onChange={setLegDer} opcionesClassName="nihss-pares-options" />
            </div>
            <div className="nihss-pares-side">
              <div className="nihss-pares-side-title">MII</div>
              <Selector titulo="" valor={legIzq} opciones={MOTOR_LEG} onChange={setLegIzq} opcionesClassName="nihss-pares-options" />
            </div>
          </div>
        </div>

        <Selector titulo="7. Dismetría" valor={ataxia} opciones={ATAXIA} onChange={setAtaxia} />
        <Selector titulo="8. Sensibilidad" valor={sensory} opciones={SENSORY} onChange={setSensory} />
        <Selector titulo="9. Lenguaje" valor={language} opciones={LANGUAGE} onChange={setLanguage} />
        <Selector titulo="10. Disartria" valor={dysarthria} opciones={DYSARTHRIA} onChange={setDysarthria} />
        <Selector titulo="11. Extinción e inatención" valor={extinction} opciones={EXTINCTION} onChange={setExtinction} />
      </div>

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={reset}>
            Reiniciar escala
          </button>
        </div>

        <div className={`resultado ${interpretacion.color}`}>
          <div className="puntos-total">{total} puntos</div>
          <div className="interpretacion">{interpretacion.texto}</div>
        </div>
      </div>

      {hasSelections && <InformeCopiable texto={textoInforme} />}
    </main>
  );
}
