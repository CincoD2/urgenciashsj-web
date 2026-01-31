'use client';
// @ts-nocheck

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type Criterio = {
  id: string;
  label: string;
  texto: string;
};

const CRITERIOS: Criterio[] = [
  {
    id: 'mental',
    label: 'Estado mental alterado o empeorado',
    texto: 'Estado mental alterado',
  },
  {
    id: 'fr',
    label: 'Frecuencia respiratoria ≥ 22 rpm',
    texto: 'Frecuencia respiratoria ≥22 rpm',
  },
  {
    id: 'tas',
    label: 'TAS ≤ 100 mmHg',
    texto: 'TAS ≤100 mmHg',
  },
];

function getInterpretacion(puntuacion: number) {
  if (puntuacion < 2) {
    return {
      texto: 'BAJO RIESGO: Repetir qSOFA frecuentemente. Continuar tratamiento estándar.',
      color: 'verde',
    };
  }
  return {
    texto: 'RIESGO ALTO: Vigilar disfunción orgánica. Pedir lactato. Evaluar con SOFA.',
    color: 'rojo',
  };
}

export default function Qsofa() {
  const [seleccion, setSeleccion] = useState<Record<string, boolean>>({});
  const haySeleccion = Object.values(seleccion).some(Boolean);

  const puntuacion = useMemo(() => {
    return CRITERIOS.reduce((total, c) => (seleccion[c.id] ? total + 1 : total), 0);
  }, [seleccion]);

  const interpretacion = useMemo(() => getInterpretacion(puntuacion), [puntuacion]);

  const textoInforme = useMemo(() => {
    if (!haySeleccion) return null;
    const criteriosSeleccionados = CRITERIOS.filter((c) => seleccion[c.id])
      .map((c) => `- ${c.texto}`)
      .join('\n');

    return `qSOFA
${criteriosSeleccionados}

Puntuación: ${puntuacion}
${interpretacion.texto}`;
  }, [haySeleccion, seleccion, puntuacion, interpretacion]);

  const toggle = (id: string) => {
    setSeleccion((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const reset = () => {
    setSeleccion({});
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">qSOFA score para identificación de sepsis</h1>
      <div className="criterios">
        {CRITERIOS.map((c) => (
          <button
            key={c.id}
            className={`criterio-btn ${seleccion[c.id] ? 'activo-rojo' : ''}`}
            onClick={() => toggle(c.id)}
          >
            <span>{c.label}</span>
            <span className="puntos">+1</span>
          </button>
        ))}
      </div>

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={reset}>
            Reiniciar escala
          </button>
        </div>

        <div className={`resultado ${interpretacion.color}`}>
          <div className="puntos-total">{puntuacion} puntos</div>
          <div className="interpretacion">{interpretacion.texto}</div>
        </div>
      </div>

      {textoInforme && <InformeCopiable texto={textoInforme} />}

      <section className="mt-8 space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>
          Se trata de un modelo desarrollado en Febrero de 2016 para evaluar la posibilidad de un
          riesgo alto en pacientes con sospecha de sepsis con escasos parámetros, dejando ya a un
          lado los criterios del SIRS. Emplea solamente el estado mental alterado (es decir,
          GCS&lt;15).
        </p>
        <p>
          Una puntuación baja no elimina la posibilidad de sepsis, por lo que se recomienda seguir
          evaluando al paciente, si sigue siendo sospechoso. Una puntuación alta induce a adoptar
          medidas más concretas de tratamiento, con medición de lactato, evaluación con SOFA,
          tratamiento antibiótico y fluidoterapia.
        </p>
      </section>
    </main>
  );
}
