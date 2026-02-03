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

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Confirma tu email en UrgenciasHSJ',
    text: `Hola,\n\nConfirma tu email haciendo clic en este enlace:\n${verifyUrl}\n\nEste enlace caduca en 24 horas.`,
  });

  revalidatePath('/login');

  return { ok: true, message: 'Registro recibido. Revisa tu email para confirmar.' } as const;
}
