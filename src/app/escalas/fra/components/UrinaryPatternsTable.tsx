const columns = [
  'Prerrenal',
  'Necrosis tubular aguda',
  'GMN aguda',
  'Nefritis intersticial',
  'Nefropatía obstructiva',
  'Oclusión arterial',
];

const rows = [
  ['Densidad', '> 1.020', '< 1.010', '< 1.020', '< 1.020', '< 1.020', ''],
  ['Osmolaridad (mOsm/kg)', '> 400', '< 350', '< 400*', '< 400', '< 400', '< 350'],
  ['Na urinario (mEq/l)', '< 20', '> 40', '< 20*', '> 20', '> 40', '> 100'],
  ['FeNa (%)', '< 1', '> 2', '< 1', '', '', '> 80'],
  ['CrU/CrP', '> 40', '< 20', '', '', '', '< 2'],
  ['UreaU/UreaP', '> 10', '< 10', 'Variable', '< 10', '10', '1'],
  ['FeUrea', '< 35%', '> 35% (50-60%)', '', '', '', ''],
  ['Proteinuria', 'Variable', 'Variable', '++ o +++', '+ o ++', 'Variable', ''],
  [
    'Sedimento',
    'Anodino / cilindros hialinos',
    'Cilindros granulosos, pigmentados, hialinos y células epiteliales',
    'Cilindros hemáticos y hematíes dismórficos',
    'Leucocituria, cilindros leucocitarios, células epiteliales',
    'Cristales, hematíes o leucocitos aislados',
    '',
  ],
];

const kdigoRows = [
  [
    'Definición de FRA',
    'Aumento de creatinina sérica ≥ 0,3 mg/dl en 48 h, o ≥ 1,5 veces la basal en 7 días, o diuresis < 0,5 ml/kg/h durante al menos 6 h.',
  ],
  [
    'KDIGO 1',
    'Creatinina 1,5-1,9 veces basal o aumento ≥ 0,3 mg/dl; o diuresis < 0,5 ml/kg/h durante 6-12 h.',
  ],
  [
    'KDIGO 2',
    'Creatinina 2-2,9 veces basal; o diuresis < 0,5 ml/kg/h durante ≥ 12 h.',
  ],
  [
    'KDIGO 3',
    'Creatinina ≥ 3 veces basal, o ≥ 4 mg/dl, o terapia renal sustitutiva; o diuresis < 0,3 ml/kg/h durante ≥ 24 h, o anuria ≥ 12 h.',
  ],
];

type FrequentCauseEntry = {
  causes?: string[];
  clinical?: string[];
  tests?: string[];
};

type FrequentCauseGroup = {
  type: 'Prerrenal' | 'Parenquimatoso' | 'Obstructivo';
  tone: 'teal' | 'amber' | 'rose';
  rows: FrequentCauseEntry[];
};

function StackList({
  items,
  tone,
}: {
  items?: string[];
  tone: 'slate' | 'teal' | 'amber';
}) {
  if (!items || items.length === 0) return null;

  const toneClass =
    tone === 'teal'
      ? 'text-[#214c55]'
      : tone === 'amber'
        ? 'text-[#6f542e]'
        : 'text-slate-700';

  return (
    <ul className={`list-disc space-y-2 pl-4 ${toneClass}`}>
      {items.map((item) => (
        <li
          key={item}
          className="leading-5 sm:text-sm"
        >
          {item.includes(':') ? (
            <>
              <strong>{item.split(':')[0]}:</strong>
              {item.slice(item.indexOf(':') + 1)}
            </>
          ) : (
            item
          )}
        </li>
      ))}
    </ul>
  );
}

const frequentCauseGroups: FrequentCauseGroup[] = [
  {
    type: 'Prerrenal',
    tone: 'teal',
    rows: [
      {
        causes: [
          'Disminución del VCE: pérdidas, vómitos, diarrea, hemorragia y redistribución.',
          'ICC, cirrosis, síndrome nefrótico, tercer espacio.',
        ],
        clinical: [
          'Signos de depleción de volumen.',
          'Hipotensión, taquicardia, ortostatismo.',
        ],
        tests: [
          'Densidad > 1.020.',
          'EFNa < 1%.',
          'Na_u < 20 mEq/l.',
        ],
      },
      {
        causes: [
          'Disminución del gasto cardiaco: shock cardiogénico, IAM, arritmias, valvulopatías, TEP.',
          'Vasodilatación periférica: sepsis, hipoxemia, antihipertensivos, anafilaxia.',
        ],
        clinical: [
          '↓ VCE, antecedentes cardiovasculares.',
          'Infección sistémica o contexto distributivo.',
        ],
        tests: [
          'Patrón urinario prerrenal.',
          'Ecocardiografía/POCUS según contexto.',
        ],
      },
      {
        causes: [
          'Vasoconstricción renal: AINE, síndrome hepatorrenal, hipercalcemia.',
          'Vasodilatación de la arteriola eferente: IECA o ARA-II.',
        ],
        clinical: [
          'Exposición farmacológica reciente.',
          'Contexto de hepatopatía o ICC.',
        ],
        tests: [
          'EFNa baja o FEUrea baja.',
          'Sedimento anodino o cilindros hialinos.',
        ],
      },
    ],
  },
  {
    type: 'Parenquimatoso',
    tone: 'amber',
    rows: [
      {
        causes: [
          'Necrosis tubular isquémica: FRA prerrenal prolongado, hipotensión, cirugía reciente.',
          'Necrosis tubular por tóxicos exógenos: contraste, aminoglucósidos, vancomicina, cisplatino.',
        ],
        clinical: [
          'Shock mantenido o sepsis persistente.',
          'Exposición a nefrotóxicos.',
        ],
        tests: [
          'Cilindros granulosos o células epiteliales.',
          'EFNa > 1%.',
          'Na_u > 20-40 mEq/l.',
        ],
      },
      {
        causes: [
          'Tóxicos endógenos: rabdomiólisis, hemólisis, lisis tumoral, mieloma.',
          'Nefritis tubulointersticial: IBP, antibióticos, AINE, furosemida, tiazidas, alopurinol.',
          'Pielonefritis aguda.',
        ],
        clinical: [
          'Dolor, fiebre o sepsis.',
          'Rash, eosinofilia o fiebre medicamentosa.',
          'Contexto de rabdomiólisis o hemólisis.',
        ],
        tests: [
          'Leucocituria, bacteriuria o eosinofiluria.',
          'CK / LDH elevadas según contexto.',
          'Hemocultivos y urocultivo si infección.',
        ],
      },
      {
        causes: [
          'Glomerulonefritis / vasculitis.',
          'Anemia microangiopática / MAT.',
          'Ateroembolismo / enfermedad vascular renal / HTA maligna.',
        ],
        clinical: [
          'HTA, edema, artralgias, hemoptisis, púrpura o livedo.',
          'Procedimiento vascular reciente.',
        ],
        tests: [
          'Proteinuria, hematuria y cilindros hemáticos.',
          'ANA, ANCA, complemento, anti-MBG.',
          'Plaquetas bajas, esquistocitos, LDH elevada.',
        ],
      },
    ],
  },
  {
    type: 'Obstructivo',
    tone: 'rose',
    rows: [
      {
        causes: [
          'HBP, retención urinaria, sonda obstruida.',
          'Litiasis, coágulos, necrosis papilar.',
          'Monorreno obstruido u obstrucción bilateral.',
        ],
        clinical: [
          'Globo vesical, anuria u oliguria fluctuante.',
          'Dolor cólico, LUTS o hematuria macroscópica.',
        ],
        tests: [
          'Hematuria no dismórfica, a veces con coágulos.',
          'Ecografía renal-vesical.',
          'Valorar TC si sospecha de litiasis o masa.',
        ],
      },
      {
        causes: [
          'Tumores de próstata, vejiga, cérvix, colon o pelvis.',
          'Fibrosis retroperitoneal.',
          'Vejiga neurógena y otras anomalías urológicas.',
        ],
        clinical: [
          'Síntomas obstructivos bajos, HBP.',
          'Historia oncológica o compresión extrínseca.',
        ],
        tests: [
          'Hidronefrosis o residuo posmiccional elevado.',
          'TC / pielografía / derivación urológica según contexto.',
        ],
      },
    ],
  },
];

export default function UrinaryPatternsTable() {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Criterios KDIGO</h2>
        <p className="mt-1 text-sm text-slate-600">
          Resumen rápido para confirmar fracaso renal agudo y clasificar el estadio.
        </p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-sm text-slate-800">
            <thead className="bg-slate-100 text-slate-900">
              <tr>
                <th className="w-44 border border-slate-200 px-4 py-3 text-left font-semibold">Categoría</th>
                <th className="border border-slate-200 px-4 py-3 text-left font-semibold">Criterios</th>
              </tr>
            </thead>
            <tbody>
              {kdigoRows.map((row, index) => (
                <tr key={row[0]} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-200 px-4 py-3 font-medium text-slate-900">{row[0]}</td>
                  <td className="border border-slate-200 px-4 py-3">{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-base font-semibold text-slate-900">Patrones urinarios orientativos</h3>
        <p className="mt-1 text-sm text-slate-600">
          Tabla de referencia rápida para orientar la causa del FRA a partir de los parámetros
          urinarios y el sedimento.
        </p>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-[980px] w-full border-collapse text-sm text-slate-800">
            <thead className="bg-[#5f5a4d] text-white">
              <tr>
                <th className="border border-[#4f4a3f] px-4 py-3 text-left font-semibold">Parámetro</th>
                {columns.map((column) => (
                  <th key={column} className="border border-[#4f4a3f] px-4 py-3 text-center font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row[0]} className={index % 2 === 0 ? 'bg-white' : 'bg-[#f4f1eb]'}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${row[0]}-${cellIndex}`}
                      className={`border border-slate-200 px-4 py-3 align-top ${cellIndex === 0 ? 'text-left' : 'text-center'}`}
                    >
                      {cell || '—'}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-[#ece6da]">
                <td className="border border-slate-200 px-4 py-3 font-semibold">Excepciones</td>
                <td colSpan={6} className="border border-slate-200 px-4 py-3">
                  En algunos casos, la microangiopatía trombótica, la glomerulonefritis aguda, la
                  nefropatía por contraste o la uropatía obstructiva pueden cursar con patrón
                  prerrenal.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-1 text-sm text-slate-600">
          <p>CrP: creatinina plasmática. CrU: creatinina urinaria. FeNa: excreción fraccional de sodio.</p>
          <p>FeUrea: excreción fraccional de urea. GMN: glomerulonefritis. MAT: microangiopatía trombótica.</p>
          <p>* Los patrones de GMN pueden ser variables.</p>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold text-slate-900">Causas frecuentes por tipo de FRA</h3>
          <p className="mt-1 text-sm text-slate-600">
            Adaptado como tabla única de causas, clínica/historia y pruebas complementarias para
            orientar el enfoque inicial.
          </p>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[1100px] w-full border-collapse text-sm text-slate-800">
              <thead className="bg-[#5f5a4d] text-white">
                <tr>
                  <th className="w-[8%] border border-[#4f4a3f] px-2 py-3 text-center font-semibold">Tipo</th>
                  <th className="w-[40%] border border-[#4f4a3f] px-4 py-3 text-left font-semibold">Causas</th>
                  <th className="w-[24%] border border-[#4f4a3f] px-4 py-3 text-left font-semibold">Clínica/historia</th>
                  <th className="w-[28%] border border-[#4f4a3f] px-4 py-3 text-left font-semibold">
                    Pruebas complementarias
                  </th>
                </tr>
              </thead>
              <tbody>
                {frequentCauseGroups.flatMap((group) =>
                  group.rows.map((row, index) => {
                    const typeCellClass =
                      group.tone === 'teal'
                        ? 'border-[#cfe1e4] bg-[#eaf6f7] text-[#214c55]'
                        : group.tone === 'amber'
                          ? 'border-[#eadcc7] bg-[#fbf2e6] text-[#6f542e]'
                          : 'border-[#ead8de] bg-[#fbf1f4] text-[#7d4455]';

                    return (
                      <tr
                        key={`${group.type}-${row.causes?.[0] ?? index}`}
                        className={`${index === 0 ? 'border-t-[3px] border-t-[#8a867b]' : ''} ${index % 2 === 0 ? 'bg-white' : 'bg-[#fcfbf8]'}`}
                      >
                        {index === 0 ? (
                          <td
                            rowSpan={group.rows.length}
                            className={`border px-2 py-0 align-middle ${typeCellClass}`}
                          >
                            <div className="flex h-full min-h-[260px] w-full items-center justify-center">
                              <div className="-rotate-90 whitespace-nowrap text-center text-xl font-semibold leading-none">
                                {group.type}
                              </div>
                            </div>
                          </td>
                        ) : null}
                        <td className="border border-slate-200 bg-[#f8fafb] px-4 py-4 align-top">
                          <StackList items={row.causes} tone="slate" />
                        </td>
                        <td className="border border-slate-200 bg-[#f3fafb] px-4 py-4 align-top">
                          <StackList items={row.clinical} tone="teal" />
                        </td>
                        <td className="border border-slate-200 bg-[#fff8ef] px-4 py-4 align-top">
                          <StackList items={row.tests} tone="amber" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-slate-600">
            Tabla esquemática: resume las causas más frecuentes y algunos apoyos clínicos o
            analíticos de mayor utilidad en Urgencias.
          </div>

          <div className="mt-3 text-sm leading-6 text-slate-600">
            VCE: volumen circulante efectivo. ICC: insuficiencia cardiaca congestiva. IAM: infarto
            agudo de miocardio. TEP: tromboembolismo pulmonar. AINE: antiinflamatorios no
            esteroideos. IECA: inhibidores de la enzima convertidora de la angiotensina. ARA-II:
            antagonistas del receptor de la angiotensina II. IBP: inhibidores de la bomba de
            protones. HTA: hipertensión arterial. HBP: hiperplasia benigna de próstata. EFNa:
            excreción fraccional de sodio. Na_u: sodio urinario. MAT: microangiopatía trombótica.
          </div>
        </div>
      </div>
    </section>
  );
}
