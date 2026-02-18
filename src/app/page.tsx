import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import Link from 'next/link';

type LinkItem = {
  label: string;
  href: string;
  icon?: IconKey;
  endIcon?: EndIconKey;
  intranet?: boolean;
};

const observacion: LinkItem[] = [
  {
    label: 'Relevo Observación',
    href: 'https://drive.google.com/file/d/1YccU61yNP8X5N10rd2xSBB26guQUMD8A/view?usp=sharing',
    endIcon: 'phoneSheet',
  },
  {
    label: 'Esquema Observación',
    href: 'https://drive.google.com/file/d/1KQaem_gE9AXnI6FSg_TIbVFba4vmGwCW/view?usp=sharing',
    endIcon: 'phoneSheet',
  },
  {
    label: 'Hoja Informativa UHD',
    href: 'https://drive.google.com/file/d/1XfV0FDX5U6wWhKX0DVWnEhiwGl3lXbKI/view?usp=drive_link',
    endIcon: 'phoneSheet',
  },
  {
    label: 'Plantilla asignación médico N2',
    href: 'https://drive.google.com/file/d/1Gi_J6xWg8lGq5t4PKmA07kSdJKpGYP5Q/view?usp=sharing',
    endIcon: 'phoneSheet',
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

type EndIconKey = 'phoneSheet';

const enlacesCorporativos: Record<string, LinkItem[]> = {
  Personal: [
    {
      label: 'Portal del Empleado GVA',
      href: 'https://vvd17portalempleado.cs.san.gva.es/',
      icon: 'person',
      intranet: true,
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
      intranet: true,
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
      href: 'https://eves.san.gva.es/es/',
      icon: 'grad',
    },
    {
      label: 'Informática',
      href: 'https://intranet17.cs.san.gva.es/departamento/servicios-de-apoyo/informatica/informatica/',
      icon: 'computer',
      intranet: true,
    },
  ],
  Departamento: [
    {
      label: 'GestLab (HSJ)',
      href: 'https://vvd17silaplpro.cs.san.gva.es/iGestlab/Login.aspx?',
      icon: 'flask',
      intranet: true,
    },

    {
      label: 'Visor RX (HSJ)',
      href: 'https://vvd17zfpa.cs.san.gva.es/ZFP/',
      icon: 'xray',
      intranet: true,
    },
    {
      label: 'Taonet-Sintrom',
      href: 'http://10.192.176.103:8080/tao/servlet/KYNTAOController',
      icon: 'drop',
      intranet: true,
    },
    {
      label: 'Citas AP',
      href: 'https://www.tramita.gva.es/ctt-att-atr/asistente/iniciarTramite.html?tramite=CS-SOLOCITASIP&version=5&idioma=es&idProcGuc=2888&idSubfaseGuc=SOLICITUD&idCatGuc=PR',
      icon: 'agenda',
    },
  ],
};

const documentosInteres: LinkItem[] = [
  {
    label: 'Solicitudes Personal',
    href: 'https://vvd17cloud.cs.san.gva.es/index.php/s/HssCWC6MNQHB3IY?path=%2F1.-%20SOLICITUDES%20Y%20PLANTILLAS%2FDOCUMENTACION%20ADMINISTRATIVA%2FPERSONAL%2FSOLICITUDES%20PERSONAL',
    intranet: true,
  },
  {
    label: 'Hoja de teléfonos más usados Urgencias',
    href: 'https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/Shared_GVA/listintel_urghsj.pdf?csf=1&web=1&e=e0QIiW',
    endIcon: 'phoneSheet',
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
    endIcon: 'phoneSheet',
  },

  {
    label: 'Plantilla Protocolos',
    href: 'https://vvd17cloud.cs.san.gva.es/index.php/s/HssCWC6MNQHB3IY/download?path=%2F3.-%20PROTOCOLOS%20Y%20APLICACIONES%2FPROTOCOLOS%20E%20INSTRUCCIONES%20DE%20TRABAJO%2F00.-PLANTILLA%20DE%20PROTOCOLO&files=modelo%20de%20protocolo.docx',
    intranet: true,
  },
  {
    label: 'Hoja firma guardias residentes',
    href: 'https://drive.google.com/file/d/1yjGxQNaHLHtdOYXpRmCZ-Oq_H9HEfKtG/view?usp=sharing',
    endIcon: 'phoneSheet',
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
  {
    label: 'Peremecum (H.G.U. Dr. Balmis)',
    href: 'https://alicante.san.gva.es/documents/d/alicante/peremecum',
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

function IntranetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.696-3.534c.63 0 1.332-.288 2.196-1.458l.911-1.22a.334.334 0 0 0-.074-.472.38.38 0 0 0-.505.06l-1.475 1.679a.241.241 0 0 1-.279.061.211.211 0 0 1-.12-.244l1.858-7.446a.499.499 0 0 0-.575-.613l-3.35.613a.35.35 0 0 0-.276.258l-.086.334a.25.25 0 0 0 .243.312h1.73l-1.476 5.922c-.054.234-.144.63-.144.918 0 .666.396 1.296 1.422 1.296zm1.83-10.536c.702 0 1.242-.414 1.386-1.044.036-.144.054-.306.054-.414 0-.504-.396-.972-1.134-.972-.702 0-1.242.414-1.386 1.044a1.868 1.868 0 0 0-.054.414c0 .504.396.972 1.134.972z" />
    </svg>
  );
}

function PhoneSheetIcon() {
  return (
    <svg
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M3.5 8H3V7H3.5C3.77614 7 4 7.22386 4 7.5C4 7.77614 3.77614 8 3.5 8Z"
        fill="#3d7684"
      />
      <path
        d="M7 10V7H7.5C7.77614 7 8 7.22386 8 7.5V9.5C8 9.77614 7.77614 10 7.5 10H7Z"
        fill="#3d7684"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 1.5C1 0.671573 1.67157 0 2.5 0H10.7071L14 3.29289V13.5C14 14.3284 13.3284 15 12.5 15H2.5C1.67157 15 1 14.3284 1 13.5V1.5ZM3.5 6H2V11H3V9H3.5C4.32843 9 5 8.32843 5 7.5C5 6.67157 4.32843 6 3.5 6ZM7.5 6H6V11H7.5C8.32843 11 9 10.3284 9 9.5V7.5C9 6.67157 8.32843 6 7.5 6ZM10 11V6H13V7H11V8H12V9H11V11H10Z"
        fill="#3d7684"
      />
    </svg>
  );
}

function EndIcon({ name }: { name: EndIconKey }) {
  switch (name) {
    case 'phoneSheet':
      return <PhoneSheetIcon />;
  }
  return null;
}

function LinkList({ items }: { items: LinkItem[] }) {
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
              <span>{it.label}</span>
              {it.endIcon ? <EndIcon name={it.endIcon} /> : null}
              {it.intranet ? (
                <span
                  className="ml-1 text-[#6b7f83]"
                  title="accesible solo intranet"
                  aria-label="accesible solo intranet"
                >
                  <IntranetIcon />
                </span>
              ) : null}
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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

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
    .filter((entry) => {
      const parsed = new Date(entry.date);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed.getFullYear() === currentYear && parsed.getMonth() === currentMonth;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

export default function HomePage() {
  const latestChangelog = loadLatestChangelog(3);

  return (
    <div className="space-y-10">
      <section className="relative -mx-4 h-[310px] overflow-hidden -mt-16 pt-9 rounded-b-3xl">
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
          <div className="space-y-2 text-sm text-[#3f5f66]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                Novedades
              </span>
              <span className="text-xs font-semibold text-[#2b5d68]">Ver todo →</span>
            </div>
            <div className="space-y-1.5">
              {latestChangelog.map((entry) => (
                <div key={`${entry.date}-${entry.title}`} className="grid grid-cols-[88px_1fr] gap-x-3">
                  <span className="text-xs text-[#6b7f83] pt-0.5">{entry.date}</span>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900">{entry.title}</span>
                    {entry.summary ? (
                      <span className="text-xs text-[#7b8f94] ml-2">— {entry.summary}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>
      )}

      <section className="rounded-xl border border-[#dfe9eb] bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Enlaces Corporativos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <h2 className="text-xl font-semibold">Nivel 2 · Observación</h2>
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
