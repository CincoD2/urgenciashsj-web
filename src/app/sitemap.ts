import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urgenciashsj.es';

const staticRoutes = [
  '/',
  '/sesiones',
  '/protocolos',
  '/eventos',
  '/formacion',
  '/dietas',
  '/inhaladores',
  '/calculadoras',
  '/escalas',
  '/disclaimer',
  '/cookies',
  '/novedades',
];

const escalaRoutes = [
  '/escalas/anion-gap',
  '/escalas/cha2ds2va',
  '/escalas/curb65',
  '/escalas/depuradorTtos',
  '/escalas/glasgow',
  '/escalas/gradiente-aa-o2',
  '/escalas/hasbled',
  '/escalas/hiperNa',
  '/escalas/hiponatremia',
  '/escalas/idsa',
  '/escalas/nihss',
  '/escalas/pafi',
  '/escalas/psi',
  '/escalas/qsofa',
  '/escalas/sirs',
  '/escalas/safi',
  '/escalas/tam',
  '/escalas/timi-scacest',
  '/escalas/timi-scasest',
  '/escalas/urea-bun',
  '/escalas/wells-tvp',
];

function getProtocolosSlugs() {
  const dir = path.join(process.cwd(), 'content/protocolos');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
    .filter((slug) => !(process.env.NODE_ENV === 'production' && (slug === 'sepsis' || slug === 'ejemplo-componentes')));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const protocolosRoutes = getProtocolosSlugs().map((slug) => `/protocolos/${slug}`);
  const routes = [...staticRoutes, ...escalaRoutes, ...protocolosRoutes];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
  }));
}
