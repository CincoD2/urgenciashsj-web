import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

import { prisma } from '@/lib/prisma';

type Period = 'daily' | 'weekly';

function resolvePeriod(url: URL): Period {
  return url.searchParams.get('period') === 'weekly' ? 'weekly' : 'daily';
}

function resolveWindow(period: Period) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (period === 'weekly' ? 7 : 1));
  return { start, end };
}

function isAuthorized(req: Request, url: URL): boolean {
  if (req.headers.get('x-vercel-cron') === '1') return true;
  const secret = process.env.BROKEN_LINK_CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('x-cron-secret') === secret || url.searchParams.get('secret') === secret;
}

function buildTextReport(params: {
  period: Period;
  fromIso: string;
  toIso: string;
  totalChecks: number;
  totalErrors: number;
  topFailingUrls: Array<{ targetUrl: string; count: number }>;
}) {
  const lines = params.topFailingUrls.length
    ? params.topFailingUrls.map((item) => `- ${item.targetUrl}: ${item.count}`).join('\n')
    : '- Sin fallos';

  return [
    `Resumen ${params.period === 'weekly' ? 'semanal' : 'diario'} de enlaces externos`,
    `Ventana: ${params.fromIso} -> ${params.toIso}`,
    `Comprobaciones: ${params.totalChecks}`,
    `Errores detectados: ${params.totalErrors}`,
    '',
    'Top enlaces externos con error:',
    lines,
  ].join('\n');
}

function buildHtmlReport(params: {
  period: Period;
  fromIso: string;
  toIso: string;
  totalChecks: number;
  totalErrors: number;
  topFailingUrls: Array<{ targetUrl: string; count: number }>;
}) {
  const rows = params.topFailingUrls.length
    ? params.topFailingUrls
        .map(
          (item) =>
            `<tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${item.targetUrl}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.count}</td></tr>`
        )
        .join('')
    : '<tr><td colspan="2" style="padding:6px 8px;">Sin fallos</td></tr>';

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <h2 style="margin:0 0 8px;">Resumen ${params.period === 'weekly' ? 'semanal' : 'diario'} de enlaces externos</h2>
      <p style="margin:0 0 12px;color:#475569;">Ventana: ${params.fromIso} -> ${params.toIso}</p>
      <p style="margin:0 0 2px;"><strong>Comprobaciones:</strong> ${params.totalChecks}</p>
      <p style="margin:0 0 16px;"><strong>Errores detectados:</strong> ${params.totalErrors}</p>

      <h3 style="margin:14px 0 8px;">Top enlaces externos con error</h3>
      <table style="border-collapse:collapse;width:100%;max-width:760px;">
        <thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:2px solid #cbd5e1;">URL</th><th style="text-align:right;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Fallos</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function sendReport(params: {
  period: Period;
  fromIso: string;
  toIso: string;
  totalChecks: number;
  totalErrors: number;
  topFailingUrls: Array<{ targetUrl: string; count: number }>;
}) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.CONTACT_FROM_EMAIL ?? user;
  const to = process.env.BROKEN_LINK_REPORT_TO;

  if (!host || !port || !user || !pass || !from || !to) {
    throw new Error('Missing SMTP/BROKEN_LINK_REPORT_TO configuration.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  const subject = `[UrgenciasHSJ] Resumen ${params.period === 'weekly' ? 'semanal' : 'diario'} enlaces externos`;
  await transporter.sendMail({
    from,
    to,
    subject,
    text: buildTextReport(params),
    html: buildHtmlReport(params),
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!isAuthorized(req, url)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const period = resolvePeriod(url);
  const { start, end } = resolveWindow(period);

  const [totalChecks, totalErrors, grouped] = await Promise.all([
    prisma.externalLinkCheck.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.externalLinkCheck.count({ where: { createdAt: { gte: start, lt: end }, isError: true } }),
    prisma.externalLinkCheck.groupBy({
      by: ['targetUrl'],
      where: {
        createdAt: { gte: start, lt: end },
        isError: true,
      },
      _count: { targetUrl: true },
      orderBy: { _count: { targetUrl: 'desc' } },
      take: 20,
    }),
  ]);

  const topFailingUrls = grouped.map((item) => ({
    targetUrl: item.targetUrl,
    count: item._count.targetUrl,
  }));

  const fromIso = start.toISOString();
  const toIso = end.toISOString();

  await sendReport({
    period,
    fromIso,
    toIso,
    totalChecks,
    totalErrors,
    topFailingUrls,
  });

  return NextResponse.json({
    ok: true,
    period,
    from: fromIso,
    to: toIso,
    totalChecks,
    totalErrors,
  });
}
