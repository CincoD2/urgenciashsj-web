export function Pearl({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-blue-500 bg-blue-50 p-4 my-4">
      <strong className="block text-blue-700">💡 Perla clínica</strong>
      <div>{children}</div>
    </div>
  );
}
