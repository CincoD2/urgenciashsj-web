import { readFile } from 'node:fs/promises';
import path from 'node:path';
import catalogo from '../../../../public/dietas_recom/index.json';

// Se genera al compilar: el navegador recibe un único catálogo con el texto indexable.
export const dynamic = 'force-static';

export async function GET() {
  const items = await Promise.all(catalogo.map(async (item) => ({
    ...item,
    contenido: await readFile(path.join(process.cwd(), 'public', item.ruta), 'utf8'),
  })));
  return Response.json(items);
}
