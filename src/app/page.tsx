import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import Link from 'next/link';

type LinkItem = { label: string; href: string; icon?: IconKey };

const observacion: LinkItem[] = [
  {
    label: 'Relevo Observación',
    href: 'https://drive.google.com/file/d/1YccU61yNP8X5N10rd2xSBB26guQUMD8A/view?usp=sharing',
  },
  {
    label: 'Esquema Observación',
    href: 'https://drive.google.com/file/d/1KQaem_gE9AXnI6FSg_TIbVFba4vmGwCW/view?usp=sharing',
  },
];

type IconKey =
  | 'person'
  | 'money'
  | 'internet'
  | 'mail'
  | 'book'
  | 'grad'
  | 'computer'
  | 'wrench'
  | 'flask'
  | 'xray'
  | 'drop'
  | 'agenda';

const enlacesCorporativos: Record<string, LinkItem[]> = {
  Personal: [
    {
      label: 'Portal del Empleado GVA',
      href: 'https://vvd17portalempleado.cs.san.gva.es/',
      icon: 'person',
    },
    {
      label: 'Nóminas San Juan',
      href: 'https://nomina.san.gva.es/es/',
      icon: 'money',
    },
    {
      label: 'Gestor Identidades (GVA)',
      href: 'https://idm.san.gva.es/sspr',
      icon: 'person',
    },
    {
      label: 'Intranet Privada San Juan',
      href: 'https://intranet17.cs.san.gva.es/',
      icon: 'internet',
    },
  ],
  Utilidades: [
    {
      label: 'Mail Corporativo',
      href: 'https://outlook.office365.com/',
      icon: 'mail',
    },
    {
      label: 'Biblioteca',
      href: 'https://a-hsanjuan.c17.net/sf17/es/journals/catalog/opac',
      icon: 'book',
    },
    {
      label: 'Portal Formación (EVES)',
      href: 'https://eves.san.gva.es/web/guest/home',
      icon: 'grad',
    },
    {
      label: 'Informática',
      href: 'https://intranet17.cs.san.gva.es/departamento/servicios-de-apoyo/informatica/informatica/',
      icon: 'computer',
    },
  ],
  Departamento: [
    {
      label: 'GestLab (HSJ)',
      href: 'https://vvd17silaplpro.cs.san.gva.es/iGestlab/Login.aspx?',
      icon: 'flask',
    },

    {
      label: 'Visor RX (HSJ)',
      href: 'https://vvd17zfpa.cs.san.gva.es/ZFP/',
      icon: 'xray',
    },
    {
      label: 'Taonet-Sintrom',
      href: 'http://10.192.176.103:8080/tao/servlet/KYNTAOController',
      icon: 'drop',
    },
    {
      label: 'Citas AP',
      href: 'https://www.tramita.gva.es/ctt-att-atr/asistente/iniciarTramite.html?tramite=CS-SOLOCITASIP&version=4&login=a&idioma=es&idCatGuc=PR&idProcGuc=2888',
      icon: 'agenda',
    },
  ],
  'Otros departamentos': [
    {
      label: 'PACS Alicante',
      href: 'https://c2imzfp.san.gva.es/ZFP',
      icon: 'xray',
    },
    {
      label: 'PACS Valencia',
      href: 'https://c1imzfp.san.gva.es/ZFP',
      icon: 'xray',
    },
    {
      label: 'PACS Castellón',
      href: 'https://c3imzfp.san.gva.es/ZFP',
      icon: 'xray',
    },
  ],
};

const documentosInteres: LinkItem[] = [
  {
    label: 'Solicitudes Personal',
    href: 'https://vvd17cloud.cs.san.gva.es/index.php/s/HssCWC6MNQHB3IY?path=%2F1.-%20SOLICITUDES%20Y%20PLANTILLAS%2FDOCUMENTACION%20ADMINISTRATIVA%2FPERSONAL%2FSOLICITUDES%20PERSONAL',
  },
  {
    label: 'Teléfonos Urgencias (credenciales CS)',
    href: 'https://sanjuan.san.gva.es/listin/',
  },
  {
    label: 'Oxigenoterapia Linde | Indicaciones',
    href: 'https://www.lindemedicaldirect.com/es/lite/app/Modules/Application/Main/Main.html#!/Startup',
  },
  {
    label: 'Perfiles Glucémicos Completos',
    href: 'https://drive.google.com/file/d/1w8JIsDIsdrLVSAdGt3i9jfFyFzx-XR67/view?usp=sharing',
  },

  {
    label: 'Plantilla Protocolos',
    href: 'https://vvd17cloud.cs.san.gva.es/index.php/s/HssCWC6MNQHB3IY/download?path=%2F3.-%20PROTOCOLOS%20Y%20APLICACIONES%2FPROTOCOLOS%20E%20INSTRUCCIONES%20DE%20TRABAJO%2F00.-PLANTILLA%20DE%20PROTOCOLO&files=modelo%20de%20protocolo.docx',
  },
  {
    label: 'Hoja firma guardias residentes',
    href: 'https://drive.google.com/file/d/1yjGxQNaHLHtdOYXpRmCZ-Oq_H9HEfKtG/view?usp=sharing',
  },
  {
    label: 'Hoja Informativa UHD',
    href: 'https://drive.google.com/file/d/1XfV0FDX5U6wWhKX0DVWnEhiwGl3lXbKI/view?usp=drive_link',
  },
];

const enlacesInteres: LinkItem[] = [
  {
    label: 'AEMPS',
    href: 'http://www.aemps.gob.es/cima/fichasTecnicas.do?metodo=detalleForm',
  },
  { label: 'Fármacos Lactancia', href: 'http://e-lactancia.org/' },
  {
    label: 'Equivalencias Mórficos',
    href: 'https://lamochiladelresi.wordpress.com/wp-content/uploads/2019/07/tabla_de_equivalencia_aproximada_entre_opioides_2014.pdf',
  },
  { label: 'UpToDate', href: 'http://www.uptodate.com/contents/search' },
  {
    label: 'Intoxicaciones (MurciaSalud)',
    href: 'http://www.murciasalud.es/toxiconet.php?op=listado_protocolos&idsec=4014',
  },
  {
    label: 'CIE oficial',
    href: 'https://eciemaps.mscbs.gob.es/ecieMaps/browser/indexMapping.html',
  },
];

const calendarEmbed =
  'https://www.google.com/calendar/embed?color=%23b90e28&color=%23f691b2&src=0mg852tsvqgekgud1j3g2ud4rk@group.calendar.google.com&src=6d41e36m9j14i3c1ovrvum1qdihm4d36@import.calendar.google.com&mode=AGENDA';

function Icon({ name }: { name: IconKey }) {
  const common = 'h-4 w-4';
  switch (name) {
    case 'person':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M5 21c1.5-4 12.5-4 14 0" />
        </svg>
      );
    case 'money':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M7 9v6M17 9v6" />
        </svg>
      );
    case 'internet':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a12 12 0 0 1 0 18M12 3a12 12 0 0 0 0 18" />
        </svg>
      );
    case 'mail':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
    case 'book':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 4h10a3 3 0 0 1 3 3v13H7a3 3 0 0 0-3 3z" />
          <path d="M4 4v16a3 3 0 0 1 3-3h10" />
        </svg>
      );
    case 'grad':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 7l10-4 10 4-10 4-10-4z" />
          <path d="M6 10v5c0 2 4 3 6 3s6-1 6-3v-5" />
        </svg>
      );
    case 'computer':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M10 16l-1 4M14 16l1 4" />
        </svg>
      );
    case 'wrench':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 7a4 4 0 0 0-5 5L4 17l3 3 5-5a4 4 0 0 0 5-5z" />
        </svg>
      );
    case 'flask':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 2h6" />
          <path d="M10 2v5l-5 9a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-9V2" />
        </svg>
      );
    case 'xray':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h6" />
        </svg>
      );
    case 'drop':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
        </svg>
      );
    case 'agenda':
      return (
        <svg
          className={common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 2v4M17 2v4M3 9h18" />
        </svg>
      );
  }
}

function LinkList({ items }: { items: { label: string; href: string; icon?: IconKey }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label}>
          {it.href ? (
            <a
              href={it.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 underline decoration-slate-300 underline-offset-4 hover:text-slate-700"
            >
              {it.icon ? (
                <span className="text-[#3d7684]">
                  <Icon name={it.icon} />
                </span>
              ) : null}
              {it.label}
            </a>
          ) : (
            <span>{it.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

type ChangelogEntry = {
  title: string;
  date: string;
  summary?: string;
};

function loadLatestChangelog(limit: number) {
  const dir = path.join(process.cwd(), 'content/changelog');
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => {
      const fullPath = path.join(dir, file);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data } = matter(raw);

      return {
        title: (data.title as string) ?? file.replace(/\.(md|mdx)$/i, ''),
        date: (data.date as string) ?? '1970-01-01',
        summary: data.summary as string | undefined,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

export default function HomePage() {
  const latestChangelog = loadLatestChangelog(3);

  return (
    <div className="space-y-10">
      <section className="relative -mx-4 h-[310px] overflow-hidden -mt-16 pt-9">
        <div
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: 'url(/urg-background.png)',
            backgroundPosition: 'center 18%',
          }}
        />
        <div className="absolute inset-0 bg-white/60" />
        <div className="relative z-10 flex h-full items-center">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
            <h1 className="text-4xl font-semibold text-black">UrgenciasHSJ</h1>
            <p className="mt-2 text-black">Recursos de Urgencias</p>
            <div className="mt-3 h-1 w-20 rounded-full bg-[#3d7684]" />
          </div>
        </div>
      </section>

      {latestChangelog.length > 0 && (
        <Link
          href="/novedades"
          className="block rounded-2xl border border-[#cfe2e6] bg-[#eef6f8] p-4 transition hover:border-[#b8d3da] hover:bg-[#e6f2f5]"
        >
          <div className="space-y-1 text-sm text-[#3f5f66]">
            {latestChangelog.map((entry) => (
              <div key={`${entry.date}-${entry.title}`} className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                  Novedades
                </span>
                <span className="text-xs text-[#6b7f83]">{entry.date}</span>
                <span className="font-semibold text-slate-900">{entry.title}</span>
                {entry.summary ? (
                  <span className="text-xs text-[#7b8f94] ml-2">— {entry.summary}</span>
                ) : null}
                <span className="ml-auto text-xs font-semibold text-[#2b5d68]">Ver todo →</span>
              </div>
            ))}
          </div>
        </Link>
      )}

      <section className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Enlaces Corporativos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(enlacesCorporativos).map(([grupo, items]) => (
            <div key={grupo} className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#516f75]">
                {grupo}
              </h3>
              <LinkList items={items} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-xl font-semibold">Observación</h2>
          <LinkList items={observacion} />
        </section>

        <section className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-xl font-semibold">Documentos de Interés</h2>
          <LinkList items={documentosInteres} />
        </section>

        <section className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-xl font-semibold">Enlaces de Interés</h2>
          <LinkList items={enlacesInteres} />
        </section>
      </div>

      <section className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Próximos eventos relacionados</h2>
        <div className="overflow-hidden rounded-md border border-[#dfe9eb]">
          <iframe title="Calendario de eventos" src={calendarEmbed} className="h-[500px] w-full" />
        </div>
      </section>
    </div>
  );
}
