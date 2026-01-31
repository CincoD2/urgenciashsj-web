type TableCell = string | number;

type TableRow = TableCell[];

export function DataTable({
  headers,
  rows,
}: {
  headers: TableCell[];
  rows: TableRow[];
}) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            {headers.map((h, idx) => (
              <th key={`${h}-${idx}`} className="px-3 py-2 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={`row-${rIdx}`} className="border-t border-slate-200">
              {row.map((cell, cIdx) => (
                <td key={`cell-${rIdx}-${cIdx}`} className="px-3 py-2 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
