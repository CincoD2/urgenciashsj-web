'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { MONTHS, type MonthKey } from '@/lib/horariosData';
import { getStaticScheduleRows } from '@/lib/horariosStore';
import { prisma } from '@/lib/prisma';

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
          year_month: {
            year: row.year,
            month: row.month,
          },
        },
        update: {
          url: row.url,
        },
        create: {
          year: row.year,
          month: row.month,
          url: row.url,
        },
      })
    )
  );
}

export async function createScheduleEntry(formData: FormData) {
  await assertAdmin();

  await seedStaticHorariosIfDatabaseEmpty();

  const year = parseYear(formData.get('year'));
  const month = parseMonth(formData.get('month'));
  const url = parseUrl(formData.get('url'));

  const existing = await prisma.scheduleEntry.findUnique({
    where: {
      year_month: {
        year,
        month,
      },
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error('Ya existe un horario para ese año y mes.');
  }

  await prisma.scheduleEntry.create({
    data: {
      year,
      month,
      url,
    },
  });

  revalidateHorarios();
}

export async function updateScheduleEntry(formData: FormData) {
  await assertAdmin();

  const entryId = String(formData.get('entryId') ?? '').trim();
  if (!entryId) {
    throw new Error('Registro no válido.');
  }

  const year = parseYear(formData.get('year'));
  const month = parseMonth(formData.get('month'));
  const url = parseUrl(formData.get('url'));

  const duplicate = await prisma.scheduleEntry.findFirst({
    where: {
      year,
      month,
      id: { not: entryId },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new Error('Ya existe otro horario para ese año y mes.');
  }

  await prisma.scheduleEntry.update({
    where: { id: entryId },
    data: {
      year,
      month,
      url,
    },
  });

  revalidateHorarios();
}

export async function deleteScheduleEntry(formData: FormData) {
  await assertAdmin();

  const entryId = String(formData.get('entryId') ?? '').trim();
  if (!entryId) {
    return;
  }

  await prisma.scheduleEntry.delete({
    where: { id: entryId },
  });

  revalidateHorarios();
}

export async function importStaticHorarios() {
  await assertAdmin();

  await seedStaticHorariosIfDatabaseEmpty();

  revalidateHorarios();
}
