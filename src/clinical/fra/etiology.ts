import type {
  EtiologyAssessment,
  EtiologyBucket,
  EtiologyScore,
  FraInput,
  NumericValue,
} from './types.ts';

function round(value: NumericValue, decimals = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function pushReason(score: EtiologyScore, points: number, reason: string) {
  score.score += points;
  score.reasons.push(`${reason} (+${points})`);
}

function anyTrue(values: boolean[]) {
  return values.some(Boolean);
}

function countTrue(values: boolean[]) {
  return values.filter(Boolean).length;
}

export function calculateFeNa(input: FraInput): NumericValue {
  const una = input.urineStudies.urineSodiumMmolL;
  const ucr = input.urineStudies.urineCreatinineMgDl;
  const pna = input.urineStudies.plasmaSodiumMmolL;
  const pcr = input.urineStudies.plasmaCreatinineMgDl ?? input.creatinineCurrentMgDl;
  if (
    typeof una !== 'number' ||
    typeof ucr !== 'number' ||
    typeof pna !== 'number' ||
    typeof pcr !== 'number' ||
    ucr <= 0 ||
    pna <= 0
  ) {
    return null;
  }
  return round((una * pcr * 100) / (pna * ucr));
}

export function calculateFeUrea(input: FraInput): NumericValue {
  const uurea = input.urineStudies.urineUreaMgDl;
  const purea = input.urineStudies.plasmaUreaMgDl;
  const ucr = input.urineStudies.urineCreatinineMgDl;
  const pcr = input.urineStudies.plasmaCreatinineMgDl ?? input.creatinineCurrentMgDl;
  if (
    typeof uurea !== 'number' ||
    typeof purea !== 'number' ||
    typeof ucr !== 'number' ||
    typeof pcr !== 'number' ||
    purea <= 0 ||
    ucr <= 0
  ) {
    return null;
  }
  return round((uurea * pcr * 100) / (purea * ucr));
}

export function calculateUrinePlasmaCreatinineRatio(input: FraInput): NumericValue {
  const ucr = input.urineStudies.urineCreatinineMgDl;
  const pcr = input.urineStudies.plasmaCreatinineMgDl ?? input.creatinineCurrentMgDl;
  if (typeof ucr !== 'number' || typeof pcr !== 'number' || pcr <= 0) {
    return null;
  }
  return round(ucr / pcr);
}

function makeScore(bucket: EtiologyBucket, label: string): EtiologyScore {
  return { bucket, label, score: 0, reasons: [] };
}

function appendUnique(target: string[], values: string[]) {
  for (const value of values) {
    if (value && !target.includes(value)) target.push(value);
  }
}

export function assessEtiology(input: FraInput): EtiologyAssessment {
  const prerenal = makeScore('prerenal', 'Prerrenal');
  const intrinsic = makeScore('intrinsic', 'Renal/parénquimatosa');
  const postrenal = makeScore('postrenal', 'Postrenal/obstructiva');
  const fenaPercent = calculateFeNa(input);
  const feUreaPercent = calculateFeUrea(input);
  const urinePlasmaCreatinineRatio = calculateUrinePlasmaCreatinineRatio(input);
  const urinePattern: string[] = [];
  const warnings: string[] = [];
  const differentials: string[] = [];

  const depletionSigns = [
    input.hypovolemia.hypotension,
    input.hypovolemia.orthostasis,
    input.hypovolemia.tachycardia,
    input.hypovolemia.dryMucousMembranes,
  ];
  if (anyTrue(depletionSigns)) {
    pushReason(prerenal, 2, 'Signos de hipovolemia o bajo relleno');
    appendUnique(differentials, ['Hipovolemia real']);
  }
  if (
    anyTrue([
      input.hypovolemia.vomiting,
      input.hypovolemia.diarrhea,
      input.hypovolemia.hemorrhage,
      input.hypovolemia.poorIntake,
    ])
  ) {
    pushReason(prerenal, 2, 'Pérdidas digestivas, hemorragia o bajo aporte');
    appendUnique(differentials, ['Pérdidas extrarrenales']);
  }
  if (input.sepsis && !input.intrinsicContext.persistentSepsis) {
    pushReason(prerenal, 1, 'Sepsis inicial con vasodilatación');
  }
  if (
    anyTrue([
      input.lowEffectiveVolume.heartFailure,
      input.lowEffectiveVolume.cirrhosis,
      input.lowEffectiveVolume.nephroticSyndrome,
      input.lowEffectiveVolume.thirdSpacing,
    ])
  ) {
    pushReason(prerenal, 2, 'Bajo volumen circulante efectivo');
    appendUnique(differentials, ['Síndrome cardiorrenal o hepatorrenal']);
  }
  const prerenalMedCount = countTrue([
    input.medications.diuretics,
    input.medications.acei,
    input.medications.arb,
    input.medications.nsaid,
  ]);
  if (prerenalMedCount > 0) {
    pushReason(prerenal, prerenalMedCount >= 2 ? 2 : 1, 'Fármacos que favorecen FRA prerrenal');
  }
  if (
    typeof input.urineStudies.urineSodiumMmolL === 'number' &&
    input.urineStudies.urineSodiumMmolL < 20
  ) {
    pushReason(prerenal, 2, 'Sodio urinario <20 mmol/l');
  }
  if (typeof fenaPercent === 'number' && fenaPercent < 1) {
    pushReason(prerenal, input.medications.diuretics ? 1 : 2, 'FeNa <1%');
  }
  if (typeof feUreaPercent === 'number' && feUreaPercent < 35) {
    pushReason(prerenal, input.medications.diuretics ? 3 : 2, 'FeUrea <35%');
  }
  if (
    typeof input.urineStudies.urineOsmolalityMosmKg === 'number' &&
    input.urineStudies.urineOsmolalityMosmKg > 400
  ) {
    pushReason(prerenal, 1, 'Osmolaridad urinaria >400 mOsm/kg');
  }
  if (
    typeof input.urineStudies.urineSpecificGravity === 'number' &&
    input.urineStudies.urineSpecificGravity > 1.018
  ) {
    pushReason(prerenal, 1, 'Densidad urinaria >1.018');
  }
  if (typeof urinePlasmaCreatinineRatio === 'number' && urinePlasmaCreatinineRatio > 40) {
    pushReason(prerenal, 1, 'Cociente Cr urinaria/Cr plasmática >40');
  }
  if (
    (input.urineStudies.blandSediment || input.urineStudies.hyalineCasts) &&
    !anyTrue([
      input.urineStudies.granularCasts,
      input.urineStudies.cellularCasts,
      input.urineStudies.redCellCasts,
      input.urineStudies.eosinophiluria,
    ])
  ) {
    pushReason(prerenal, 1, 'Sedimento anodino o cilindros hialinos');
  }
  if (input.intrinsicContext.responseToFluids) {
    pushReason(prerenal, 3, 'Respuesta a fluidoterapia');
  }

  if (
    anyTrue([
      input.intrinsicContext.prolongedShock,
      input.intrinsicContext.persistentSepsis,
      input.intrinsicContext.recentSurgery,
    ])
  ) {
    pushReason(intrinsic, 2, 'Isquemia renal prolongada o sepsis mantenida');
    appendUnique(differentials, ['Necrosis tubular aguda']);
  }
  const nephrotoxinCount = countTrue([
    input.medications.iodinatedContrast,
    input.medications.aminoglycosides,
    input.medications.vancomycin,
    input.medications.nsaid,
    input.medications.chemotherapy,
    input.medications.immunotherapy,
    input.medications.ppi,
    input.medications.allopurinol,
  ]);
  if (nephrotoxinCount > 0) {
    pushReason(intrinsic, nephrotoxinCount >= 2 ? 2 : 1, 'Exposición a nefrotóxicos');
    appendUnique(differentials, ['Nefrotoxicidad medicamentosa']);
  }
  if (
    input.intrinsicContext.rhabdomyolysisSuspected ||
    (typeof input.additionalLabs.ckU_L === 'number' && input.additionalLabs.ckU_L >= 1000)
  ) {
    pushReason(intrinsic, 2, 'Rabdomiólisis o daño pigmentario');
    appendUnique(differentials, ['Rabdomiólisis']);
  }
  if (
    anyTrue([
      input.intrinsicContext.hemolysis,
      input.intrinsicContext.tumorLysis,
      input.intrinsicContext.myeloma,
    ])
  ) {
    pushReason(intrinsic, 2, 'Hemólisis, lisis tumoral o mieloma');
    appendUnique(differentials, ['Lisis tumoral / mieloma / hemólisis']);
  }
  if (typeof fenaPercent === 'number' && fenaPercent > 2) {
    pushReason(intrinsic, 2, 'FeNa >2%');
  } else if (typeof fenaPercent === 'number' && fenaPercent >= 1) {
    pushReason(intrinsic, 1, 'FeNa entre 1 y 2%');
  }
  if (typeof feUreaPercent === 'number' && feUreaPercent > 50) {
    pushReason(intrinsic, 2, 'FeUrea >50%');
  }
  if (
    typeof input.urineStudies.urineSodiumMmolL === 'number' &&
    input.urineStudies.urineSodiumMmolL > 40
  ) {
    pushReason(intrinsic, 1, 'Sodio urinario >40 mmol/l');
  }
  if (
    typeof input.urineStudies.urineOsmolalityMosmKg === 'number' &&
    input.urineStudies.urineOsmolalityMosmKg < 350
  ) {
    pushReason(intrinsic, 1, 'Osmolaridad urinaria <350 mOsm/kg');
  }
  if (
    typeof input.urineStudies.urineSpecificGravity === 'number' &&
    input.urineStudies.urineSpecificGravity < 1.01
  ) {
    pushReason(intrinsic, 1, 'Densidad urinaria <1.010');
  }
  if (typeof urinePlasmaCreatinineRatio === 'number' && urinePlasmaCreatinineRatio < 20) {
    pushReason(intrinsic, 1, 'Cociente Cr urinaria/Cr plasmática <20');
  }
  if (input.urineStudies.granularCasts || input.urineStudies.cellularCasts) {
    pushReason(intrinsic, 3, 'Cilindros granulosos o celulares');
    appendUnique(differentials, ['Necrosis tubular aguda']);
  }
  if (input.urineStudies.hematuria && input.urineStudies.proteinuria) {
    pushReason(intrinsic, 2, 'Hematuria con proteinuria');
    appendUnique(differentials, ['Glomerulonefritis']);
  }
  if (input.urineStudies.redCellCasts) {
    pushReason(intrinsic, 3, 'Cilindros hemáticos');
    appendUnique(differentials, ['Glomerulonefritis o vasculitis']);
  }
  if (input.urineStudies.leukocyturia || input.urineStudies.eosinophiluria) {
    pushReason(intrinsic, 2, 'Leucocituria o eosinofiluria');
    appendUnique(differentials, ['Nefritis intersticial aguda']);
  }
  if (input.urineStudies.hemePositiveWithoutRbc) {
    pushReason(intrinsic, 2, 'Hemo positivo sin hematíes');
    appendUnique(differentials, ['Mioglobinuria o hemoglobinuria']);
  }
  if (input.urineStudies.bacteriuria || input.intrinsicContext.pyelonephritisSuspected) {
    pushReason(intrinsic, 1, 'Infección urinaria alta / pielonefritis');
    appendUnique(differentials, ['Pielonefritis']);
  }
  if (
    typeof input.additionalLabs.plateletsX10e3uL === 'number' &&
    input.additionalLabs.plateletsX10e3uL < 150 &&
    typeof input.additionalLabs.hemoglobinGdL === 'number' &&
    input.additionalLabs.hemoglobinGdL < 10 &&
    input.additionalLabs.schistocytes
  ) {
    pushReason(intrinsic, 3, 'Plaquetopenia + anemia + esquistocitos');
    appendUnique(differentials, ['Microangiopatía trombótica']);
  }
  if (
    anyTrue([
      input.intrinsicContext.purpura,
      input.intrinsicContext.hemoptysis,
      input.intrinsicContext.constitutionalSyndrome,
      input.intrinsicContext.arthralgias,
      input.intrinsicContext.severeHypertension,
    ])
  ) {
    pushReason(intrinsic, 2, 'Datos sistémicos compatibles con glomerulonefritis/vasculitis');
    appendUnique(differentials, ['Vasculitis o glomerulonefritis rápidamente progresiva']);
  }
  if (
    input.intrinsicContext.recentVascularProcedure &&
    anyTrue([
      input.intrinsicContext.livedoReticularis,
      input.intrinsicContext.eosinophilia,
      input.intrinsicContext.hypocomplementemia,
    ])
  ) {
    pushReason(intrinsic, 3, 'Contexto compatible con embolismo por colesterol');
    appendUnique(differentials, ['Ateroembolismo renal']);
  }

  if (input.anuria) {
    pushReason(postrenal, 3, 'Anuria brusca');
  }
  if (input.obstructionClues.bladderGlobe || input.ultrasound.bladderGlobe) {
    pushReason(postrenal, 3, 'Globo vesical');
    appendUnique(differentials, ['Obstrucción baja']);
  }
  if (input.obstructionClues.bphOrLowerUrinarySymptoms) {
    pushReason(postrenal, 1, 'HBP o síntomas obstructivos bajos');
    appendUnique(differentials, ['Retención urinaria por HBP']);
  }
  if (input.obstructionClues.colickyPain || input.obstructionClues.stones) {
    pushReason(postrenal, 2, 'Cólico o litiasis');
    appendUnique(differentials, ['Litiasis ureteral']);
  }
  if (input.obstructionClues.grossHematuriaClots) {
    pushReason(postrenal, 2, 'Hematuria con coágulos');
    appendUnique(differentials, ['Tamponamiento vesical por coágulos']);
  }
  if (input.obstructionClues.pelvicMalignancy) {
    pushReason(postrenal, 2, 'Neoplasia pélvica o urológica');
    appendUnique(differentials, ['Obstrucción tumoral']);
  }
  if (
    anyTrue([
      input.obstructionClues.solitaryKidney,
      input.ultrasound.solitaryKidney,
    ])
  ) {
    pushReason(postrenal, 2, 'Monorreno');
  }
  if (input.obstructionClues.obstructedCatheter) {
    pushReason(postrenal, 2, 'Sonda obstruida');
    appendUnique(differentials, ['Obstrucción de sonda']);
  }
  if (input.ultrasound.hydronephrosis) {
    pushReason(postrenal, 4, 'Hidronefrosis o dilatación de la vía urinaria');
    appendUnique(differentials, ['Obstrucción urinaria alta']);
  }

  if (typeof fenaPercent === 'number') {
    urinePattern.push(
      fenaPercent < 1 ? 'FeNa <1%: apoya prerrenal' : `FeNa ${fenaPercent}%: menos compatible con prerrenal`
    );
    warnings.push(
      'La FeNa puede ser engañosa en glomerulonefritis, vasculitis, rabdomiólisis, nefropatía por contraste, obstrucción inicial y síndrome hepatorrenal.'
    );
  }
  if (typeof feUreaPercent === 'number') {
    urinePattern.push(
      feUreaPercent < 35
        ? 'FeUrea <35%: apoya prerrenal'
        : feUreaPercent > 50
          ? 'FeUrea >50%: apoya daño tubular/parénquimatoso'
          : 'FeUrea intermedia'
    );
  }
  if (typeof input.urineStudies.urineSodiumMmolL === 'number') {
    urinePattern.push(
      input.urineStudies.urineSodiumMmolL < 20
        ? 'Na urinario <20 mEq/l'
        : input.urineStudies.urineSodiumMmolL > 40
          ? 'Na urinario >40 mEq/l'
          : 'Na urinario intermedio'
    );
  }
  if (typeof input.urineStudies.urineOsmolalityMosmKg === 'number') {
    urinePattern.push(
      input.urineStudies.urineOsmolalityMosmKg > 400
        ? 'Osmolaridad urinaria elevada'
        : input.urineStudies.urineOsmolalityMosmKg < 350
          ? 'Osmolaridad urinaria baja'
          : 'Osmolaridad urinaria intermedia'
    );
  }
  if (typeof input.urineStudies.urineSpecificGravity === 'number') {
    urinePattern.push(
      input.urineStudies.urineSpecificGravity > 1.018
        ? 'Densidad urinaria alta'
        : input.urineStudies.urineSpecificGravity < 1.01
          ? 'Densidad urinaria baja'
          : 'Densidad urinaria intermedia'
    );
  }
  if (typeof urinePlasmaCreatinineRatio === 'number') {
    urinePattern.push(`Cociente CrU/CrP ${urinePlasmaCreatinineRatio}`);
  }
  if (input.urineStudies.blandSediment) urinePattern.push('Sedimento anodino');
  if (input.urineStudies.hyalineCasts) urinePattern.push('Cilindros hialinos');
  if (input.urineStudies.granularCasts || input.urineStudies.cellularCasts) {
    urinePattern.push('Sedimento tubular activo');
  }
  if (input.urineStudies.redCellCasts || (input.urineStudies.hematuria && input.urineStudies.proteinuria)) {
    urinePattern.push('Patrón glomerular');
  }
  if (input.urineStudies.leukocyturia || input.urineStudies.bacteriuria) {
    urinePattern.push('Piuria/bacteriuria');
  }
  if (input.urineStudies.eosinophiluria) urinePattern.push('Eosinofiluria');
  if (input.urineStudies.crystals) urinePattern.push('Cristaluria');
  if (input.urineStudies.hemePositiveWithoutRbc) urinePattern.push('Hemo positivo sin hematíes');
  if (input.medications.diuretics && typeof fenaPercent === 'number') {
    warnings.push('El uso de diuréticos puede alterar la FeNa; en ese contexto debe priorizarse la FeUrea si está disponible.');
  }
  if (!input.ultrasound.hydronephrosis && postrenal.score >= 3) {
    warnings.push('Puede existir obstrucción sin hidronefrosis en fases iniciales, con hipovolemia o fibrosis retroperitoneal.');
  }

  const scores = [prerenal, intrinsic, postrenal].sort((a, b) => b.score - a.score);
  const topScore = scores[0]?.score ?? 0;
  const secondScore = scores[1]?.score ?? 0;
  const leadingBuckets = scores.filter((score) => score.score === topScore && topScore > 0).map((score) => score.bucket);
  const mixed =
    topScore > 0 &&
    (leadingBuckets.length > 1 || (secondScore >= Math.max(4, topScore - 2) && secondScore > 0));

  const mostLikely =
    topScore === 0 ? 'indeterminate' : mixed ? 'mixed' : scores[0]?.bucket ?? 'indeterminate';

  const explanation =
    mostLikely === 'indeterminate'
      ? 'No hay un patrón etiológico dominante con los datos introducidos.'
      : mostLikely === 'mixed'
        ? 'El patrón es potencialmente multifactorial, con puntuaciones cercanas entre etiologías.'
        : `La etiología con mayor apoyo es ${scores[0]?.label.toLowerCase()}.`;

  return {
    scores,
    mostLikely,
    leadingBuckets,
    mixed,
    fenaPercent,
    feUreaPercent,
    urinePlasmaCreatinineRatio,
    urinePattern,
    warnings,
    differentials,
    explanation,
  };
}
