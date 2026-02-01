export default function PendingApprovalPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold">Tu acceso está pendiente de aprobación</h1>
      <p className="text-base text-neutral-600">
        Hemos recibido tu solicitud de acceso. El administrador debe aprobar tu cuenta antes de poder
        entrar en el parte de jefatura.
      </p>
      <p className="text-sm text-neutral-500">
        Si crees que esto es un error, contacta con administración.
      </p>
    </main>
  );
}
