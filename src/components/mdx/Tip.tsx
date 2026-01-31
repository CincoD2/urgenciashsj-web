export function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 my-4">
      <strong className="block text-emerald-700">✅ Consejo</strong>
      <div>{children}</div>
    </div>
  );
}
