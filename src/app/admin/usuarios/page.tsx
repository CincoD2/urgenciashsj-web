import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { deleteUsers, setUserApproved, setUserRole, updateAutoLogout } from './actions';
import AdminUsersTable from './AdminUsersTable';

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: 'ADMIN' | 'USER';
  approved: boolean;
  createdAt: Date;
};

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const users: UserRow[] = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      approved: true,
      createdAt: true,
    },
  });
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  const idleMinutes = settings?.idleMinutes ?? 5;
  const warningSeconds = settings?.warningSeconds ?? 30;
  const protectedEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold">Administración de usuarios</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Aprueba accesos y gestiona roles para el parte de jefatura.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Auto-logout por inactividad</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Configura el cierre automático y el aviso previo para toda la zona privada.
        </p>
        <form action={updateAutoLogout} className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
            Minutos de inactividad
            <input
              type="number"
              name="idleMinutes"
              min={1}
              max={120}
              defaultValue={idleMinutes}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
            Aviso antes de cerrar (segundos)
            <input
              type="number"
              name="warningSeconds"
              min={5}
              max={300}
              defaultValue={warningSeconds}
              className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end">
            <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
              Guardar
            </button>
          </div>
        </form>
      </section>

      <AdminUsersTable
        users={users}
        currentUserId={session.user.id}
        protectedEmails={protectedEmails}
        setUserApproved={setUserApproved}
        setUserRole={setUserRole}
        deleteUsers={deleteUsers}
      />
    </main>
  );
}
