export type MacroCatalogItem = {
  id: string;
  titulo: string;
  ruta: string;
  tags?: string[];
  sistemas?: string[];
  contenido?: string;
};

export function normalizeMacroSearch(value = '') {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function matchesMacroSearch(item: MacroCatalogItem, query: string) {
  const terms = normalizeMacroSearch(query).trim().split(/\s+/).filter(Boolean);
  const searchable = normalizeMacroSearch([
    item.id, item.titulo, ...(item.tags || []), ...(item.sistemas || []), item.contenido || '',
  ].join(' '));
  return terms.every((term) => searchable.includes(term));
}
