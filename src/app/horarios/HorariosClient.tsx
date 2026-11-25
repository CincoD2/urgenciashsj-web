"use client";

import { useMemo, useState } from "react";
import ResourceSearchHeader from "@/components/ResourceSearchHeader";
import HeaderSearchInput from "@/components/HeaderSearchInput";
import { FilterButton } from "@/components/ui/SiteButton";
import TurnoRodado2027 from './TurnoRodado2027';

import {
  MONTHS,
  MONTH_ALIASES,
  MONTH_LABELS,
  type MonthKey,
  type YearSchedule,
} from "@/lib/horariosData";

type HorariosClientProps = {
  horarios: YearSchedule[];
};

export default function HorariosClient({ horarios }: HorariosClientProps) {
  const [query, setQuery] = useState("");
  const [activeYear, setActiveYear] = useState(
    horarios[0]?.year ?? new Date().getFullYear(),
  );

  const normalizedQuery = useMemo(
    () =>
      query
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9/ -]/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    [query],
  );

  const parsedQuery = useMemo(() => {
    if (!normalizedQuery) return { year: undefined, month: undefined };

    const parts = normalizedQuery.split(/[\s/-]+/).filter(Boolean);
    let year: number | undefined;
    let month: MonthKey | undefined;

    const resolveYear = (value: string) => {
      if (/^\d{4}$/.test(value)) return Number(value);
      if (/^\d{2}$/.test(value)) {
        const n = Number(value);
        return n <= 79 ? 2000 + n : 1900 + n;
      }
      return undefined;
    };

    const resolveMonth = (value: string) => {
      for (const key of MONTHS) {
        if (MONTH_ALIASES[key].includes(value)) {
          return key;
        }
      }
      return undefined;
    };

    for (const part of parts) {
      if (!year) year = resolveYear(part);
      if (!month) month = resolveMonth(part);
    }

    if (!year) {
      const yearMatch = normalizedQuery.match(/\b(\d{4}|\d{2})\b/);
      if (yearMatch) year = resolveYear(yearMatch[1]);
    }

    if (!month) {
      for (const key of MONTHS) {
        const aliases = MONTH_ALIASES[key];
        if (aliases.some((alias) => normalizedQuery.includes(alias))) {
          month = key;
          break;
        }
      }
    }

    return { year, month };
  }, [normalizedQuery]);

  const matchedMonths = useMemo(() => {
    if (!normalizedQuery) return [];
    if (parsedQuery.month) return [parsedQuery.month];
    return MONTHS.filter((month) => {
      const label = MONTH_LABELS[month].toLowerCase();
      return (
        MONTH_ALIASES[month].some((alias) => normalizedQuery.includes(alias)) ||
        label.includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, parsedQuery.month]);

  const filteredYears = useMemo(() => {
    if (!normalizedQuery) return horarios;

    return horarios.filter((item) => {
      const yearMatch = parsedQuery.year
        ? item.year === parsedQuery.year
        : String(item.year).includes(normalizedQuery);

      const monthMatch = parsedQuery.month
        ? Boolean(item.months[parsedQuery.month]?.url)
        : MONTHS.some((month) => {
            const url = item.months[month]?.url;
            if (!url) return false;
            const label = MONTH_LABELS[month].toLowerCase();
            return (
              MONTH_ALIASES[month].some((alias) =>
                normalizedQuery.includes(alias),
              ) || label.includes(normalizedQuery)
            );
          });

      if (parsedQuery.year && parsedQuery.month) {
        return yearMatch && monthMatch;
      }

      if (parsedQuery.year) return yearMatch;
      if (parsedQuery.month) return monthMatch;
      return yearMatch || monthMatch;
    });
  }, [horarios, normalizedQuery, parsedQuery.year, parsedQuery.month]);

  const resolvedActiveYear = useMemo(() => {
    if (!filteredYears.length) return undefined;
    return filteredYears.some((item) => item.year === activeYear)
      ? activeYear
      : filteredYears[0].year;
  }, [activeYear, filteredYears]);

  const active = useMemo(() => {
    if (!filteredYears.length || resolvedActiveYear === undefined) return undefined;
    return (
      filteredYears.find((item) => item.year === resolvedActiveYear) ??
      filteredYears[0]
    );
  }, [filteredYears, resolvedActiveYear]);

  return (
    <div className="space-y-6">
      <ResourceSearchHeader
        title="Horarios"
        badge="Servicio de Urgencias"
        description="Busca por año o mes, selecciona un año y abre el PDF del mes correspondiente."
        stats={
          <>
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 backdrop-blur-sm">{horarios.length} años</span>
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 backdrop-blur-sm">{horarios.reduce((total, item) => total + MONTHS.filter((month) => item.months[month]?.url).length, 0)} horarios mensuales</span>
            {query.trim() && <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1 backdrop-blur-sm">{filteredYears.length} años encontrados</span>}
          </>
        }
      >
        <HeaderSearchInput
          id="horarios-search"
          label="Buscar horarios"
          placeholder="Buscar por año o mes (p. ej., 2026, marzo)"
          value={query}
          onChange={setQuery}
        />
      </ResourceSearchHeader>

      <div className="flex flex-wrap gap-2" aria-label="Seleccionar año">
        {filteredYears.map((item) => (
          <FilterButton
            key={item.year}
            active={item.year === active?.year}
            filtering={Boolean(query.trim())}
            count={MONTHS.filter((month) => item.months[month]?.url).length}
            onClick={() => setActiveYear(item.year)}
            aria-label={`${item.year}, ${MONTHS.filter((month) => item.months[month]?.url).length} horarios mensuales`}
          >
            {item.year}
          </FilterButton>
        ))}
      </div>

      {filteredYears.length ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-[#1f4c57]">
              {active?.year}
            </h2>
            {matchedMonths.length > 0 ? (
              <div className="rounded-full border border-[#dfe9eb] bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-500">
                Mostrando:{" "}
                {matchedMonths.map((m) => MONTH_LABELS[m]).join(", ")}
              </div>
            ) : null}
          </div>

          {active?.links && active.links.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {active.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-[#1f4c57] bg-white px-4 py-1.5 text-sm font-semibold text-[#1f4c57] shadow-sm transition hover:bg-[#1f4c57] hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(matchedMonths.length > 0 ? matchedMonths : MONTHS).map(
              (month) => {
                const entry = active?.months?.[month];
                const url = entry?.url;
                if (url) {
                  return (
                    <a
                      key={month}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative overflow-hidden rounded-2xl border border-[#dfe9eb] bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#3d7684] hover:bg-[#f6f9fa]"
                    >
                      <span className="block text-xs font-semibold uppercase text-[#6b7f85]">
                        {active?.year}
                      </span>
                      <span className="mt-1 block text-lg font-semibold text-[#1f4c57]">
                        {month}
                      </span>
                      {entry.version > 1 ? (
                        <span className="mt-1 inline-flex rounded-full bg-[#e7f0f2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2b5d68]">
                          v{entry.version}
                        </span>
                      ) : null}
                      <span className="mt-2 inline-flex items-center text-xs font-semibold text-[#2b5d68]">
                        Abrir PDF
                        <svg
                          className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 12h14" />
                          <path d="M13 5l7 7-7 7" />
                        </svg>
                      </span>
                    </a>
                  );
                }

                return (
                  <span
                    key={month}
                    className="flex flex-col justify-between rounded-2xl border border-[#e5e7eb] bg-[#f3f6f7] px-4 py-3 text-left text-sm font-semibold text-[#8fa1a6]"
                  >
                    <span className="text-xs uppercase text-[#8fa1a6]/80">
                      {active?.year}
                    </span>
                    <span className="text-lg text-[#94a8ae]">{month}</span>
                    <span className="text-xs">Sin archivo</span>
                  </span>
                );
              },
            )}
          </div>
          {active?.year === 2027 && <TurnoRodado2027 />}
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-[#dfe9eb] bg-[#f8fafc] px-4 py-6 text-sm text-slate-500">
          No hay resultados para esa busqueda.
        </div>
      )}
    </div>
  );
}
