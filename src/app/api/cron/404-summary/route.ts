import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

import { prisma } from '@/lib/prisma';

type Period = 'daily' | 'weekly';

function resolvePeriod(url: URL): Period {
  const value = (url.searchParams.get('period') || 'daily').toLowerCase();
  return value === 'weekly' ? 'weekly' : 'daily';
}

function resolveWindow(period: Period) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (period === 'weekly' ? 7 : 1));
  return { start, end };
}

function isAuthorized(req: Request, url: URL): boolean {
  // Vercel Cron requests include this header.
  if (req.headers.get('x-vercel-cron') === '1') {
    return true;
  }

  const secret = process.env.BROKEN_LINK_CRON_SECRET;
  if (!secret) return false;
  const headerSecret = req.headers.get('x-cron-secret');
  const querySecret = url.searchParams.get('secret');
  return headerSecret === secret || querySecret === secret;
}

function buildHtmlReport(params: {
  period: Period;
  fromIso: string;
  toIso: string;
  total: number;
  topPaths: Array<{ path: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
}) {
  const { period, fromIso, toIso, total, topPaths, topReferrers } = params;

  const pathRows = topPaths.length
    ? topPaths
        .map(
          (item) =>
            `<tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${item.path}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.count}</td></tr>`
        )
        .join('')
    : '<tr><td colspan="2" style="padding:6px 8px;">Sin datos</td></tr>';

  const refRows = topReferrers.length
    ? topReferrers
        .map(
          (item) =>
            `<tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${item.referrer}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${item.count}</td></tr>`
        )
        .join('')
    : '<tr><td colspan="2" style="padding:6px 8px;">Sin datos</td></tr>';

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <h2 style="margin:0 0 8px;">Resumen ${period === 'weekly' ? 'semanal' : 'diario'} de enlaces rotos</h2>
      <p style="margin:0 0 12px;color:#475569;">Ventana: ${fromIso} -> ${toIso}</p>
      <p style="margin:0 0 16px;"><strong>Total de impactos 404:</strong> ${total}</p>

      <h3 style="margin:14px 0 8px;">Top URLs no encontradas</h3>
      <table style="border-collapse:collapse;width:100%;max-width:760px;">
        <thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Path</th><th style="text-align:right;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Hits</th></tr></thead>
        <tbody>${pathRows}</tbody>
      </table>

      <h3 style="margin:14px 0 8px;">Top páginas de origen (referrer)</h3>
      <table style="border-collapse:collapse;width:100%;max-width:760px;">
        <thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Referrer</th><th style="text-align:right;padding:6px 8px;border-bottom:2px solid #cbd5e1;">Hits</th></tr></thead>
        <tbody>${refRows}</tbody>
      </table>
    </div>
  `;
}

function buildTextReport(params: {
  period: Period;
  fromIso: string;
  toIso: string;
  total: number;
  topPaths: Array<{ path: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
}) {
  const { period, fromIso, toIso, total, topPaths, topReferrers } = params;
  const pathLines = topPaths.length
    ? topPaths.map((item) => `- ${item.path}: ${item.count}`).join('\n')
    : '- Sin datos';
  const refLines = topReferrers.length
    ? topReferrers.map((item) => `- ${item.referrer}: ${item.count}`).join('\n')
    : '- Sin datos';

  return [
    `Resumen ${period === 'weekly' ? 'semanal' : 'diario'} de enlaces rotos`,
    `Ventana: ${fromIso} -> ${toIso}`,
    `Total impactos 404: ${total}`,
    '',
    'Top URLs no encontradas:',
    pathLines,
    '',
    'Top referrers:',
    refLines,
  ].join('\n');
}

async function sendReport(params: {
  period: Period;
  fromIso: string;
  toIso: string;
  total: number;
  topPaths: Array<{ path: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
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

  const subject = `[UrgenciasHSJ] Resumen ${params.period === 'weekly' ? 'semanal' : 'diario'} 404`;
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

  const [total, groupedByPath, groupedByReferrer] = await Promise.all([
    prisma.brokenLinkHit.count({
      where: {
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.brokenLinkHit.groupBy({
      by: ['path'],
      where: {
        createdAt: { gte: start, lt: end },
      },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 20,
    }),
    prisma.brokenLinkHit.groupBy({
      by: ['referrer'],
      where: {
        createdAt: { gte: start, lt: end },
        NOT: { referrer: null },
      },
      _count: { referrer: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 15,
    }),
  ]);

  const fromIso = start.toISOString();
  const toIso = end.toISOString();
  const topPaths = groupedByPath.map((item) => ({ path: item.path, count: item._count.path }));
  const topReferrers = groupedByReferrer
    .filter((item) => item.referrer)
    .map((item) => ({ referrer: item.referrer as string, count: item._count.referrer }));

  await sendReport({
    period,
    fromIso,
    toIso,
    total,
    topPaths,
    topReferrers,
  });

  return NextResponse.json({
    ok: true,
    period,
    total,
    from: fromIso,
    to: toIso,
  });
}
