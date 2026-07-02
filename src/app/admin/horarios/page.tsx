import { getServerSession } from 'next-auth';
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

export default async function AdminHorariosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const [{ rows, source }, staticRows] = await Promise.all([
    getScheduleRows(),
    Promise.resolve(getStaticScheduleRows()),
  ]);

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
        rows={rows}
        source={source}
        staticCount={staticRows.length}
        createScheduleEntry={createScheduleEntry}
        updateScheduleEntry={updateScheduleEntry}
        deleteScheduleEntry={deleteScheduleEntry}
        importStaticHorarios={importStaticHorarios}
      />
    </main>
  );
}
