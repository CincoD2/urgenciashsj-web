import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPrefixes = ['/parte-jefatura', '/api/parte-jefatura'];
const adminPrefixes = ['/admin/usuarios'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some((path) => pathname.startsWith(path));
  const isAdmin = adminPrefixes.some((path) => pathname.startsWith(path));

  if (!isProtected && !isAdmin) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const signInUrl = new URL('/api/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (!token.approved) {
    const pendingUrl = new URL('/pendiente', req.url);
    return NextResponse.redirect(pendingUrl);
  }

  if (isAdmin && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/parte-jefatura/:path*', '/api/parte-jefatura/:path*', '/admin/usuarios/:path*'],
};
