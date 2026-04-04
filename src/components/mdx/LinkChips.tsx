type LinkChipItem = {
  href: string;
  label: string;
};

type LinkChipProps = LinkChipItem;

type LinkChipsProps = {
  title?: string;
  items: LinkChipItem[];
};

export function LinkChip({ href, label }: LinkChipProps) {
  return (
    <a
      href={href}
      className="rounded-full border border-[#dfe9eb] bg-white px-3 py-1 text-[11px] font-semibold text-[#3d7684] no-underline transition hover:border-[#c8dadd] hover:text-[#2b5d68]"
    >
      {label}
    </a>
  );
}

export function LinkChips({ title, items }: LinkChipsProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {title ? <span className="mr-1 text-sm font-medium text-slate-600">{title}</span> : null}
      {items.map((item) => (
        <LinkChip key={`${item.href}-${item.label}`} href={item.href} label={item.label} />
      ))}
    </div>
  );
}
