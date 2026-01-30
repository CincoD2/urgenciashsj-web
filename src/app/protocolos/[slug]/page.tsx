import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string }>;
}) {
  const { slug } = await params;
  if (!slug) {
    return {};
  }

  const filePath = path.join(process.cwd(), 'content/protocolos', `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(raw);

  return {
    title: data.title ?? 'Protocolos',
    description: data.description ?? '',
  };
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), 'content/protocolos');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));

  return files.map((file) => ({
    slug: file.replace(/\.mdx$/, ''),
  }));
}

export default async function ProtocoloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), 'content/protocolos', `${slug}.mdx`);

  if (!fs.existsSync(filePath)) notFound();

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(raw);
  const { default: Content } = await import(`../../../../content/protocolos/${slug}.mdx`);

  return (
    <article className="prose max-w-none">
      <h1 className="text-2xl font-semibold">{data.title ?? 'Protocolos'}</h1>
      <Content />
    </article>
  );
}
