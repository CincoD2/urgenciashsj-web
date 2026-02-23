import fs from 'fs';
import path from 'path';

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { ts: number; lastUpdated: string } | null = null;

function walkLatestMtimeMs(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;

  let latest = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dirPath, entry.name);
    const stat = fs.statSync(fullPath);
    latest = Math.max(latest, stat.mtimeMs);
    if (entry.isDirectory()) {
      latest = Math.max(latest, walkLatestMtimeMs(fullPath));
    }
  }

  return latest;
}

function computeLastUpdatedIso(): string {
  const roots = [
    path.join(process.cwd(), 'src', 'app'),
    path.join(process.cwd(), 'src', 'components'),
    path.join(process.cwd(), 'src', 'lib'),
    path.join(process.cwd(), 'content'),
  ];

  let latest = 0;
  for (const root of roots) {
    latest = Math.max(latest, walkLatestMtimeMs(root));
  }

  return latest ? new Date(latest).toISOString() : new Date(0).toISOString();
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) {
    return Response.json({ lastUpdated: cache.lastUpdated });
  }

  const lastUpdated = computeLastUpdatedIso();
  cache = { ts: now, lastUpdated };

  return Response.json({ lastUpdated });
}
