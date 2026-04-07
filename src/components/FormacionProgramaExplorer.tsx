'use client';

import { useDeferredValue, useState } from 'react';
import type { MuyeProgramData } from '@/lib/muyeProgramData';

type ProgramSection = MuyeProgramData['sections'][number];

type Props = {
  sections: MuyeProgramData['sections'];
  evaluationInstruments: MuyeProgramData['meta']['evaluationInstruments'];
};

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m8 6 4 4-4 4" />
    </svg>
  );
}

function countCompetencies(section: ProgramSection) {
  return section.domains.reduce((total, domain) => total + domain.competencies.length, 0);
}

function isCompetencyExpandable(
  competency: ProgramSection['domains'][number]['competencies'][number],
) {
  return Boolean(
    competency.activity ||
      competency.recommendations ||
      competency.context ||
      competency.evaluations.length > 0,
  );
}

export default function FormacionProgramaExplorer({ sections, evaluationInstruments }: Props) {
  const initialSection = sections.find((section) => section.id === 'especificas') ?? sections[0];
  type EvaluationCode = MuyeProgramData['meta']['evaluationInstruments'][number]['code'];
  const [selectedSectionId, setSelectedSectionId] = useState<ProgramSection['id']>(initialSection.id);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [onlyWithActivity, setOnlyWithActivity] = useState(false);
  const [selectedEvaluationCode, setSelectedEvaluationCode] = useState<EvaluationCode | null>(null);
  const [openDomainIds, setOpenDomainIds] = useState<Set<string>>(
    () => new Set(initialSection.domains.map((domain) => domain.id)),
  );
  const [openCompetencyIds, setOpenCompetencyIds] = useState<Set<string>>(() => new Set());
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const evaluationInstrumentMap = new Map(
    evaluationInstruments.map((instrument) => [instrument.code, instrument]),
  );
  const selectedEvaluation = selectedEvaluationCode
    ? evaluationInstrumentMap.get(selectedEvaluationCode) ?? null
    : null;

  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0];

  const visibleDomains = selectedSection.domains
    .filter((domain) => selectedDomainId === 'all' || domain.id === selectedDomainId)
    .map((domain) => ({
      ...domain,
      competencies: domain.competencies.filter((competency) => {
        if (onlyWithActivity && !competency.activity) return false;
        if (!deferredQuery) return true;

        const searchable = [
          competency.code,
          competency.text,
          competency.activity,
          competency.recommendations,
          competency.context,
          competency.evaluations.join(' '),
        ]
          .join(' ')
          .toLowerCase();

        return searchable.includes(deferredQuery);
      }),
    }))
    .filter((domain) => domain.competencies.length > 0);

  const visibleCount = visibleDomains.reduce((total, domain) => total + domain.competencies.length, 0);
  const visibleExpandableCompetencyIds = visibleDomains.flatMap((domain) =>
    domain.competencies.filter(isCompetencyExpandable).map((competency) => competency.id),
  );

  function toggleDomain(domainId: string) {
    setOpenDomainIds((current) => {
      const next = new Set(current);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  }

  function toggleCompetency(competencyId: string) {
    setOpenCompetencyIds((current) => {
      const next = new Set(current);
      if (next.has(competencyId)) next.delete(competencyId);
      else next.add(competencyId);
      return next;
    });
  }

  function expandAllVisible() {
    setOpenDomainIds(new Set(visibleDomains.map((domain) => domain.id)));
    setOpenCompetencyIds(new Set(visibleExpandableCompetencyIds));
  }

  function collapseAllVisible() {
    setOpenDomainIds((current) => {
      const next = new Set(current);
      visibleDomains.forEach((domain) => next.delete(domain.id));
      return next;
    });
    setOpenCompetencyIds((current) => {
      const next = new Set(current);
      visibleExpandableCompetencyIds.forEach((competencyId) => next.delete(competencyId));
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-[#d7e4ee] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-3">
          {sections.map((section) => {
            const active = section.id === selectedSection.id;
            const competencyCount = countCompetencies(section);

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  setSelectedSectionId(section.id);
                  setSelectedDomainId('all');
                  setOpenDomainIds(new Set(section.domains.map((domain) => domain.id)));
                  setOpenCompetencyIds(new Set());
                }}
                className={`rounded-[1.25rem] border p-4 text-left transition ${
                  active
                    ? 'border-[#2b5d68] bg-[#eef6f8] shadow-sm'
                    : 'border-[#d7e4ee] bg-[#fbfdfe] hover:border-[#bcd2d8] hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        active ? 'text-[#16353c]' : 'text-slate-950'
                      }`}
                    >
                      {section.title}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[#5d767d]">{section.summary}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      active
                        ? 'bg-[#2b5d68] text-white'
                        : 'border border-[#d7e4ee] bg-white text-[#5d767d]'
                    }`}
                  >
                    {active ? 'Activo' : 'Ver'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-wide text-[#5d767d]">
                  <span className="rounded-full bg-white px-2.5 py-1">
                    {section.domains.length} dominios
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1">
                    {competencyCount} competencias
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#ecf3f5] bg-[#fbfdfe] px-4 py-3 text-sm text-[#5d767d]">
          <p>
            Bloque activo: <span className="font-semibold text-slate-950">{selectedSection.title}</span>
          </p>
          <p className="shrink-0 text-xs font-medium uppercase tracking-wide text-[#2b5d68]">
            {selectedSection.domains.length} dominios · {countCompetencies(selectedSection)} competencias
          </p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[#d7e4ee] bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-900">Buscar competencia, técnica o actividad</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej. vía aérea, ecografía, simulación, trauma, portafolio"
              className="w-full rounded-2xl border border-[#d7e4ee] bg-[#fbfdfe] px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-[#3d7684] focus:bg-white"
            />
          </label>

          <label className="inline-flex items-center gap-3 rounded-2xl border border-[#d7e4ee] bg-[#fbfdfe] px-4 py-3 text-sm text-[#48636a]">
            <input
              type="checkbox"
              checked={onlyWithActivity}
              onChange={(event) => setOnlyWithActivity(event.target.checked)}
              className="h-4 w-4 rounded border-[#b9cbd0] text-[#2b5d68] focus:ring-[#2b5d68]"
            />
            Mostrar solo competencias con actividad formativa explícita
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedDomainId('all')}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              selectedDomainId === 'all'
                ? 'border-[#2b5d68] bg-[#2b5d68] text-white'
                : 'border-[#d7e4ee] bg-white text-[#5d767d] hover:border-[#bcd2d8] hover:bg-[#f5fafb]'
            }`}
          >
            Todos los dominios
          </button>

          {selectedSection.domains.map((domain) => (
            <button
              key={domain.id}
              type="button"
              onClick={() => {
                setSelectedDomainId(domain.id);
                setOpenDomainIds((current) => new Set(current).add(domain.id));
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                selectedDomainId === domain.id
                  ? 'border-[#2b5d68] bg-[#2b5d68] text-white'
                  : 'border-[#d7e4ee] bg-white text-[#5d767d] hover:border-[#bcd2d8] hover:bg-[#f5fafb]'
              }`}
            >
              {domain.title.replace(/^DOMINIO\s+/i, '')}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <p className="text-sm text-[#5d767d]">
            {visibleCount} competencias visibles en {visibleDomains.length} dominios.
          </p>
        </div>
      </div>

      {visibleDomains.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[#cfdde2] bg-white p-6 text-sm text-[#5d767d] shadow-sm">
          No hay resultados con los filtros actuales.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-[#ecf3f5] bg-[#fbfdfe] p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5d767d]">
                  Acciones de visualización
                </p>
                <p className="mt-1 text-sm text-[#5d767d]">
                  Controla la apertura o el cierre del conjunto de dominios y competencias visibles.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={expandAllVisible}
                  disabled={visibleDomains.length === 0}
                  className="rounded-full border border-[#d7e4ee] bg-white px-3 py-1.5 text-xs font-semibold text-[#2b5d68] transition hover:border-[#bcd2d8] hover:bg-[#f5fafb] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Expandir todo
                </button>
                <button
                  type="button"
                  onClick={collapseAllVisible}
                  disabled={visibleDomains.length === 0}
                  className="rounded-full border border-[#d7e4ee] bg-white px-3 py-1.5 text-xs font-semibold text-[#5d767d] transition hover:border-[#bcd2d8] hover:bg-[#f5fafb] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Contraer todo
                </button>
              </div>
            </div>
          </div>

          {visibleDomains.map((domain) => {
            const isDomainOpen = openDomainIds.has(domain.id);

            return (
              <section
                key={domain.id}
                className="rounded-[1.5rem] border border-[#d7e4ee] bg-white p-5 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleDomain(domain.id)}
                  className="flex w-full items-start gap-3 border-b border-[#ecf3f5] pb-4 text-left"
                >
                  <span
                    className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d7e4ee] bg-[#f7fbfc] text-[#5d767d] transition ${
                      isDomainOpen
                        ? 'rotate-90 border-[#b7d3da] bg-[#eef6f8] text-[#2b5d68]'
                        : ''
                    }`}
                  >
                    <ChevronIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                      {selectedSection.title}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">{domain.title}</h3>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-sm text-[#5d767d]">
                      {domain.competencies.length} competencias
                    </span>
                  </div>
                </button>

                {isDomainOpen ? <div className="mt-4 space-y-3">
                {domain.competencies.map((competency) => {
                  const isExpandable = isCompetencyExpandable(competency);

                  if (!isExpandable) {
                    return (
                      <div
                        key={competency.id}
                        className="rounded-2xl border border-[#e3edf0] bg-[#fbfdfe] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex min-w-12 justify-center rounded-full bg-[#e8f2f4] px-2.5 py-1 text-xs font-semibold text-[#2b5d68]">
                            {competency.code}
                          </span>
                          <span className="min-w-0 flex-1 text-sm font-medium leading-6 text-slate-900">
                            {competency.text}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const isCompetencyOpen = openCompetencyIds.has(competency.id);

                  return (
                    <div
                      key={competency.id}
                      className={`rounded-2xl border border-[#e3edf0] bg-[#fbfdfe] p-4 ${
                        isCompetencyOpen ? 'border-[#c4dbe1] bg-white' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleCompetency(competency.id)}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        <span
                          className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d7e4ee] bg-white text-[#6f858b] transition ${
                            isCompetencyOpen
                              ? 'rotate-90 border-[#b7d3da] bg-[#eef6f8] text-[#2b5d68]'
                              : ''
                          }`}
                        >
                          <ChevronIcon />
                        </span>
                        <span className="inline-flex min-w-12 justify-center rounded-full bg-[#e8f2f4] px-2.5 py-1 text-xs font-semibold text-[#2b5d68]">
                          {competency.code}
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-medium leading-6 text-slate-900">
                          {competency.text}
                        </span>
                      </button>

                      {isCompetencyOpen ? <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {competency.activity ? (
                          <div className="rounded-2xl border border-[#d7e4ee] bg-[#eef6f8] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                              Actividad formativa
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#48636a]">
                              {competency.activity}
                            </p>
                          </div>
                        ) : null}

                        {competency.recommendations ? (
                          <div className="rounded-2xl border border-[#dfe7ef] bg-[#f4f7fb] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#385f7a]">
                              Recomendaciones
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#516774]">
                              {competency.recommendations}
                            </p>
                          </div>
                        ) : null}

                        {competency.context ? (
                          <div className="rounded-2xl border border-[#d9e8e2] bg-[#f1f8f4] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#3c6f65]">
                              Contexto de aprendizaje
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#4b6861]">{competency.context}</p>
                          </div>
                        ) : null}

                        {competency.evaluations.length > 0 ? (
                          <div className="rounded-2xl border border-[#ece3f2] bg-[#faf7fc] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5a82]">
                              Evaluación
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {competency.evaluations.map((evaluation) => (
                                <button
                                  type="button"
                                  key={evaluation}
                                  onClick={() => setSelectedEvaluationCode(evaluation)}
                                  title={
                                    evaluationInstrumentMap.has(evaluation)
                                      ? `${evaluation}: ${evaluationInstrumentMap.get(evaluation)?.label}`
                                      : evaluation
                                  }
                                  aria-label={
                                    evaluationInstrumentMap.has(evaluation)
                                      ? `${evaluation}: ${evaluationInstrumentMap.get(evaluation)?.label}`
                                      : evaluation
                                  }
                                  className="cursor-pointer rounded-full border border-[#e0d9eb] bg-white px-2.5 py-1 text-xs font-medium text-[#6b5a82] transition hover:border-[#cbbdde] hover:bg-[#f7f2fb]"
                                >
                                  {evaluation}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div> : null}
                    </div>
                  );
                })}
                </div> : null}
              </section>
            );
          })}
        </div>
      )}

      {selectedEvaluation ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8"
          onClick={() => setSelectedEvaluationCode(null)}
        >
          <div
            className="w-full max-w-2xl rounded-[1.5rem] border border-[#d7e4ee] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b5a82]">
                  Instrumento de evaluación
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  {selectedEvaluation.code} · {selectedEvaluation.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvaluationCode(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d7e4ee] bg-white text-[#5d767d] transition hover:bg-[#f5fafb]"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-[#dfe7ef] bg-[#f4f7fb] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#385f7a]">
                  Qué es
                </p>
                <p className="mt-2 text-sm leading-6 text-[#516774]">
                  {selectedEvaluation.description}
                </p>
              </div>

              <div className="rounded-2xl border border-[#ece3f2] bg-[#faf7fc] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5a82]">
                  Qué evalúa
                </p>
                <p className="mt-2 text-sm leading-6 text-[#5f5570]">
                  {selectedEvaluation.assesses}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
