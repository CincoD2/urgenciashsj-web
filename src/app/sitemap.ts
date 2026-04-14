import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urgenciashsj.es';
const appDir = path.join(process.cwd(), 'src/app');
const protocolosDir = path.join(process.cwd(), 'content/protocolos');

const excludedRoutes = new Set([
  '/dietas',
  '/login',
  '/logout',
  '/parte-jefatura',
  '/pendiente',
  '/reset-password',
]);

const excludedRoutePrefixes = ['/admin'];

function shouldExcludeRoute(route: string) {
  return excludedRoutes.has(route) || excludedRoutePrefixes.some((prefix) => route.startsWith(prefix));
}

function isRouteGroup(segment: string) {
  return segment.startsWith('(') && segment.endsWith(')');
}

function isUnsupportedRouteSegment(segment: string) {
  return segment.startsWith('[') || segment.startsWith('@');
}

function getRouteFromPageFile(filePath: string) {
  const relativePath = path.relative(appDir, filePath).split(path.sep).join('/');
  const withoutPage = relativePath.replace(/(^|\/)page\.tsx$/, '');
  const segments = withoutPage
    .split('/')
    .filter(Boolean)
    .filter((segment) => !isRouteGroup(segment));

  if (segments.some(isUnsupportedRouteSegment)) return null;

  const route = segments.length === 0 ? '/' : `/${segments.join('/')}`;
  if (shouldExcludeRoute(route)) return null;

  return route;
}

function walkPageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkPageFiles(fullPath);
    if (entry.isFile() && entry.name === 'page.tsx') return [fullPath];
    return [];
  });
}

function getStaticRoutes() {
  return walkPageFiles(appDir)
    .map((filePath) => {
      const route = getRouteFromPageFile(filePath);
      if (!route) return null;

      return {
        route,
        lastModified: fs.statSync(filePath).mtime,
      };
    })
    .filter((entry): entry is { route: string; lastModified: Date } => entry !== null)
    .sort((a, b) => a.route.localeCompare(b.route, 'es'));
}

function getProtocolosRoutes() {
  if (!fs.existsSync(protocolosDir)) return [];

  return fs
    .readdirSync(protocolosDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      return {
        slug,
        fullPath: path.join(protocolosDir, file),
      };
    })
    .filter(
      ({ slug }) =>
        !(process.env.NODE_ENV === 'production' && (slug === 'sepsis' || slug === 'ejemplo-componentes'))
    )
    .map(({ slug, fullPath }) => ({
      route: `/protocolos/${slug}`,
      lastModified: fs.statSync(fullPath).mtime,
    }))
    .sort((a, b) => a.route.localeCompare(b.route, 'es'));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [...getStaticRoutes(), ...getProtocolosRoutes()];

  return routes.map(({ route, lastModified }) => ({
    url: `${baseUrl}${route}`,
    lastModified,
  }));
}
