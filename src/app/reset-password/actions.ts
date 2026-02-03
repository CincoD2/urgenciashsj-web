'use server';

import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

export async function resetPassword(_prevState: { ok?: boolean; message?: string }, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const token = String(formData.get('token') || '');
  const password = String(formData.get('password') || '');
  const passwordConfirm = String(formData.get('passwordConfirm') || '');

  if (!email || !token || !password || password.length < 8 || password !== passwordConfirm) {
    return { ok: false, message: 'Datos inválidos. Revisa la contraseña.' } as const;
  }

  const identifier = `password-reset:${email}`;
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } },
  });

  if (!record || record.expires < new Date()) {
    return { ok: false, message: 'El enlace de restablecimiento no es válido o ha caducado.' } as const;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  return { ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' } as const;
}
