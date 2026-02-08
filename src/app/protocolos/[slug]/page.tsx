import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { notFound } from 'next/navigation';
import PdfDownloadButton from '@/components/PdfDownloadButton';

export async function generateMetadata({ params }: { params: Promise<{ slug?: string }> }) {
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
  const isProd = process.env.NODE_ENV === 'production';

  return files
    .map((file) => file.replace(/\.mdx$/, ''))
    .filter((slug) => !(isProd && (slug === 'sepsis' || slug === 'ejemplo-componentes')))
    .map((slug) => ({ slug }));
}

export default async function ProtocoloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (
    process.env.NODE_ENV === 'production' &&
    (slug === 'sepsis' || slug === 'ejemplo-componentes')
  ) {
    notFound();
  }
  const filePath = path.join(process.cwd(), 'content/protocolos', `${slug}.mdx`);

  if (!fs.existsSync(filePath)) notFound();

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(raw);
  const { default: Content } = await import(`../../../../content/protocolos/${slug}.mdx`);

  return (
    <article className="prose prose-slate max-w-none prose-headings:text-[var(--primary)] prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-[var(--primary-dark)] prose-a:text-[var(--primary)] prose-a:no-underline hover:prose-a:text-[var(--primary-dark)] prose-blockquote:border-[var(--primary)] prose-hr:border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {data.title ?? 'Protocolos'}
          <PdfDownloadButton href={(data as { pdf?: string }).pdf} />
        </h1>
      </div>
      <Content />
    </article>
  );
}
