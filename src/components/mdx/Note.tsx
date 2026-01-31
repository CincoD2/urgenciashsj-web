export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-slate-400 bg-slate-50 p-4 my-4">
      <strong className="block text-slate-700">📝 Nota</strong>
      <div>{children}</div>
    </div>
  );
}
