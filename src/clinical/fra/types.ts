export type NumericValue = number | null;

export type KdigoStage = 0 | 1 | 2 | 3;

export type EtiologyBucket = 'prerenal' | 'intrinsic' | 'postrenal';

export type ConsultationTarget = 'Nefrologia' | 'UCI' | 'Urologia';

export type FraInput = {
  weightKg: NumericValue;
  creatinineCurrentMgDl: NumericValue;
  creatinineBaselineMgDl: NumericValue;
  baselineTimeHours: NumericValue;
  urineOutputTotalMl: NumericValue;
  oliguriaDurationHours: NumericValue;
  renalReplacementStarted: boolean;
  chronicKidneyDiseaseKnown: boolean;
  chronicity: {
    chronicAnemia: boolean;
    hyperphosphatemia: boolean;
    hypocalcemia: boolean;
    hyperparathyroidism: boolean;
    smallKidneys: boolean;
    hyperechogenicKidneys: boolean;
    chronicPolyuriaNocturiaPruritus: boolean;
  };
  potassiumMmolL: NumericValue;
  hyperkalemiaEcgChanges: boolean;
  hyperkalemiaSymptoms: boolean;
  hyperkalemiaRefractory: boolean;
  ph: NumericValue;
  bicarbonateMmolL: NumericValue;
  refractoryAcidosis: boolean;
  pulmonaryEdemaOrFluidOverload: boolean;
  refractoryFluidOverload: boolean;
  uremicSymptoms: {
    encephalopathy: boolean;
    pericarditis: boolean;
    bleedingDiathesis: boolean;
    intractableVomiting: boolean;
  };
  shock: boolean;
  sepsis: boolean;
  severeSepsis: boolean;
  suspectedDialyzableIntoxication: boolean;
  anuria: boolean;
  infectedObstructionSuspected: boolean;
  bilateralObstructionSuspected: boolean;
  hypovolemia: {
    vomiting: boolean;
    diarrhea: boolean;
    hemorrhage: boolean;
    poorIntake: boolean;
    hypotension: boolean;
    orthostasis: boolean;
    dryMucousMembranes: boolean;
    tachycardia: boolean;
  };
  lowEffectiveVolume: {
    heartFailure: boolean;
    cirrhosis: boolean;
    nephroticSyndrome: boolean;
    thirdSpacing: boolean;
  };
  medications: {
    nsaid: boolean;
    acei: boolean;
    arb: boolean;
    diuretics: boolean;
    aminoglycosides: boolean;
    vancomycin: boolean;
    iodinatedContrast: boolean;
    chemotherapy: boolean;
    immunotherapy: boolean;
    ppi: boolean;
    allopurinol: boolean;
  };
  obstructionClues: {
    bphOrLowerUrinarySymptoms: boolean;
    bladderGlobe: boolean;
    colickyPain: boolean;
    grossHematuriaClots: boolean;
    stones: boolean;
    pelvicMalignancy: boolean;
    solitaryKidney: boolean;
    obstructedCatheter: boolean;
  };
  urineStudies: {
    urineSodiumMmolL: NumericValue;
    urineCreatinineMgDl: NumericValue;
    plasmaSodiumMmolL: NumericValue;
    plasmaCreatinineMgDl: NumericValue;
    urineUreaMgDl: NumericValue;
    plasmaUreaMgDl: NumericValue;
    urineOsmolalityMosmKg: NumericValue;
    urineSpecificGravity: NumericValue;
    blandSediment: boolean;
    hematuria: boolean;
    proteinuria: boolean;
    hyalineCasts: boolean;
    granularCasts: boolean;
    cellularCasts: boolean;
    redCellCasts: boolean;
    leukocyturia: boolean;
    bacteriuria: boolean;
    eosinophiluria: boolean;
    crystals: boolean;
    hemePositiveWithoutRbc: boolean;
  };
  additionalLabs: {
    ckU_L: NumericValue;
    ldhU_L: NumericValue;
    uricAcidMgDl: NumericValue;
    plateletsX10e3uL: NumericValue;
    hemoglobinGdL: NumericValue;
    schistocytes: boolean;
  };
  ultrasound: {
    hydronephrosis: boolean;
    bladderGlobe: boolean;
    smallKidneys: boolean;
    hyperechogenicity: boolean;
    solitaryKidney: boolean;
  };
  intrinsicContext: {
    prolongedShock: boolean;
    persistentSepsis: boolean;
    recentSurgery: boolean;
    responseToFluids: boolean;
    rhabdomyolysisSuspected: boolean;
    hemolysis: boolean;
    tumorLysis: boolean;
    myeloma: boolean;
    severeHypertension: boolean;
    purpura: boolean;
    hemoptysis: boolean;
    constitutionalSyndrome: boolean;
    arthralgias: boolean;
    recentVascularProcedure: boolean;
    livedoReticularis: boolean;
    eosinophilia: boolean;
    hypocomplementemia: boolean;
    pyelonephritisSuspected: boolean;
  };
};

export type UrineAssessment = {
  rateMlKgHour: NumericValue;
  stage: KdigoStage;
  matchedCriteria: string[];
  limitations: string[];
};

export type KdigoCriterionResult = {
  id: 'creatinine-48h' | 'creatinine-7d' | 'urine' | 'trs';
  label: string;
  matched: boolean;
  detail: string;
};

export type ChronicityAssessment = {
  signalCount: number;
  suggestsChronicity: boolean;
  items: string[];
  summary: string | null;
};

export type KdigoAssessment = {
  hasFra: boolean;
  stage: KdigoStage;
  creatinineRatio: NumericValue;
  creatinineDeltaMgDl: NumericValue;
  urine: UrineAssessment;
  matchedCriteria: KdigoCriterionResult[];
  limitations: string[];
  stageExplanation: string;
  chronicity: ChronicityAssessment;
};

export type EtiologyScore = {
  bucket: EtiologyBucket;
  label: string;
  score: number;
  reasons: string[];
};

export type EtiologyAssessment = {
  scores: EtiologyScore[];
  mostLikely: EtiologyBucket | 'mixed' | 'indeterminate';
  leadingBuckets: EtiologyBucket[];
  mixed: boolean;
  fenaPercent: NumericValue;
  feUreaPercent: NumericValue;
  urinePlasmaCreatinineRatio: NumericValue;
  urinePattern: string[];
  warnings: string[];
  differentials: string[];
  explanation: string;
};

export type SeverityAlert = {
  code: string;
  message: string;
  targets: ConsultationTarget[];
};

export type SeverityAssessment = {
  hasRedFlags: boolean;
  alerts: SeverityAlert[];
  consultationTargets: ConsultationTarget[];
  summary: string;
};

export type ManagementPlan = {
  general: string[];
  targeted: string[];
  consults: string[];
  monitoring: string[];
};

export type FraAssessment = {
  kdigo: KdigoAssessment;
  etiology: EtiologyAssessment;
  severity: SeverityAssessment;
  management: ManagementPlan;
  caveats: string[];
  reportText: string;
};

export function createDefaultFraInput(): FraInput {
  return {
    weightKg: null,
    creatinineCurrentMgDl: null,
    creatinineBaselineMgDl: null,
    baselineTimeHours: null,
    urineOutputTotalMl: null,
    oliguriaDurationHours: null,
    renalReplacementStarted: false,
    chronicKidneyDiseaseKnown: false,
    chronicity: {
      chronicAnemia: false,
      hyperphosphatemia: false,
      hypocalcemia: false,
      hyperparathyroidism: false,
      smallKidneys: false,
      hyperechogenicKidneys: false,
      chronicPolyuriaNocturiaPruritus: false,
    },
    potassiumMmolL: null,
    hyperkalemiaEcgChanges: false,
    hyperkalemiaSymptoms: false,
    hyperkalemiaRefractory: false,
    ph: null,
    bicarbonateMmolL: null,
    refractoryAcidosis: false,
    pulmonaryEdemaOrFluidOverload: false,
    refractoryFluidOverload: false,
    uremicSymptoms: {
      encephalopathy: false,
      pericarditis: false,
      bleedingDiathesis: false,
      intractableVomiting: false,
    },
    shock: false,
    sepsis: false,
    severeSepsis: false,
    suspectedDialyzableIntoxication: false,
    anuria: false,
    infectedObstructionSuspected: false,
    bilateralObstructionSuspected: false,
    hypovolemia: {
      vomiting: false,
      diarrhea: false,
      hemorrhage: false,
      poorIntake: false,
      hypotension: false,
      orthostasis: false,
      dryMucousMembranes: false,
      tachycardia: false,
    },
    lowEffectiveVolume: {
      heartFailure: false,
      cirrhosis: false,
      nephroticSyndrome: false,
      thirdSpacing: false,
    },
    medications: {
      nsaid: false,
      acei: false,
      arb: false,
      diuretics: false,
      aminoglycosides: false,
      vancomycin: false,
      iodinatedContrast: false,
      chemotherapy: false,
      immunotherapy: false,
      ppi: false,
      allopurinol: false,
    },
    obstructionClues: {
      bphOrLowerUrinarySymptoms: false,
      bladderGlobe: false,
      colickyPain: false,
      grossHematuriaClots: false,
      stones: false,
      pelvicMalignancy: false,
      solitaryKidney: false,
      obstructedCatheter: false,
    },
    urineStudies: {
      urineSodiumMmolL: null,
      urineCreatinineMgDl: null,
      plasmaSodiumMmolL: null,
      plasmaCreatinineMgDl: null,
      urineUreaMgDl: null,
      plasmaUreaMgDl: null,
      urineOsmolalityMosmKg: null,
      urineSpecificGravity: null,
      blandSediment: false,
      hematuria: false,
      proteinuria: false,
      hyalineCasts: false,
      granularCasts: false,
      cellularCasts: false,
      redCellCasts: false,
      leukocyturia: false,
      bacteriuria: false,
      eosinophiluria: false,
      crystals: false,
      hemePositiveWithoutRbc: false,
    },
    additionalLabs: {
      ckU_L: null,
      ldhU_L: null,
      uricAcidMgDl: null,
      plateletsX10e3uL: null,
      hemoglobinGdL: null,
      schistocytes: false,
    },
    ultrasound: {
      hydronephrosis: false,
      bladderGlobe: false,
      smallKidneys: false,
      hyperechogenicity: false,
      solitaryKidney: false,
    },
    intrinsicContext: {
      prolongedShock: false,
      persistentSepsis: false,
      recentSurgery: false,
      responseToFluids: false,
      rhabdomyolysisSuspected: false,
      hemolysis: false,
      tumorLysis: false,
      myeloma: false,
      severeHypertension: false,
      purpura: false,
      hemoptysis: false,
      constitutionalSyndrome: false,
      arthralgias: false,
      recentVascularProcedure: false,
      livedoReticularis: false,
      eosinophilia: false,
      hypocomplementemia: false,
      pyelonephritisSuspected: false,
    },
  };
}
