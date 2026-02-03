'use server';

import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';
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

  const user = await prisma.user.update({
    where: { id: userId },
    data: { approved },
  });

  if (approved && user.email) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const userEnv = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.CONTACT_FROM_EMAIL ?? process.env.SMTP_USER;
    if (host && port && userEnv && pass && from) {
      const baseUrl =
        process.env.NEXTAUTH_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      const loginUrl = `${baseUrl}/login`;
      const subject = 'Tu acceso ha sido aprobado';
      const logoUrl = `${baseUrl}/logourg.png`;
      const html = `
        <!doctype html>
        <html lang="es">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>${subject}</title>
            <style>
              body { margin: 0; background: #f5f8f9; font-family: "Encode Sans", Arial, Helvetica, sans-serif; color: #0f172a; }
              .wrap { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
              .card { background: #ffffff; border: 1px solid #dfe9eb; border-radius: 16px; padding: 24px; }
              .logo { display: inline-flex; align-items: center; gap: 10px; }
              .logo img { width: 32px; height: 32px; }
              .title { font-size: 20px; font-weight: 700; margin: 16px 0 8px; }
              .text { font-size: 14px; line-height: 1.6; color: #334155; }
              .button { display: inline-block; margin: 18px 0; background: #2b5d68; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 999px; font-weight: 600; font-size: 14px; }
              .footer { margin-top: 18px; font-size: 12px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="wrap">
              <div class="card">
                <div class="logo">
                  <img src="${logoUrl}" alt="UrgenciasHSJ" />
                  <strong>UrgenciasHSJ</strong>
                </div>
                <div class="title">Acceso aprobado</div>
                <p class="text">
                  Tu solicitud de acceso ha sido aprobada. Ya puedes iniciar sesión.
                </p>
                <a class="button" href="${loginUrl}">Iniciar sesión</a>
              </div>
              <div class="footer">UrgenciasHSJ · ${baseUrl}</div>
            </div>
          </body>
        </html>
      `;

      const transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user: userEnv, pass },
      });

      await transporter.sendMail({
        from,
        to: user.email,
        subject,
        text: `Tu acceso ha sido aprobado. Ya puedes iniciar sesión: ${loginUrl}`,
        html,
      });
    }
  }

  revalidatePath('/admin/usuarios');
}

export async function deleteUsers(formData: FormData) {
  await assertAdmin();
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const ids = formData.getAll('userIds').map((id) => String(id));

  if (!ids.length) return;

  const filteredIds = currentUserId ? ids.filter((id) => id !== currentUserId) : ids;
  if (!filteredIds.length) {
    revalidatePath('/admin/usuarios');
    return;
  }

  await prisma.user.deleteMany({
    where: {
      id: {
        in: filteredIds,
      },
      role: { not: 'ADMIN' },
    },
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

export async function updateAutoLogout(formData: FormData) {
  await assertAdmin();
  const idleMinutes = Number(formData.get('idleMinutes'));
  const warningSeconds = Number(formData.get('warningSeconds'));

  if (!Number.isFinite(idleMinutes) || idleMinutes < 1 || idleMinutes > 120) {
    throw new Error('Minutos de inactividad inválidos');
  }
  if (!Number.isFinite(warningSeconds) || warningSeconds < 5 || warningSeconds > 300) {
    throw new Error('Segundos de aviso inválidos');
  }

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { idleMinutes, warningSeconds },
    create: { id: 1, idleMinutes, warningSeconds },
  });

  revalidatePath('/admin/usuarios');
}
