export type CimaMedicine = {
  nombre?: string;
  nregistro?: string;
  dosis?: string;
  formaFarmaceutica?: { nombre?: string };
  vtm?: { nombre?: string };
};

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
}

function strengths(value: string): string[] {
  const normalized = normalize(value)
    .replace(/\s+\d+\s+(?:TUBOS?|ENVASES?|FRASCOS?|COMPRIMIDOS?|C.PSULAS?|SOBRES?|AMPOLLAS?|VIALES?)\b.*$/, '')
    .replace(/\b((?:\d+(?:[.,]\d+)?\s*\/\s*)+)(\d+(?:[.,]\d+)?)\s*(MG|MCG|MICROGRAMOS|µG)\b/g, (_, prefix: string, last: string, unit: string) =>
      [...prefix.matchAll(/\d+(?:[.,]\d+)?/g)].map((match) => `${match[0]} ${unit}`).concat(`${last} ${unit}`).join('/'))
    .replace(/MCG|µG/g, 'MICROGRAMOS');
  return [...normalized.matchAll(/(\d+(?:[.,]\d+)?)\s*(MICROGRAMOS|MG|G)\s*(?:\/\s*(ML|G))?/g)]
    .map((match) => `${Number(match[1].replace(',', '.'))}${match[2]}/${match[3] || ''}`);
}

function dosageForm(value: string): string {
  const text = normalize(value);
  if (/UNG.UENTO|POMADA/.test(text)) return 'pomada';
  if (/COLIRIO/.test(text)) return 'colirio';
  if (/C.PSULA/.test(text)) return 'capsula';
  if (/COMPR|C0MPR/.test(text)) return 'comprimido';
  if (/SOLUCION ORAL|GOTAS ORALES/.test(text)) return 'solucion oral';
  return '';
}

/** Returns no match whenever the pasted presentation cannot be identified safely. */
export function matchCimaMedicine(input: string, medicines: CimaMedicine[]): CimaMedicine | null {
  const brand = normalize(input).match(/^\(FM\)\s*(\S+)|^(\S+)/)?.[1] || normalize(input).split(' ')[0];
  const inputStrengths = strengths(input);
  const inputForm = dosageForm(input);
  if (!brand || (!inputStrengths.length && !inputForm)) return null;

  const candidates = medicines.filter((medicine) => {
    const name = normalize(medicine.nombre || '');
    if (!name.startsWith(`${brand} `)) return false;
    const candidateStrengths = strengths(name);
    if (inputStrengths.length && (candidateStrengths.length !== inputStrengths.length || candidateStrengths.some((strength, index) => strength !== inputStrengths[index]))) return false;
    const candidateForm = dosageForm(medicine.formaFarmaceutica?.nombre || name);
    if (inputForm && candidateForm !== inputForm) return false;
    return Boolean(medicine.vtm?.nombre);
  });

  if (!candidates.length) return null;
  if (!inputStrengths.length) {
    const formulations = new Set(candidates.map((candidate) => JSON.stringify([
      normalize(candidate.vtm?.nombre || ''),
      normalize(candidate.dosis || strengths(candidate.nombre || '').join('|')),
      normalize(candidate.formaFarmaceutica?.nombre || dosageForm(candidate.nombre || '')),
    ])));
    return formulations.size === 1 ? candidates[0] : null;
  }
  const ingredientNames = new Set(candidates.map((candidate) => normalize(candidate.vtm?.nombre || '')));
  return ingredientNames.size === 1 ? candidates[0] : null;
}
