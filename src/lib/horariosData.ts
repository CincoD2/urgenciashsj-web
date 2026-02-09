export const MONTHS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
] as const;

export type MonthKey = (typeof MONTHS)[number];

export const MONTH_LABELS: Record<MonthKey, string> = {
  ENE: "Enero",
  FEB: "Febrero",
  MAR: "Marzo",
  ABR: "Abril",
  MAY: "Mayo",
  JUN: "Junio",
  JUL: "Julio",
  AGO: "Agosto",
  SEP: "Septiembre",
  OCT: "Octubre",
  NOV: "Noviembre",
  DIC: "Diciembre",
};

export const MONTH_ALIASES: Record<MonthKey, string[]> = {
  ENE: ["ene", "enero", "1", "01"],
  FEB: ["feb", "febrero", "2", "02"],
  MAR: ["mar", "marzo", "3", "03"],
  ABR: ["abr", "abril", "4", "04"],
  MAY: ["may", "mayo", "5", "05"],
  JUN: ["jun", "junio", "6", "06"],
  JUL: ["jul", "julio", "7", "07"],
  AGO: ["ago", "agosto", "8", "08"],
  SEP: ["sep", "sept", "septiembre", "9", "09"],
  OCT: ["oct", "octubre", "10"],
  NOV: ["nov", "noviembre", "11"],
  DIC: ["dic", "diciembre", "12"],
};

export type YearSchedule = {
  year: number;
  links?: { label: string; url: string }[];
  months: Partial<Record<MonthKey, string>>;
};

export const HORARIOS: YearSchedule[] = [
  {
    year: 2026,
    /* links: [
      {
        label: "Rueda",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/20181217%20Turno%20Rodado%20Urgencias%20VPS%202019%20Oficial.pdf",
      },
    ], */
    months: {
      ENE: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202601.pdf?csf=1&web=1&e=SLnjEO",
      FEB: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202602.pdf?csf=1&web=1&e=l4fwle",
      MAR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202603.pdf?csf=1&web=1&e=0evzyA",
      ABR: "",
      MAY: "",
      JUN: "",
      JUL: "",
      AGO: "",
      SEP: "",
      OCT: "",
      NOV: "",
      DIC: "",
    },
  },
  {
    year: 2025,
    /* links: [
      {
        label: "Rueda",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/2018%20Turno%20Rodado.pdf",
      },
    ], */
    months: {
      ENE: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202501.pdf?csf=1&web=1&e=yrcBt5",
      FEB: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202502.pdf?csf=1&web=1&e=mpz3aB",
      MAR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202503.pdf?csf=1&web=1&e=MoEkBl",
      ABR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202504.pdf?csf=1&web=1&e=AmJy68",
      MAY: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202505.pdf?csf=1&web=1&e=mPSCRs",
      JUN: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202506.pdf?csf=1&web=1&e=gDbDnQ",
      JUL: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202507.pdf?csf=1&web=1&e=WoZh6J",
      AGO: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202508.pdf?csf=1&web=1&e=BDtCCS",
      SEP: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202509.pdf?csf=1&web=1&e=PbaxMi",
      OCT: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202510.pdf?csf=1&web=1&e=uGvFU5",
      NOV: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202511.pdf?csf=1&web=1&e=drIk3h",
      DIC: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202512.pdf?csf=1&web=1&e=clTEVI",
    },
  },
  {
    year: 2024,
    /* links: [
      {
        label: "Rueda",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/20161221%20Turno%20Rodado%202017.pdf",
      },
      {
        label: "Navidades 2016-2021",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/Navidades%202016-2021.pdf",
      },
    ], */
    months: {
      ENE: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202401.pdf?csf=1&web=1&e=nQ0TNc",
      FEB: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202402.pdf?csf=1&web=1&e=DFoa7X",
      MAR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202403.pdf?csf=1&web=1&e=fW4etk",
      ABR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202404.pdf?csf=1&web=1&e=9gRddE",
      MAY: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202405.pdf?csf=1&web=1&e=IPYiKc",
      JUN: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202406.pdf?csf=1&web=1&e=B96acr",
      JUL: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202407.pdf?csf=1&web=1&e=TtTD95",
      AGO: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202408.pdf?csf=1&web=1&e=HcfZQN",
      SEP: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202409.pdf?csf=1&web=1&e=P6Z2c1",
      OCT: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202410.pdf?csf=1&web=1&e=CMf59E",
      NOV: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202411.pdf?csf=1&web=1&e=PGNfTq",
      DIC: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202412.pdf?csf=1&web=1&e=aHGmAI",
    },
  },
  {
    year: 2023,
    /* links: [
      {
        label: "Rueda (feb 2016)",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/20160210%20Rueda%202016.pdf",
      },
      {
        label: "Rueda (dic 2015)",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/2016%20Turno%20Rodado.pdf",
      },
      {
        label: "Distribucion de turnos",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/20160216%20Distribuci%C3%B3n%20Trabajo.pdf",
      },
      {
        label: "Horario Sostenible",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/20160219%20Normas%20Horario%20Sostenible.pdf",
      },
    ], */
    months: {
      ENE: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202301.pdf?csf=1&web=1&e=N6MxO7",
      FEB: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202302.pdf?csf=1&web=1&e=FvDJan",
      MAR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202303.pdf?csf=1&web=1&e=13geEP",
      ABR: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202304.pdf?csf=1&web=1&e=5Gbb72",
      MAY: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202305.pdf?csf=1&web=1&e=dTAyvb",
      JUN: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202306.pdf?csf=1&web=1&e=Y5XWkC",
      JUL: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202307.pdf?csf=1&web=1&e=8N881t",
      AGO: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202308.pdf?csf=1&web=1&e=OvrGeS",
      SEP: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202309.pdf?csf=1&web=1&e=rRPUOH",
      OCT: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202310.pdf?csf=1&web=1&e=O3FGAT",
      NOV: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202311.pdf?csf=1&web=1&e=Eg2bhM",
      DIC: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202312.pdf?csf=1&web=1&e=IUF7qN",
    },
  },
  {
    year: 2022,
    /* links: [
      {
        label: "Rueda",
        url: "https://coresocial.riberasaludapp.com/Organizacion/AreaMedicaQuirurgica/URGV/TURNOS/Rueda2015.pdf",
      },
    ], */
    months: {
      ENE: "",
      FEB: "",
      MAR: "",
      ABR: "",
      MAY: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202205.pdf?csf=1&web=1&e=kfTu0S",
      JUN: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202206.pdf?csf=1&web=1&e=7qYxqC",
      JUL: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202207.pdf?csf=1&web=1&e=P1Yf83",
      AGO: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202208.pdf?csf=1&web=1&e=JnSaeh",
      SEP: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202209.pdf?csf=1&web=1&e=gsxxb7",
      OCT: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202210.pdf?csf=1&web=1&e=6P93Ut",
      NOV: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202211.pdf?csf=1&web=1&e=068oKI",
      DIC: "https://gvaes-my.sharepoint.com/:b:/r/personal/dieguez_san_gva_es/Documents/SesionesUrg_PDF/horarios_urg/202212.pdf?csf=1&web=1&e=y6RewO",
    },
  },
];
