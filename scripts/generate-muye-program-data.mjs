import fs from 'node:fs';
import path from 'node:path';

const inputPath = process.argv[2];
const outputPath =
  process.argv[3] ??
  path.join(process.cwd(), 'src/lib/muyeProgramData.ts');

if (!inputPath) {
  console.error('Uso: node scripts/generate-muye-program-data.mjs <xml> [output]');
  process.exit(1);
}

const xml = fs.readFileSync(inputPath, 'utf8');

function decodeText(value = '') {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTagValue(source, tag) {
  const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decodeText(match[1]) : '';
}

function formatDate(raw) {
  if (!raw || raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sliceBetween(startMarker, endMarker) {
  const start = xml.indexOf(startMarker);
  const end = xml.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1) {
    throw new Error(`No se ha podido localizar el tramo entre "${startMarker}" y "${endMarker}"`);
  }
  return xml.slice(start, end);
}

function extractSections(startMarker, endMarker, familyId, familyTitle, familySummary) {
  const chunk = sliceBetween(startMarker, endMarker);
  const tables = [...chunk.matchAll(/<table class="[^"]+">([\s\S]*?)<\/table>/g)].map((match) => match[1]);
  const domains = [];

  for (const table of tables) {
    const tbodyMatch = table.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tbodyMatch) continue;

    const rowMatches = [...tbodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
    let currentDomain = null;

    for (const [, row] of rowMatches) {
      const cells = [...row.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)].map((cell) => {
        const attrs = cell[1] ?? '';
        const text = decodeText(cell[2]);
        const classMatch = attrs.match(/class="([^"]+)"/);
        const classes = (classMatch?.[1] ?? '').split(/\s+/).filter(Boolean);
        return { text, classes };
      });
      if (!cells.length) continue;

      if (cells.length === 1 && /DOMINIO/i.test(cells[0].text)) {
        const title = cells[0].text;
        currentDomain = {
          id: `${familyId}-${domains.length + 1}`,
          slug: slugify(title),
          title,
          competencies: [],
        };
        domains.push(currentDomain);
        continue;
      }

      if (!currentDomain) continue;

      const [code, text, ex, ob, au, i360, po, context, activity, recommendations] = cells;
      if (!code?.text || !text?.text) continue;

      const evaluations = [];
      if (ex?.text || ex?.classes.includes('sombra')) evaluations.push('Ex');
      if (ob?.text || ob?.classes.includes('sombra')) evaluations.push('Ob');
      if (au?.text || au?.classes.includes('sombra')) evaluations.push('Au');
      if (i360?.text || i360?.classes.includes('sombra')) evaluations.push('360°');
      if (po?.text || po?.classes.includes('sombra')) evaluations.push('Po');

      currentDomain.competencies.push({
        id: `${familyId}-${code.text.replace(/[^0-9.]/g, '').replace(/\./g, '-')}`,
        code: code.text,
        text: text.text,
        evaluations,
        context: context?.text ?? '',
        activity: activity?.text ?? '',
        recommendations: recommendations?.text ?? '',
      });
    }
  }

  return {
    id: familyId,
    title: familyTitle,
    summary: familySummary,
    domains,
  };
}

function extractParagraphsBetween(startMarker, endMarker) {
  const chunk = sliceBetween(startMarker, endMarker);
  return [...chunk.matchAll(/<p class="parrafo(?:_2)?">([\s\S]*?)<\/p>/g)]
    .map((match) => decodeText(match[1]))
    .filter(Boolean);
}

function extractEvaluationInstruments() {
  const tableMatch = xml.match(
    /<table class="tabla_girada_condensada" data-vertical-align="top">([\s\S]*?)<\/table>/,
  );

  if (!tableMatch) {
    throw new Error('No se ha encontrado la tabla de instrumentos de evaluación');
  }

  const tbodyMatch = tableMatch[1].match(/<tbody>([\s\S]*?)<\/tbody>/);
  const rows = [...(tbodyMatch?.[1] ?? '').matchAll(/<tr>([\s\S]*?)<\/tr>/g)];

  return rows.map(([, row]) => {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => cell[1]);
    const [instrumentRaw = '', descriptionRaw = '', assessesRaw = ''] = cells;
    const instrumentParts = [...instrumentRaw.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((part) =>
      decodeText(part[1]),
    );
    const code = instrumentParts[0] ?? '';
    const label = instrumentParts[1] ?? code;

    return {
      code,
      label,
      description: decodeText(descriptionRaw),
      assesses: decodeText(assessesRaw),
    };
  });
}

function extractRotationData() {
  const sectionStart = '<p class="centro_redonda">8. Desarrollo del programa formativo</p>';
  const sectionEnd = '<p class="parrafo_2">Atención continuada (guardias):</p>';
  const chunk = sliceBetween(sectionStart, sectionEnd);
  const tableMatch = chunk.match(/<table class="tabla_ancha">([\s\S]*?)<\/table>/);

  if (!tableMatch) {
    throw new Error('No se ha encontrado la tabla principal de rotaciones');
  }

  const tbodyMatch = tableMatch[1].match(/<tbody>([\s\S]*?)<\/tbody>/);
  const tfootMatch = tableMatch[1].match(/<tfoot>([\s\S]*?)<\/tfoot>/);
  const rows = [...(tbodyMatch?.[1] ?? '').matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  const periods = rows.map(([, row]) => {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => cell[1]);
    const [yearRangeRaw, servicesRaw, observationsRaw = ''] = cells;
    const yearRange = decodeText(yearRangeRaw);
    const services = [...servicesRaw.matchAll(/<p class="cuerpo_tabla_izq">([\s\S]*?)<\/p>/g)].map((entry) =>
      decodeText(entry[1]),
    );
    const observations = [...observationsRaw.matchAll(/<p class="cuerpo_tabla_izq">([\s\S]*?)<\/p>/g)].map((entry) =>
      decodeText(entry[1]),
    );

    return {
      yearRange,
      services,
      observations,
    };
  });

  const footnotes = [...(tfootMatch?.[1] ?? '').matchAll(/<p class="cita">([\s\S]*?)<\/p>/g)].map((entry) =>
    decodeText(entry[1]),
  );

  const guardias = extractParagraphsBetween(
    '<p class="parrafo_2">Atención continuada (guardias):</p>',
    '<p class="anexo_num">ANEXO II</p>',
  );

  return {
    intro: extractParagraphsBetween(
      '<p class="centro_redonda">8. Desarrollo del programa formativo</p>',
      '<table class="tabla_ancha">',
    ),
    periods,
    footnotes,
    guardias,
  };
}

const data = {
  meta: {
    boeId: getTagValue(xml, 'identificador'),
    order: getTagValue(xml, 'numero_oficial'),
    title: getTagValue(xml, 'titulo'),
    publicationDate: formatDate(getTagValue(xml, 'fecha_publicacion')),
    effectiveDate: formatDate(getTagValue(xml, 'fecha_vigencia')),
    pdfUrl: `https://www.boe.es${getTagValue(xml, 'url_pdf')}`,
    eliUrl: getTagValue(xml, 'url_eli'),
    duration: '4 años',
    effectiveTrainingMonths: 44,
    totalYears: 4,
    evaluationInstruments: extractEvaluationInstruments(),
  },
  sections: [
    extractSections(
      '7.1 Competencias transversales',
      '7.2 Competencias comunes',
      'transversales',
      'Competencias transversales',
      'Competencias comunes a las especialidades en Ciencias de la Salud que acompañan toda la residencia.',
    ),
    extractSections(
      '7.2 Competencias comunes',
      '7.3 Competencias específicas',
      'comunes',
      'Competencias comunes con MFYC',
      'Bloque compartido con Medicina Familiar y Comunitaria, con foco en continuidad asistencial y clínica por sistemas.',
    ),
    extractSections(
      '7.3 Competencias específicas',
      'Los servicios del contexto de aprendizaje',
      'especificas',
      'Competencias específicas de MUYE',
      'Competencias nucleares de la especialidad en urgencias y emergencias, desde soporte vital hasta coordinación y gestión.',
    ),
  ],
  rotations: extractRotationData(),
};

const output = `export const muyeProgramData = ${JSON.stringify(data, null, 2)} as const;\n\nexport type MuyeProgramData = typeof muyeProgramData;\nexport type MuyeProgramSection = MuyeProgramData['sections'][number];\nexport type MuyeProgramDomain = MuyeProgramSection['domains'][number];\nexport type MuyeProgramCompetency = MuyeProgramDomain['competencies'][number];\n`;

fs.writeFileSync(outputPath, output);
console.log(`Generado ${outputPath}`);
