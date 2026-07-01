import test from 'node:test';
import assert from 'node:assert/strict';

import { assessSeverity, createDefaultFraInput } from './index.ts';

test('genera alerta roja por hiperpotasemia grave', () => {
  const input = createDefaultFraInput();
  input.potassiumMmolL = 6.8;

  const result = assessSeverity(input);

  assert.equal(result.hasRedFlags, true);
  assert.ok(result.alerts.some((alert) => alert.code === 'hyperkalemia-severe'));
});

test('genera alerta roja por obstruccion complicada', () => {
  const input = createDefaultFraInput();
  input.infectedObstructionSuspected = true;

  const result = assessSeverity(input);

  assert.equal(result.hasRedFlags, true);
  assert.ok(result.consultationTargets.includes('Urologia'));
});
