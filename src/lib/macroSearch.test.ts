import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { matchesMacroSearch, type MacroCatalogItem } from './macroSearch.ts';

const catalogo: MacroCatalogItem[] = JSON.parse(await readFile('public/dietas_recom/index.json', 'utf8'));
const items = await Promise.all(catalogo.map(async (item) => ({
  ...item,
  contenido: await readFile(path.join('public', item.ruta), 'utf8'),
})));
const mapa = items.find((item) => item.id === 'MAPA')!;

test('MAPA se encuentra por siglas, sinónimos y contenido real', () => {
  for (const query of ['MAPA', 'HTA', 'hipertension', 'presion arterial', 'tension domicilio', 'enfermera familia', '  TENSIÓN   arterial  ']) {
    assert.ok(matchesMacroSearch(mapa, query), query);
  }
  assert.equal(matchesMacroSearch(mapa, 'cefalea'), false);
});

test('el catálogo completo permite buscar texto sin etiquetas y mantiene búsquedas vacías', () => {
  for (const item of items) {
    assert.ok(matchesMacroSearch(item, '  '));
    const words = item.contenido.trim().split(/\s+/).slice(-5).join(' ');
    assert.ok(matchesMacroSearch(item, words), item.id);
  }
});
