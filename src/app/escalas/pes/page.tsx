'use client';

import { useMemo, useState } from 'react';
import InformeCopiable from '@/components/InformeCopiable';

type Criterion = {
  id: string;
  label: string;
  puntos: number;
  texto: string;
  activeClass?: 'activo-rojo' | 'activo-verde';
};

const CRITERIOS: Criterion[] = [
  {
    id: 'antibioticosPrevios',
    label: 'Uso previo de antibióticos en el último mes',
    puntos: 2,
    texto: 'Uso previo de antibióticos en el último mes (+2)',
  },
  {
    id: 'respiratorioCronico',
    label: 'Enfermedad respiratoria crónica (EPOC o bronquiectasias)',
    puntos: 2,
    texto: 'Enfermedad respiratoria crónica: EPOC o bronquiectasias (+2)',
  },
  {
    id: 'renalCronica',
    label: 'Enfermedad renal crónica',
    puntos: 3,
    texto: 'Enfermedad renal crónica (+3)',
  },
  {
    id: 'conciencia',
    label: 'Alteración del nivel de consciencia',
    puntos: 2,
    texto: 'Alteración del nivel de consciencia (+2)',
  },
  {
    id: 'fiebreInicial',
    label: 'Temperatura inicial >37,8 ºC',
    puntos: -1,
    texto: 'Temperatura inicial >37,8 ºC (-1)',
    activeClass: 'activo-verde',
  },
];

function parseAge(raw: string) {
  const normalized = raw.trim();
  if (!normalized) return null;
  const value = Number(normalized);
  if (Number.isNaN(value) || value < 0) return null;
  return Math.floor(value);
}

function sanitizeAgeInput(raw: string) {
  return raw.replace(/[^\d]/g, '');
}

function getAgePoints(age: number | null) {
  if (age === null) return 0;
  if (age > 65) return 2;
  if (age >= 40) return 1;
  return 0;
}

function getAgeText(age: number | null) {
  if (age === null) return 'Edad no especificada';
  if (age > 65) return `Edad: ${age} años (+2)`;
  if (age >= 40) return `Edad: ${age} años (+1)`;
  return `Edad: ${age} años (0)`;
}

function getSexPoints(isMale: boolean | null) {
  if (isMale === true) return 1;
  return 0;
}

function getSexText(isMale: boolean | null) {
  if (isMale === true) return 'Sexo masculino (+1)';
  if (isMale === false) return 'Sexo femenino (0)';
  return 'Sexo no especificado';
}

function getInterpretacion(puntuacion: number) {
  if (puntuacion >= 5) {
    return {
      riesgo: 'RIESGO ALTO',
      color: 'rojo',
      detalle:
        'PES ≥5: alta probabilidad de patógenos PES. En NAC hospitalaria, considerar cobertura ampliada y obtención de muestras microbiológicas para desescalado.',
    };
  }

  if (puntuacion >= 2) {
    return {
      riesgo: 'RIESGO INTERMEDIO',
      color: 'amarillo',
      detalle:
        'PES 2-4: riesgo intermedio. Interpretar junto a la gravedad, colonización previa, ingresos recientes y epidemiología local.',
    };
  }

  return {
    riesgo: 'RIESGO BAJO',
    color: 'verde',
    detalle:
      'PES 0-1: baja probabilidad de patógenos PES. Habitualmente permite tratamiento empírico estándar de la NAC si no hay otros factores de riesgo.',
  };
}

export default function PesPage() {
  const [edad, setEdad] = useState('');
  const [isMale, setIsMale] = useState<boolean | null>(null);
  const [seleccion, setSeleccion] = useState<Record<string, boolean>>({});
  const edadNum = useMemo(() => parseAge(edad), [edad]);
  const hayDatos = edad !== '' || isMale !== null || Object.values(seleccion).some(Boolean);

  const puntuacion = useMemo(() => {
    const agePoints = getAgePoints(edadNum);
    const sexPoints = getSexPoints(isMale);
    const criteriaPoints = CRITERIOS.reduce((total, criterio) => {
      return seleccion[criterio.id] ? total + criterio.puntos : total;
    }, 0);

    return agePoints + sexPoints + criteriaPoints;
  }, [edadNum, isMale, seleccion]);

  const interpretacion = useMemo(() => getInterpretacion(puntuacion), [puntuacion]);

  const textoInforme = useMemo(() => {
    const activeCriteria = CRITERIOS.filter((criterio) => seleccion[criterio.id]).map(
      (criterio) => `- ${criterio.texto}`
    );

    const lineas = [
      'ESCALA PES',
      `- ${getAgeText(edadNum)}`,
      `- ${getSexText(isMale)}`,
      ...activeCriteria,
      '',
      `Puntuación total: ${puntuacion}`,
      `${interpretacion.riesgo}: ${interpretacion.detalle}`,
    ];

    return lineas.join('\n');
  }, [edadNum, isMale, seleccion, puntuacion, interpretacion]);

  function toggle(id: string) {
    setSeleccion((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function resetEscala() {
    setEdad('');
    setIsMale(null);
    setSeleccion({});
  }

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">PES Score</h1>

      <p className="text-sm leading-relaxed text-slate-600">
        La escala PES identifica riesgo de patógenos que pueden requerir cobertura empírica
        diferente en la NAC: <strong>Pseudomonas aeruginosa</strong>, enterobacterias BLEE y{' '}
        <strong>SARM</strong>. En vuestro protocolo de NAC, <strong>PES ≥5</strong> se usa como
        punto de corte para sospecha de patógenos multirresistentes.
      </p>

      <div className="inputs-grid inputs-grid-1col-mobile">
        <div className="input-group">
          <label>Edad</label>
          <div className="input-con-unidad">
            <input
              type="number"
              min="0"
              step="2"
              inputMode="numeric"
              value={edad}
              onChange={(e) => setEdad(sanitizeAgeInput(e.target.value))}
              placeholder="Edad"
            />
            <span className="input-unidad">años</span>
          </div>
        </div>

        <div className="input-group">
          <label>Sexo</label>
          <div className="selector-botones selector-botones-2col">
            <button
              type="button"
              className={`selector-btn ${isMale === false ? 'activo' : ''}`}
              onClick={() => setIsMale(false)}
            >
              Mujer
            </button>
            <button
              type="button"
              className={`selector-btn ${isMale === true ? 'activo' : ''}`}
              onClick={() => setIsMale(true)}
            >
              Varón
            </button>
          </div>
        </div>
      </div>

      <div className="criterios criterios-2col criterios-1col-mobile">
        {CRITERIOS.map((criterio) => {
          const activeClass = criterio.activeClass ?? 'activo-rojo';
          const estaActivo = Boolean(seleccion[criterio.id]);
          return (
            <button
              key={criterio.id}
              className={`criterio-btn ${estaActivo ? activeClass : ''}`}
              onClick={() => toggle(criterio.id)}
            >
              <span>{criterio.label}</span>
              <span className="puntos">{criterio.puntos > 0 ? `+${criterio.puntos}` : criterio.puntos}</span>
            </button>
          );
        })}
      </div>

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={resetEscala}>
            Reiniciar escala
          </button>
        </div>

        <div className={`resultado ${interpretacion.color}`}>
          <div className="puntos-total">{puntuacion} puntos</div>
          <div className="interpretacion">{interpretacion.riesgo}</div>
          <div className="resultado-subtexto">{interpretacion.detalle}</div>
        </div>
      </div>

      {hayDatos ? <InformeCopiable texto={textoInforme} /> : null}

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          La escala PES es una herramienta de apoyo para decidir si conviene ampliar cobertura
          empírica frente a <strong>Pseudomonas aeruginosa</strong>, enterobacterias BLEE o{' '}
          <strong>SARM</strong> en neumonía adquirida en la comunidad.
        </p>
        <p>
          No sustituye el juicio clínico. Interprétala junto a la gravedad del episodio, antecedentes
          microbiológicos, hospitalizaciones previas y epidemiología local.
        </p>
        <p>
          Si quieres ver cómo se integra en el esquema terapéutico local, consulta el protocolo de{' '}
          <a href="/protocolos/nac" className="font-medium text-blue-600 hover:underline">
            NAC
          </a>
          .
        </p>
        <div className="space-y-2">
          <p className="font-semibold">Bibliografía</p>
          <p>
            Prina E, Ranzani OT, Polverino E, et al. Risk factors associated with potentially
            antibiotic-resistant pathogens in community-acquired pneumonia. Ann Am Thorac Soc.
            2015;12(2):153-160.
          </p>
          <p>
            Cillóniz C, Dominedò C, Nicolini A, Torres A. PES Pathogens in Severe
            Community-Acquired Pneumonia. Microorganisms. 2019;7(6):168.
          </p>
        </div>
      </section>
    </main>
  );
}
