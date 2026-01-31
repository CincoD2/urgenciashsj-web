"use client"
// @ts-nocheck

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type EdadOption = {
  id: string;
  label: string;
  puntos: number;
  texto: string;
};

type Criterio = {
  id: string;
  label: string;
  puntos: number;
  texto: string;
};

const EDADES: EdadOption[] = [
  { id: 'lt65', label: 'Edad < 65 años', puntos: 0, texto: 'Edad < 65 años' },
  { id: '65_74', label: 'Edad entre 65 y 74 años', puntos: 1, texto: 'Edad entre 65 y 74 años' },
  { id: 'ge75', label: 'Edad ≥ 75 años', puntos: 2, texto: 'Edad ≥ 75 años' }
];

const CRITERIOS: Criterio[] = [
  {
    id: 'icc',
    label:
      'Historia de insuficiencia cardiaca congestiva (valoración clínica o disfunción ventricular moderada o severa o MCPH)',
    puntos: 1,
    texto: 'Historia de insuficiencia cardiaca congestiva'
  },
  {
    id: 'hta',
    label: 'HTA actual (>140/90) o en tratamiento',
    puntos: 1,
    texto: 'HTA actual (>140/90) o en tratamiento'
  },
  {
    id: 'acv',
    label: 'ACV, AIT o TEP previos',
    puntos: 2,
    texto: 'ACV, AIT o TEP previos'
  },
  {
    id: 'vascular',
    label:
      'Historia de enfermedad vascular (enf. arterial coronaria significativa, IAM previo, EAP o ateromatosis aórtica)',
    puntos: 1,
    texto: 'Historia de enfermedad vascular'
  },
  {
    id: 'dm',
    label:
      'Diabetes mellitus (tratamiento con ADOs o insulina o glucemia capilar > 125 mg/dL)',
    puntos: 1,
    texto: 'Diabetes mellitus'
  },
  {
    id: 'mujer',
    label: 'Género femenino',
    puntos: 1,
    texto: 'Género femenino'
  }
];

const RIESGO: string[] = [
  'menor de 1.3 %',
  '1.3 %',
  '2.2 %',
  '3.2 %',
  '4.0 %',
  '6.7 %',
  '9.8 %',
  '9.6 %',
  '6.7 %',
  '15.2 %'
];

function getInterpretacion(puntuacion: number, soloMujer: boolean) {
  if (puntuacion < 1) {
    return {
      texto: `Riesgo bajo (riesgo de ACV en el próximo año: ${RIESGO[puntuacion]})`,
      color: 'verde'
    };
  }
  if (puntuacion === 1 && soloMujer) {
    return {
      texto: 'Riesgo bajo (riesgo de ACV en el próximo año: menor de 1.3 %)',
      color: 'verde'
    };
  }
  if (puntuacion === 1) {
    return {
      texto: `Riesgo bajo-moderado. Considerar anticoagulación o antiagregación (riesgo de ACV en el próximo año: ${RIESGO[puntuacion]})`,
      color: 'amarillo'
    };
  }
  return {
    texto: `Riesgo moderado o alto. Está indicada la anticoagulación (riesgo de ACV en el próximo año: ${RIESGO[puntuacion]})`,
    color: 'rojo'
  };
}

export default function Chads2vasc() {
  const [edad, setEdad] = useState<EdadOption | null>(null);
  const [seleccion, setSeleccion] = useState<Record<string, boolean>>({});

  const puntuacionBase = useMemo(() => {
    const edadPuntos = edad?.puntos || 0;
    const otros = CRITERIOS.reduce(
      (total, c) => (seleccion[c.id] ? total + c.puntos : total),
      0
    );
    return edadPuntos + otros;
  }, [edad, seleccion]);

  const soloMujer = useMemo(() => {
    const mujer = !!seleccion.mujer;
    const otros = Object.keys(seleccion).some((id) => id !== 'mujer' && seleccion[id]);
    return mujer && !otros && (edad?.puntos || 0) === 0;
  }, [seleccion, edad]);

  const puntuacionFinal = soloMujer ? puntuacionBase - 1 : puntuacionBase;

  const interpretacion = useMemo(
    () => getInterpretacion(puntuacionFinal, soloMujer),
    [puntuacionFinal, soloMujer]
  );

  const textoInforme = useMemo(() => {
    const criteriosEdad = edad?.texto ? `- ${edad.texto}` : '';
    const criteriosSeleccionados = CRITERIOS
      .filter((c) => seleccion[c.id])
      .map((c) => `- ${c.texto}`)
      .join('\n');

    if (!criteriosEdad && !criteriosSeleccionados) return null;

    return `CHA2DS2-VASc
${[criteriosEdad, criteriosSeleccionados].filter(Boolean).join('\n')}

Puntuación: ${puntuacionFinal}
${interpretacion.texto}`;
  }, [edad, seleccion, puntuacionFinal, interpretacion]);

  const toggle = (id: string) => {
    setSeleccion((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const reset = () => {
    setEdad(null);
    setSeleccion({});
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">CHA2DS2-VASc</h1>
      <div className="input-group" style={{ marginBottom: 16 }}>
        <label>Edad</label>
        <div className="selector-botones">
          {EDADES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`selector-btn ${edad?.id === opt.id ? 'activo' : ''}`}
              onClick={() => setEdad(opt)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="criterios criterios-2col">
        {CRITERIOS.map((c) => (
          <button
            key={c.id}
            className={`criterio-btn ${seleccion[c.id] ? 'activo-rojo' : ''}`}
            onClick={() => toggle(c.id)}
          >
            <span>{c.label}</span>
            <span className="puntos">{c.puntos > 0 ? `+${c.puntos}` : c.puntos}</span>
          </button>
        ))}
      </div>

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={reset}>
            Reiniciar escala
          </button>
        </div>

        {edad ? (
          <div className={`resultado ${interpretacion.color}`}>
            <div className="puntos-total">{puntuacionFinal} puntos</div>
            <div className="interpretacion">{interpretacion.texto}</div>
          </div>
        ) : null}
      </div>

      {textoInforme && <InformeCopiable texto={textoInforme} />}

      <section className="mt-8 space-y-4 text-sm text-slate-700 leading-relaxed">
        <p>
          El CHADS2-VASc Score es la evolución de un instrumento muy utilizado con el fin de estimar, de una forma
          relativamente sencilla el riesgo de sufrir un Accidente Cerebrovascular en el caso de los enfermos con
          Fibrilación Auricular de origen no reumático, el CHADS2. Fundamentalmente se utilizan ambos para decidir
          cuales de estos enfermos deberían tener tratamiento anticoagulante o antiagregante. Su resultado es una
          puntuación, que indica el porcentaje de riesgo de sufrir un ACV por el enfermo en los siguientes doce meses.
        </p>
        <p>
          A las siglas de CHADS2, que proceden de: Congestive Heart Failure, Hypertension, Age, Diabetes, Previous
          Stroke, se añaden la evaluación de enfermedad cardiovascular previa, y el sexo, que son los parámetros en los
          que se basa el sistema de evaluación.
        </p>
        <p>
          CHADS2-VASc responde a la crítica que se hizo a su antecesor, de que no incluía algunos factores que también
          podrían influir en la aparición de ACV, aunque es ligeramente más complejo. Su utilización es recomendada por
          las Sociedades Europea y Canadiense de Cardiología.
        </p>
        <p>
          Tanto el uso del CHADS2, como el CHADS2-VASc se aconseja en conjunción con otros sistemas de evaluación del
          riesgo de sangrado (HAS-BLED, HEMORR2HAGES, ATRIA, y otros).
        </p>
        <div className="space-y-2">
          <p className="font-semibold">Referencias:</p>
          <p>
            Lip GY, Nieuwlaat R, Pisters R, Lane DA, et al: Refining Clinical Risk Stratification for prediction stroke
            and thromboembolism in atrial fibrillation using a novel risk factor-based approach: The Euroheart Survey
            on atrial fibrillation. Chest 2010; 137(2):263-272
          </p>
          <p>
            Lip GY, Frison L, Halperin JL, Lane DA; Identifying patients of high risk for stroke despite anticoagulation:
            a comparison of contemporary stroke risk stratification schemes in an anticoagulates atrial fibrillation
            cohort. Stroke 2010; 41(12):2731-8
          </p>
        </div>
      </section>
    </main>
  );
}
