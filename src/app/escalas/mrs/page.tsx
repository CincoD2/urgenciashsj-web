'use client';
// @ts-nocheck

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type Respuesta = 'si' | 'no' | null;

type Pregunta = {
  id: string;
  label: string;
};

const PREGUNTAS: Pregunta[] = [
  {
    id: 'sintomas',
    label:
      '¿Presenta síntomas neurológicos (lenguaje, coordinación, visión, sensibilidad, movilidad o deglución)?',
  },
  {
    id: 'limitacionHabitos',
    label:
      '¿Ha habido limitación en actividades habituales/laborales o cambios relevantes en vida social respecto a su situación previa?',
  },
  {
    id: 'ayudaInstrumentales',
    label:
      '¿Precisa ayuda para actividades instrumentales (compras, dinero, transporte, tareas domésticas o preparación de comida)?',
  },
  {
    id: 'ayudaBasicas',
    label: '¿Necesita ayuda para actividades básicas (comer, aseo, baño o caminar)?',
  },
  {
    id: 'atencionConstante',
    label: '¿Requiere atención constante, está encamado, es incontinente o no puede quedarse solo?',
  },
];

function getResultado(respuestas: Record<string, Respuesta>) {
  const faltan = PREGUNTAS.some((p) => !respuestas[p.id]);

  if (faltan) {
    return {
      score: null,
      grado: 'Pendiente de completar',
      color: 'amarillo',
      detalle: 'Completa todas las preguntas para obtener una clasificación mRS final.',
    };
  }

  if (respuestas.atencionConstante === 'si') {
    return {
      score: 5,
      grado: 'Discapacidad grave',
      color: 'rojo',
      detalle: 'Requiere atención continua, no puede mantenerse solo.',
    };
  }

  if (respuestas.ayudaBasicas === 'si') {
    return {
      score: 4,
      grado: 'Discapacidad moderadamente grave',
      color: 'naranja',
      detalle: 'Dependencia para actividades básicas y deambulación.',
    };
  }

  if (respuestas.ayudaInstrumentales === 'si') {
    return {
      score: 3,
      grado: 'Discapacidad moderada',
      color: 'naranja',
      detalle: 'Precisa ayuda para actividades instrumentales, con autonomía básica preservada.',
    };
  }

  if (respuestas.limitacionHabitos === 'si') {
    return {
      score: 2,
      grado: 'Discapacidad leve',
      color: 'amarillo',
      detalle: 'Limitación para actividades previas, mantiene independencia en ABVD.',
    };
  }

  if (respuestas.sintomas === 'si') {
    return {
      score: 1,
      grado: 'Sin discapacidad significativa',
      color: 'verde',
      detalle: 'Síntomas presentes sin limitación funcional relevante.',
    };
  }

  return {
    score: 0,
    grado: 'Asintomático',
    color: 'verde',
    detalle: 'Sin discapacidad funcional.',
  };
}

export default function MRSPage() {
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta>>({
    sintomas: null,
    limitacionHabitos: null,
    ayudaInstrumentales: null,
    ayudaBasicas: null,
    atencionConstante: null,
  });

  const resultado = useMemo(() => getResultado(respuestas), [respuestas]);

  const textoInforme = useMemo(() => {
    if (resultado.score === null) return null;

    const respuestaTexto = (valor: Respuesta) => (valor === 'si' ? 'Sí' : 'No');

    return (
      `ESCALA DE RANKIN MODIFICADA (mRS)\n` +
      `- Síntomas neurológicos: ${respuestaTexto(respuestas.sintomas)}\n` +
      `- Limitación en actividades habituales/sociales: ${respuestaTexto(respuestas.limitacionHabitos)}\n` +
      `- Ayuda en actividades instrumentales: ${respuestaTexto(respuestas.ayudaInstrumentales)}\n` +
      `- Ayuda en actividades básicas: ${respuestaTexto(respuestas.ayudaBasicas)}\n` +
      `- Atención constante / no puede quedarse solo: ${respuestaTexto(respuestas.atencionConstante)}\n\n` +
      `Resultado: mRS ${resultado.score} - ${resultado.grado}\n` +
      `${resultado.detalle}`
    );
  }, [respuestas, resultado]);

  function setRespuesta(id: string, valor: Exclude<Respuesta, null>) {
    setRespuestas((prev) => ({ ...prev, [id]: valor }));
  }

  function resetEscala() {
    setRespuestas({
      sintomas: null,
      limitacionHabitos: null,
      ayudaInstrumentales: null,
      ayudaBasicas: null,
      atencionConstante: null,
    });
  }

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">Escala de Rankin modificada (mRS)</h1>

      <p className="text-sm text-slate-600">
        Algoritmo estructurado de discapacidad (grados 0 a 5) basado en dependencia funcional
        progresiva.
      </p>

      <div className="space-y-4">
        {PREGUNTAS.map((pregunta) => (
          <div key={pregunta.id} className="input-group">
            <label>{pregunta.label}</label>
            <div className="selector-botones selector-botones-inline">
              <button
                type="button"
                className={`selector-btn ${respuestas[pregunta.id] === 'si' ? 'activo' : ''}`}
                onClick={() => setRespuesta(pregunta.id, 'si')}
              >
                Sí
              </button>
              <button
                type="button"
                className={`selector-btn ${respuestas[pregunta.id] === 'no' ? 'activo' : ''}`}
                onClick={() => setRespuesta(pregunta.id, 'no')}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={resetEscala}>
            Reiniciar escala
          </button>
        </div>

        <div className={`resultado ${resultado.color}`}>
          <div className="puntos-total">
            {resultado.score === null ? 'mRS -' : `mRS ${resultado.score}`}
          </div>
          <div className="interpretacion">{resultado.grado}</div>
          <div className="resultado-subtexto">{resultado.detalle}</div>
        </div>
      </div>

      {textoInforme && <InformeCopiable texto={textoInforme} />}

      <section className="mt-8 space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>
          La Escala de Rankin modificada (mRS) es una herramienta clínica de uso global para evaluar
          el grado de dependencia y discapacidad funcional en pacientes tras un ictus.
        </p>
        <p>
          Consiste en una escala ordinal de siete niveles, desde 0 (sin síntomas) hasta 6 (muerte).
          En este formulario se calcula la discapacidad funcional de 0 a 5 a partir de preguntas
          estructuradas sobre autonomía, necesidad de ayuda y dependencia.
        </p>
        <p>
          Los grados intermedios reflejan desde independencia con síntomas leves, pasando por
          discapacidad leve o moderada, hasta dependencia grave con necesidad de supervisión y
          cuidados continuos.
        </p>
        <div className="space-y-2">
          <p className="font-semibold">Bibliografía:</p>
          <p>
            Saver JL, Chaisinanunkul N, Campbell BCV, et al. Standardized Nomenclature for Modified
            Rankin Scale Global Disability Outcomes: Consensus Recommendations From Stroke Therapy
            Academic Industry Roundtable XI. Stroke. 2021.
          </p>
        </div>
      </section>
    </main>
  );
}
