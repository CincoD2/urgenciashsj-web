import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.approved) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const logoPath = path.join(process.cwd(), 'src', 'assets', 'parte-jefatura-logo.png');
  const buffer = await readFile(logoPath);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=0, no-store',
    },
  });
}
