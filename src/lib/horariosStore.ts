import { prisma } from '@/lib/prisma';
import {
  HORARIOS,
  MONTHS,
  type LegacyYearSchedule,
  type MonthKey,
  type YearSchedule,
} from '@/lib/horariosData';

export type ScheduleRow = {
  id: string;
  year: number;
  month: MonthKey;
  version: number;
  url: string;
  isLatest: boolean;
  totalVersions: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type HorariosSource = 'database' | 'static' | 'empty';

const monthOrder = new Map(MONTHS.map((month, index) => [month, index]));

function compareRows(a: Pick<ScheduleRow, 'year' | 'month' | 'version'>, b: Pick<ScheduleRow, 'year' | 'month' | 'version'>) {
  if (a.year !== b.year) return b.year - a.year;
  const monthDelta = (monthOrder.get(a.month) ?? 99) - (monthOrder.get(b.month) ?? 99);
  if (monthDelta !== 0) return monthDelta;
  return b.version - a.version;
}

function sortRows(rows: ScheduleRow[]) {
  return [...rows].sort(compareRows);
}

function annotateVersions(
  rows: Array<{
    id: string;
    year: number;
    month: MonthKey;
    version: number;
    url: string;
    createdAt?: Date;
    updatedAt?: Date;
  }>
) {
  const counters = new Map<string, number>();

  for (const row of rows) {
    const key = `${row.year}-${row.month}`;
    counters.set(key, Math.max(counters.get(key) ?? 0, row.version));
  }

  return sortRows(
    rows.map((row) => {
      const key = `${row.year}-${row.month}`;
      const totalVersions = counters.get(key) ?? row.version;
      return {
        ...row,
        isLatest: row.version === totalVersions,
        totalVersions,
      };
    })
  );
}

function legacyRowsToYearSchedules(entries: LegacyYearSchedule[]): YearSchedule[] {
  return entries.map((entry) => ({
    year: entry.year,
    links: entry.links,
    months: Object.fromEntries(
      MONTHS.flatMap((month) => {
        const url = entry.months[month];
        return url ? [[month, { url, version: 1 }]] : [];
      })
    ) as YearSchedule['months'],
  }));
}

function groupRowsByYear(rows: ScheduleRow[]): YearSchedule[] {
  const grouped = new Map<number, YearSchedule>();

  for (const row of sortRows(rows)) {
    if (!row.isLatest) continue;

    const existing = grouped.get(row.year) ?? {
      year: row.year,
      months: {},
    };

    existing.months[row.month] = {
      url: row.url,
      version: row.version,
    };
    grouped.set(row.year, existing);
  }

  return [...grouped.values()].sort((a, b) => b.year - a.year);
}

export function getStaticScheduleRows(): ScheduleRow[] {
  const rows: ScheduleRow[] = [];

  for (const entry of HORARIOS) {
    for (const month of MONTHS) {
      const url = entry.months[month];
      if (!url) continue;
      rows.push({
        id: `static-${entry.year}-${month}-v1`,
        year: entry.year,
        month,
        version: 1,
        url,
        isLatest: true,
        totalVersions: 1,
      });
    }
  }

  return sortRows(rows);
}

export async function getScheduleRows(): Promise<{
  rows: ScheduleRow[];
  source: HorariosSource;
}> {
  try {
    const rows = await prisma.scheduleEntry.findMany({
      select: {
        id: true,
        year: true,
        month: true,
        version: true,
        url: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (rows.length === 0) {
      return { rows: [], source: 'empty' };
    }

    return {
      rows: annotateVersions(
        rows.map((row) => ({
          id: row.id,
          year: row.year,
          month: row.month as MonthKey,
          version: row.version,
          url: row.url,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }))
      ),
      source: 'database',
    };
  } catch {
    return { rows: getStaticScheduleRows(), source: 'static' };
  }
}

export async function getHorarios(): Promise<YearSchedule[]> {
  const { rows, source } = await getScheduleRows();
  if (source === 'database' && rows.length > 0) {
    return groupRowsByYear(rows);
  }

  return legacyRowsToYearSchedules(HORARIOS);
}

export async function getHorariosCacheKey() {
  try {
    const [count, latest] = await Promise.all([
      prisma.scheduleEntry.count(),
      prisma.scheduleEntry.aggregate({ _max: { updatedAt: true } }),
    ]);

    return `db:${count}:${latest._max.updatedAt?.toISOString() ?? 'none'}`;
  } catch {
    return `static:${getStaticScheduleRows().length}`;
  }
}
