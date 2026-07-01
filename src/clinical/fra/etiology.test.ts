import test from 'node:test';
import assert from 'node:assert/strict';

import { assessEtiology, createDefaultFraInput } from './index.ts';

test('orienta a etiologia prerrenal con hipovolemia y FeUrea baja', () => {
  const input = createDefaultFraInput();
  input.hypovolemia.vomiting = true;
  input.hypovolemia.hypotension = true;
  input.medications.diuretics = true;
  input.urineStudies.urineUreaMgDl = 300;
  input.urineStudies.plasmaUreaMgDl = 80;
  input.urineStudies.urineCreatinineMgDl = 120;
  input.creatinineCurrentMgDl = 1.2;
  input.urineStudies.plasmaCreatinineMgDl = 1.2;

  const result = assessEtiology(input);

  assert.equal(result.mostLikely, 'prerenal');
  assert.ok((result.scores.find((score) => score.bucket === 'prerenal')?.score ?? 0) > 0);
});

test('orienta a postrenal con globo vesical e hidronefrosis', () => {
  const input = createDefaultFraInput();
  input.anuria = true;
  input.obstructionClues.bladderGlobe = true;
  input.ultrasound.hydronephrosis = true;

  const result = assessEtiology(input);

  assert.equal(result.mostLikely, 'postrenal');
  assert.ok((result.scores.find((score) => score.bucket === 'postrenal')?.score ?? 0) >= 7);
});
