export type IconKey =
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

export type EndIconKey = 'phoneSheet';

export type LinkItem = {
  label: string;
  href: string;
  icon?: IconKey;
  endIcon?: EndIconKey;
  intranet?: boolean;
};

export const observacion: LinkItem[] = [
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
  {
    label: 'Consentimientos Informados Conselleria',
    href: 'https://www.san.gva.es/es/web/portal-del-paciente/consentiment-informat/guia-ci-castella',
  },
];

export const enlacesCorporativos: Record<string, LinkItem[]> = {
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

export const documentosInteres: LinkItem[] = [
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

export const enlacesInteres: LinkItem[] = [
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

export type HomeSearchEntry = {
  id: string;
  title: string;
  section: string;
  href?: string;
  content: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getHomeSearchTargetId(section: string, title: string) {
  return `home-${slugify(section)}-${slugify(title)}`;
}

function buildSectionEntries(section: string, items: LinkItem[]) {
  return items.map((item) => ({
    id: getHomeSearchTargetId(section, item.label),
    title: item.label,
    section,
    href: item.href,
    content: [section, item.label, item.intranet ? 'intranet' : '', item.href]
      .filter(Boolean)
      .join(' '),
  }));
}

export function getHomeSearchEntries(): HomeSearchEntry[] {
  return [
    ...Object.entries(enlacesCorporativos).flatMap(([section, items]) =>
      buildSectionEntries(`Enlaces corporativos · ${section}`, items)
    ),
    ...buildSectionEntries('Nivel 2 · Observación', observacion),
    ...buildSectionEntries('Documentos de Interés', documentosInteres),
    ...buildSectionEntries('Enlaces de Interés', enlacesInteres),
    {
      id: 'home-novedades',
      title: 'Novedades',
      section: 'Inicio',
      href: '/novedades',
      content: 'inicio novedades changelog cambios actualizaciones',
    },
    {
      id: 'home-top-consultadas',
      title: 'Top consultadas',
      section: 'Inicio',
      content: 'inicio top consultadas paginas mas vistas analytics',
    },
    {
      id: 'home-eventos',
      title: 'Próximos eventos relacionados',
      section: 'Inicio',
      content: 'inicio eventos calendario agenda google calendar',
    },
  ];
}
