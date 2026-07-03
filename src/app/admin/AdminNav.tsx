import Link from 'next/link';

type AdminNavProps = {
  current: 'horarios' | 'usuarios';
};

export default function AdminNav({ current }: AdminNavProps) {
  const items = [
    { key: 'horarios', href: '/admin/horarios', label: 'Horarios' },
    { key: 'usuarios', href: '/admin/usuarios', label: 'Usuarios' },
  ] as const;

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.key === current;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active
                ? 'border-[#1f4c57] bg-[#e7f0f2] text-[#1f4c57]'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-[#1f4c57]/40'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
