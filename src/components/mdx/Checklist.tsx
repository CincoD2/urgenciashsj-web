type ChecklistItem = {
  text: string;
  checked?: boolean;
};

export function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="my-4 space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      {items.map((item, idx) => (
        <li key={`${item.text}-${idx}`} className="flex items-start gap-2">
          <span
            aria-hidden
            className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded border ${
              item.checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-slate-400'
            }`}
          >
            {item.checked ? '✓' : ''}
          </span>
          <span className="text-slate-700">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
