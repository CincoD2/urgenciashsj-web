export function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-amber-500 bg-amber-50 p-4 my-4">
      <strong className="block text-amber-700">⚠️ Advertencia</strong>
      <div>{children}</div>
    </div>
  );
}
