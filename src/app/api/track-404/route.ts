import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    return '/';
  }

  return path.length > 512 ? path.slice(0, 512) : path;
}

function normalizeOptional(value: unknown, max = 1000): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        path?: string;
        referrer?: string | null;
      }
    | null;

  const path = typeof body?.path === 'string' ? normalizePath(body.path.trim()) : '/';
  const referrer = normalizeOptional(body?.referrer, 1000);
  const userAgent = normalizeOptional(req.headers.get('user-agent'), 500);

  await prisma.brokenLinkHit.create({
    data: {
      path,
      referrer,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
