/** Email-safe layout: tables and inline styles for Mail, Gmail and Outlook. */
export function turno2027Email(group: string, siteUrl: string) {
  const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  const root = siteUrl.replace(/\/$/, '');
  const url = escape(`${root}/horarios`);
  const label = escape(group);
  const text = `UrgenciasHSJ · Turno rodado 2027 · Grupo ${group}\n\nAdjuntamos el calendario de tu grupo, del 11 de enero al 23 de diciembre de 2027, con las asignaciones especiales de festivos incluidas. No se incluyen los refuerzos (R).\n\nAntes de importar, crea un calendario separado para tus turnos.\n\niPhone: Calendario > Calendarios > Añadir calendario > Añadir calendario. Ponle un nombre, elige iCloud y un color, y guarda. Después abre este mensaje en Mail de Apple, toca el adjunto ICS y utiliza Añadir todos si aparece. Selecciona el calendario que acabas de crear.\n\nMac: Calendario > Archivo > Importar. Selecciona el ICS y el calendario de destino.\n\nAndroid: desde un ordenador, abre Google Calendar > Configuración > Importar y exportar. Importa el ICS y sincroniza la misma cuenta de Google en el móvil.\n\nImporta el archivo una sola vez para evitar duplicados. Es una copia del turno rodado y no se actualiza automáticamente.\n\nConsulta el damero y las instrucciones en ${root}/horarios\n\nHas recibido este correo porque has solicitado el calendario en nuestra web. Tu dirección se utiliza solo para este envío y no se añade a ninguna lista de distribución.\n\nUrgenciasHSJ`;
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Turno rodado 2027 · Grupo ${label}</title></head>
<body style="margin:0;padding:0;background-color:#f5f8f9;color:#334155;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu calendario del grupo ${label}, con los festivos incluidos, está listo para importar.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f8f9;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border:1px solid #dfe9eb;border-radius:18px;overflow:hidden;">
<tr><td style="padding:24px;background-color:#1f4c57;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="padding-right:12px;"><img src="${escape(root)}/logourg.png" width="38" height="38" alt="" style="display:block;border:0;"></td><td style="color:#ffffff;font-size:21px;font-weight:bold;">UrgenciasHSJ<br><span style="font-size:12px;font-weight:normal;color:#d7e9ec;">Servicio de Urgencias</span></td></tr></table>
</td></tr>
<tr><td style="padding:28px 24px 20px;">
<p style="margin:0 0 10px;color:#52747d;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Tu calendario de turnos</p>
<h1 style="margin:0 0 12px;color:#1f4c57;font-size:27px;line-height:1.25;">Turno rodado 2027</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;">El calendario de tu grupo está listo. Encontrarás el archivo <strong>.ics adjunto a este correo</strong> para incorporarlo a tu agenda.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#edf5f5;border:1px solid #dfe9eb;border-radius:12px;"><tr><td style="padding:18px;"><strong style="font-size:20px;color:#1f4c57;">Grupo ${label}</strong><br><span style="font-size:14px;line-height:1.8;color:#52747d;">11 de enero – 23 de diciembre de 2027</span><br><span style="font-size:13px;line-height:1.7;">Festivos incluidos · Sin refuerzos (R)</span></td></tr></table>
<h2 style="margin:26px 0 10px;color:#1f4c57;font-size:18px;">Añádelo a tu calendario</h2>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;">Crea primero un calendario separado, por ejemplo <strong>Urgencias 2027 · Grupo ${label}</strong>, y selecciónalo al importar.</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;"><strong style="color:#1f4c57;">iPhone</strong><br>Abre Calendario → Calendarios → Añadir calendario → Añadir calendario. Escribe un nombre, elige iCloud y un color, y guarda. Después abre este correo en Mail de Apple, toca el adjunto y pulsa «Añadir todos» si aparece. Elige el calendario recién creado.</p>
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;"><strong style="color:#1f4c57;">Mac</strong><br>En Calendario, ve a Archivo → Importar, selecciona el archivo ICS y el calendario de destino.</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.7;"><strong style="color:#1f4c57;">Android</strong><br>Desde un ordenador, abre Google Calendar → Configuración → Importar y exportar. Importa el archivo y sincroniza la misma cuenta de Google en tu móvil.</p>
<p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#64748b;">Importa cada archivo una sola vez para evitar duplicados. El calendario es una copia del turno rodado y no se actualiza automáticamente.</p>
<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#1f4c57" style="border-radius:10px;"><a href="${url}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">Ver damero e instrucciones</a></td></tr></table>
</td></tr>
<tr><td style="padding:20px 24px;border-top:1px solid #dfe9eb;background-color:#f8fafb;"><p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">Has recibido este correo porque has solicitado el calendario en nuestra web. Tu dirección se utiliza solo para este envío y <strong>no se añade a ninguna lista de distribución</strong>.</p></td></tr>
</table>
<p style="margin:18px 0 0;color:#64748b;font-size:12px;">UrgenciasHSJ · <a href="${escape(root)}" style="color:#52747d;text-decoration:none;">urgenciashsj.es</a></p>
</td></tr></table></body></html>`;
  return { html, text };
}
