type ProtocolSectionNavItem = {
  href: string;
  label: string;
  description: string;
  eyebrow?: string;
};

type ProtocolSectionNavProps = {
  title?: string;
  items: ProtocolSectionNavItem[];
  columns?: 2 | 3 | 4 | 5;
};

export function ProtocolSectionNav({
  title = 'Navegación rápida',
  items,
  columns = 3,
}: ProtocolSectionNavProps) {
  const columnsClass =
    columns === 5
      ? 'xl:grid-cols-5'
      : columns === 4
        ? 'xl:grid-cols-4'
        : columns === 2
          ? 'xl:grid-cols-2'
          : 'xl:grid-cols-3';

  return (
    <div className="not-prose my-5 overflow-hidden rounded-[24px] border border-[#d7e5e8] bg-[linear-gradient(135deg,#f7fbfc_0%,#edf5f7_55%,#e2edf0_100%)] shadow-[0_14px_36px_rgba(61,118,132,0.08)]">
      <div className="border-b border-white/70 px-4 py-3 sm:px-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3d7684]">
          {title}
        </div>
      </div>

      <div className={`grid gap-2.5 p-3 sm:grid-cols-2 sm:p-4 ${columnsClass}`}>
        {items.map((item) => (
          <a
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="group rounded-[18px] border border-white/80 bg-white/92 px-3.5 py-3 no-underline shadow-[0_8px_20px_rgba(61,118,132,0.06)] transition hover:-translate-y-0.5 hover:border-[#bfd5da] hover:shadow-[0_12px_28px_rgba(61,118,132,0.10)]"
          >
            <div className="min-w-0">
              {item.eyebrow ? (
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b8b92]">
                  {item.eyebrow}
                </div>
              ) : null}
              <div className="text-[15px] font-bold leading-5 text-[var(--primary-dark)]">
                {item.label}
              </div>
              <p className="mb-0 mt-1.5 line-clamp-2 text-[13px] leading-5 text-slate-600">
                {item.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
