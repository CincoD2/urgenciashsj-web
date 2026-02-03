"use client";

import { useMemo, useState } from "react";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "USER";
  approved: boolean;
  createdAt: Date;
};

type AdminUsersTableProps = {
  users: UserRow[];
  currentUserId: string;
  protectedEmails: string[];
  setUserRole: (formData: FormData) => void;
  setUserApproved: (formData: FormData) => void;
  deleteUsers: (formData: FormData) => void;
};

export default function AdminUsersTable({
  users,
  currentUserId,
  protectedEmails,
  setUserRole,
  setUserApproved,
  deleteUsers,
}: AdminUsersTableProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const selectableIds = useMemo(
    () =>
      users
        .filter(
          (u) =>
            u.role !== "ADMIN" &&
            u.id !== currentUserId &&
            !protectedEmails.includes((u.email ?? "").toLowerCase())
        )
        .map((u) => u.id),
    [currentUserId, protectedEmails, users]
  );

  const allSelected = selected.length > 0 && selected.length === selectableIds.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : selectableIds);
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  return (
    <section className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
        <div className="text-sm text-neutral-600">
          Seleccionados: <span className="font-semibold">{selected.length}</span>
        </div>
        <form
          action={deleteUsers}
          onSubmit={(event) => {
            if (selected.length === 0) {
              event.preventDefault();
              return;
            }
            const ok = window.confirm(
              `¿Eliminar ${selected.length} usuario(s)? Esta acción no se puede deshacer.`
            );
            if (!ok) event.preventDefault();
          }}
        >
          {selected.map((id) => (
            <input key={id} type="hidden" name="userIds" value={id} />
          ))}
          <button
            type="submit"
            disabled={selected.length === 0}
            className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Eliminar seleccionados
          </button>
        </form>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
          <tr>
            <th className="px-4 py-3">
              <input
                type="checkbox"
                aria-label="Seleccionar todos"
                checked={allSelected}
                onChange={toggleAll}
                disabled={selectableIds.length === 0}
              />
            </th>
            <th className="px-4 py-3">Usuario</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Rol</th>
            <th className="px-4 py-3">Aprobado</th>
            <th className="px-4 py-3">Alta</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isProtectedEmail = protectedEmails.includes((user.email ?? "").toLowerCase());
            const disableDelete =
              user.role === "ADMIN" || user.id === currentUserId || isProtectedEmail;
            return (
              <tr key={user.id} className="border-t border-neutral-100">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${user.email ?? "usuario"}`}
                    disabled={disableDelete}
                    checked={selected.includes(user.id)}
                    onChange={() => toggleOne(user.id)}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">{user.name || "—"}</td>
                <td className="px-4 py-3 text-neutral-700">{user.email || "—"}</td>
                <td className="px-4 py-3 text-neutral-700">
                  <form action={setUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className={`rounded-md border px-2 py-1 text-sm ${
                        isProtectedEmail
                          ? "border-neutral-200 bg-neutral-100 text-neutral-500"
                          : "border-neutral-200"
                      }`}
                      disabled={isProtectedEmail}
                    >
                      <option value="USER">Usuario</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                    {!isProtectedEmail && (
                      <button className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                        Guardar
                      </button>
                    )}
                  </form>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                      user.approved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {user.approved ? "Sí" : "Pendiente"}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {new Date(user.createdAt).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3">
                  <form action={setUserApproved}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="approved" value={user.approved ? "false" : "true"} />
                    <button
                      disabled={isProtectedEmail}
                      className={`rounded-md px-3 py-1 text-xs font-semibold ${
                        user.approved
                          ? "bg-neutral-200 text-neutral-700"
                          : "bg-emerald-600 text-white"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {user.approved ? "Desaprobar" : "Aprobar"}
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
        No se pueden eliminar administradores ni tu propio usuario.
      </div>
    </section>
  );
}
