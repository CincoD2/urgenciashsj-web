import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b">
      <nav className="mx-auto max-w-7xl px-4 py-4 flex gap-6">
        <Link href="/">Inicio</Link>
        <Link href="/calculadoras">Calculadoras</Link>
        <Link href="/escalas">Escalas</Link>
        <Link href="/protocolos">Protocolos</Link>
        <Link href="/dietas">Dietas</Link>
        <Link href="/formacion">Formación</Link>
      </nav>
    </header>
  );
}
