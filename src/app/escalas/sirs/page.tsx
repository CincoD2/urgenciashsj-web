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
    id: 'temperatura',
    label: 'Temperatura ≤ 35 o ≥ 38.5 ºC',
    texto: 'Temperatura ≤35 o ≥38.5 ºC',
  },
  {
    id: 'fc',
    label: 'Frecuencia cardíaca > 90 lpm',
    texto: 'Frecuencia cardíaca >90 lpm',
  },
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

function getInterpretacion(puntuacion: number) {
  if (puntuacion > 2) {
    return {
      texto:
        'Más de 2 criterios SIRS: se recomienda ingreso en UCI, independiente del resto de parámetros valorados en BISAP.',
      color: 'rojo',
    };
  }
  return {
    texto:
      'SIRS con 2 o menos criterios: no cumple recomendación de ingreso en UCI por criterio SIRS aislado.',
    color: 'amarillo',
  };
}

export default function Sirs() {
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

    return `SIRS (Síndrome de Respuesta Inflamatoria Sistémica)
${criteriosSeleccionados}

Criterios cumplidos: ${puntuacion}
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
      <h1 className="text-2xl font-semibold">SIRS (Síndrome de Respuesta Inflamatoria Sistémica)</h1>
      <p className="text-sm text-slate-700">
        Respuesta inflamatoria no infecciosa definida por la presencia de 2 o más criterios.
      </p>

      <div className="criterios" style={{ gridTemplateColumns: '1fr' }}>
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
          <div className="puntos-total">{puntuacion} criterios</div>
          <div className="interpretacion">{interpretacion.texto}</div>
        </div>
      </div>

      {textoInforme && <InformeCopiable texto={textoInforme} />}
    </main>
  );
}
