import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

import { prisma } from '@/lib/prisma';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = String(body?.email || '').trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.email) {
    return NextResponse.json({ ok: true });
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const userEnv = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.CONTACT_FROM_EMAIL ?? process.env.SMTP_USER;
  if (!host || !port || !userEnv || !pass || !from) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const identifier = `password-reset:${email}`;
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user: userEnv, pass },
  });

  const subject = 'Restablece tu contraseña en UrgenciasHSJ';
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
            <div class="title">Restablecer contraseña</div>
            <p class="text">
              Hemos recibido una solicitud para restablecer tu contraseña. Si has sido tú,
              pulsa el botón para continuar.
            </p>
            <a class="button" href="${resetUrl}">Restablecer contraseña</a>
            <p class="text muted">Este enlace caduca en 1 hora.</p>
            <p class="text muted">
              Si no has solicitado este cambio, puedes ignorar este email.
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
    text: `Hola,\n\nRestablece tu contraseña haciendo clic en este enlace:\n${resetUrl}\n\nEste enlace caduca en 1 hora.`,
    html,
  });

  return NextResponse.json({ ok: true });
}
