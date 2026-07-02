import { prisma } from '@/lib/prisma';
import {
  HORARIOS,
  MONTHS,
  type MonthKey,
  type YearSchedule,
} from '@/lib/horariosData';

export type ScheduleRow = {
  id: string;
  year: number;
  month: MonthKey;
  url: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type HorariosSource = 'database' | 'static' | 'empty';

const monthOrder = new Map(MONTHS.map((month, index) => [month, index]));

function sortRows(rows: ScheduleRow[]) {
  return [...rows].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return (monthOrder.get(a.month) ?? 99) - (monthOrder.get(b.month) ?? 99);
  });
}

function groupRowsByYear(rows: ScheduleRow[]): YearSchedule[] {
  const grouped = new Map<number, YearSchedule>();

  for (const row of sortRows(rows)) {
    const existing = grouped.get(row.year) ?? {
      year: row.year,
      months: {},
    };

    existing.months[row.month] = row.url;
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
        id: `static-${entry.year}-${month}`,
        year: entry.year,
        month,
        url,
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
        url: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (rows.length === 0) {
      return { rows: [], source: 'empty' };
    }

    return {
      rows: sortRows(
        rows.map((row) => ({
          id: row.id,
          year: row.year,
          month: row.month as MonthKey,
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

  return HORARIOS;
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
