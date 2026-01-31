export function BoxGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 grid gap-4 md:grid-cols-2">
      {children}
    </div>
  );
}
