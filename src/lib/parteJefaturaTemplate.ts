type ParteJefaturaData = {
  fecha: string;
  jefeGuardia: string;
  pruebas: { tipo: string; cantidad: number }[];
  especialidades: { tipo: string; cantidad: number }[];
  incidencias: string;
  conteos: {
    pendientesIngreso: number;
    pendientesEvolucion: number;
    pendientesMedico: number;
    observacionPendientesUbicacion: number;
  };
  logoDataUrl?: string | null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatText = (value: string) => escapeHtml(value).replace(/\n/g, '<br/>');

export function buildParteJefaturaHtml(data: ParteJefaturaData) {
  const { fecha, jefeGuardia, pruebas, especialidades, incidencias, conteos, logoDataUrl } = data;
  const incidenciasText = incidencias.trim() ? incidencias : 'Sin incidencias';

  const logoHtml = logoDataUrl
    ? `<img class="logo" src="${logoDataUrl}" alt="Logo"/>`
    : '<div class="logo placeholder">Logo</div>';

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Parte Jefatura</title>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
        color: #000;
      }
      .page {
        padding: 0;
      }
      .membrete {
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        margin-bottom: 8mm;
      }
      .logo {
        width: 11.28cm;
        height: 1.5cm;
        object-fit: contain;
      }
      .logo.placeholder {
        width: 11.28cm;
        height: 1.5cm;
        border: 1px solid #000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9pt;
      }
      .titulo {
        border: 1px solid #000;
        text-align: center;
        font-weight: 700;
        font-size: 12pt;
        padding: 1.5mm 4mm;
        margin-bottom: 6mm;
        text-transform: uppercase;
      }
      .linea {
        margin-bottom: 4mm;
      }
      .linea strong { font-weight: 700; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 6mm 0;
        font-size: 10pt;
        table-layout: fixed;
      }
      th, td {
        border: 1px solid #000;
        padding: 6px 8px;
        vertical-align: top;
      }
      th {
        padding: 3px 6px;
      }
      th:last-child {
        text-align: center;
        width: 45mm;
      }
      td:last-child {
        text-align: center;
        width: 45mm;
      }
      th {
        text-align: left;
        font-weight: 700;
      }
      .incidencias {
        padding: 0;
        min-height: 60mm;
        white-space: normal;
        text-align: left;
      }
      .incidencias-contenido {
        text-align: justify;
      }
      .incidencias-titulo {
        font-weight: 700;
        margin-bottom: 3mm;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="membrete">
        ${logoHtml}
      </div>
      <div class="titulo">INFORME JEFATURA GUARDIA URGENCIAS</div>
      <div class="linea"><strong>FECHA:</strong> ${escapeHtml(fecha)}</div>
      <div class="linea"><strong>JEFE DE GUARDIA:</strong> ${escapeHtml(jefeGuardia)}</div>
      <div class="linea">Nº Pacientes que permanecen en urgencias a las 8.00h</div>

      <table>
        <thead>
          <tr>
            <th>MOTIVO</th>
            <th>Nº PACIENTES</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>PENDIENTES DE INGRESO</td>
            <td>${conteos.pendientesIngreso}</td>
          </tr>
          <tr>
            <td>PENDIENTES DE PRUEBA RADIOLÓGICA</td>
            <td>${escapeHtml(
              pruebas.length ? pruebas.map((p) => `${p.tipo}: ${p.cantidad}`).join('; ') : '—'
            )}</td>
          </tr>
          <tr>
            <td>PENDIENTES DE VALORACIÓN POR ESPECIALIDAD (ESPECIFICAR)</td>
            <td>${escapeHtml(
              especialidades.length
                ? especialidades.map((e) => `${e.tipo}: ${e.cantidad}`).join('; ')
                : '—'
            )}</td>
          </tr>
          <tr>
            <td>PENDIENTES DE EVOLUCIÓN</td>
            <td>${conteos.pendientesEvolucion}</td>
          </tr>
          <tr>
            <td>PENDIENTES DE ASISTENCIA</td>
            <td>${conteos.pendientesMedico}</td>
          </tr>
          <tr>
            <td>OBSERVACIÓN URGENCIAS</td>
            <td>${conteos.observacionPendientesUbicacion}</td>
          </tr>
        </tbody>
      </table>

      <div class="incidencias">
        <div class="incidencias-titulo">INCIDENCIAS</div>
        <div class="incidencias-contenido">${incidenciasText}</div>
      </div>
    </div>
  </body>
</html>`;
}

export type { ParteJefaturaData };
