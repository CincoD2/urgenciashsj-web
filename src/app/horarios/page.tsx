"use client";

import { useEffect, useMemo, useState } from "react";

const MONTHS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
] as const;

type MonthKey = (typeof MONTHS)[number];

const MONTH_LABELS: Record<MonthKey, string> = {
  ENE: "Enero",
  FEB: "Febrero",
  MAR: "Marzo",
  ABR: "Abril",
  MAY: "Mayo",
  JUN: "Junio",
  JUL: "Julio",
  AGO: "Agosto",
  SEP: "Septiembre",
  OCT: "Octubre",
  NOV: "Noviembre",
  DIC: "Diciembre",
};

const MONTH_ALIASES: Record<MonthKey, string[]> = {
  ENE: ["ene", "enero", "1", "01"],
  FEB: ["feb", "febrero", "2", "02"],
  MAR: ["mar", "marzo", "3", "03"],
  ABR: ["abr", "abril", "4", "04"],
  MAY: ["may", "mayo", "5", "05"],
  JUN: ["jun", "junio", "6", "06"],
  JUL: ["jul", "julio", "7", "07"],
  AGO: ["ago", "agosto", "8", "08"],
  SEP: ["sep", "sept", "septiembre", "9", "09"],
  OCT: ["oct", "octubre", "10"],
  NOV: ["nov", "noviembre", "11"],
  DIC: ["dic", "diciembre", "12"],
};

type YearSchedule = {
  year: number;
  links?: { label: string; url: string }[];
  months: Partial<Record<MonthKey, string>>;
};

const HORARIOS: YearSchedule[] = [
  {
    year: 2026,
    /* links: [
      {
        label: "Rueda",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/20181217%20Turno%20Rodado%20Urgencias%20VPS%202019%20Oficial.pdf",
      },
    ], */
    months: {
      ENE: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202601.pdf?csf=1&web=1&e=SLnjEO",
      FEB: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202602.pdf?csf=1&web=1&e=l4fwle",
      MAR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202603.pdf?csf=1&web=1&e=0evzyA",
      ABR: "",
      MAY: "",
      JUN: "",
      JUL: "",
      AGO: "",
      SEP: "",
      OCT: "",
      NOV: "",
      DIC: "",
    },
  },
  {
    year: 2025,
    /* links: [
      {
        label: "Rueda",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/2018%20Turno%20Rodado.pdf",
      },
    ], */
    months: {
      ENE: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202501.pdf?csf=1&web=1&e=yrcBt5",
      FEB: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202502.pdf?csf=1&web=1&e=mpz3aB",
      MAR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202503.pdf?csf=1&web=1&e=MoEkBl",
      ABR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202504.pdf?csf=1&web=1&e=AmJy68",
      MAY: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202505.pdf?csf=1&web=1&e=mPSCRs",
      JUN: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202506.pdf?csf=1&web=1&e=gDbDnQ",
      JUL: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202507.pdf?csf=1&web=1&e=WoZh6J",
      AGO: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202508.pdf?csf=1&web=1&e=BDtCCS",
      SEP: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202509.pdf?csf=1&web=1&e=PbaxMi",
      OCT: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202510.pdf?csf=1&web=1&e=uGvFU5",
      NOV: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202511.pdf?csf=1&web=1&e=drIk3h",
      DIC: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202512.pdf?csf=1&web=1&e=clTEVI",
    },
  },
  {
    year: 2024,
    /* links: [
      {
        label: "Rueda",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/20161221%20Turno%20Rodado%202017.pdf",
      },
      {
        label: "Navidades 2016-2021",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/Navidades%202016-2021.pdf",
      },
    ], */
    months: {
      ENE: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202401.pdf?csf=1&web=1&e=nQ0TNc",
      FEB: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202402.pdf?csf=1&web=1&e=DFoa7X",
      MAR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202403.pdf?csf=1&web=1&e=fW4etk",
      ABR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202404.pdf?csf=1&web=1&e=9gRddE",
      MAY: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202405.pdf?csf=1&web=1&e=IPYiKc",
      JUN: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202406.pdf?csf=1&web=1&e=B96acr",
      JUL: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202407.pdf?csf=1&web=1&e=TtTD95",
      AGO: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202408.pdf?csf=1&web=1&e=HcfZQN",
      SEP: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202409.pdf?csf=1&web=1&e=P6Z2c1",
      OCT: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202410.pdf?csf=1&web=1&e=wa8lQY",
      NOV: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202411.pdf?csf=1&web=1&e=h3ehUr",
      DIC: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202412.pdf?csf=1&web=1&e=IofGPT",
    },
  },
  {
    year: 2023,
    /* links: [
      {
        label: "Rueda (feb 2016)",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/20160210%20Rueda%202016.pdf",
      },
      {
        label: "Rueda (dic 2015)",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/2016%20Turno%20Rodado.pdf",
      },
      {
        label: "Distribucion de turnos",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/20160216%20Distribuci%C3%B3n%20Trabajo.pdf",
      },
      {
        label: "Horario Sostenible",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/20160219%20Normas%20Horario%20Sostenible.pdf",
      },
    ], */
    months: {
      ENE: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202301.pdf?csf=1&web=1&e=N6MxO7",
      FEB: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202302.pdf?csf=1&web=1&e=FvDJan",
      MAR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202303.pdf?csf=1&web=1&e=13geEP",
      ABR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202304.pdf?csf=1&web=1&e=5Gbb72",
      MAY: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202305.pdf?csf=1&web=1&e=dTAyvb",
      JUN: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202306.pdf?csf=1&web=1&e=Y5XWkC",
      JUL: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202307.pdf?csf=1&web=1&e=8N881t",
      AGO: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202308.pdf?csf=1&web=1&e=7we7O3",
      SEP: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202309.pdf?csf=1&web=1&e=rRPUOH",
      OCT: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202310.pdf?csf=1&web=1&e=O3FGAT",
      NOV: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202311.pdf?csf=1&web=1&e=hcX8cb",
      DIC: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202312.pdf?csf=1&web=1&e=4XkT48",
    },
  },
  {
    year: 2022,
    /* links: [
      {
        label: "Rueda",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/Rueda2015.pdf",
      },
    ], */
    months: {
      ENE: "",
      FEB: "",
      MAR: "",
      ABR: "",
      MAY: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202205.pdf?csf=1&web=1&e=kfTu0S",
      JUN: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202206.pdf?csf=1&web=1&e=7qYxqC",
      JUL: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202207.pdf?csf=1&web=1&e=P1Yf83",
      AGO: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202208.pdf?csf=1&web=1&e=JnSaeh",
      SEP: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202209.pdf?csf=1&web=1&e=gsxxb7",
      OCT: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202210.pdf?csf=1&web=1&e=6P93Ut",
      NOV: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202211.pdf?csf=1&web=1&e=068oKI",
      DIC: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202212.pdf?csf=1&web=1&e=y6RewO",
    },
  },
];

export default function HorariosPage() {
  const [query, setQuery] = useState("");
  const [activeYear, setActiveYear] = useState(
    HORARIOS[0]?.year ?? new Date().getFullYear(),
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
    if (!normalizedQuery) return HORARIOS;

    return HORARIOS.filter((item) => {
      const yearMatch = parsedQuery.year
        ? item.year === parsedQuery.year
        : String(item.year).includes(normalizedQuery);

      const monthMatch = parsedQuery.month
        ? Boolean(item.months[parsedQuery.month])
        : MONTHS.some((month) => {
            const url = item.months[month];
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
  }, [normalizedQuery, parsedQuery.year, parsedQuery.month]);

  useEffect(() => {
    if (!filteredYears.length) return;
    if (!filteredYears.some((item) => item.year === activeYear)) {
      setActiveYear(filteredYears[0].year);
    }
  }, [filteredYears, activeYear]);

  const active = useMemo(() => {
    if (!filteredYears.length) return undefined;
    return (
      filteredYears.find((item) => item.year === activeYear) ?? filteredYears[0]
    );
  }, [activeYear, filteredYears]);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8aa0a6]">
              Servicio de Urgencias
            </p>
            <h1 className="text-3xl font-semibold text-[#1f4c57]">Horarios</h1>
          </div>
          <div className="rounded-full border border-[#dfe9eb] bg-white/80 px-3 py-1 text-xs font-semibold uppercase text-slate-500 shadow-sm">
            {filteredYears.length} años
          </div>
        </div>
        <p className="max-w-2xl text-sm text-slate-600">
          Selecciona un año y abre el PDF del mes correspondiente.
          <span className="font-semibold">HORARIOS</span> de esta página.
        </p>
      </header>

      <div className="rounded-2xl border border-[#dfe9eb] bg-gradient-to-br from-white via-[#f6f9fa] to-[#e7f0f2] p-4 shadow-sm">
        <div className="buscador-wrapper buscador-dietas">
          <span className="buscador-icon" aria-hidden>
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-5-5" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por año o mes (ej. 2025, marzo)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="buscador-input"
          />
          {query && (
            <button
              type="button"
              className="buscador-clear"
              onClick={() => setQuery("")}
              aria-label="Limpiar"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6l-12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {filteredYears.map((item) => {
            const isActive = item.year === active?.year;
            return (
              <button
                key={item.year}
                type="button"
                onClick={() => setActiveYear(item.year)}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-[#1f4c57] bg-[#1f4c57] text-white shadow-md"
                    : "border-[#dfe9eb] bg-white text-[#1f4c57] hover:border-[#1f4c57]/60 hover:bg-[#e7f0f2]"
                }`}
              >
                {item.year}
              </button>
            );
          })}
        </div>
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
                const url = active?.months?.[month];
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
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-[#dfe9eb] bg-[#f8fafc] px-4 py-6 text-sm text-slate-500">
          No hay resultados para esa busqueda.
        </div>
      )}
    </div>
  );
}
