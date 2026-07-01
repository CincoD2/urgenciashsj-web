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
      </div>
    </section>
  );
}
