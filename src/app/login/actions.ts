'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerUser(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password || !isValidEmail(email) || password.length < 8) {
    return { ok: false, message: 'Datos inválidos. Revisa email y contraseña.' } as const;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, message: 'Ese email ya está registrado.' } as const;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isAdmin = adminEmails.includes(email);

  await prisma.user.create({
    data: {
      name: name || null,
      email,
      passwordHash,
      role: isAdmin ? 'ADMIN' : 'USER',
      approved: isAdmin,
    },
  });

  revalidatePath('/login');

  return { ok: true } as const;
}
