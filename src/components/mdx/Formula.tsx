export function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm">
      {children}
    </div>
  );
}
