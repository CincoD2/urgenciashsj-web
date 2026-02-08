export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-red-500 bg-red-50 p-4 my-4 rounded-lg">
      <strong className="block text-red-700">⚠️ Alerta</strong>
      <div>{children}</div>
    </div>
  );
}
