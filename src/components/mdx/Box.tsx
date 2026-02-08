export function Box({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-4 rounded-lg border border-[#d6e4e7] bg-[var(--muted-bg)] p-4 leading-tight shadow-[0_1px_4px_rgba(61,118,132,0.08)]">
      {title ? <strong className="mb-2 block text-[var(--primary-dark)]">{title}</strong> : null}
      <div className="box-content text-slate-700 [&_strong]:!text-[var(--primary-dark)] [&_a]:!text-[var(--primary)] hover:[&_a]:!text-[var(--primary-dark)]">
        {children}
      </div>
    </div>
  );
}
