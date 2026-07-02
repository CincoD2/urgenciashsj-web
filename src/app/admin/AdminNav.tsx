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
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
