import test from 'node:test';
import assert from 'node:assert/strict';

import { assessKdigo, createDefaultFraInput } from './index.ts';

test('confirma FRA por aumento de creatinina >=0,3 mg/dl en 48 h', () => {
  const input = createDefaultFraInput();
  input.creatinineCurrentMgDl = 1.4;
  input.creatinineBaselineMgDl = 1.0;
  input.baselineTimeHours = 24;

  const result = assessKdigo(input);

  assert.equal(result.hasFra, true);
  assert.equal(result.stage, 1);
  assert.equal(result.creatinineDeltaMgDl, 0.4);
});

test('clasifica KDIGO 3 por diuresis <0,3 ml/kg/h durante 24 h', () => {
  const input = createDefaultFraInput();
  input.weightKg = 80;
  input.urineOutputTotalMl = 400;
  input.oliguriaDurationHours = 24;

  const result = assessKdigo(input);

  assert.equal(result.hasFra, true);
  assert.equal(result.urine.stage, 3);
  assert.equal(result.stage, 3);
});

test('marca KDIGO 3 si ha iniciado TRS', () => {
  const input = createDefaultFraInput();
  input.renalReplacementStarted = true;

  const result = assessKdigo(input);

  assert.equal(result.hasFra, true);
  assert.equal(result.stage, 3);
});
