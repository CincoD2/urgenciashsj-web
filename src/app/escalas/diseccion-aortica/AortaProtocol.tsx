'use client';

import { useEffect, useReducer, useState, type ReactNode } from 'react';
import InformeCopiable from '@/components/InformeCopiable';
import styles from './AortaProtocol.module.css';
import {
  INITIAL_STATE,
  REFERENCES,
  SEQUENCE,
  STANFORD,
  buildSbarText,
  clampWeight,
  getAddrsScore,
  getDecision,
  getDrugs,
  getTemImplication,
  type Domain,
  type ProtocolState,
  type Tone,
} from './model';

const STORAGE_KEY = 'hsj-diseccion-aortica-v1';
const tones: Record<Tone, string> = {
  primary: 'border-[#c8dde3] bg-[#eef6f8] text-[#2b5d68]',
  error: 'border-red-200 bg-red-50 text-red-800',
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

function Badge({ tone = 'primary', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${active ? 'border-[#5a7f8a] bg-[#5a7f8a] text-white' : 'border-[#c8dde3] bg-white text-[#2b5d68] hover:bg-[#eef6f8]'}`}
    >
      {children}
    </button>
  );
}

function ChecklistItem({
  checked,
  onClick,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onClick}
      className={`mb-1.5 flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm ${checked ? 'border-[#5a7f8a] bg-[#e8f2f4] text-[#2b5d68]' : 'border-[#dfe9eb] bg-white text-slate-700 hover:bg-slate-50'}`}
    >
      <span
        aria-hidden="true"
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border ${checked ? 'border-[#5a7f8a] bg-[#5a7f8a] text-white' : 'border-slate-400 bg-white'}`}
      >
        {checked ? '✓' : ''}
      </span>
      <span>{children}</span>
    </button>
  );
}

type Action =
  | { type: 'restore'; value: ProtocolState }
  | { type: 'update'; value: Partial<ProtocolState> };
function reducer(current: { state: ProtocolState; hydrated: boolean }, action: Action) {
  return action.type === 'restore'
    ? { state: action.value, hydrated: true }
    : { ...current, state: { ...current.state, ...action.value } };
}

function isSavedState(value: unknown): value is ProtocolState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  const options = {
    stanfordMode: ['A', 'B'],
    temT: ['A', 'B', 'nonA-nonB'],
    temE: ['E0', 'E1', 'E2', 'E3'],
    temM: ['M0', 'M1+', 'M2+', 'M3+'],
    lumenFilter: ['all', 'true', 'false'],
    stability: ['estable', 'inestable'],
    guideline: ['ESC', 'AHA'],
  };
  if (!Object.entries(options).every(([key, values]) => values.includes(String(state[key]))))
    return false;
  if (
    !['highSuspicionOverride', 'trapSimulated', 'bbContra'].every(
      (key) => typeof state[key] === 'boolean'
    )
  )
    return false;
  if (
    typeof state.weightKg !== 'number' ||
    !Number.isFinite(state.weightKg) ||
    state.weightKg < 40 ||
    state.weightKg > 150
  )
    return false;
  if (![1, 2, 3].includes(Number(state.seqStep)) || typeof state.ddimer !== 'string') return false;
  const strings = (input: unknown): input is string[] =>
    Array.isArray(input) && input.every((item) => typeof item === 'string');
  if (!strings(state.transferTasks) || !state.addrs || typeof state.addrs !== 'object')
    return false;
  const addrs = state.addrs as Record<string, unknown>;
  return ['dom1', 'dom2', 'dom3'].every((key) => strings(addrs[key]));
}

export default function AortaProtocol() {
  const [{ state, hydrated }, dispatch] = useReducer(reducer, {
    state: INITIAL_STATE,
    hydrated: false,
  });
  const [resetArmed, setResetArmed] = useState(false);
  const [weightDraft, setWeightDraft] = useState<string | null>(null);

  useEffect(() => {
    let restored = INITIAL_STATE;
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      if (isSavedState(saved)) restored = saved;
    } catch {
      /* A blocked or invalid browser store must not prevent using the tool. */
    }
    dispatch({ type: 'restore', value: restored });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Storage is optional. */
    }
  }, [state, hydrated]);

  function update(value: Partial<ProtocolState>) {
    setResetArmed(false);
    dispatch({ type: 'update', value });
  }

  function toggleFinding(domain: Domain, label: string) {
    const current = state.addrs[domain];
    update({
      addrs: {
        ...state.addrs,
        [domain]: current.includes(label)
          ? current.filter((item) => item !== label)
          : [...current, label],
      },
    });
  }

  function toggleTransferTask(task: string) {
    update({
      transferTasks: state.transferTasks.includes(task)
        ? state.transferTasks.filter((item) => item !== task)
        : [...state.transferTasks, task],
    });
  }

  function resetProtocol() {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    setWeightDraft(null);
    update(INITIAL_STATE);
  }

  const score = getAddrsScore(state);
  const decision = getDecision(state);
  const sequence = SEQUENCE[state.trapSimulated ? 0 : state.seqStep];

  return (
    <div className="space-y-6 [&_button]:cursor-pointer [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-[#3d7684]">
      <div>
        <div className="space-y-4">
          <nav
            aria-label="Secciones del protocolo"
            className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
          >
            <a
              href="#fisiopatologia"
              className="inline-flex min-h-11 items-center rounded-lg border border-[#d7e5e8] bg-white px-3 py-2 text-xs font-semibold text-[#2b5d68] hover:bg-[#eef6f8] sm:rounded-full sm:px-4 sm:text-sm"
            >
              1. Fisiopatología y TEM
            </a>
            <a
              href="#diagnostico"
              className="inline-flex min-h-11 items-center rounded-lg border border-[#d7e5e8] bg-white px-3 py-2 text-xs font-semibold text-[#2b5d68] hover:bg-[#eef6f8] sm:rounded-full sm:px-4 sm:text-sm"
            >
              2. ADD-RS y Diagnóstico
            </a>
            <a
              href="#antiimpulso"
              className="inline-flex min-h-11 items-center rounded-lg border border-[#d7e5e8] bg-white px-3 py-2 text-xs font-semibold text-[#2b5d68] hover:bg-[#eef6f8] sm:rounded-full sm:px-4 sm:text-sm"
            >
              3. Terapia Anti-Impulso
            </a>
            <a
              href="#traslado"
              className="inline-flex min-h-11 items-center rounded-lg border border-[#d7e5e8] bg-white px-3 py-2 text-xs font-semibold text-[#2b5d68] hover:bg-[#eef6f8] sm:rounded-full sm:px-4 sm:text-sm"
            >
              4. Circuito de Traslado
            </a>
          </nav>
        </div>
      </div>
      <div className="space-y-6">
        <section className="space-y-4 rounded-3xl border border-[#cfe2e6] bg-gradient-to-br from-[#e8f2f4] via-[#f5fafb] to-white p-5 sm:p-6">
          <div className="space-y-4">
            <div className="space-y-2 border-b border-[#dfe9eb] pb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#516f75]">
                Síndrome aórtico agudo · Abordaje tiempo-dependiente
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Disección aguda de aorta
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                Protocolo para médicos de urgencias en centros sin cirugía cardiovascular: sospecha
                temprana, terapia anti-impulso en secuencia estricta y traslado urgente al centro
                aórtico receptor. Adaptado de la herramienta del Dr. Sanchís basada en su{' '}
                <a
                  href="https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/20261120%20Sd%20A%C3%B3rtico%20Agudo%20(Sanch%C3%ADs).pdf?d=w4528231d6e3349188b4278ee5452bb97&csf=1&web=1&e=uCpxIi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4"
                >
                  sesión clínica de noviembre de 2026
                </a>
                .
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="#diagnostico" className={styles.headerAction}>
                  Calcular riesgo ADD-RS
                </a>
                <a href="#antiimpulso" className={styles.headerAction}>
                  Ver pauta anti-impulso IV
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5 space-y-1">
                <div className="text-xs text-[#516f75]">Desgarro primario proximal</div>
                <div className="text-2xl font-semibold tabular-nums text-[#2b5d68]">65 %</div>
                <div className="text-xs leading-5 text-[#516f75]">
                  En aorta ascendente (1–5 cm sobre seno de Valsalva derecho)
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5 space-y-1">
                <div className="text-xs text-[#516f75]">Objetivo prioritario de FC</div>
                <div className="text-2xl font-semibold tabular-nums text-[#2b5d68]">≤ 60 lpm</div>
                <div className="text-xs leading-5 text-[#516f75]">
                  Betabloqueo IV antes de cualquier vasodilatador (ESC 2024)
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5 space-y-1">
                <div className="text-xs text-[#516f75]">Meta tensional sistólica</div>
                <div className="text-2xl font-semibold tabular-nums text-[#2b5d68]">100–120</div>
                <div className="text-xs leading-5 text-[#516f75]">
                  mmHg de PAS preservando perfusión orgánica
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5 space-y-1">
                <div className="text-xs text-[#516f75]">Tasa de fallos ADvISED</div>
                <div className="text-2xl font-semibold tabular-nums text-[#2b5d68]">0,3 %</div>
                <div className="text-xs leading-5 text-[#516f75]">
                  Con ADD-RS ≤ 1 y Dímero-D &lt; 500 ng/mL
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="fisiopatologia" className="scroll-mt-24 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2 border-b border-[#dfe9eb] pb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#516f75]">
                1 · Fisiopatología y clasificación
              </span>
              <h2 className="text-xl font-semibold text-[#2b5d68]">
                Anatomía y clasificación Stanford / TEM
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                La disrupción de la túnica íntima permite el paso de sangre hacia la túnica media,
                separando las capas y creando una luz falsa que se propaga de forma anterógrada o
                retrógrada.
              </p>
            </div>
            <div className="grid items-start gap-5 lg:grid-cols-2">
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="mb-2 text-base font-semibold text-[#2b5d68]">
                      Anatomía del flap intimal
                    </h3>
                    <p className="text-sm leading-6 text-slate-600">
                      Selecciona el patrón anatómico para visualizar la extensión y el origen del
                      desgarro.
                    </p>
                  </div>
                  <div
                    role="group"
                    aria-label="Selector de clasificación Stanford"
                    className="flex w-fit flex-wrap gap-2 rounded-xl border border-[#dfe9eb] bg-slate-50 p-1"
                  >
                    <Choice
                      active={state.stanfordMode === 'A'}
                      onClick={() => update({ stanfordMode: 'A' })}
                    >
                      Stanford A
                    </Choice>
                    <Choice
                      active={state.stanfordMode === 'B'}
                      onClick={() => update({ stanfordMode: 'B' })}
                    >
                      Stanford B
                    </Choice>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4 rounded-xl border border-[#dfe9eb] bg-slate-50 p-4">
                  <svg
                    viewBox="0 0 320 380"
                    role="img"
                    aria-label="Esquema anatómico de la aorta con flap intimal, luz verdadera y luz falsa"
                    className="block h-auto w-full max-w-[280px]"
                  >
                    <path
                      d="M128 74 L118 30 M152 64 L152 24 M178 68 L194 28"
                      stroke="#516f75"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M110 155 L110 105 C110 55 205 55 205 110 L205 335"
                      stroke="#0f172a"
                      strokeWidth="34"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      id="svg-true-lumen"
                      d="M110 155 L110 105 C110 55 205 55 205 110 L205 335"
                      stroke="#3d7684"
                      strokeWidth="18"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      id="svg-false-lumen"
                      d={
                        state.stanfordMode === 'A'
                          ? 'M100 148 L100 105 C100 44 217 44 217 110 L217 315'
                          : 'M217 105 L217 325'
                      }
                      stroke="#c2410c"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="6 4"
                      fill="none"
                    />
                    <path
                      id="svg-flap"
                      d={
                        state.stanfordMode === 'A'
                          ? 'M106 148 L106 105 C106 50 211 50 211 110 L211 315'
                          : 'M211 105 L211 325'
                      }
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <circle
                      id="svg-tear-dot"
                      cx={state.stanfordMode === 'A' ? 110 : 205}
                      cy={state.stanfordMode === 'A' ? 128 : 112}
                      r="7"
                      fill="#b91c1c"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <path
                      d="M205 225 L252 225"
                      stroke="#0f172a"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M205 250 L252 250"
                      stroke="#0f172a"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M188 275 L146 275"
                      stroke="#3d7684"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      id="svg-left-renal"
                      d="M222 282 L264 282"
                      stroke="#c2410c"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <text
                      x="20"
                      y="132"
                      fill="#0f172a"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="inherit"
                    >
                      Ascendente
                    </text>
                    <text x="20" y="146" fill="#516f75" fontSize="10" fontFamily="inherit">
                      65 % desgarro
                    </text>
                    <text
                      x="225"
                      y="65"
                      fill="#0f172a"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="inherit"
                    >
                      Arco (10 %)
                    </text>
                    <text
                      x="228"
                      y="135"
                      fill="#0f172a"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="inherit"
                    >
                      Descendente
                    </text>
                    <text x="228" y="149" fill="#516f75" fontSize="10" fontFamily="inherit">
                      20 % debajo subclavia
                    </text>
                    <text x="256" y="229" fill="#516f75" fontSize="10" fontFamily="inherit">
                      T. celíaco
                    </text>
                    <text x="256" y="254" fill="#516f75" fontSize="10" fontFamily="inherit">
                      AMS
                    </text>
                    <text
                      x="92"
                      y="279"
                      fill="#3d7684"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="inherit"
                    >
                      Renal der.
                    </text>
                    <text
                      x="230"
                      y="299"
                      fill="#c2410c"
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="inherit"
                    >
                      Renal izq.
                    </text>
                    <text x="148" y="362" fill="#516f75" fontSize="10" fontFamily="inherit">
                      Azul: luz verdadera · Naranja: luz falsa
                    </text>
                  </svg>
                  <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg bg-white p-2 text-center [&_strong]:block [&_strong]:text-[#2b5d68] [&_span]:block [&_span]:text-xs [&_span]:text-slate-600">
                      <strong>65 %</strong>
                      <span>Ascendente</span>
                    </div>
                    <div className="rounded-lg bg-white p-2 text-center [&_strong]:block [&_strong]:text-[#2b5d68] [&_span]:block [&_span]:text-xs [&_span]:text-slate-600">
                      <strong>20 %</strong>
                      <span>Desc. proximal</span>
                    </div>
                    <div className="rounded-lg bg-white p-2 text-center [&_strong]:block [&_strong]:text-[#2b5d68] [&_span]:block [&_span]:text-xs [&_span]:text-slate-600">
                      <strong>10 %</strong>
                      <span>Arco transverso</span>
                    </div>
                    <div className="rounded-lg bg-white p-2 text-center [&_strong]:block [&_strong]:text-[#2b5d68] [&_span]:block [&_span]:text-xs [&_span]:text-slate-600">
                      <strong>5 %</strong>
                      <span>Toracoabdominal</span>
                    </div>
                  </div>
                </div>
                <div
                  id="stanford-summary"
                  style={{ marginTop: '1rem', marginBottom: '0' }}
                  className="mb-4 rounded-xl border border-[#dfe9eb] bg-slate-50 p-3 sm:p-4"
                >
                  <Badge tone={state.stanfordMode === 'A' ? 'error' : 'warning'}>
                    {STANFORD[state.stanfordMode].badge}
                  </Badge>
                  <p style={{ margin: '.5rem 0 0' }}>{STANFORD[state.stanfordMode].description}</p>
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-2 text-base font-semibold text-[#2b5d68]">
                  Clasificación TEM interactiva
                </h3>
                <p style={{ marginBottom: '1rem' }} className="text-sm leading-6 text-slate-600">
                  Integra tipo anatómico (T), localización del desgarro primario (E) y estado de
                  malperfusión (M) para comunicar la gravedad al centro receptor.
                </p>
                <div className="mb-4">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    T — Tipo anatómico (compromiso ascendente)
                  </span>
                  <div id="tem-t-group" className="flex flex-wrap gap-2">
                    <Choice active={state.temT === 'A'} onClick={() => update({ temT: 'A' })}>
                      Tipo A (ascendente)
                    </Choice>
                    <Choice active={state.temT === 'B'} onClick={() => update({ temT: 'B' })}>
                      Tipo B (distal a subclavia)
                    </Choice>
                    <Choice
                      active={state.temT === 'nonA-nonB'}
                      onClick={() => update({ temT: 'nonA-nonB' })}
                    >
                      No-A No-B (arco)
                    </Choice>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    E — Entry (localización del desgarro primario)
                  </span>
                  <div id="tem-e-group" className="flex flex-wrap gap-2">
                    <Choice active={state.temE === 'E0'} onClick={() => update({ temE: 'E0' })}>
                      E0 (Hematoma intramural / sin puerta)
                    </Choice>
                    <Choice active={state.temE === 'E1'} onClick={() => update({ temE: 'E1' })}>
                      E1 (Aorta ascendente)
                    </Choice>
                    <Choice active={state.temE === 'E2'} onClick={() => update({ temE: 'E2' })}>
                      E2 (Arco aórtico)
                    </Choice>
                    <Choice active={state.temE === 'E3'} onClick={() => update({ temE: 'E3' })}>
                      E3 (Descendente: B1/B2)
                    </Choice>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    M — Malperfusión de órgano diana
                  </span>
                  <div id="tem-m-group" className="flex flex-wrap gap-2">
                    <Choice active={state.temM === 'M0'} onClick={() => update({ temM: 'M0' })}>
                      M0 (Sin malperfusión)
                    </Choice>
                    <Choice active={state.temM === 'M1+'} onClick={() => update({ temM: 'M1+' })}>
                      M1+ (Miocárdica / ECG)
                    </Choice>
                    <Choice active={state.temM === 'M2+'} onClick={() => update({ temM: 'M2+' })}>
                      M2+ (Cerebral / Síncope-Ictus)
                    </Choice>
                    <Choice active={state.temM === 'M3+'} onClick={() => update({ temM: 'M3+' })}>
                      M3+ (Visceral / Renal / Extrem.)
                    </Choice>
                  </div>
                </div>
                <div
                  aria-live="polite"
                  className="mt-4 rounded-xl border border-[#c8dde3] border-l-4 border-l-[#3d7684] bg-[#eef6f8] p-4 text-[#2b5d68]"
                >
                  <div id="tem-code-display" className="text-lg font-semibold">
                    {state.temT === 'nonA-nonB' ? 'No-A No-B' : `T-${state.temT}`} · {state.temE} ·{' '}
                    {state.temM}
                  </div>
                  <p style={{ margin: '.25rem 0 0' }}>{getTemImplication(state)}</p>
                </div>
                <div
                  style={{ marginTop: '1rem', marginBottom: '0' }}
                  className="mb-4 rounded-xl border border-[#dfe9eb] bg-slate-50 p-3 sm:p-4"
                >
                  <span
                    style={{ marginBottom: '.25rem' }}
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Subtipos de entrada en Tipo B (Weiss) y evolución temporal
                  </span>
                  <p className="text-sm leading-6 text-slate-600">
                    La disección es <strong>aguda</strong> en los primeros 14 días y{' '}
                    <strong>crónica</strong> tras los 14 días. En Tipo B, la puerta en la convexidad
                    (<strong>B1</strong>) suele tener menor propagación retrógrada que en la
                    concavidad interna del arco (<strong>B2</strong>
                    ), donde la ausencia de barrera anatómica facilita la extensión retrógrada.
                  </p>
                </div>
              </div>
            </div>
            <div
              style={{ marginTop: '1.5rem' }}
              className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5"
            >
              <div
                style={{ flexWrap: 'wrap' }}
                className="mb-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <h3 className="mb-2 text-base font-semibold text-[#2b5d68]">
                    Diferenciación en Angio-TC: luz verdadera frente a luz falsa
                  </h3>
                  <p className="text-sm leading-6 text-slate-600">
                    Identificar la luz verdadera es imprescindible para planificar el stent o la
                    cirugía en el centro receptor.
                  </p>
                </div>
                <div
                  role="group"
                  aria-label="Filtro de signos radiológicos"
                  className="flex w-fit flex-wrap gap-2 rounded-xl border border-[#dfe9eb] bg-slate-50 p-1"
                >
                  <Choice
                    active={state.lumenFilter === 'all'}
                    onClick={() => update({ lumenFilter: 'all' })}
                  >
                    Ver todos
                  </Choice>
                  <Choice
                    active={state.lumenFilter === 'true'}
                    onClick={() => update({ lumenFilter: 'true' })}
                  >
                    Priorizar luz verdadera
                  </Choice>
                  <Choice
                    active={state.lumenFilter === 'false'}
                    onClick={() => update({ lumenFilter: 'false' })}
                  >
                    Priorizar luz falsa
                  </Choice>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto rounded-lg border border-[#dfe9eb]">
                <table
                  id="lumen-table"
                  className="w-full border-collapse text-left text-sm [&_th]:bg-[#eef6f8] [&_th]:p-3 [&_th]:font-semibold [&_th]:text-[#2b5d68] [&_td]:p-3 [&_td]:align-top [&_tr]:border-b [&_tr]:border-[#dfe9eb] [&_tr:last-child]:border-b-0"
                >
                  <thead>
                    <tr>
                      <th>Criterio en Angio-TC</th>
                      <th>Luz verdadera</th>
                      <th>Luz falsa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={
                        state.lumenFilter === 'all'
                          ? ''
                          : state.lumenFilter === 'true'
                            ? 'bg-[#e8f2f4]'
                            : 'opacity-65'
                      }
                    >
                      <td>Calibre y morfología</td>
                      <td>Menor calibre (compresión extrínseca por la falsa)</td>
                      <td>Mayor calibre respecto a la luz verdadera</td>
                    </tr>
                    <tr
                      className={
                        state.lumenFilter === 'all'
                          ? ''
                          : state.lumenFilter === 'true'
                            ? 'bg-[#e8f2f4]'
                            : 'opacity-65'
                      }
                    >
                      <td>Pared y calcificaciones</td>
                      <td>
                        Presencia de calcificaciones en pared externa; continuidad con aorta no
                        disecada
                      </td>
                      <td>
                        Puede trombosarse (pared de baja densidad) y presenta mayor riesgo de
                        ruptura
                      </td>
                    </tr>
                    <tr
                      className={
                        state.lumenFilter === 'all'
                          ? ''
                          : state.lumenFilter === 'false'
                            ? 'bg-[#e8f2f4]'
                            : 'opacity-65'
                      }
                    >
                      <td>Dinámica de contraste</td>
                      <td>Opacificación precoz, contigua a la raíz aórtica</td>
                      <td>Menor densidad de contraste por opacificación retardada</td>
                    </tr>
                    <tr
                      className={
                        state.lumenFilter === 'all'
                          ? ''
                          : state.lumenFilter === 'false'
                            ? 'bg-[#e8f2f4]'
                            : 'opacity-65'
                      }
                    >
                      <td>Signos específicos</td>
                      <td>Flujo laminar preservado</td>
                      <td>
                        Signo del pico (ángulo agudo en cuña), signo de la telaraña (restos de
                        media) y signo de Mercedes-Benz (doble luz falsa)
                      </td>
                    </tr>
                    <tr
                      className={
                        state.lumenFilter === 'all'
                          ? ''
                          : state.lumenFilter === 'true'
                            ? 'bg-[#e8f2f4]'
                            : 'opacity-65'
                      }
                    >
                      <td>Origen de ramas viscerales</td>
                      <td>Habitualmente origen del tronco celíaco, AMS y arteria renal derecha</td>
                      <td>
                        Generalmente la arteria renal izquierda nace de la luz falsa; localización
                        anterolateral derecha en ascendente y posterolateral izquierda en
                        descendente
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }} className="grid gap-4 md:grid-cols-3">
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <Badge tone={'primary'}>Etiología frecuente</Badge>
                <h3
                  style={{ marginTop: '.5rem' }}
                  className="mb-2 text-base font-semibold text-[#2b5d68]"
                >
                  Hipertensión arterial (40–75 %)
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  Principal factor adquirido, exacerbado por el tabaco. El esfuerzo físico o el
                  estrés emocional preceden el dolor agudo en el 66 % de los casos por picos
                  tensionales.
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <Badge tone={'warning'}>Pacientes &lt; 40 años</Badge>
                <h3
                  style={{ marginTop: '.5rem' }}
                  className="mb-2 text-base font-semibold text-[#2b5d68]"
                >
                  Conectivopatías y congénitas
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  Síndrome de Marfan (presente en 15–50 % de los &lt; 40 años), Ehlers-Danlos tipo
                  IV (procolágeno III), válvula aórtica bicúspide y coartación de aorta.
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <Badge tone={'error'}>Otros factores y fármacos</Badge>
                <h3
                  style={{ marginTop: '.5rem' }}
                  className="mb-2 text-base font-semibold text-[#2b5d68]"
                >
                  Cocaína, embarazo y fluoroquinolonas
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  Vasculitis aórtica, abuso de cocaína, embarazo e intervenciones cardíacas previas.
                  Evitar fluoroquinolonas en pacientes de riesgo (OR 2,38; IC 95 % 1,71–3,32).
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="diagnostico" className="scroll-mt-24 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2 border-b border-[#dfe9eb] pb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#516f75]">
                2 · Diagnóstico y estratificación de riesgo
              </span>
              <h2 className="text-xl font-semibold text-[#2b5d68]">
                ADD-RS y orientación diagnóstica
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Calcula la puntuación ADD-RS al pie de cama para decidir entre Angio-TC directa,
                cribado con Dímero-D o protocolo POCUS en el paciente inestable.
              </p>
            </div>
            <div className="grid items-start gap-5 lg:grid-cols-2">
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3
                    style={{ margin: '0' }}
                    className="mb-2 text-base font-semibold text-[#2b5d68]"
                  >
                    Calculadora clínica ADD-RS
                  </h3>
                  <Badge tone={score >= 2 ? 'error' : 'primary'}>
                    ADD-RS: {score} / 3 · {score >= 2 ? 'Alto riesgo' : 'Riesgo bajo'}
                  </Badge>
                </div>
                <p style={{ marginBottom: '1rem' }} className="text-sm leading-6 text-slate-600">
                  Un punto por cada categoría con al menos un hallazgo positivo (máximo 3 puntos).
                </p>
                <div className="mb-4 rounded-xl border border-[#dfe9eb] bg-slate-50 p-3 sm:p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <strong>1. Trastornos predisponentes de alto riesgo</strong>
                    <Badge tone={'primary'}>{state.addrs.dom1.length > 0 ? 1 : 0} pt</Badge>
                  </div>
                  <ChecklistItem
                    checked={state.addrs.dom1.includes('Marfan o conectivopatía')}
                    onClick={() => toggleFinding('dom1', 'Marfan o conectivopatía')}
                  >
                    Síndrome de Marfan o enfermedad del tejido conectivo
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.addrs.dom1.includes('Antecedente familiar')}
                    onClick={() => toggleFinding('dom1', 'Antecedente familiar')}
                  >
                    Antecedente familiar de patología aórtica
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.addrs.dom1.includes('Valvulopatía aórtica')}
                    onClick={() => toggleFinding('dom1', 'Valvulopatía aórtica')}
                  >
                    Valvulopatía aórtica conocida (p. ej. bicúspide)
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.addrs.dom1.includes('Manipulación aórtica reciente')}
                    onClick={() => toggleFinding('dom1', 'Manipulación aórtica reciente')}
                  >
                    Manipulación aórtica o cirugía cardíaca reciente
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.addrs.dom1.includes('Aneurisma torácico conocido')}
                    onClick={() => toggleFinding('dom1', 'Aneurisma torácico conocido')}
                  >
                    Aneurisma de aorta torácica conocido
                  </ChecklistItem>
                </div>
                <div className="mb-4 rounded-xl border border-[#dfe9eb] bg-slate-50 p-3 sm:p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <strong>2. Características del dolor de alto riesgo</strong>
                    <Badge tone={'primary'}>{state.addrs.dom2.length > 0 ? 1 : 0} pt</Badge>
                  </div>
                  <ChecklistItem
                    checked={state.addrs.dom2.includes('Inicio brusco')}
                    onClick={() => toggleFinding('dom2', 'Inicio brusco')}
                  >
                    Inicio súbito / brusco en tórax, espalda o abdomen
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.addrs.dom2.includes('Intensidad severa')}
                    onClick={() => toggleFinding('dom2', 'Intensidad severa')}
                  >
                    Intensidad severa máxima desde el comienzo
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.addrs.dom2.includes('Carácter desgarrante')}
                    onClick={() => toggleFinding('dom2', 'Carácter desgarrante')}
                  >
                    Carácter desgarrante, punzante o quemante
                  </ChecklistItem>
                </div>
                <div
                  style={{ marginBottom: '1rem' }}
                  className="mb-4 rounded-xl border border-[#dfe9eb] bg-slate-50 p-3 sm:p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <strong>3. Hallazgos de alto riesgo en el examen físico</strong>
                    <Badge tone={'primary'}>{state.addrs.dom3.length > 0 ? 1 : 0} pt</Badge>
                  </div>
                  <ChecklistItem
                    checked={state.addrs.dom3.includes('Déficit de pulso o diferencia de PA')}
                    onClick={() => toggleFinding('dom3', 'Déficit de pulso o diferencia de PA')}
                  >
                    Déficit de pulso o diferencia de PA entre brazos
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.addrs.dom3.includes('Déficit neurológico focal')}
                    onClick={() => toggleFinding('dom3', 'Déficit neurológico focal')}
                  >
                    Déficit neurológico focal o síncope / lipotimia
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.addrs.dom3.includes('Soplo nuevo de IA')}
                    onClick={() => toggleFinding('dom3', 'Soplo nuevo de IA')}
                  >
                    Soplo nuevo de regurgitación aórtica
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.addrs.dom3.includes('Hipotensión o shock')}
                    onClick={() => toggleFinding('dom3', 'Hipotensión o shock')}
                  >
                    Hipotensión arterial o estado de shock
                  </ChecklistItem>
                </div>
                <div className="min-w-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Estado hemodinámico para traslado a TC
                      </span>
                      <div
                        role="group"
                        aria-label="Estado hemodinámico"
                        className="flex w-fit flex-wrap gap-2 rounded-xl border border-[#dfe9eb] bg-slate-50 p-1"
                      >
                        <Choice
                          active={state.stability === 'estable'}
                          onClick={() => update({ stability: 'estable' })}
                        >
                          Estable
                        </Choice>
                        <Choice
                          active={state.stability === 'inestable'}
                          onClick={() => update({ stability: 'inestable' })}
                        >
                          Inestable
                        </Choice>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="ddimer-input"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Dímero-D si disponible (ng/mL)
                      </label>
                      <input
                        type="number"
                        id="ddimer-input"
                        min="0"
                        max="20000"
                        step="10"
                        placeholder="Ej. 350"
                        value={state.ddimer}
                        onChange={(event) => update({ ddimer: event.target.value })}
                        className="min-h-11 w-full rounded-lg border border-[#c8dde3] bg-white px-3 py-2 text-base text-slate-900 focus:border-[#3d7684]"
                      />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <ChecklistItem
                    checked={state.highSuspicionOverride}
                    onClick={() => update({ highSuspicionOverride: !state.highSuspicionOverride })}
                  >
                    Mantengo sospecha clínica alta pese a ADD-RS 0–1
                  </ChecklistItem>
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <h3 className="mb-2 text-base font-semibold text-[#2b5d68]">
                  Conducta diagnóstica recomendada
                </h3>
                <p style={{ marginBottom: '1rem' }} className="text-sm leading-6 text-slate-600">
                  La ruta resaltada responde en tiempo real a tu valoración clínica y hemodinámica.
                </p>
                <div
                  id="algo-decision-banner"
                  aria-live="polite"
                  className={`rounded-xl border p-4 ${tones[decision.tone]}`}
                >
                  <div id="algo-headline" className="text-lg font-semibold">
                    {decision.headline}
                  </div>
                  <p style={{ margin: '.25rem 0 0' }}>{decision.detail}</p>
                </div>
                <div
                  id="node-unstable"
                  className={`mt-4 rounded-lg border p-4 text-sm ${decision.route === 'node-unstable' ? tones[decision.tone] : decision.route ? 'border-[#dfe9eb] bg-slate-50 opacity-65' : 'border-[#dfe9eb] bg-slate-50'}`}
                >
                  <strong>Ruta A · Paciente inestable (no apto para TC)</strong>
                  <p className="text-sm leading-6 text-slate-600">
                    Realizar POCUS a pie de cama (protocolo SPEED: ETT + aorta abdominal,
                    sensibilidad 93,2 %). Un hallazgo compatible (flap, derrame pericárdico,
                    dilatación raíz, IA severa) obliga a activar de inmediato al centro aórtico
                    receptor e iniciar terapia anti-impulso/soporte sin demora.
                  </p>
                </div>
                <div
                  id="node-direct-ct"
                  className={`mt-4 rounded-lg border p-4 text-sm ${decision.route === 'node-direct-ct' ? tones[decision.tone] : decision.route ? 'border-[#dfe9eb] bg-slate-50 opacity-65' : 'border-[#dfe9eb] bg-slate-50'}`}
                >
                  <strong>Ruta B · ADD-RS ≥ 2 o sospecha clínica alta</strong>
                  <p className="text-sm leading-6 text-slate-600">
                    Indicación directa de Angio-TC toracoabdominal urgente. No esperar a resultados
                    de analítica ni solicitar Dímero-D. Iniciar control de FC y TA ya en el box de
                    urgencias.
                  </p>
                </div>
                <div
                  id="node-ddimer-pos"
                  className={`mt-4 rounded-lg border p-4 text-sm ${decision.route === 'node-ddimer-pos' ? tones[decision.tone] : decision.route ? 'border-[#dfe9eb] bg-slate-50 opacity-65' : 'border-[#dfe9eb] bg-slate-50'}`}
                >
                  <strong>Ruta C1 · ADD-RS ≤ 1 con Dímero-D ≥ 500 ng/mL o duda persistente</strong>
                  <p className="text-sm leading-6 text-slate-600">
                    Realizar Angio-TC toracoabdominal urgente. El Dímero-D elevado obliga a
                    descartar síndrome aórtico agudo mediante imagen.
                  </p>
                </div>
                <div
                  id="node-ddimer-neg"
                  className={`mt-4 rounded-lg border p-4 text-sm ${decision.route === 'node-ddimer-neg' ? tones[decision.tone] : decision.route ? 'border-[#dfe9eb] bg-slate-50 opacity-65' : 'border-[#dfe9eb] bg-slate-50'}`}
                >
                  <strong>Ruta C2 · ADD-RS ≤ 1 con Dímero-D &lt; 500 ng/mL y sospecha baja</strong>
                  <p className="text-sm leading-6 text-slate-600">
                    Descartar sin imagen aórtica (tasa de fallos 0,3 %, estudio ADvISED). Buscar
                    diagnósticos alternativos. Regla de seguridad: un Dímero-D negativo nunca debe
                    absolver ni retrasar la TC si la sospecha clínica es alta.
                  </p>
                </div>
                <div
                  style={{ marginTop: '1rem', marginBottom: '0' }}
                  className="mb-4 rounded-xl border border-[#dfe9eb] bg-slate-50 p-3 sm:p-4"
                >
                  <Badge tone={'warning'}>Trampas diagnósticas en urgencias</Badge>
                  <p style={{ marginTop: '.25rem' }} className="text-sm leading-6 text-slate-600">
                    La presentación sin dolor típico, sin déficit de pulso o sin hipotensión dispara
                    el retraso diagnóstico. La ecocardiografía transtorácica aislada en paciente
                    estable no establece el diagnóstico definitivo (ACEP nivel B). Evitar
                    anticoagulación o fibrinólisis por confusión con síndrome coronario o TEP antes
                    de descartar disección.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="antiimpulso" className="scroll-mt-24 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2 border-b border-[#dfe9eb] pb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#516f75]">
                3 · Manejo farmacológico inicial y terapia anti-impulso
              </span>
              <h2 className="text-xl font-semibold text-[#2b5d68]">Tratamiento anti-impulso</h2>
              <p className="text-sm leading-6 text-slate-600">
                Reducir las fuerzas de cizallamiento parietal (dP/dt) exige bloquear la respuesta
                simpática antes de vasodilatar. Explora la secuencia y ajusta las dosis al peso del
                paciente.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <button
                aria-pressed={!state.trapSimulated && state.seqStep === 1}
                type="button"
                id="seq-1"
                onClick={() => update({ seqStep: 1, trapSimulated: false })}
                className={`flex min-w-0 flex-col gap-2 rounded-xl border p-4 text-left ${!state.trapSimulated && state.seqStep === 1 ? tones.primary : 'border-[#dfe9eb] bg-white'}`}
              >
                <span className="text-sm font-semibold text-[#3d7684]">01 · ANALGESIA OPIÁCEA</span>
                <span
                  style={{ margin: '0' }}
                  className="mb-2 text-base font-semibold text-[#2b5d68]"
                >
                  Suprimir dolor y descarga adrenérgica
                </span>
                <span className="text-sm leading-6 text-slate-600">
                  Cloruro mórfico o fentanilo IV titulado. El dolor desgarrante dispara la
                  liberación de catecolaminas y eleva la FC y la TAS de forma refleja.
                </span>
              </button>
              <button
                aria-pressed={!state.trapSimulated && state.seqStep === 2}
                type="button"
                id="seq-2"
                onClick={() => update({ seqStep: 2, trapSimulated: false })}
                className={`flex min-w-0 flex-col gap-2 rounded-xl border p-4 text-left ${!state.trapSimulated && state.seqStep === 2 ? tones.primary : 'border-[#dfe9eb] bg-white'}`}
              >
                <span className="text-sm font-semibold text-[#3d7684]">
                  02 · CONTROL PRIORITARIO DE FC
                </span>
                <span
                  style={{ margin: '0' }}
                  className="mb-2 text-base font-semibold text-[#2b5d68]"
                >
                  Betabloqueo IV antes de vasodilatar
                </span>
                <span className="text-sm leading-6 text-slate-600">
                  Meta estricta ≤ 60 lpm (ESC 2024) o 60–80 lpm (ACC/AHA). Esmolol o labetalol IV
                  reducen la pendiente de eyección ventricular (dP/dt).
                </span>
              </button>
              <button
                aria-pressed={!state.trapSimulated && state.seqStep === 3}
                type="button"
                id="seq-3"
                onClick={() => update({ seqStep: 3, trapSimulated: false })}
                className={`flex min-w-0 flex-col gap-2 rounded-xl border p-4 text-left ${state.trapSimulated ? tones.error : !state.trapSimulated && state.seqStep === 3 ? tones.primary : 'border-[#dfe9eb] bg-white'}`}
              >
                <span className="text-sm font-semibold text-[#3d7684]">
                  03 · CONTROL DE TAS (100–120 mmHg)
                </span>
                <span
                  style={{ margin: '0' }}
                  className="mb-2 text-base font-semibold text-[#2b5d68]"
                >
                  Vasodilatador IV solo si persiste alta
                </span>
                <span className="text-sm leading-6 text-slate-600">
                  Añadir nicardipino, nitroprusiato o nitroglicerina IV únicamente tras lograr el
                  betabloqueo eficaz para evitar taquicardia refleja.
                </span>
              </button>
            </div>
            <div
              id="seq-feedback"
              style={{ marginBottom: '1.5rem' }}
              className="mb-6 rounded-xl border border-[#dfe9eb] bg-[#eef6f8] p-4"
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div>
                  <Badge
                    tone={
                      state.trapSimulated
                        ? 'error'
                        : state.seqStep === 2
                          ? 'positive'
                          : state.seqStep === 3
                            ? 'warning'
                            : 'primary'
                    }
                  >
                    {sequence.headline}
                  </Badge>
                  <p style={{ margin: '.5rem 0 0' }}>{sequence.detail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => update({ trapSimulated: !state.trapSimulated })}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#c8dde3] bg-white px-4 py-2 text-sm font-semibold text-[#2b5d68] hover:bg-[#eef6f8]"
                >
                  {state.trapSimulated
                    ? 'Restaurar secuencia segura'
                    : 'Simular error: vasodilatador sin betabloqueo'}
                </button>
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-5 grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_130px_auto]">
                <div>
                  <label
                    htmlFor="weight-slider"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Peso estimado del paciente (deslizador: 40–150 kg)
                  </label>
                  <input
                    type="range"
                    id="weight-slider"
                    min="40"
                    max="150"
                    step="1"
                    value={state.weightKg}
                    onChange={(event) => {
                      setWeightDraft(null);
                      update({ weightKg: clampWeight(event.target.value) });
                    }}
                    className="min-h-11 w-full accent-[#5a7f8a]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="weight-number"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Peso exacto (kg)
                  </label>
                  <input
                    type="number"
                    id="weight-number"
                    min="40"
                    max="150"
                    step="1"
                    value={weightDraft ?? state.weightKg}
                    onChange={(event) => {
                      const raw = event.target.value;
                      setWeightDraft(raw);
                      const value = Number(raw);
                      if (raw !== '' && Number.isFinite(value) && value >= 40 && value <= 150)
                        update({ weightKg: clampWeight(value) });
                    }}
                    onBlur={() => {
                      if (weightDraft !== null) update({ weightKg: clampWeight(weightDraft) });
                      setWeightDraft(null);
                    }}
                    className="min-h-11 w-full rounded-lg border border-[#c8dde3] bg-white px-3 py-2 text-base text-slate-900 focus:border-[#3d7684]"
                  />
                </div>
                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Guía objetivo de FC
                  </span>
                  <div
                    role="group"
                    aria-label="Criterio de frecuencia cardíaca"
                    className="flex w-fit flex-wrap gap-2 rounded-xl border border-[#dfe9eb] bg-slate-50 p-1"
                  >
                    <Choice
                      active={state.guideline === 'ESC'}
                      onClick={() => update({ guideline: 'ESC' })}
                    >
                      ESC 2024 (≤ 60 lpm)
                    </Choice>
                    <Choice
                      active={state.guideline === 'AHA'}
                      onClick={() => update({ guideline: 'AHA' })}
                    >
                      ACC/AHA (60–80 lpm)
                    </Choice>
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <Choice
                  active={state.bbContra}
                  onClick={() => update({ bbContra: !state.bbContra })}
                >
                  Contraindicación a betabloqueantes (asma grave / bloqueo AV)
                </Choice>
                <Badge tone={'primary'}>
                  Objetivos: {state.guideline === 'ESC' ? 'FC ≤ 60 lpm' : 'FC 60–80 lpm'} · PAS
                  100–120 mmHg
                </Badge>
              </div>
              <div className="mt-4 overflow-x-auto rounded-lg border border-[#dfe9eb]">
                <table className="w-full border-collapse text-left text-sm [&_th]:bg-[#eef6f8] [&_th]:p-3 [&_th]:font-semibold [&_th]:text-[#2b5d68] [&_td]:p-3 [&_td]:align-top [&_tr]:border-b [&_tr]:border-[#dfe9eb] [&_tr:last-child]:border-b-0">
                  <thead>
                    <tr>
                      <th>Fármaco y orden</th>
                      <th>Mecanismo y ventaja</th>
                      <th>Bolo / Dosis inicial</th>
                      <th>
                        Perfusión calculada (<span>{state.weightKg}</span> kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDrugs(state).map((drug) => (
                      <tr
                        key={drug.name}
                        className={
                          drug.highlight ? 'bg-[#e8f2f4]' : drug.dimmed ? 'opacity-65' : ''
                        }
                      >
                        <td>
                          <strong>{drug.name}</strong>
                        </td>
                        <td>{drug.mech}</td>
                        <td>{drug.bolus}</td>
                        <td>
                          <strong>{drug.infusion}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
        <section id="traslado" className="scroll-mt-24 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2 border-b border-[#dfe9eb] pb-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#516f75]">
                4 · Circuito y protocolo de traslado urgente
              </span>
              <h2 className="text-xl font-semibold text-[#2b5d68]">Preparación del traslado</h2>
              <p className="text-sm leading-6 text-slate-600">
                Las demoras quirúrgicas disparan la mortalidad preoperatoria. Un hospital sin
                cirugía cardiovascular debe activar el traslado medicalizado mientras estabiliza la
                perfusión y transmite las imágenes.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f2f4] font-semibold text-[#2b5d68]">
                  1
                </span>
                <h3 className="mb-2 text-base font-semibold text-[#2b5d68]">Alerta precoz</h3>
                <p className="text-sm leading-6 text-slate-600">
                  Contacto directo con Cirugía Cardiovascular del centro receptor y coordinación de
                  UVI móvil tras Angio-TC confirmatoria (o POCUS positivo en paciente inestable).
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f2f4] font-semibold text-[#2b5d68]">
                  2
                </span>
                <h3 className="mb-2 text-base font-semibold text-[#2b5d68]">
                  Envío DICOM y reserva
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  Transferencia telemática inmediata de la Angio-TC al PACS receptor. Dos vías
                  gruesas, analítica con pruebas cruzadas y sondaje vesical sin retrasar la salida.
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f2f4] font-semibold text-[#2b5d68]">
                  3
                </span>
                <h3 className="mb-2 text-base font-semibold text-[#2b5d68]">
                  Traslado en perfusión
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  Ambulancia medicalizada con bombas continuas (analgesia + esmolol/labetalol ±
                  vasodilatador) manteniendo FC ≤ 60 lpm y PAS 100–120 mmHg.
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f2f4] font-semibold text-[#2b5d68]">
                  4
                </span>
                <h3 className="mb-2 text-base font-semibold text-[#2b5d68]">
                  Destino según Stanford
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  Tipo A: emergencia quirúrgica directa a quirófano/UCC. Tipo B complicada: urgente
                  para TEVAR/cirugía. Tipo B no complicada: control médico estricto e interconsulta.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="min-w-0 rounded-xl border border-[#dfe9eb] bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3
                    style={{ margin: '0' }}
                    className="mb-2 text-base font-semibold text-[#2b5d68]"
                  >
                    Lista de verificación pre-traslado
                  </h3>
                  <Badge tone={'primary'}>{state.transferTasks.length} / 8 completados</Badge>
                </div>
                <p style={{ marginBottom: '1rem' }} className="text-sm leading-6 text-slate-600">
                  Marca las acciones completadas antes de la salida de la unidad de soporte vital
                  avanzado. El progreso se guarda automáticamente en la sesión.
                </p>
                <div id="transfer-checklist">
                  <ChecklistItem
                    checked={state.transferTasks.includes('contact')}
                    onClick={() => toggleTransferTask('contact')}
                  >
                    Contacto telefónico directo con Cirugía Cardiovascular del centro receptor
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.transferTasks.includes('ambulance')}
                    onClick={() => toggleTransferTask('ambulance')}
                  >
                    Activación de UVI móvil / transporte medicalizado prioritario (Código Aorta)
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.transferTasks.includes('dicom')}
                    onClick={() => toggleTransferTask('dicom')}
                  >
                    Envío telemático de imágenes de Angio-TC al centro receptor
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.transferTasks.includes('lines')}
                    onClick={() => toggleTransferTask('lines')}
                  >
                    Dos catéteres IV de grueso calibre y monitorización continua (ECG, PA, SpO2)
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.transferTasks.includes('analgesia')}
                    onClick={() => toggleTransferTask('analgesia')}
                  >
                    Analgesia opiácea IV administrada para control del dolor
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.transferTasks.includes('antiimpulse')}
                    onClick={() => toggleTransferTask('antiimpulse')}
                  >
                    Perfusión continua de betabloqueante IV (meta FC ≤ 60 lpm, PAS 100–120 mmHg)
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.transferTasks.includes('labs')}
                    onClick={() => toggleTransferTask('labs')}
                  >
                    Extracción de grupo sanguíneo, pruebas cruzadas, lactato y función renal
                  </ChecklistItem>
                  <ChecklistItem
                    checked={state.transferTasks.includes('diuresis')}
                    onClick={() => toggleTransferTask('diuresis')}
                  >
                    Registro de déficit de pulsos, focalidad neurológica y diuresis
                  </ChecklistItem>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={resetProtocol}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#c8dde3] bg-white px-4 py-2 text-sm font-semibold text-[#2b5d68] hover:bg-[#eef6f8]"
                >
                  {resetArmed ? 'Confirmar reinicio' : 'Reiniciar protocolo'}
                </button>
              </div>
              <div
                id="handoff-feedback"
                aria-live="polite"
                className="mt-2 min-h-5 text-sm text-emerald-800"
              >
                {resetArmed ? 'Pulsa de nuevo para limpiar todos los campos.' : ''}
              </div>
            </div>
          </div>
        </section>
      </div>
      <section aria-labelledby="aorta-report-title" className="w-full space-y-3">
        <h2 id="aorta-report-title" className="text-lg font-semibold text-[#2b5d68]">
          Resumen estructurado para el centro receptor
        </h2>
        <p className="text-sm text-slate-600">
          Se actualiza con la estratificación ADD-RS, el código TEM, la pauta por peso y la lista de
          verificación.
        </p>
        <InformeCopiable texto={buildSbarText(state)} />
      </section>
      <section
        aria-labelledby="aorta-references-title"
        className="rounded-xl border border-[#dfe9eb] bg-slate-50 p-5 text-xs leading-6 text-slate-500"
      >
        <h2 id="aorta-references-title" className="mb-2 font-semibold text-[#516f75]">
          Fuentes clínicas de referencia integradas en este protocolo
        </h2>
        <p>{REFERENCES}</p>
      </section>
    </div>
  );
}
