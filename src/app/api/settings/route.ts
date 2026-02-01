import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });

  return NextResponse.json({
    idleMinutes: settings?.idleMinutes ?? 5,
    warningSeconds: settings?.warningSeconds ?? 30,
  });
}
