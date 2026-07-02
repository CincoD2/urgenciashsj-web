'use server';

import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ChangePasswordState = { ok?: boolean; message?: string };

export async function changePassword(_prevState: ChangePasswordState, formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const currentPassword = String(formData.get('currentPassword') || '');
  const newPassword = String(formData.get('newPassword') || '');
  const newPasswordConfirm = String(formData.get('newPasswordConfirm') || '');

  if (!userId) {
    return { ok: false, message: 'Sesión no válida. Inicia sesión de nuevo.' } as const;
  }

  if (!currentPassword || !newPassword || newPassword.length < 8 || newPassword !== newPasswordConfirm) {
    return { ok: false, message: 'Datos inválidos. Revisa las contraseñas.' } as const;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    where: { id: userId },
    data: { passwordHash },
  });

  return { ok: true, message: 'Contraseña actualizada.' } as const;
}
