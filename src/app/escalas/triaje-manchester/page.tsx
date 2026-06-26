'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import {
  getAlgorithmById,
  getGlossaryEntry,
  getPriorityConfig,
  getSuggestedDestination,
  MANCHESTER_DISCRIMINATORS,
  MANCHESTER_PRIORITIES,
  type ManchesterAlgorithm,
  type ManchesterDiscriminator,
  type ManchesterDiscriminant,
  type ManchesterPatientGroup,
  type ManchesterPriorityLevel,
} from '@/lib/triajeManchesterData';

type TriageResult = {
  priority: ManchesterPriorityLevel;
  matchedDiscriminants?: ManchesterDiscriminant[];
  title?: string;
  description?: string;
  panelClassName?: string;
  hidePriorityHeader?: boolean;
};

const GROUP_LABELS: Record<ManchesterPatientGroup, string> = {
  adult: 'Adulto',
  pediatric: 'Pediátrico',
};

const PRIORITY_BADGE_CLASSES: Record<ManchesterPriorityLevel, string> = {
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-orange-100 text-orange-800 border-orange-200',
  3: 'bg-amber-100 text-amber-800 border-amber-200',
  4: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  5: 'bg-sky-100 text-sky-800 border-sky-200',
};

const RESULT_PANEL_CLASSES: Record<ManchesterPriorityLevel, string> = {
  1: 'resultado rojo',
  2: 'resultado naranja',
  3: 'resultado amarillo',
  4: 'resultado verde',
  5: 'rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-900',
};

const PRIORITY_SOLID_COLORS: Record<ManchesterPriorityLevel, string> = {
  1: 'bg-red-600',
  2: 'bg-orange-500',
  3: 'bg-amber-400',
  4: 'bg-emerald-500',
  5: 'bg-sky-500',
};

const collator = new Intl.Collator('es', { sensitivity: 'base' });

function sortDiscriminators<T extends { label: string }>(items: T[]) {
  return [...items].sort((a, b) => collator.compare(a.label, b.label));
}

export default function TriajeManchesterPage() {
  const [group, setGroup] = useState<ManchesterPatientGroup>('adult');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredDiscriminators = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    const matches = MANCHESTER_DISCRIMINATORS.filter((item) => {
      if (item.group !== group) return false;
      if (!normalizedQuery) return true;

      return item.label.toLowerCase().includes(normalizedQuery);
    });

    return sortDiscriminators(matches);
  }, [deferredQuery, group]);

  const selectedDiscriminator = useMemo(
    () =>
      filteredDiscriminators.find((item) => item.id === selectedId) ??
      filteredDiscriminators[0] ??
      null,
    [filteredDiscriminators, selectedId]
  );

  const selectedAlgorithm = useMemo(
    () => getAlgorithmById(selectedDiscriminator?.algorithmId),
    [selectedDiscriminator]
  );

  return (
    <main className="escala-wrapper escala-full space-y-6 px-4 py-6 sm:px-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#f5fbff_0%,#eef7ff_38%,#f8fbff_100%)] shadow-sm">
        <div className="space-y-4 px-5 py-6 sm:px-7">
          <div className="max-w-4xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Herramienta interactiva
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Triaje Manchester
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-700">
              Flujo secuencial por prioridades para seleccionar discriminadores y estimar el nivel
              de atención del paciente en urgencias, así como sugerir un destino para cada caso.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-5">
            {MANCHESTER_PRIORITIES.map((priority) => (
              <article
                key={priority.level}
                className={`rounded-xl border px-3 py-3 ${
                  PRIORITY_BADGE_CLASSES[priority.level]
                } bg-white/80`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em]">
                    P{priority.level}
                  </div>
                  <div className="text-xs font-semibold opacity-80">{priority.responseTarget}</div>
                </div>
                <div className="mt-2 text-sm font-semibold">{priority.colorName}</div>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-xs leading-5 text-slate-600">
            <span className="font-semibold text-slate-800">Bibliografia:</span> Emergency Triage.
            Manchester Triage Group. 3rd edition. Edited by Kevin Mackway-Jones, Janet Marsden and
            Jill Windle.
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Selección inicial</h2>
            <p className="mt-1 text-sm text-slate-600">
              Elige grupo y discriminador para abrir su algoritmo.
            </p>
          </div>

          <div className="grid items-end gap-3 xl:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">Grupo</span>
              <div className="grid grid-cols-2 gap-2">
                {(['adult', 'pediatric'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`flex h-[50px] items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition ${
                      group === item
                        ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    onClick={() => setGroup(item)}
                  >
                    {GROUP_LABELS[item]}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Buscar discriminador
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej. dolor abdominal, vómitos, disnea..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>Discriminadores</span>
            <span>{filteredDiscriminators.length}</span>
          </div>

          <div className="grid max-h-[42vh] gap-2 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3">
            {filteredDiscriminators.map((item) => {
              const active = item.id === selectedDiscriminator?.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? 'border-sky-500 bg-sky-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-medium leading-5 text-slate-900">
                      {item.label}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        item.algorithmStatus === 'ready'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.algorithmStatus === 'ready' ? 'Disponible' : 'Pendiente'}
                    </span>
                  </div>
                </button>
              );
            })}

            {!filteredDiscriminators.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600 md:col-span-2 2xl:col-span-3">
                No hay discriminadores que coincidan con esa búsqueda.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {!selectedDiscriminator && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-600">
            Selecciona un discriminador para empezar.
          </div>
        )}

        {selectedDiscriminator && !selectedAlgorithm && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {GROUP_LABELS[selectedDiscriminator.group]}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  {selectedDiscriminator.label}
                </h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Pendiente de transcripción
              </span>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
              <p className="text-sm leading-6 text-slate-700">
                Este discriminador ya está dado de alta en la herramienta, pero su algoritmo todavía
                no se ha convertido desde el PDF fuente. La UI y el motor secuencial están listos
                para cargarlo sin tocar la navegación.
              </p>
            </div>
          </div>
        )}

        {selectedDiscriminator && selectedAlgorithm && (
          <AlgorithmWorkbench
            key={selectedDiscriminator.id}
            algorithm={selectedAlgorithm}
            discriminator={selectedDiscriminator}
          />
        )}
      </section>
    </main>
  );
}

function AlgorithmWorkbench({
  algorithm,
  discriminator,
}: {
  algorithm: ManchesterAlgorithm;
  discriminator: ManchesterDiscriminator;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedByPriority, setSelectedByPriority] = useState<Record<string, string[]>>({});
  const [openGlossaryId, setOpenGlossaryId] = useState<string | null>(null);
  const [reachedFallback, setReachedFallback] = useState(false);

  const currentStep = algorithm.steps[stepIndex] ?? null;
  const currentPriority = currentStep?.priority ?? null;
  const currentSelection = currentPriority
    ? (selectedByPriority[String(currentPriority)] ?? [])
    : [];
  const visitedPriorityLevels = algorithm.steps
    .slice(0, stepIndex + 1)
    .map((step) => step.priority);

  const liveResult: TriageResult | null = (() => {
    if (algorithm.id === 'adult-focalidad-neurologica') {
      const selectedIds = selectedByPriority['2'] ?? [];
      const hasDuration = selectedIds.includes('inicio-de-los-sintomas-menor-de-4-5h');
      const focalSignsCount = selectedIds.filter((id) =>
        ['lenguaje-anormal', 'asimetria-facial', 'asimetria-en-mmss'].includes(id)
      ).length;

      if (!selectedIds.length && !reachedFallback) return null;

      if (focalSignsCount >= 2 || (focalSignsCount >= 1 && hasDuration)) {
        return {
          priority: 2,
          matchedDiscriminants: algorithm.steps[0]?.discriminants.filter((item) =>
            selectedIds.includes(item.id)
          ),
        };
      }

      return {
        priority: algorithm.fallbackPriority,
        title: algorithm.fallbackTitle,
        description: algorithm.fallbackDescription,
        panelClassName: algorithm.fallbackPanelClassName,
        hidePriorityHeader: algorithm.fallbackHidePriority,
      };
    }

    for (const step of algorithm.steps) {
      const selectedIds = selectedByPriority[String(step.priority)] ?? [];
      if (!selectedIds.length) continue;

      return {
        priority: step.resultPriority ?? step.priority,
        matchedDiscriminants: step.discriminants.filter((item) => selectedIds.includes(item.id)),
        title: step.resultTitle,
        description: step.resultDescription,
        panelClassName: step.resultPanelClassName,
      };
    }

    if (reachedFallback) {
      return {
        priority: algorithm.fallbackPriority,
        title: algorithm.fallbackTitle,
        description: algorithm.fallbackDescription,
        panelClassName: algorithm.fallbackPanelClassName,
        hidePriorityHeader: algorithm.fallbackHidePriority,
      };
    }

    return null;
  })();

  const progressPriority =
    reachedFallback && !liveResult?.matchedDiscriminants?.length
      ? algorithm.fallbackPriority
      : (currentPriority ?? 1);
  const suggestedDestination = liveResult
    ? getSuggestedDestination(algorithm.id, liveResult.priority)
    : null;

  function resetAlgorithm() {
    setStepIndex(0);
    setSelectedByPriority({});
    setOpenGlossaryId(null);
    setReachedFallback(false);
  }

  function toggleDiscriminant(discriminantId: string) {
    if (!currentStep) return;

    setSelectedByPriority((prev) => {
      const stepKey = String(currentStep.priority);
      const previous = prev[stepKey] ?? [];
      const next = previous.includes(discriminantId)
        ? previous.filter((item) => item !== discriminantId)
        : [...previous, discriminantId];

      return {
        ...prev,
        [stepKey]: next,
      };
    });

    setReachedFallback(false);
  }

  function goToPreviousStep() {
    if (reachedFallback) {
      setReachedFallback(false);
      setOpenGlossaryId(null);
      return;
    }

    if (stepIndex === 0) return;
    setStepIndex((prev) => Math.max(0, prev - 1));
    setReachedFallback(false);
    setOpenGlossaryId(null);
  }

  function goToNextStep() {
    if (!currentStep) return;

    if (stepIndex >= algorithm.steps.length - 1) {
      setReachedFallback(true);
      setOpenGlossaryId(null);
      return;
    }

    setOpenGlossaryId(null);
    setStepIndex((prev) => prev + 1);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {GROUP_LABELS[discriminator.group]}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">{discriminator.label}</h2>
        </div>
        <button
          type="button"
          onClick={resetAlgorithm}
          className="rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-sky-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
        >
          Reiniciar
        </button>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="overflow-hidden rounded-full border border-slate-200 bg-white shadow-inner">
          <div className="grid grid-cols-5 gap-px bg-slate-200">
            {MANCHESTER_PRIORITIES.map((priority) => {
              const isCurrent = priority.level === progressPriority;
              const isVisited =
                priority.level < progressPriority ||
                (priority.level === algorithm.fallbackPriority && reachedFallback);
              const isSelectableResult =
                priority.level !== algorithm.fallbackPriority &&
                visitedPriorityLevels.includes(priority.level as 1 | 2 | 3 | 4) &&
                (selectedByPriority[String(priority.level)]?.length ?? 0) > 0;

              return (
                <div
                  key={priority.level}
                  className={`flex min-h-12 items-center justify-center text-sm font-bold transition ${
                    isCurrent
                      ? `${PRIORITY_SOLID_COLORS[priority.level]} text-white`
                      : isSelectableResult
                        ? 'bg-white text-slate-900'
                        : isVisited
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-white text-slate-400'
                  }`}
                  title={`Prioridad ${priority.level}`}
                >
                  {priority.level}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {currentStep ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {reachedFallback ? 'Resultado final' : 'Paso actual'}
              </div>
              {reachedFallback ? (
                <h3 className="mt-1 text-xl font-semibold text-slate-900">
                  Resultado final del algoritmo
                </h3>
              ) : (
                <>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">
                    Prioridad {currentStep.priority} ·{' '}
                    {getPriorityConfig(currentStep.priority)?.colorName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Selecciona una opcion si procede. Si no, avanza a la siguiente pantalla.
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-100"
                onClick={goToPreviousStep}
                disabled={stepIndex === 0}
              >
                Anterior
              </button>
              <button
                type="button"
                className="rounded-full border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:border-sky-700 hover:bg-sky-700"
                onClick={goToNextStep}
              >
                {stepIndex >= algorithm.steps.length - 1 ? 'Terminar' : 'Siguiente'}
              </button>
            </div>
          </div>

          {!reachedFallback ? (
            <div className="mt-5 grid gap-3 xl:grid-cols-3">
              {currentStep.discriminants.map((item) => {
                const glossary = getGlossaryEntry(item.glossaryId);
                const isGlossaryOpen = openGlossaryId === item.id;
                const isSelected = currentSelection.includes(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleDiscriminant(item.id)}
                    className={`relative z-0 w-full rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:z-20 focus-within:z-20 ${
                      isGlossaryOpen ? 'z-30' : ''
                    } ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`${glossary ? 'pr-10 pb-8' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                        <div className="text-sm font-medium leading-6 text-slate-900">
                          {item.label}
                        </div>
                      </div>
                    </div>

                    {glossary && (
                      <div className="group absolute bottom-3 right-3">
                        <button
                          type="button"
                          aria-label={`Ver definición de ${glossary.label}`}
                          aria-expanded={isGlossaryOpen}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenGlossaryId((prev) => (prev === item.id ? null : item.id));
                          }}
                        >
                          i
                        </button>
                        <div
                          className={`absolute bottom-8 right-0 z-20 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-50 shadow-2xl transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${
                            isGlossaryOpen ? 'visible opacity-100' : 'invisible opacity-0'
                          }`}
                        >
                          <div className="font-semibold text-white">{glossary.label}</div>
                          <div className="mt-1 text-slate-200">{glossary.summary}</div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}

          {liveResult ? (
            <div
              className={`mt-5 ${liveResult.panelClassName ?? RESULT_PANEL_CLASSES[liveResult.priority]}`}
            >
              <div>
                {!liveResult.hidePriorityHeader ? (
                  <div className="puntos-total">
                    Resultado actual · Prioridad {liveResult.priority} ·{' '}
                    {getPriorityConfig(liveResult.priority)?.colorName}
                  </div>
                ) : null}
                <div className="interpretacion">
                  {liveResult.title ??
                    `${getPriorityConfig(liveResult.priority)?.clinicalLabel} · ${getPriorityConfig(liveResult.priority)?.responseTarget}`}
                </div>
                {suggestedDestination ? (
                  <div className="mt-2 text-sm font-semibold">
                    Destino sugerido: {suggestedDestination.code} · {suggestedDestination.label}
                  </div>
                ) : null}
                <div className="resultado-subtexto">
                  {liveResult.description ??
                    (liveResult.matchedDiscriminants?.length
                      ? `Discriminantes positivos: ${liveResult.matchedDiscriminants.map((item) => item.label).join(' · ')}`
                      : `No se ha marcado ningun discriminante en prioridades 1 a ${algorithm.steps.at(-1)?.priority ?? 4}, por lo que el resultado actual es prioridad ${algorithm.fallbackPriority}.`)}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
