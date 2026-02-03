import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

providers.push(
  CredentialsProvider({
    name: 'Email y contraseña',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Contraseña', type: 'password' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      const password = credentials?.password ?? '';

      if (!email || !password) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          approved: true,
          passwordHash: true,
          emailVerified: true,
        },
      });

      if (!user?.passwordHash) {
        return null;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return null;
      }

      if (!user.emailVerified) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    },
  })
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN', approved: true },
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      if (token?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { role: true, approved: true },
        });
        token.role = dbUser?.role ?? 'USER';
        token.approved = dbUser?.approved ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? 'USER';
        session.user.approved = (token.approved as boolean) ?? false;
      }

      return session;
    },
  },
  pages: {
    signIn: '/api/auth/signin',
  },
};
