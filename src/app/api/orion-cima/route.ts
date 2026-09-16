import { NextRequest, NextResponse } from 'next/server';
import { matchCimaMedicine, type CimaMedicine } from '@/lib/orionCima';

type CimaSearchResponse = { resultados?: CimaMedicine[] };

async function resolveMedicine(name: string): Promise<{ active: string | null; status: 'matched' | 'unmatched' | 'error' }> {
  const brand = name.trim().replace(/^\(FM\)\s*/i, '').split(/\s+/)[0];
  try {
    const url = new URL('https://cima.aemps.es/cima/rest/medicamentos');
    url.searchParams.set('nombre', brand);
    url.searchParams.set('tamanioPagina', '200');
    const response = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) return { active: null, status: 'error' };
    const data = await response.json() as CimaSearchResponse;
    const match = matchCimaMedicine(name, data.resultados || []);
    return match?.vtm?.nombre
      ? { active: match.vtm.nombre, status: 'matched' }
      : { active: null, status: 'unmatched' };
  } catch {
    return { active: null, status: 'error' };
  }
}

export async function POST(request: NextRequest) {
  let names: unknown;
  try {
    names = (await request.json()).names;
  } catch {
    return NextResponse.json({ error: 'Solicitud incorrecta' }, { status: 400 });
  }
  if (!Array.isArray(names) || names.length > 50 || names.some((name) => typeof name !== 'string' || !name.trim() || name.length > 180)) {
    return NextResponse.json({ error: 'Lista de medicamentos incorrecta' }, { status: 400 });
  }

  // Solo llegan nombres de medicamentos; nunca el texto completo ni datos del paciente.
  const uniqueNames = [...new Set(names as string[])];
  const results: Record<string, Awaited<ReturnType<typeof resolveMedicine>>> = {};
  for (let offset = 0; offset < uniqueNames.length; offset += 4) {
    const batch = uniqueNames.slice(offset, offset + 4);
    const resolved = await Promise.all(batch.map(resolveMedicine));
    batch.forEach((name, index) => { results[name] = resolved[index]; });
  }
  return NextResponse.json({ results });
}
