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
      'Insuficiencia cardiaca crónica: síntomas o signos de IC, o FEVI ≤ 40% (incluye HFpEF, HFmrEF y HFrEF)',
    puntos: 1,
    texto: 'Insuficiencia cardiaca crónica'
  },
  {
    id: 'hta',
    label: 'Hipertensión: PA en reposo >140/90 en ≥2 ocasiones o tratamiento antihipertensivo',
    puntos: 1,
    texto: 'Hipertensión'
  },
  {
    id: 'dm',
    label: 'Diabetes mellitus (tipo 1 o 2) o tratamiento hipoglucemiante',
    puntos: 1,
    texto: 'Diabetes mellitus'
  },
  {
    id: 'acv',
    label: 'Ictus previo, AIT o tromboembolismo arterial',
    puntos: 2,
    texto: 'Ictus/AIT/tromboembolismo arterial previo'
  },
  {
    id: 'vascular',
    label:
      'Enfermedad vascular: cardiopatía isquémica, IAM previo, revascularización, EAP o placa aórtica compleja',
    puntos: 1,
    texto: 'Enfermedad vascular'
  }
];

function getInterpretacion(puntuacion: number) {
  if (puntuacion === 0) {
    return {
      texto: 'Riesgo tromboembólico bajo. En general no se indica anticoagulación.',
      color: 'verde'
    };
  }
  if (puntuacion === 1) {
    return {
      texto:
        'Riesgo tromboembólico intermedio. Debe considerarse anticoagulación oral, con decisión compartida.',
      color: 'amarillo'
    };
  }
  return {
    texto:
      'Riesgo tromboembólico elevado. Se recomienda anticoagulación oral (puntuación ≥ 2).',
    color: 'rojo'
  };
}

export default function Cha2ds2va() {
  const [edad, setEdad] = useState<EdadOption | null>(null);
  const [seleccion, setSeleccion] = useState<Record<string, boolean>>({});

  const puntuacionFinal = useMemo(() => {
    const edadPuntos = edad?.puntos || 0;
    const otros = CRITERIOS.reduce(
      (total, c) => (seleccion[c.id] ? total + c.puntos : total),
      0
    );
    return edadPuntos + otros;
  }, [edad, seleccion]);

  const interpretacion = useMemo(
    () => getInterpretacion(puntuacionFinal),
    [puntuacionFinal]
  );

  const textoInforme = useMemo(() => {
    const criteriosEdad = edad?.texto ? `- ${edad.texto}` : '';
    const criteriosSeleccionados = CRITERIOS
      .filter((c) => seleccion[c.id])
      .map((c) => `- ${c.texto}`)
      .join('\n');

    if (!criteriosEdad && !criteriosSeleccionados) return null;

    return `CHA2DS2-VA Score
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
      <h1 className="text-2xl font-semibold">CHA2DS2-VA Score</h1>
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

      <div className="criterios criterios-2col criterios-1col-mobile">
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
          El CHA2DS2-VA Score es una herramienta para estimar el riesgo de ictus en pacientes con fibrilación auricular
          y apoyar la decisión sobre anticoagulación oral, sin incorporar sexo o género como criterio.
        </p>
        <p>
          Se recomienda anticoagulación oral si la puntuación es ≥ 2 y debe considerarse si es 1, en un enfoque centrado
          en el paciente y de decisión compartida. En pacientes con puntuación 0, el riesgo tromboembólico suele ser bajo.
        </p>
        <p>
          Además de los componentes del score, deben valorarse otros modificadores de riesgo tromboembólico: cáncer,
          enfermedad renal crónica, etnia (negra, hispana, asiática), biomarcadores (troponina, BNP) y, en grupos
          específicos, dilatación auricular, hiperlipidemia, tabaquismo y obesidad.
        </p>
        <div className="space-y-2">
          <p className="font-semibold">Bibliografía:</p>
          <p>
            Van Gelder IC, Rienstra M, Bunting KV, Casado-Arroyo R, Caso V, Crijns HJGM, De Potter TJR, Dwight J,
            Guasti L, Hanke T, Jaarsma T, Lettino M, Løchen M-L, Lumbers RT, Maesen B, Mølgaard I, Rosano GMC, Sanders P,
            Schnabel RB, Suwalski P, Svennberg E, Tamargo J, Tica O, Traykov V, Tzeis S, Kotecha D, ESC Scientific
            Document Group. 2024 ESC Guidelines for the management of atrial fibrillation developed in collaboration
            with the European Association for Cardio-Thoracic Surgery (EACTS): Developed by the task force for the
            management of atrial fibrillation of the European Society of Cardiology (ESC), with the special
            contribution of the European Heart Rhythm Association (EHRA) of the ESC. Endorsed by the European Stroke
            Organisation (ESO). European Heart Journal. 2024;45(36):3314–3414. DOI:{' '}
            <a
              href="https://doi.org/10.1093/eurheartj/ehae176"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              10.1093/eurheartj/ehae176
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
