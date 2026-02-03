'use server';

import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

export async function changePassword(_prevState: { ok?: boolean; message?: string }, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const currentPassword = String(formData.get('currentPassword') || '');
  const newPassword = String(formData.get('newPassword') || '');
  const newPasswordConfirm = String(formData.get('newPasswordConfirm') || '');

  if (!email || !currentPassword || !newPassword || newPassword.length < 8 || newPassword !== newPasswordConfirm) {
    return { ok: false, message: 'Datos inválidos. Revisa las contraseñas.' } as const;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { ok: false, message: 'No se pudo verificar tu usuario.' } as const;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, message: 'La contraseña actual no es correcta.' } as const;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  return { ok: true, message: 'Contraseña actualizada.' } as const;
}
