"use client"
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
    id: 'hta',
    label: 'Hipertensión arterial (TAS > 160 mmHg)',
    texto: 'Hipertensión arterial (TAS > 160 mmHg)'
  },
  {
    id: 'renal',
    label: 'Alteración de la función renal (diálisis, trasplante, Cr > 2,26 mg/dL)',
    texto: 'Alteración de la función renal'
  },
  {
    id: 'hepatico',
    label:
      'Alteración de la función hepática (cirrosis, Br > x2, AST/ALT/ALP > x3)',
    texto: 'Alteración de la función hepática'
  },
  {
    id: 'acv',
    label: 'ACV isquémico o hemorrágico previo',
    texto: 'ACV isquémico o hemorrágico previo'
  },
  {
    id: 'hemorragia',
    label:
      'Hemorragia mayor previa o predisposición (asociada o no a anemia o trombocitopenia severa)',
    texto: 'Hemorragia mayor previa o predisposición'
  },
  {
    id: 'inr',
    label:
      'INR lábil (menos del 60% del tiempo en rango terapéutico en pacientes con AVK)',
    texto: 'INR lábil'
  },
  {
    id: 'edad',
    label: 'Edad > 65 años (o fragilidad extrema)',
    texto: 'Edad > 65 años (o fragilidad extrema)'
  },
  {
    id: 'medicacion',
    label: 'Medicación predisponente (antiagregantes, AINEs)',
    texto: 'Medicación predisponente'
  },
  {
    id: 'alcohol',
    label: 'Alcoholismo activo',
    texto: 'Alcoholismo activo'
  }
];

function getInterpretacion(puntuacion: number) {
  if (puntuacion >= 3) {
    return {
      texto: 'Riesgo alto (probabilidad de sangrado en un año entre el 4,9 y el 19,6 %)',
      color: 'rojo'
    };
  }
  if (puntuacion === 2) {
    return {
      texto: 'Riesgo intermedio (probabilidad de sangrado en un año entre 1,88 y 3,2 %)',
      color: 'amarillo'
    };
  }
  if (puntuacion === 1) {
    return {
      texto: 'Riesgo bajo (probabilidad de sangrado en un año entre el 1,02 y el 1,5 %)',
      color: 'verde'
    };
  }
  return {
    texto: 'Riesgo muy bajo (probabilidad de sangrado en un año menor del 1 %)',
    color: 'verde'
  };
}

export default function Hasbled() {
  const [seleccion, setSeleccion] = useState<Record<string, boolean>>({});
  const haySeleccion = Object.values(seleccion).some(Boolean);

  const puntuacion = useMemo(() => {
    return CRITERIOS.reduce((total, c) => (seleccion[c.id] ? total + 1 : total), 0);
  }, [seleccion]);

  const interpretacion = useMemo(() => getInterpretacion(puntuacion), [puntuacion]);

  const textoInforme = useMemo(() => {
    if (!haySeleccion) return null;
    const criteriosSeleccionados = CRITERIOS
      .filter((c) => seleccion[c.id])
      .map((c) => `- ${c.texto}`)
      .join('\n');

    return `HAS-BLED
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
      <h1 className="text-2xl font-semibold">HAS-BLED</h1>
      <div className="criterios criterios-2col criterios-1col-mobile">
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
          Uno de los tratamientos prioritarios para la prevención del accidente cerebrovascular en la fibrilación
          auricular, es la anticoagulación oral. Sin embargo, se trata de un tratamiento con riesgo que puede ser
          importante. El HAS-BLED score fué diseñado tras la evaluación de 3978 pacientes anticoagulados a causa de
          padecer una Fibrilación Auricular. Este sistema de evaluación mide el riesgo de padecer en un año una
          hemorragia importante, por su monto o su localización (Intracraneal, con descenso de la Hb de más de 2 g/L,
          y/o necesidad de transfusión). Clasifica solamente en tres niveles, aparte del muy bajo, pero ha sido
          recomendado por la European Society of Cardiology (ESC), y por la Sociedad Canadiense de Cardiología. Un
          score igual o mayor de 3 puntos, no siempre significa la no administración de anticoagulación o detener esta,
          sino que es un indicativo de una estrecha supervisión periódica del paciente.
        </p>
        <div className="space-y-2">
          <p className="font-semibold">Referencias:</p>
          <p>
            Lip, G. Y. H. : Hot Topics: HAS-BLED tool- What is the Real Risk of Blleding in Anticoagulation?.
            CardioSource.org . HRSonline.org. SEptember 17, 2012
          </p>
          <p>
            Lip G.Y.H., Frison L., Halperin JL, Lane CD: Comparative validation of a Novel Risk Score for predicting
            Bleeding Risk min anticoagulated patients with atrial fibrillation. The HAS-BLED (Hypertension, Abnormal
            Renal/Liver function, Stroke, Bleeding History or Predisposition, Labile INR, Elderly, Drugs/Alcohol
            concomitantly) Score. J Am Coll Cardiol 2011; 57:173-80
          </p>
        </div>
      </section>
    </main>
  );
}
