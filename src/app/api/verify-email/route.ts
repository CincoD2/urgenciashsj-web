import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?verified=error', url));
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return NextResponse.redirect(new URL('/login?verified=error', url));
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token } });
    return NextResponse.redirect(new URL('/login?verified=expired', url));
  }

  await prisma.user.update({
    where: { email: record.identifier.toLowerCase() },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.deleteMany({ where: { token } });

  return NextResponse.redirect(new URL('/login?verified=1', url));
}
