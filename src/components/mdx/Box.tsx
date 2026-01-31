export function Box({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-4 rounded-lg border border-[#dfe9eb] bg-white p-4 leading-tight">
      {title ? <strong className="mb-2 block text-slate-700">{title}</strong> : null}
      <div className="box-content">{children}</div>
    </div>
  );
}
