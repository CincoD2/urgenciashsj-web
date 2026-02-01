import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import nodemailer from 'nodemailer';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { getServerSession } from 'next-auth';
import { buildParteJefaturaHtml } from '@/lib/parteJefaturaTemplate';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

type Body = {
  email?: string;
  fecha?: string;
  jefeGuardia?: string;
  pruebas?: { tipo?: string; cantidad?: number | string }[];
  especialidades?: { tipo?: string; cantidad?: number | string }[];
  incidencias?: string;
  incidenciasHtml?: string;
  pendientesIngreso?: number | string;
  pendientesEvolucion?: number | string;
  pendientesMedico?: number | string;
  observacionPendientesUbicacion?: number | string;
};

const clampInt = (value: unknown) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(999, n));
};

const trimText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const normalizeLabel = (value: unknown, max = 40) => trimText(value).slice(0, max);

const formatFecha = (value: string) => {
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}/${mm}/${yyyy}`;
  }
  return trimmed;
};

const normalizeItems = (
  items: Body['pruebas'] | Body['especialidades']
): { tipo: string; cantidad: number }[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      tipo: normalizeLabel(item?.tipo, 50),
      cantidad: clampInt(item?.cantidad),
    }))
    .filter((item) => item.tipo && item.cantidad > 0);
};

const sanitizeRichText = (value: unknown) => {
  const input = trimText(value);
  if (!input) return '';
  const withoutScripts = input
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const allowed = new Set([
    'b',
    'strong',
    'i',
    'em',
    'u',
    'br',
    'ul',
    'ol',
    'li',
    'p',
    'div',
    'span',
    'font',
  ]);
  const allowedColors = new Set(['#000000', '#b91c1c', '#1d4ed8']);
  return withoutScripts.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag) => {
    const lower = String(tag).toLowerCase();
    if (!allowed.has(lower)) return '';
    if (lower === 'br') return '<br/>';
    const isClosing = match.startsWith('</');
    if (isClosing) return `</${lower}>`;
    if (lower === 'font') {
      const colorMatch = match.match(/color=["']?([^"']+)["']?/i);
      const color = colorMatch ? colorMatch[1].toLowerCase() : '';
      return allowedColors.has(color) ? `<font color="${color}">` : '<font>';
    }
    if (lower === 'span') {
      const styleMatch = match.match(/style=["']?([^"']+)["']?/i);
      const style = styleMatch ? styleMatch[1].toLowerCase() : '';
      const colorMatch = style.match(/color\s*:\s*([^;]+)\s*;?/i);
      const color = colorMatch ? colorMatch[1].trim() : '';
      return allowedColors.has(color) ? `<span style="color:${color};">` : '<span>';
    }
    return `<${lower}>`;
  });
};

const isRichTextEmpty = (html: string) => {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text.length === 0;
};

async function loadLogoDataUrl() {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'img', 'parte-jefatura-logo.png');
    const file = await readFile(logoPath);
    return `data:image/png;base64,${file.toString('base64')}`;
  } catch {
    return null;
  }
}

async function resolveExecutablePath() {
  const envPath =
    process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_EXECUTABLE_PATH;
  if (envPath) return envPath;

  if (process.env.NODE_ENV === 'production') {
    return await chromium.executablePath();
  }

  const candidates =
    process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
        ]
      : process.platform === 'win32'
        ? [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Chromium\\Application\\chrome.exe',
          ]
        : [
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
          ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }

  return await chromium.executablePath();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.approved) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const email = trimText(body.email);
    const fecha = formatFecha(trimText(body.fecha));
    const jefeGuardia = trimText(body.jefeGuardia);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }
    if (!fecha || !jefeGuardia) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: fecha y/o jefe de guardia.' },
        { status: 400 }
      );
    }

    const html = buildParteJefaturaHtml({
      fecha,
      jefeGuardia,
      pruebas: normalizeItems(body.pruebas),
      especialidades: normalizeItems(body.especialidades),
      incidencias: (() => {
        const sanitized = sanitizeRichText(body.incidenciasHtml ?? body.incidencias);
        return isRichTextEmpty(sanitized) ? 'Sin incidencias' : sanitized;
      })(),
      conteos: {
        pendientesIngreso: clampInt(body.pendientesIngreso),
        pendientesEvolucion: clampInt(body.pendientesEvolucion),
        pendientesMedico: clampInt(body.pendientesMedico),
        observacionPendientesUbicacion: clampInt(body.observacionPendientesUbicacion),
      },
      logoDataUrl: await loadLogoDataUrl(),
    });

    const executablePath = await resolveExecutablePath();
    const isProduction = process.env.NODE_ENV === 'production';
    const browser = await puppeteer.launch(
      isProduction
        ? {
            args: chromium.args,
            executablePath,
            headless: true,
          }
        : {
            executablePath,
            headless: true,
          }
    );

    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });
    await page.close();
    await browser.close();

    const to = email;
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

    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Parte de Jefatura',
      text: 'Adjuntamos el parte de jefatura en PDF.',
      attachments: [
        {
          filename: 'parte-jefatura.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log('parte-jefatura mail sent:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (error) {
    console.error('parte-jefatura mail error:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Error enviando email.', details }, { status: 500 });
  }
}
