import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';
import { getScheduleRows, getStaticScheduleRows } from '@/lib/horariosStore';

import AdminNav from '../AdminNav';
import {
  createScheduleEntry,
  deleteScheduleEntry,
  importStaticHorarios,
  updateScheduleEntry,
} from './actions';
import AdminHorariosManager from './AdminHorariosManager';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminHorariosPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedPage = Number(resolvedSearchParams.page ?? '1');
  const [{ rows, source }, staticRows] = await Promise.all([
    getScheduleRows(),
    Promise.resolve(getStaticScheduleRows()),
  ]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage >= 1
      ? Math.min(requestedPage, totalPages)
      : 1;
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedRows = rows.slice(start, start + PAGE_SIZE);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold">Administración de horarios</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Gestiona los PDFs mensuales desde la zona admin, sin editar código.
        </p>
        <div className="mt-4">
          <AdminNav current="horarios" />
        </div>
      </header>

      <AdminHorariosManager
        rows={paginatedRows}
        totalRows={rows.length}
        source={source}
        staticCount={staticRows.length}
        createScheduleEntry={createScheduleEntry}
        updateScheduleEntry={updateScheduleEntry}
        deleteScheduleEntry={deleteScheduleEntry}
        importStaticHorarios={importStaticHorarios}
      />

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm">
          <span className="text-neutral-600">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex flex-wrap gap-2">
            <Link
              href={currentPage > 1 ? `/admin/horarios?page=${currentPage - 1}` : '/admin/horarios'}
              aria-disabled={currentPage === 1}
              className={`rounded-md px-3 py-1 font-semibold ${
                currentPage === 1
                  ? 'pointer-events-none bg-neutral-100 text-neutral-400'
                  : 'bg-neutral-900 text-white'
              }`}
            >
              Anterior
            </Link>
            <Link
              href={`/admin/horarios?page=${currentPage + 1}`}
              aria-disabled={currentPage >= totalPages}
              className={`rounded-md px-3 py-1 font-semibold ${
                currentPage >= totalPages
                  ? 'pointer-events-none bg-neutral-100 text-neutral-400'
                  : 'bg-neutral-900 text-white'
              }`}
            >
              Siguiente
            </Link>
          </div>
        </nav>
      ) : null}
    </main>
  );
}
