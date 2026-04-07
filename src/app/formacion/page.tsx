import Link from 'next/link';

type Bloque = {
  titulo: string;
  descripcion: string;
  icono: 'trauma' | 'master' | 'eco' | 'vent';
  acento: string;
  acentoSuave: string;
  borde: string;
  items: Array<{
    label: string;
    href: string;
  }>;
};

const bloques: Bloque[] = [
  {
    titulo: 'Formación en RCP y Politrauma',
    descripcion: 'Cursos orientados al abordaje inicial del paciente crítico y traumatizado.',
    icono: 'trauma',
    acento: 'text-[#2b5d68]',
    acentoSuave: 'bg-[#eef6f8]',
    borde: 'border-[#cfe2e6]',
    items: [
      {
        label: 'Advanced Trauma Life Support (ATLS)',
        href: 'https://www.aecirujanos.es/Cursos-ATLS-DSTC-DATC_es_104_0_0_118_756.html',
      },
      { label: 'Advanced Pediatric Life Support (APLS)', href: 'https://seup.org/cursosapls/' },
      {
        label: 'Curso de Politrauma (Valdecilla)',
        href: 'https://www.hvvaldecilla.es/formacion/cu1393/curso-de-atencion-al-paciente-politraumatizado',
      },
      {
        label: 'Difficult Airway Course (EMS)',
        href: 'https://www.emergencyglobalsystem.com/curso-formacion/the-difficult-airway-course-ems/',
      },
      {
        label: 'Asistencia Inicial al Politrauma Pediátrico (AITP La Paz)',
        href: 'https://www.idipaz.es/node/1192',
      },
      {
        label: 'Transporte Medicalizado para Personal Médico (EVES)',
        href: 'https://eves.san.gva.es/web/guest/detalle-cursos?codigo=12005501F&idi=es',
      },
    ],
  },
  {
    titulo: 'Masters de Urgencias y Emergencias',
    descripcion: 'Programas de posgrado para consolidar itinerarios profesionales en el área.',
    icono: 'master',
    acento: 'text-[#385f7a]',
    acentoSuave: 'bg-[#eef3f8]',
    borde: 'border-[#d7e4ee]',
    items: [
      {
        label: 'Máster en Medicina de Urgencias y Emergencias de la SEMES',
        href: 'https://www.medicapanamericana.com/es/formacion/master-en-medicina-de-urgencias-y-emergencias-de-la-semes',
      },
      {
        label: 'Máster en Enfermo Crítico y Emergencias (UAM)',
        href: 'https://www.uam.es/CentroFormacionContinua/MT_Enfermo_Critico_y_Emergencias/1446781426700.htm?language=es_ES&nDept=3&pid=1446755564845&pidDept=1446755608769',
      },
    ],
  },
  {
    titulo: 'Ecografía',
    descripcion: 'Formación clínica focalizada en herramientas POCUS y ecografía aplicada.',
    icono: 'eco',
    acento: 'text-[#3c6f65]',
    acentoSuave: 'bg-[#edf7f3]',
    borde: 'border-[#d1e6df]',
    items: [
      {
        label: 'Ecocardioscopia',
        href: 'https://ecocardio.com/area-formacion/seic-formacion/curso-ecocardioscopia.html',
      },
      {
        label: 'Ecografía pulmonar',
        href: 'https://ecocardio.com/area-formacion/seic-formacion/curso-ecopulmonar.html',
      },
      {
        label: 'Máster de la UAM en Ecografía Clínica POC (Point of Care)',
        href: 'https://uam.es/CentroFormacionContinua/MT_Ecografia_clinica_Estudio/1446815843581.htm?language=es_ES&nDept=3&pid=1446755564845&pidDept=1446755608769',
      },
      {
        label: 'Máster de la UdL en Ecografía Clínica (Winfocus)',
        href: 'http://www.winfocusiberia.com/nuevo-master-en-ecografia-clinica-udl/',
      },
    ],
  },
  {
    titulo: 'Ventilación',
    descripcion: 'Actualización en soporte ventilatorio no invasivo y manejo respiratorio avanzado.',
    icono: 'vent',
    acento: 'text-[#6b5a82]',
    acentoSuave: 'bg-[#f4f0f8]',
    borde: 'border-[#e0d9eb]',
    items: [
      {
        label: 'Curso VMNI SEMES (Murcia)',
        href: 'http://vmni.eventosenplural.com/curso-ventilacion-mecanica-no-invasiva/',
      },
    ],
  },
];

const totalRecursos = bloques.reduce((count, bloque) => count + bloque.items.length, 0);

function BlockIcon({ icono, className }: { icono: Bloque['icono']; className?: string }) {
  const base = className ?? 'h-5 w-5';

  switch (icono) {
    case 'trauma':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={base}>
          <path d="M12 4v16M4 12h16" />
          <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" opacity="0.45" />
        </svg>
      );
    case 'master':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={base}>
          <path d="M3 8l9-4 9 4-9 4-9-4Z" />
          <path d="M7 11v4.5c0 1.7 3.1 2.5 5 2.5s5-.8 5-2.5V11" />
        </svg>
      );
    case 'eco':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={base}>
          <rect x="4" y="5" width="11" height="14" rx="2" />
          <path d="M8 9h3M8 12h4M17 9l3-1v8l-3-1" />
        </svg>
      );
    case 'vent':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={base}>
          <path d="M5 12h6" />
          <path d="M11 8v8" />
          <path d="M14 7h2a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-2" />
        </svg>
      );
  }
}

function ExternalArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export default function FormacionPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(238,246,248,0.96),rgba(255,255,255,0.88))] px-6 py-8 shadow-[0_18px_48px_rgba(20,37,45,0.10)] sm:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.12]"
            style={{ backgroundImage: 'url(/urg-background.png)' }}
          />
          <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-[#cfe2e6]/65 blur-3xl" />
          <div className="absolute right-0 top-10 h-40 w-40 rounded-full bg-[#dce9f3]/70 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[#d9efe8]/70 blur-3xl" />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2b5d68] backdrop-blur">
            Formación continuada
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Formación
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[#48636a] sm:text-base">
              Recursos formativos para reforzar la capacitación en urgencias y emergencias, con un
              diseño más alineado con la portada y una lectura más clara por áreas.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#cfe2e6] bg-white/80 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#516f75]">
                Áreas formativas
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{bloques.length}</p>
            </div>
            <div className="rounded-2xl border border-[#d7e4ee] bg-white/80 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#516f75]">
                Recursos enlazados
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{totalRecursos}</p>
            </div>
            <div className="rounded-2xl border border-[#d1e6df] bg-white/80 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#516f75]">
                Enfoque
              </p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                MIR, posgrado y capacitación práctica
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/formacion/programa-oficial"
          className="relative overflow-hidden rounded-[1.75rem] border border-[#cfe2e6] bg-[linear-gradient(135deg,#eef6f8,#ffffff)] p-6 shadow-[0_14px_38px_rgba(20,37,45,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(20,37,45,0.10)] md:col-span-2"
        >
          <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#dcebee] blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex w-fit items-center rounded-full border border-[#cfe2e6] bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#2b5d68]">
                Referencia principal
              </span>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                  Programa Oficial de la Especialidad de Urgencias y Emergencias
                </h2>
                <p className="text-sm leading-6 text-[#4e686f] sm:text-base">
                  Punto de partida para ordenar la formación complementaria de la página y ubicar
                  los cursos y másteres dentro del itinerario de la especialidad.
                </p>
                <p className="text-sm font-medium text-[#2b5d68]">Abrir subpágina del programa →</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-[#48636a] shadow-sm backdrop-blur-sm">
              Formación sanitaria especializada
            </div>
          </div>
        </Link>

        {bloques.map((bloque) => (
          <section
            key={bloque.titulo}
            className={`group rounded-[1.5rem] border bg-white/95 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(20,37,45,0.08)] ${bloque.borde}`}
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bloque.acentoSuave} ${bloque.acento}`}
                >
                  <BlockIcon icono={bloque.icono} />
                </div>
                <div className="min-w-0 space-y-1">
                  <h2 className="text-lg font-semibold text-slate-950">{bloque.titulo}</h2>
                  <p className="text-sm leading-6 text-[#61767c]">{bloque.descripcion}</p>
                </div>
              </div>

              <ul className="space-y-2.5">
                {bloque.items.map((it) => (
                  <li key={it.href}>
                    <a
                      href={it.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm text-slate-900 transition hover:bg-slate-50 ${bloque.borde} ${bloque.acentoSuave}`}
                    >
                      <span className="min-w-0 flex-1">{it.label}</span>
                      <span className={bloque.acento}>
                        <ExternalArrow />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
