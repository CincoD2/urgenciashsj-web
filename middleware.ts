import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth?.token;

    if (!token) {
      return NextResponse.next();
    }

    if (!token.approved) {
      return NextResponse.redirect(new URL('/pendiente', req.url));
    }

    if (pathname.startsWith('/admin/usuarios') && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login?reason=private',
    },
  }
);

export const config = {
  matcher: ['/parte-jefatura/:path*', '/api/parte-jefatura/:path*', '/admin/usuarios/:path*'],
};
