const bloques = [
  {
    titulo: "Formación en RCP y Politrauma",
    items: [
      {
        label: "Advanced Trauma Life Support (ATLS)",
        href: "https://www.aecirujanos.es/Cursos-ATLS-Advanced-Trauma-Life-Support_es_104_7_0_117_118.html",
      },
      { label: "Advanced Pediatric Life Support (APLS)", href: "https://seup.org/cursosapls/" },
      {
        label: "Curso de Politrauma (Valdecilla)",
        href: "https://www.hvvaldecilla.es/formacion/cu1393/curso-de-atencion-al-paciente-politraumatizado",
      },
      {
        label: "Difficult Airway Course (EMS)",
        href: "https://www.emergencyglobalsystem.com/curso-formacion/the-difficult-airway-course-ems/",
      },
      {
        label: "Asistencia Inicial al Politrauma Pediátrico (AITP La Paz)",
        href: "https://www.aeped.es/eventos/2021/curso-asistencia-inicial-al-trauma-pediatrico-aitp-paz",
      },
      {
        label: "Transporte Medicalizado para Personal Médico (EVES)",
        href: "https://eves.san.gva.es/web/guest/detalle-cursos?codigo=12005501F&idi=es",
      },
    ],
  },
  {
    titulo: "Masters de Urgencias y Emergencias",
    items: [
      {
        label: "Máster en Medicina de Urgencias y Emergencias de la SEMES",
        href: "https://www.medicapanamericana.com/es/formacion/master-en-medicina-de-urgencias-y-emergencias-de-la-semes",
      },
      {
        label: "Máster en Enfermo Crítico y Emergencias (UAM)",
        href: "https://www.uam.es/CentroFormacionContinua/MT_Enfermo_Critico_y_Emergencias/1446781426700.htm?language=es_ES&nDept=3&pid=1446755564845&pidDept=1446755608769",
      },
    ],
  },
  {
    titulo: "Ecografía",
    items: [
      { label: "Ecocardioscopia", href: "https://ecocardio.com/area-formacion/seic-formacion/curso-ecocardioscopia.html" },
      { label: "Ecografía pulmonar", href: "https://ecocardio.com/area-formacion/seic-formacion/curso-ecopulmonar.html" },
      {
        label: "Máster de la UAM en Ecografía Clínica POC (Point of Care)",
        href: "https://uam.es/CentroFormacionContinua/MT_Ecografia_clinica_Estudio/1446815843581.htm?language=es_ES&nDept=3&pid=1446755564845&pidDept=1446755608769",
      },
      {
        label: "Máster de la UdL en Ecografía Clínica (Winfocus)",
        href: "http://www.winfocusiberia.com/nuevo-master-en-ecografia-clinica-udl/",
      },
    ],
  },
  {
    titulo: "Ventilación",
    items: [
      { label: "Curso VMNI SEMES (Murcia)", href: "http://vmni.eventosenplural.com/curso-ventilacion-mecanica-no-invasiva/" },
    ],
  },
];

export default function FormacionPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Formación</h1>
        <p className="text-slate-600">
          A continuación se relacionan algunos de los cursos y masters que complementan la formación recibida a través
          del programa de formación sanitaria especializada (MIR), para completar la formación básica en urgencias y
          emergencias.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {bloques.map((b) => (
          <section key={b.titulo} className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">{b.titulo}</h2>
            <ul className="mt-3 space-y-2">
              {b.items.map((it) => (
                <li key={it.href}>
                  <a
                    href={it.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-slate-700"
                  >
                    {it.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
