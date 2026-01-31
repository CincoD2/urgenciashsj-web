import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

type Body = {
  message?: string;
  website?: string;
  recaptchaToken?: string;
};

const rateLimitWindowMs = 10 * 60 * 1000;
const rateLimitMax = 5;
const rateLimit = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }
    if (body.website && body.website.trim().length > 0) {
      return NextResponse.json({ ok: true });
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const token = body.recaptchaToken;
    if (!secret) {
      return NextResponse.json({ error: 'reCAPTCHA no configurado' }, { status: 500 });
    }
    if (!token) {
      return NextResponse.json({ error: 'reCAPTCHA faltante' }, { status: 400 });
    }

    const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const captchaData = (await captchaRes.json()) as { success?: boolean; score?: number; action?: string };
    if (!captchaData.success || (captchaData.score ?? 0) < 0.5) {
      return NextResponse.json({ error: 'reCAPTCHA inválido' }, { status: 403 });
    }

    const forwarded = req.headers.get('x-forwarded-for') ?? '';
    const ip = forwarded.split(',')[0].trim() || 'unknown';
    const now = Date.now();
    const current = rateLimit.get(ip);
    if (!current || now > current.resetAt) {
      rateLimit.set(ip, { count: 1, resetAt: now + rateLimitWindowMs });
    } else {
      current.count += 1;
      if (current.count > rateLimitMax) {
        return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
      }
    }

    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL;
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!to || !from || !host || !port || !user || !pass) {
      return NextResponse.json({ error: 'Email no configurado' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject: 'Nuevo mensaje desde UrgenciasHSJ.es',
      text: message,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error enviando' }, { status: 500 });
  }
}
