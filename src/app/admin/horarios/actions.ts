'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { MONTHS, type MonthKey } from '@/lib/horariosData';
import { getStaticScheduleRows } from '@/lib/horariosStore';
import { prisma } from '@/lib/prisma';

export type ScheduleActionState = {
  ok?: boolean;
  message?: string;
};

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  return session.user;
}

function parseYear(value: FormDataEntryValue | null) {
  const year = Number(String(value ?? ''));
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new Error('Año inválido.');
  }
  return year;
}

function parseMonth(value: FormDataEntryValue | null): MonthKey {
  const month = String(value ?? '').toUpperCase() as MonthKey;
  if (!MONTHS.includes(month)) {
    throw new Error('Mes inválido.');
  }
  return month;
}

function parseUrl(value: FormDataEntryValue | null) {
  const raw = String(value ?? '').trim();
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw new Error('URL inválida.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('La URL debe empezar por http:// o https://');
  }

  return raw;
}

function revalidateHorarios() {
  revalidatePath('/horarios');
  revalidatePath('/admin/horarios');
}

async function seedStaticHorariosIfDatabaseEmpty() {
  const count = await prisma.scheduleEntry.count();
  if (count > 0) return;

  const staticRows = getStaticScheduleRows();
  if (staticRows.length === 0) return;

  await prisma.$transaction(
    staticRows.map((row) =>
      prisma.scheduleEntry.upsert({
        where: {
          year_month_version: {
            year: row.year,
            month: row.month,
            version: 1,
          },
        },
        update: {
          url: row.url,
        },
        create: {
          year: row.year,
          month: row.month,
          version: 1,
          url: row.url,
        },
      })
    )
  );
}

export async function createScheduleEntry(
  _prevState: ScheduleActionState,
  formData: FormData
) {
  try {
    await assertAdmin();

    await seedStaticHorariosIfDatabaseEmpty();

    const year = parseYear(formData.get('year'));
    const month = parseMonth(formData.get('month'));
    const url = parseUrl(formData.get('url'));

    const latest = await prisma.scheduleEntry.findFirst({
      where: {
        year,
        month,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    await prisma.scheduleEntry.create({
      data: {
        year,
        month,
        version: (latest?.version ?? 0) + 1,
        url,
      },
    });

    revalidateHorarios();
    return {
      ok: true,
      message: `Horario añadido como v${(latest?.version ?? 0) + 1}.`,
    } as const;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se pudo añadir el horario.',
    } as const;
  }
}

export async function updateScheduleEntry(
  _prevState: ScheduleActionState,
  formData: FormData
) {
  try {
    await assertAdmin();

    const entryId = String(formData.get('entryId') ?? '').trim();
    if (!entryId) {
      return { ok: false, message: 'Registro no válido.' } as const;
    }

    const year = parseYear(formData.get('year'));
    const month = parseMonth(formData.get('month'));
    const version = Number(String(formData.get('version') ?? ''));
    const url = parseUrl(formData.get('url'));

    if (!Number.isInteger(version) || version < 1) {
      return { ok: false, message: 'Versión no válida.' } as const;
    }

    await prisma.scheduleEntry.update({
      where: { id: entryId },
      data: {
        year,
        month,
        version,
        url,
      },
    });

    revalidateHorarios();
    return { ok: true, message: 'Horario guardado.' } as const;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se pudo guardar el horario.',
    } as const;
  }
}

export async function deleteScheduleEntry(
  _prevState: ScheduleActionState,
  formData: FormData
) {
  try {
    await assertAdmin();

    const entryId = String(formData.get('entryId') ?? '').trim();
    if (!entryId) {
      return { ok: false, message: 'Registro no válido.' } as const;
    }

    await prisma.scheduleEntry.delete({
      where: { id: entryId },
    });

    revalidateHorarios();
    return { ok: true, message: 'Horario eliminado.' } as const;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se pudo eliminar el horario.',
    } as const;
  }
}

export async function importStaticHorarios(
  _prevState: ScheduleActionState,
  _formData: FormData
) {
  try {
    void _prevState;
    void _formData;

    await assertAdmin();

    await seedStaticHorariosIfDatabaseEmpty();

    revalidateHorarios();
    return { ok: true, message: 'Horarios importados.' } as const;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No se pudieron importar los horarios.',
    } as const;
  }
}
