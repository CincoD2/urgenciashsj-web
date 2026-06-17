'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import InformeCopiable from '@/components/InformeCopiable';

type SelectorOption = {
  id: string;
  label: string;
};

type Severity = {
  id: 'hiper' | 'normal' | 'leve' | 'moderada' | 'grave';
  label: string;
  color: 'verde' | 'amarillo' | 'naranja' | 'rojo';
  resumen: string;
};

type AdmissionDecision = {
  label: string;
  detail: string;
};

type EtiologyOrientation = {
  title: string;
  lines: string[];
};

type FoodGroup = {
  group: string;
  foods: string;
};

const ORAL_OPTIONS: SelectorOption[] = [
  { id: '', label: 'No especificado' },
  { id: 'no', label: 'Tolera vía oral' },
  { id: 'si', label: 'Intolerancia oral' },
];

const ACID_BASE_OPTIONS: SelectorOption[] = [
  { id: '', label: 'No disponible' },
  { id: 'normal', label: 'Equilibrio normal' },
  { id: 'acidosis', label: 'Acidosis metabólica' },
  { id: 'alcalosis', label: 'Alcalosis metabólica' },
  { id: 'variable', label: 'Variable' },
];

const EXAMS_BASE = [
  'Bioquímica sanguínea con glucosa, urea, creatinina, sodio, potasio, cloro, magnesio y calcio.',
  'Hemograma con fórmula y recuento leucocitario.',
  'Gasometría arterial para interpretar el equilibrio ácido-base.',
  'Electrocardiograma obligatorio en toda hipopotasemia.',
  'Si se confirma la hipopotasemia, bioquímica de orina aislada con sodio, potasio, urea y creatinina.',
  'Si el paciente toma digoxina, solicitar digoxinemia.',
] as const;

const ECG_ALERT = 'ECG: buscar aplanamiento o inversión de onda T, onda U, prolongación del PR, depresión del ST y arritmias.';

const SAFETY_LINES = [
  'No administrar cloruro potásico en bolo intravenoso.',
  'Administrar siempre en perfusión intravenosa continua si se usa la vía IV.',
  'No superar 20 mEq/h ni concentraciones mayores de 60 mEq/L.',
] as const;

const HIGH_POTASSIUM_FOODS: FoodGroup[] = [
  { group: 'Lácteos y derivados', foods: 'Leche en polvo, quesos.' },
  { group: 'Carnes y embutidos', foods: 'Liebre, conejo, embutidos.' },
  {
    group: 'Pescados, moluscos y crustáceos',
    foods:
      'Vieira, palometa, caviar, jurel, boquerón, surimi, caballa, salmón, pulpo, pez espada, percebe y pescados ahumados.',
  },
  { group: 'Huevos', foods: 'Huevos.' },
  { group: 'Frutos secos', foods: 'Todos.' },
  { group: 'Cereales y derivados', foods: 'Harina de soja, germen de trigo, cebada, avena, maíz.' },
  { group: 'Legumbres', foods: 'Todas.' },
  {
    group: 'Frutas',
    foods:
      'Frutas desecadas (albaricoque, ciruela, higo, uva pasa), dátil, tamarindo, coco, grosella negra, plátano, aguacate, kiwi y melón.',
  },
  {
    group: 'Verduras y hortalizas',
    foods:
      'Pimienta negra, perejil, patata, ajo, espinaca, acelga, champiñón, chirivía, trufa, col de Bruselas, cardo, escarola, brócoli, endivia, col, coliflor y remolacha.',
  },
  { group: 'Grasas', foods: 'Sin alimentos destacados en la tabla aportada.' },
  { group: 'Otros', foods: 'Sopa de sobre.' },
] as const;

const CARD_CLASS =
  'rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
const CARD_TITLE_CLASS =
  'text-sm font-semibold uppercase tracking-wide text-slate-500';
const HYPOKALEMIA_MACRO_HREF = '/macros?id=HIPOPOTASEMIA';

function Selector({
  titulo,
  valor,
  opciones,
  onChange,
}: {
  titulo: string;
  valor: string;
  opciones: SelectorOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="input-group">
      <label>{titulo}</label>
      <div className="selector-botones">
        {opciones.map((opcion) => (
          <button
            key={opcion.id || 'empty'}
            type="button"
            className={`selector-btn ${valor === opcion.id ? 'activo' : ''}`}
            onClick={() => onChange(opcion.id)}
          >
            {opcion.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getSeverity(potasio: number | null): Severity | null {
  if (potasio === null || Number.isNaN(potasio)) return null;

  if (potasio > 5.5) {
    return {
      id: 'hiper',
      label: 'Hiperpotasemia',
      color: 'rojo',
      resumen: 'Seguir protocolo específico de hiperpotasemia.',
    };
  }

  if (potasio < 2.5) {
    return {
      id: 'grave',
      label: 'Hipopotasemia grave',
      color: 'rojo',
      resumen: 'Reposición intravenosa prioritaria y monitorización estrecha.',
    };
  }

  if (potasio < 3) {
    return {
      id: 'moderada',
      label: 'Hipopotasemia moderada',
      color: 'naranja',
      resumen: 'Elegir reposición oral o IV según tolerancia oral y contexto clínico.',
    };
  }

  if (potasio < 3.5) {
    return {
      id: 'leve',
      label: 'Hipopotasemia leve',
      color: 'amarillo',
      resumen: 'Suele manejarse con dieta o reposición ajustada según tolerancia oral.',
    };
  }

  return {
    id: 'normal',
    label: 'Sin hipopotasemia',
    color: 'verde',
    resumen: 'Potasio en rango normal (3,5-5,5 mEq/L).',
  };
}

function getAdmissionDecision(severity: Severity, oralStatus: string): AdmissionDecision {
  if (severity.id === 'hiper') {
    return {
      label: 'Seguir protocolo específico',
      detail: 'El valor introducido corresponde a hiperpotasemia, no a hipopotasemia.',
    };
  }

  if (severity.id === 'normal') {
    return {
      label: 'No ingreso por potasio',
      detail: 'No existe hipopotasemia según esta escala.',
    };
  }

  if (severity.id === 'grave') {
    return {
      label: 'Ingreso recomendado',
      detail: 'Toda hipopotasemia grave debe ingresar en observación.',
    };
  }

  if (oralStatus === 'si') {
    return {
      label: 'Ingreso recomendado',
      detail: `${severity.label} con intolerancia oral: criterio de ingreso en observación.`,
    };
  }

  if (oralStatus === 'no') {
    return {
      label: 'Ingreso no obligado por la cifra de potasio',
      detail:
        'Si el potasio está entre 2,5 y 3,5 mEq/L y tolera vía oral, el ingreso depende de la causa desencadenante.',
    };
  }

  return {
    label: 'Depende de la tolerancia oral',
    detail:
      'Entre 2,5 y 3,5 mEq/L el ingreso cambia si existe intolerancia oral. Confírmala para cerrar la recomendación.',
  };
}

function getTreatmentLines(severity: Severity, oralStatus: string) {
  if (severity.id === 'hiper') {
    return ['Hiperpotasemia: seguir protocolo específico.'];
  }

  if (severity.id === 'normal') {
    return ['No precisa reposición específica de potasio con esta escala.'];
  }

  if (severity.id === 'leve') {
    if (oralStatus === 'si') {
      return [
        'Cloruro potásico IV: 20 mEq en 1.000 mL de suero glucosalino.',
        'Perfusión continua a 42 gotas/min (126 mL/h).',
      ];
    }

    if (oralStatus === 'no') {
      return [
        'Suplemento dietético con alimentos ricos en potasio, como zumos de fruta.',
      ];
    }

    return [
      'Si tolera vía oral: suplemento dietético con alimentos ricos en potasio.',
      'Si no tolera vía oral: cloruro potásico IV 20 mEq en 1.000 mL de suero glucosalino a 126 mL/h.',
    ];
  }

  if (severity.id === 'moderada') {
    if (oralStatus === 'si') {
      return [
        'Cloruro potásico IV: 40 mEq en 1.000 mL de suero glucosalino.',
        'Perfusión continua a 42 gotas/min (126 mL/h).',
      ];
    }

    if (oralStatus === 'no') {
      return [
        'Dieta rica en potasio + sales de potasio por vía oral 25 mEq cada 8 h.',
        'Opciones: Potasión 3 cápsulas/8 h (1 cápsula = 8 mEq).',
        'Opciones: Potasion solución 25 mL/8 h (1 mL = 1 mEq).',
        'Opciones: Bio K aspártico 1 comprimido/8 h (25 mEq).',
      ];
    }

    return [
      'Si tolera vía oral: dieta rica en potasio + sales de potasio 25 mEq/8 h.',
      'Si no tolera vía oral: cloruro potásico IV 40 mEq en 1.000 mL de suero glucosalino a 126 mL/h.',
    ];
  }

  return [
    'Cloruro potásico IV, preferentemente diluido en suero fisiológico.',
    'Inicio: 40 mEq en 1.000 mL de suero fisiológico en 2 horas.',
    'Después: 40 mEq en 1.000 mL de suero glucosalino a 42 gotas/min (126 mL/h).',
    'Controlar potasio sérico cada 6 horas y corregir el ritmo de perfusión según resultados.',
  ];
}

function getEtiologyOrientation(
  urinePotassium: number | null,
  acidBaseStatus: string
): EtiologyOrientation | null {
  if (urinePotassium === null && !acidBaseStatus) return null;

  if (urinePotassium === null) {
    return {
      title: 'Orientación etiológica incompleta',
      lines: [
        'Añade potasio urinario en muestra aislada para diferenciar pérdidas extrarrenales (<20 mEq/L) de pérdidas renales (>20 mEq/L).',
      ],
    };
  }

  if (urinePotassium === 20) {
    return {
      title: 'Orientación etiológica limítrofe',
      lines: [
        'Potasio urinario aislado de 20 mEq/L: valor umbral, interpretar con clínica y repetir si es necesario.',
      ],
    };
  }

  if (urinePotassium < 20) {
    const lines = ['K urinario aislado <20 mEq/L: orienta a pérdidas extrarrenales.'];

    if (acidBaseStatus === 'normal') {
      lines.push('Con equilibrio ácido-base normal: valorar ingesta inadecuada de potasio, anorexia nerviosa o sudoración excesiva.');
    } else if (acidBaseStatus === 'acidosis') {
      lines.push('Con acidosis metabólica: pensar en diarrea, abuso de laxantes o fístulas.');
    } else if (acidBaseStatus === 'alcalosis') {
      lines.push('Con alcalosis metabólica: valorar vómitos, sondaje gástrico o adenoma velloso.');
    } else if (acidBaseStatus === 'variable') {
      lines.push('El patrón ácido-base variable no es el más típico para pérdidas extrarrenales; revisar contexto clínico.');
    } else {
      lines.push('Completa el equilibrio ácido-base para afinar la causa probable.');
    }

    lines.push('Si no encaja un mecanismo de pérdidas, considerar redistribución intracelular.');

    return {
      title: 'Pérdidas extrarrenales probables',
      lines,
    };
  }

  const lines = ['K urinario aislado >20 mEq/L: orienta a pérdidas renales.'];

  if (acidBaseStatus === 'acidosis') {
    lines.push('Con acidosis metabólica: orientar hacia acidosis tubular renal (tipos I, II y III).');
  } else if (acidBaseStatus === 'alcalosis') {
    lines.push(
      'Con alcalosis metabólica: valorar diuréticos, esteroides, hiperaldosteronismo, regaliz, síndromes de Bartter o Liddle, HTA renovascular/maligna, Cushing o producción ectópica de ACTH.'
    );
  } else if (acidBaseStatus === 'variable') {
    lines.push(
      'Con equilibrio ácido-base variable: valorar síndrome de Fanconi, nefropatía pierde-sal o fase diurética de la necrosis tubular aguda/uropatía obstructiva.'
    );
  } else if (acidBaseStatus === 'normal') {
    lines.push('Con equilibrio ácido-base normal el origen renal es menos específico; revisar medicación y pérdidas de sal.');
  } else {
    lines.push('Completa el equilibrio ácido-base para acotar la etiología renal.');
  }

  lines.push(
    'Considerar además redistribución intracelular por alcalosis, glucosa/insulina, agonistas betaadrenérgicos, teofilina, parálisis periódica o hipotermia si la clínica no encaja.'
  );

  return {
    title: 'Pérdidas renales probables',
    lines,
  };
}

function formatNumber(value: number) {
  return value.toFixed(1).replace('.', ',');
}

export default function HipopotasemiaPage() {
  const [potasio, setPotasio] = useState('');
  const [oralStatus, setOralStatus] = useState('');
  const [urinePotassium, setUrinePotassium] = useState('');
  const [acidBaseStatus, setAcidBaseStatus] = useState('');

  const parsed = useMemo(() => {
    const parseOrNull = (value: string) => {
      if (!value.trim()) return null;
      const parsedValue = Number(value);
      return Number.isNaN(parsedValue) ? null : parsedValue;
    };

    return {
      potasio: parseOrNull(potasio),
      urinePotassium: parseOrNull(urinePotassium),
    };
  }, [potasio, urinePotassium]);

  const severity = useMemo(() => getSeverity(parsed.potasio), [parsed.potasio]);

  const admission = useMemo(() => {
    if (!severity) return null;
    return getAdmissionDecision(severity, oralStatus);
  }, [severity, oralStatus]);

  const treatmentLines = useMemo(() => {
    if (!severity) return [];
    return getTreatmentLines(severity, oralStatus);
  }, [severity, oralStatus]);

  const etiology = useMemo(() => {
    if (!severity || severity.id === 'normal' || severity.id === 'hiper') return null;
    return getEtiologyOrientation(parsed.urinePotassium, acidBaseStatus);
  }, [severity, parsed.urinePotassium, acidBaseStatus]);

  const showDietGuide = useMemo(() => {
    if (!severity) return false;
    if (severity.id !== 'leve' && severity.id !== 'moderada') return false;
    return oralStatus === 'no';
  }, [severity, oralStatus]);

  const helperSummary = useMemo(() => {
    if (!severity) return 'Introduce una cifra de potasio sérico para clasificar la hipopotasemia.';

    if (severity.id === 'grave') {
      return 'La clínica y el riesgo arrítmico aumentan sobre todo por debajo de 3 mEq/L; en cifras <2,5 mEq/L prioriza la reposición IV.';
    }

    if (severity.id === 'hiper') {
      return 'El valor introducido corresponde a hiperpotasemia. Seguir protocolo específico.';
    }

    if (severity.id === 'normal') {
      return 'El rango normal de potasio es 3,5-5,5 mEq/L.';
    }

    if (!oralStatus) {
      return 'Confirma la tolerancia oral para ajustar la vía de reposición y el criterio de ingreso.';
    }

    return severity.resumen;
  }, [severity, oralStatus]);

  const textoInforme = useMemo(() => {
    if (!severity || parsed.potasio === null) return '';

    if (severity.id === 'hiper') {
      return [
        'POTASIO',
        '',
        `Potasio sérico: ${formatNumber(parsed.potasio)} mEq/L.`,
        'Hiperpotasemia. Seguir protocolo específico.',
      ].join('\n');
    }

    if (severity.id === 'normal') {
      return [
        'POTASIO',
        '',
        `Potasio sérico: ${formatNumber(parsed.potasio)} mEq/L.`,
        'Potasio en rango normal (3,5-5,5 mEq/L).',
      ].join('\n');
    }

    const lines = [
      'HIPOPOTASEMIA',
      '',
      `${severity.label} (${formatNumber(parsed.potasio)} mEq/L).`,
      '',
      'Tratamiento recomendado:',
      ...treatmentLines.map((line) => `- ${line}`),
      '',
      'Ingreso:',
      `- ${admission?.label ?? 'Pendiente de completar'}.`,
      `- ${admission?.detail ?? 'Valorar tolerancia oral y causa desencadenante.'}`,
      '',
      'Pruebas complementarias:',
      ...EXAMS_BASE.map((line) => `- ${line}`),
      `- ${ECG_ALERT}`,
    ];

    if (parsed.urinePotassium !== null) {
      lines.splice(
        4,
        0,
        `- Potasio urinario en muestra aislada: ${formatNumber(parsed.urinePotassium)} mEq/L.`
      );
    }

    if (etiology) {
      lines.push('', `${etiology.title}:`, ...etiology.lines.map((line) => `- ${line}`));
    }

    lines.push('', 'Seguridad:', ...SAFETY_LINES.map((line) => `- ${line}`));

    return lines.join('\n');
  }, [severity, parsed.potasio, parsed.urinePotassium, admission, treatmentLines, etiology]);

  const reset = () => {
    setPotasio('');
    setOralStatus('');
    setUrinePotassium('');
    setAcidBaseStatus('');
  };

  return (
    <main className="escala-wrapper space-y-6" style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold">Hipopotasemia</h1>

      <section className="rounded-2xl border border-[#e2e8f0] bg-[linear-gradient(135deg,#f8fbfc,rgba(255,255,255,0.98))] p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-semibold text-[#166534]">
            Normal: 3,5-5,5
          </span>
          <span className="rounded-full bg-[#fef3c7] px-3 py-1 text-xs font-semibold text-[#92400e]">
            Leve: 3,0-3,4
          </span>
          <span className="rounded-full bg-[#ffedd5] px-3 py-1 text-xs font-semibold text-[#9a3412]">
            Moderada: 2,5-2,9
          </span>
          <span className="rounded-full bg-[#fee2e2] px-3 py-1 text-xs font-semibold text-[#b91c1c]">
            Grave: &lt;2,5
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700">
          La clínica suele hacerse más evidente por debajo de 3 mEq/L. En toda hipopotasemia debe
          solicitarse ECG y completar estudio analítico para definir gravedad, mecanismo y causa.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          En Urgencias, el potasio urinario de esta escala corresponde a <strong>muestra aislada</strong>.
        </p>
      </section>

      <div className="inputs-grid">
        <div className="input-group">
          <label>Potasio sérico</label>
          <div className="input-con-unidad">
            <input
              type="number"
              min="0"
              step="0.1"
              value={potasio}
              onChange={(event) => setPotasio(event.target.value)}
            />
            <span className="input-unidad">mEq/L</span>
          </div>
        </div>

        <div className="input-group">
          <label>Potasio urinario (muestra aislada)</label>
          <div className="input-con-unidad">
            <input
              type="number"
              min="0"
              step="0.1"
              value={urinePotassium}
              onChange={(event) => setUrinePotassium(event.target.value)}
            />
            <span className="input-unidad">mEq/L</span>
          </div>
          <span className="text-xs leading-5 text-slate-500">
            Orienta pérdidas extrarrenales si es &lt;20 mEq/L y renales si es &gt;20 mEq/L.
          </span>
        </div>
      </div>

      <Selector
        titulo="Tolerancia oral"
        valor={oralStatus}
        opciones={ORAL_OPTIONS}
        onChange={setOralStatus}
      />

      <Selector
        titulo="Equilibrio ácido-base"
        valor={acidBaseStatus}
        opciones={ACID_BASE_OPTIONS}
        onChange={setAcidBaseStatus}
      />

      <div className="escala-footer">
        <div className="acciones-escala">
          <button className="reset-btn" onClick={reset}>
            Reiniciar cálculo
          </button>
        </div>

        {severity && (
          <div className={`resultado ${severity.color}`}>
            <div className="puntos-total">{severity.label}</div>
            <div className="interpretacion">{helperSummary}</div>
          </div>
        )}
      </div>

      {severity && <InformeCopiable texto={textoInforme} />}

      {severity && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={CARD_CLASS}>
            <h2 className={CARD_TITLE_CLASS}>Ingreso</h2>
            <p className="mt-2 text-sm font-semibold text-slate-800">{admission?.label}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{admission?.detail}</p>
          </section>

          <section className={CARD_CLASS}>
            <h2 className={CARD_TITLE_CLASS}>Tratamiento recomendado</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {treatmentLines.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[#5a7f8a]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {showDietGuide ? (
              <div className="mt-4 rounded-lg bg-[#f8fbfc] px-3 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-800">Apoyo dietético</p>
                <p className="mt-1 leading-6">
                  Si quieres el texto listo para entregar al paciente, abre la macro de dieta para
                  hipopotasemia.
                </p>
                <Link
                  href={HYPOKALEMIA_MACRO_HREF}
                  className="mt-2 inline-flex items-center gap-2 underline decoration-[#dfe9eb] underline-offset-4 hover:text-[#3d7684]"
                >
                  Ver macro de hipopotasemia
                </Link>
              </div>
            ) : null}
          </section>

          {showDietGuide && (
            <section className={`${CARD_CLASS} lg:col-span-2`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className={CARD_TITLE_CLASS}>Alimentos ricos en potasio</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Útil cuando se recomienda reposición oral o aumento dietético de potasio.
                  </p>
                </div>
                <div className="rounded-full bg-[#eef5f7] px-3 py-1 text-xs font-semibold text-[#47636c]">
                  <Link href={HYPOKALEMIA_MACRO_HREF} className="hover:text-[#2b5d68]">
                    Ver macro
                  </Link>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <div className="hidden grid-cols-[minmax(180px,0.9fr)_minmax(0,2fr)] bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
                  <div className="border-r border-slate-200 px-4 py-3">Grupo de alimentos</div>
                  <div className="px-4 py-3">Alimentos</div>
                </div>

                <div className="divide-y divide-slate-200">
                  {HIGH_POTASSIUM_FOODS.map((item) => (
                    <div
                      key={item.group}
                      className="grid gap-2 bg-white px-4 py-3 sm:grid-cols-[minmax(180px,0.9fr)_minmax(0,2fr)] sm:gap-4"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:border-r sm:border-slate-200 sm:pr-4">
                        {item.group}
                      </div>
                      <div className="text-sm leading-6 text-slate-700">{item.foods}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {severity.id !== 'normal' && severity.id !== 'hiper' && (
            <>
              <section className={CARD_CLASS}>
                <h2 className={CARD_TITLE_CLASS}>Pruebas complementarias</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {EXAMS_BASE.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[#5a7f8a]" />
                      <span>{line}</span>
                    </li>
                  ))}
                  <li className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[#5a7f8a]" />
                    <span>{ECG_ALERT}</span>
                  </li>
                </ul>
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  En esta escala, la orientación urinaria se basa en <strong>muestra aislada</strong>,
                  que es lo disponible en Urgencias.
                </p>
              </section>

              {etiology && (
                <section className={CARD_CLASS}>
                  <h2 className={CARD_TITLE_CLASS}>{etiology.title}</h2>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {etiology.lines.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[#5a7f8a]" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="rounded-xl border border-[#f5d7d7] bg-[#fff7f7] p-4 shadow-sm sm:p-5 lg:col-span-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#991b1b]">Seguridad</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {SAFETY_LINES.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-[#dc2626]" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      )}

      <section className="mt-8 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
        <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Clínica y alteraciones ECG
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Esquema visual de referencia sobre manifestaciones clínicas y cambios electrocardiográficos
          asociados a la hipopotasemia.
        </p>
        <Image
          src="/img/hipoK.png"
          alt="Resumen visual de la clínica y alteraciones ECG de la hipopotasemia"
          className="mt-4 w-full rounded-lg border border-[#dfe9eb]"
          width={6400}
          height={11466}
          unoptimized
        />
      </section>

      <section className="mt-8 space-y-2 text-sm leading-relaxed text-slate-700">
        <p className="font-semibold">Bibliografía:</p>
        <p>
          Jiménez Murillo L, Montero Pérez FJ. <em>Medicina de Urgencias y Emergencias. Guía
          diagnóstica y protocolos de actuación</em>. 5.ª edición.
        </p>
      </section>
    </main>
  );
}
