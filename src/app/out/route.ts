import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

const REQUEST_TIMEOUT_MS = 6000;

function isAllowedDestination(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

async function checkTarget(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const head = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      cache: 'no-store',
    });

    return {
      statusCode: head.status,
      finalUrl: head.url || url,
      isError: head.status >= 400,
      error: null as string | null,
    };
  } catch {
    try {
      const getReq = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        cache: 'no-store',
      });

      return {
        statusCode: getReq.status,
        finalUrl: getReq.url || url,
        isError: getReq.status >= 400,
        error: null as string | null,
      };
    } catch (error) {
      return {
        statusCode: null,
        finalUrl: url,
        isError: true,
        error: error instanceof Error ? error.message.slice(0, 400) : 'request_failed',
      };
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get('to');
  const from = searchParams.get('from');

  if (!to) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  let target: URL;
  try {
    target = new URL(to);
  } catch {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (!isAllowedDestination(target)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const result = await checkTarget(target.toString());
  await prisma.externalLinkCheck.create({
    data: {
      sourcePath: from?.slice(0, 500) || null,
      targetUrl: target.toString().slice(0, 2000),
      finalUrl: result.finalUrl?.slice(0, 2000) || null,
      statusCode: result.statusCode,
      isError: result.isError,
      error: result.error,
    },
  });

  return NextResponse.redirect(target);
}
