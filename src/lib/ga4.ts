import { createSign } from 'node:crypto';

type TopPage = {
  path: string;
  views: number;
};

type GoogleTokenResponse = {
  access_token?: string;
};

type RunReportResponse = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function signJwt(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(privateKey, 'base64url');

  return `${signingInput}.${signature}`;
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const assertion = signJwt(clientEmail, privateKey);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });

  if (!response.ok) return null;
  const data = (await response.json()) as GoogleTokenResponse;
  return data.access_token ?? null;
}

export async function getTopConsultedPages(limit = 5): Promise<TopPage[]> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!propertyId || !clientEmail || !privateKey) return [];

  try {
    const accessToken = await getAccessToken(clientEmail, privateKey);
    if (!accessToken) return [];

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 20,
        }),
        cache: 'no-store',
      }
    );

    if (!response.ok) return [];
    const data = (await response.json()) as RunReportResponse;
    const rows = data.rows ?? [];

    return rows
      .map((row) => {
        const path = row.dimensionValues?.[0]?.value?.trim();
        const views = Number(row.metricValues?.[0]?.value ?? 0);
        return { path: path ?? '', views };
      })
      .filter((row) => row.path && row.path.startsWith('/') && row.path !== '/')
      .slice(0, limit);
  } catch {
    return [];
  }
}
