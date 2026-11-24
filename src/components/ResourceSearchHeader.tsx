import type { ReactNode } from 'react';

export default function ResourceSearchHeader({ title, badge, description, children, stats, accessInfo }: {
  title: string;
  badge: string;
  description: string;
  children?: ReactNode;
  stats?: ReactNode;
  accessInfo?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(232,244,246,0.98),rgba(255,255,255,0.88))] px-6 py-6 shadow-[0_18px_48px_rgba(20,37,45,0.10)] sm:px-8 sm:py-7">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.12]" style={{ backgroundImage: 'url(/urg-background.png)' }} />
        <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-[#cfe2e6]/65 blur-3xl" />
        <div className="absolute right-0 top-10 h-40 w-40 rounded-full bg-[#dce9f3]/70 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#d9efe8]/70 blur-3xl" />
      </div>
      <div className="relative z-10 space-y-4">
        <div className="inline-flex rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2b5d68] backdrop-blur">{badge}</div>
        <div className="space-y-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
            {accessInfo}
            <p className="max-w-2xl text-sm leading-6 text-[#5a747a]">{description}</p>
          </div>
          {children}
          {stats && <div className="flex flex-wrap gap-2 text-sm text-[#587077] [&>span]:rounded-full [&>span]:border [&>span]:border-white/80 [&>span]:bg-white/75 [&>span]:px-3 [&>span]:py-1 [&>span]:backdrop-blur-sm">{stats}</div>}
        </div>
      </div>
    </section>
  );
}
