'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('No autorizado');
  }
}

export async function setUserApproved(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get('userId') || '');
  const approved = String(formData.get('approved') || '') === 'true';

  if (!userId) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { approved },
  });

  revalidatePath('/admin/usuarios');
}

export async function setUserRole(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get('userId') || '');
  const role = String(formData.get('role') || 'USER');

  if (!userId) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: role === 'ADMIN' ? 'ADMIN' : 'USER' },
  });

  revalidatePath('/admin/usuarios');
}
