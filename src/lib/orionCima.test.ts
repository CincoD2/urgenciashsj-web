import assert from 'node:assert/strict';
import test from 'node:test';
import { matchCimaMedicine, type CimaMedicine } from './orionCima.ts';

const cases: Array<[string, CimaMedicine[], string]> = [
  ['XARELTO 20MG 28 COMPRIMIDOS RECUBIERTOS CON PELICULA (BAYER)', [
    { nombre: 'XARELTO 10 mg COMPRIMIDOS RECUBIERTOS CON PELICULA', vtm: { nombre: 'rivaroxabán' } },
    { nombre: 'XARELTO 20 mg COMPRIMIDOS RECUBIERTOS CON PELICULA (28 COMPRIMIDOS)', vtm: { nombre: 'rivaroxabán' } },
  ], 'rivaroxabán'],
  ['TAPTIQOM 15MCG/ML+ 5MG/ML 30 ENVASES UNIDOSIS 0,3ML COLIRIO SOLUCION', [
    { nombre: 'TAPTIQOM 15 MICROGRAMOS/ML+ 5 MG/ML COLIRIO EN SOLUCION EN ENVASE UNIDOSIS', vtm: { nombre: 'tafluprost + timolol' } },
  ], 'tafluprost + timolol'],
  ['HIDROFEROL 0,266MG 10 CAPSULAS BLANDAS', [
    { nombre: 'HIDROFEROL 0,266 mg SOLUCION ORAL', vtm: { nombre: 'calcifediol' } },
    { nombre: 'HIDROFEROL 0,266 MG CAPSULAS BLANDAS', vtm: { nombre: 'calcifediol' } },
  ], 'calcifediol'],
  ['CONDROSAN 400MG 60 CAPSULAS DURAS', [
    { nombre: 'CONDROSAN 400 mg CAPSULAS DURAS', vtm: { nombre: 'condroitín sulfato' } },
  ], 'condroitín sulfato'],
  ['BRIMVERA 2MG/ML 30 ENVASES UNIDOSIS 0,35ML COLIRIO EN SOLUCION', [
    { nombre: 'BRIMVERA 2 MG/ML COLIRIO EN SOLUCION EN ENVASE UNIDOSIS', vtm: { nombre: 'brimonidina' } },
  ], 'brimonidina'],
  ['STOPCOLD 5/120 MG 20 C0MPR', [
    { nombre: 'STOPCOLD 5 mg/120 mg COMPRIMIDOS DE LIBERACION PROLONGADA', vtm: { nombre: 'cetirizina + pseudoefedrina' } },
  ], 'cetirizina + pseudoefedrina'],
  ['TOBREX UNGÜENTO OFTALMICO 3MG/G POMADA OFTALMICA 1 TUBO DE 3,5G', [
    { nombre: 'TOBREX 3 MG/ML COLIRIO EN SOLUCIÓN', vtm: { nombre: 'tobramicina' } },
    { nombre: 'TOBREX UNGÜENTO OFTÁLMICO 3 MG/G POMADA OFTÁLMICA', vtm: { nombre: 'tobramicina' } },
  ], 'tobramicina'],
  ['SIMVASTATINA 20 MG / 28 COMPRIMIDOS', [
    { nombre: 'EZETIMIBA/SIMVASTATINA 10 MG/20 MG COMPRIMIDOS', vtm: { nombre: 'ezetimiba + simvastatina' } },
    { nombre: 'SIMVASTATINA 20 MG COMPRIMIDOS', vtm: { nombre: 'simvastatina' } },
  ], 'simvastatina'],
  ['DAPAGLIFLOZINA 10 MG / 28 COMPRIMIDOS RECUBIERTOS CON PELICULA', [
    { nombre: 'DAPAGLIFLOZINA TEVA 10 MG COMPRIMIDOS RECUBIERTOS CON PELICULA', vtm: { nombre: 'dapagliflozina' } },
  ], 'dapagliflozina'],
  ['ZIMBUS BREEZHALER 114/46/136MCG 30 CAPSULAS DURAS+1 INHAL POLVO PARA INHALACION', [
    {
      nombre: 'ZIMBUS BREEZHALER 114 microgramos/46 microgramos/136 microgramos POLVO PARA INHALACION (CAPSULA DURA)',
      dosis: '114 microgramos/46 microgramos/136 microgramos',
      formaFarmaceutica: { nombre: 'POLVO PARA INHALACIÓN (CÁPSULA DURA)' },
      vtm: { nombre: 'indacaterol + glicopirronio + mometasona' },
    },
  ], 'indacaterol + glicopirronio + mometasona'],
];

for (const [input, medicines, expected] of cases) {
  test(`CIMA: ${input.split(' ')[0]}`, () => {
    assert.equal(matchCimaMedicine(input, medicines)?.vtm?.nombre, expected);
  });
}

test('no sustituye una dosis distinta', () => {
  assert.equal(matchCimaMedicine('XARELTO 20MG COMPRIMIDOS', [
    { nombre: 'XARELTO 10 MG COMPRIMIDOS', vtm: { nombre: 'rivaroxabán' } },
  ]), null);
});

test('no sustituye una forma distinta', () => {
  assert.equal(matchCimaMedicine('HIDROFEROL 0,266MG CAPSULAS', [
    { nombre: 'HIDROFEROL 0,266 MG SOLUCION ORAL', vtm: { nombre: 'calcifediol' } },
  ]), null);
});

test('identifica ANSIUM sin dosis cuando solo hay una formulación compatible', () => {
  assert.equal(matchCimaMedicine('ANSIUM  30 CAPSULAS', [
    {
      nombre: 'ANSIUM CAPSULAS DURAS',
      dosis: '5/50 mg/mg',
      formaFarmaceutica: { nombre: 'CÁPSULA DURA' },
      vtm: { nombre: 'diazepam + sulpirida' },
    },
  ])?.vtm?.nombre, 'diazepam + sulpirida');
});

test('sin dosis no elige entre dos concentraciones de la misma forma', () => {
  assert.equal(matchCimaMedicine('MEDICAMENTO 30 CAPSULAS', [
    { nombre: 'MEDICAMENTO 5 MG CAPSULAS DURAS', dosis: '5 mg', formaFarmaceutica: { nombre: 'CÁPSULA DURA' }, vtm: { nombre: 'principio activo' } },
    { nombre: 'MEDICAMENTO 10 MG CAPSULAS DURAS', dosis: '10 mg', formaFarmaceutica: { nombre: 'CÁPSULA DURA' }, vtm: { nombre: 'principio activo' } },
  ]), null);
});

test('sin dosis no sustituye si tampoco consta la forma farmacéutica', () => {
  assert.equal(matchCimaMedicine('ANSIUM', [
    { nombre: 'ANSIUM CAPSULAS DURAS', dosis: '5/50 mg/mg', vtm: { nombre: 'diazepam + sulpirida' } },
  ]), null);
});

test('no confunde una combinación triple con otra concentración intermedia', () => {
  assert.equal(matchCimaMedicine('ZIMBUS BREEZHALER 114/46/136MCG 30 CAPSULAS', [
    { nombre: 'ZIMBUS BREEZHALER 114 microgramos/58 microgramos/136 microgramos CAPSULAS', vtm: { nombre: 'indacaterol + glicopirronio + mometasona' } },
  ]), null);
});
