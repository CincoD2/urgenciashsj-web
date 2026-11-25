import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getRateLimitStatus, recordRateLimitFailure } from '@/lib/rateLimit';

export const runtime = 'nodejs';
const limit = { maxFailures: 5, windowMs: 15 * 60_000, blockMs: 15 * 60_000 };

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(origin && new URL(origin).host === req.headers.get('host'));
  } catch { /* Reject malformed origins. */ }
  if (!sameOrigin) {
    return NextResponse.json({ error: 'Solicitud no permitida.' }, { status: 403 });
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (getRateLimitStatus('turno-2027-mail', ip, limit).limited) {
    return NextResponse.json({ error: 'Has realizado varios envíos. Espera 15 minutos o descarga el ICS directamente.' }, { status: 429 });
  }
  recordRateLimitFailure('turno-2027-mail', ip, limit);
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Solicitud no válida.' }, { status: 400 });
  }
  if (body.website) return NextResponse.json({ ok: true });
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const group = body.group;
  // A single mailbox only: reject address lists, display names and header characters.
  if (email.length > 254 || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) || !['1', '2', '3', '4', '5', '6'].includes(group)) {
    return NextResponse.json({ error: 'Indica un correo válido y el grupo que quieres recibir.' }, { status: 400 });
  }
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (secret && secret !== 'test') {
    try {
      if (typeof body.recaptchaToken !== 'string' || !body.recaptchaToken) throw new Error('captcha');
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: body.recaptchaToken }),
        signal: AbortSignal.timeout(10_000),
      });
      const captcha = await response.json();
      if (!captcha.success || (captcha.score ?? 0) < 0.5 || captcha.action !== 'turno_2027_mail') throw new Error('captcha');
    } catch {
      return NextResponse.json({ error: 'No se ha podido verificar el envío. Recarga la página o descarga el ICS directamente.' }, { status: 403 });
    }
  }
  const { SMTP_HOST: host, SMTP_PORT: port, SMTP_USER: user, SMTP_PASS: pass } = process.env;
  const from = process.env.CONTACT_FROM_EMAIL || user;
  if (!host || !port || !user || !pass || !from) {
    return NextResponse.json({ error: 'El envío de correo no está disponible ahora. Puedes descargar el ICS directamente.' }, { status: 503 });
  }
  try {
    const filename = `urgencias-2027-grupo-${group}.ics`;
    const attachments = [{ filename, content: await readFile(path.join(process.cwd(), 'public', 'horarios', '2027', filename)), contentType: 'text/calendar; charset=utf-8' }];
    const transport = nodemailer.createTransport({ host, port: Number(port), secure: Number(port) === 465, auth: { user, pass }, connectionTimeout: 10_000, socketTimeout: 20_000 });
    await transport.sendMail({
      from,
      to: { address: email, name: '' },
      subject: `Turno rodado Urgencias 2027 · Grupo ${group}`,
      text: 'Adjuntamos el calendario solicitado del turno rodado de Urgencias, del 11 de enero al 23 de diciembre de 2027, con los festivos incluidos.\n\niPhone: abre este mensaje en Mail de Apple, toca el adjunto ICS y utiliza Añadir todos si aparece.\nMac: Calendario > Archivo > Importar.\nAndroid: importa el archivo desde Google Calendar en un ordenador (Configuración > Importar y exportar) y sincroniza la misma cuenta en el móvil.\n\nElige un calendario separado para tus turnos e importa cada archivo una sola vez para evitar duplicados. Los archivos no se actualizan automáticamente. N y TN finalizan a las 23:59.\n\nUrgenciasHSJ',
      attachments,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo enviar el correo. Inténtalo más tarde o descarga el ICS directamente.' }, { status: 502 });
  }
}
