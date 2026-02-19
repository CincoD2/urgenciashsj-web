'use client';
// @ts-nocheck

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type Criterio = {
  id: string;
  label: string;
  puntos: number;
  texto: string;
};

const CRITERIOS: Criterio[] = [
  {
    id: 'movilidad',
    label: 'Movilidad reducida',
    puntos: 3,
    texto: 'Movilidad reducida',
  },
  {
    id: 'cancer',
    label: 'Cáncer activo',
    puntos: 3,
    texto: 'Cáncer activo',
  },
  {
    id: 'etv',
    label: 'TEV previa (no tromboflebitis superficial)',
    puntos: 3,
    texto: 'TEV previa',
  },
  {
    id: 'trombofilia',
    label: 'Trombofilia conocida',
    puntos: 3,
    texto: 'Trombofilia conocida',
  },
  {
    id: 'cirugia',
    label: 'Trauma o cirugía reciente (último mes)',
    puntos: 2,
    texto: 'Trauma o cirugía reciente',
  },
  {
    id: 'edad',
    label: 'Edad ≥70 años',
    puntos: 1,
    texto: 'Edad ≥70 años',
  },
  {
    id: 'insuficiencia',
    label: 'Insuficiencia cardiaca o respiratoria',
    puntos: 1,
    texto: 'Insuficiencia cardiaca o respiratoria',
  },
  {
    id: 'iamIctus',
    label: 'Infarto agudo de miocardio o ictus isquémico',
    puntos: 1,
    texto: 'Infarto agudo de miocardio o ictus isquémico',
  },
  {
    id: 'infeccionReuma',
    label: 'Infección aguda o trastorno reumatológico',
    puntos: 1,
    texto: 'Infección aguda o trastorno reumatológico',
  },
  {
    id: 'obesidad',
    label: 'Obesidad (IMC ≥30 kg/m²)',
    puntos: 1,
    texto: 'Obesidad (IMC ≥30)',
  },
  {
    id: 'hormonal',
    label: 'Terapia hormonal',
    puntos: 1,
    texto: 'Terapia hormonal',
  },
];

function getInterpretacion(puntuacion: number) {
  if (puntuacion >= 4) {
    return {
      texto: 'Riesgo alto de tromboembolismo venoso',
      color: 'rojo',
      detalle:
        'Paciente de alto riesgo (Padua ≥4). Valorar profilaxis tromboembólica si no hay contraindicaciones.',
    };
  }
  return {
    texto: 'Riesgo bajo de tromboembolismo venoso',
    color: 'verde',
    detalle: 'Paciente de bajo riesgo (Padua <4).',
  };
}

export default function PaduaPage() {
  const [seleccion, setSeleccion] = useState<Record<string, boolean>>({});
  const haySeleccion = Object.values(seleccion).some(Boolean);

  const puntuacion = useMemo(() => {
    return CRITERIOS.reduce((total, c) => (seleccion[c.id] ? total + c.puntos : total), 0);
  }, [seleccion]);

  const interpretacion = useMemo(() => getInterpretacion(puntuacion), [puntuacion]);

  const textoInforme = useMemo(() => {
    if (!haySeleccion) return null;
    const criteriosSeleccionados = CRITERIOS.filter((c) => seleccion[c.id])
      .map((c) => `- ${c.texto} (+${c.puntos})`)
      .join('\n');

    return `ESCALA DE PADUA (Padua Prediction Score)
${criteriosSeleccionados}

Puntuación total: ${puntuacion}
${interpretacion.texto.toUpperCase()}
${interpretacion.detalle}`;
  }, [haySeleccion, seleccion, puntuacion, interpretacion]);

  const toggle = (id: string) => {
    setSeleccion((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  function resetEscala() {
    setSeleccion({});
  }

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">Escala de Padua</h1>

      <p className="text-sm text-slate-600">
        Modelo para estimar el riesgo de tromboembolismo venoso (TEV) en pacientes médicos
        hospitalizados. Riesgo bajo: &lt;4 puntos. Riesgo alto: ≥4 puntos.
      </p>

      <div className="criterios criterios-2col criterios-1col-mobile">
        {CRITERIOS.map((c) => (
          <button
            key={c.id}
            className={`criterio-btn ${seleccion[c.id] ? 'activo-rojo' : ''}`}
            onClick={() => toggle(c.id)}
          >
            <span>{c.label}</span>
            <span className="puntos">+{c.puntos}</span>
          </button>
        ))}
      </div>

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={resetEscala}>
            Reiniciar escala
          </button>
        </div>

        <div className={`resultado ${interpretacion.color}`}>
          <div className="puntos-total">{puntuacion} puntos</div>
          <div className="interpretacion">{interpretacion.texto}</div>
          <div className="resultado-subtexto">{interpretacion.detalle}</div>
        </div>
      </div>

      {textoInforme && <InformeCopiable texto={textoInforme} />}

      <section className="mt-8 space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>
          La Escala de Padua (Padua Prediction Score) es un modelo de evaluación de riesgo diseñado
          para identificar pacientes médicos hospitalizados con alto riesgo de tromboembolismo venoso.
        </p>
        <p>
          Asigna puntos a 11 factores de riesgo comunes: cáncer activo, TEV previo, movilidad
          reducida, trombofilia conocida, trauma o cirugía reciente, edad ≥70 años, insuficiencia
          cardiaca o respiratoria, infarto agudo de miocardio o ictus isquémico, infección aguda o
          trastornos reumatológicos, obesidad con IMC ≥30 y terapia hormonal.
        </p>
        <p>
          La interpretación práctica clasifica a los pacientes como de bajo riesgo (&lt;4 puntos) o
          alto riesgo (≥4 puntos), ayudando a la decisión clínica sobre profilaxis.
        </p>
        <div className="space-y-2">
          <p className="font-semibold">Bibliografía:</p>
          <p>
            Barbar S, Noventa F, Rossetto V, et al. A risk assessment model for the identification
            of hospitalized medical patients at risk for venous thromboembolism: the Padua Prediction
            Score. Journal of Thrombosis and Haemostasis. 2010;8(11):2450-2457.
          </p>
        </div>
      </section>
    </main>
  );
}
