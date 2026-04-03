export function Pearl({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-blue-500 bg-blue-50 p-4 my-4 rounded-lg">
      <strong className="block text-blue-700">💡 Perla clínica</strong>
      <div className="[&>p]:m-0 [&>p]:inline [&>p]:contents [&_a]:inline [&_a]:!inline">
        {children}
      </div>
    </div>
  );
}
