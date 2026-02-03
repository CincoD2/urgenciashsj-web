'use server';

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
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
  const name = String(formData.get('fullName') || formData.get('name') || '').trim();
  const hospital = String(formData.get('hospital') || '').trim();
  const position = String(formData.get('position') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const passwordConfirm = String(formData.get('passwordConfirm') || '');

  const validHospitals = new Set(['Hospital de San Juan', 'Otro']);
  const validPositions = new Set(['Adjunto', 'Residente', 'Otro']);

  if (
    !name ||
    !hospital ||
    !position ||
    !email ||
    !password ||
    !isValidEmail(email) ||
    password.length < 8 ||
    password !== passwordConfirm ||
    !validHospitals.has(hospital) ||
    !validPositions.has(position)
  ) {
    return {
      ok: false,
      code: 'invalid_data',
      message: 'Datos inválidos. Revisa nombre, hospital, categoría, email y contraseñas.',
    } as const;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, code: 'email_exists', message: 'Ese email ya está registrado.' } as const;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.CONTACT_FROM_EMAIL ?? process.env.SMTP_USER;
  if (!host || !port || !user || !pass || !from) {
    return { ok: false, code: 'email_not_configured', message: 'Email de confirmación no configurado.' } as const;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isAdmin = adminEmails.includes(email);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      hospital,
      position,
      role: isAdmin ? 'ADMIN' : 'USER',
      approved: isAdmin,
    },
  });

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const verifyUrl = `${baseUrl}/api/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  const subject = 'Confirma tu email en UrgenciasHSJ';
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
          .muted { font-size: 12px; color: #64748b; }
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
            <div class="title">Confirma tu email</div>
            <p class="text">
              Para activar tu cuenta, confirma tu dirección de email haciendo clic en el botón.
            </p>
            <a class="button" href="${verifyUrl}">Confirmar email</a>
            <p class="text muted">Este enlace caduca en 24 horas.</p>
            <p class="text muted">
              Si no has solicitado este registro, puedes ignorar este email.
            </p>
          </div>
          <div class="footer">UrgenciasHSJ · ${baseUrl}</div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject,
    text: `Hola,\n\nConfirma tu email haciendo clic en este enlace:\n${verifyUrl}\n\nEste enlace caduca en 24 horas.`,
    html,
  });

  revalidatePath('/login');

  return { ok: true, message: 'Registro recibido. Revisa tu email para confirmar.' } as const;
}
