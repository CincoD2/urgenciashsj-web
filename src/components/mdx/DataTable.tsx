import type { ReactNode } from "react";

type TableCellObject = {
  content: ReactNode;
  rowSpan?: number;
  colSpan?: number;
  className?: string;
};

type TableCell = ReactNode | TableCellObject;
type TableRow = TableCell[];

function isTableCellObject(cell: TableCell): cell is TableCellObject {
  return typeof cell === "object" && cell !== null && "content" in cell;
}

export function DataTable({
  headers = [],
  rows = [],
}: {
  headers?: TableCell[];
  rows?: TableRow[];
}) {
  if (headers.length === 0 && rows.length === 0) {
    return null;
  }
  return (
    <div className="not-prose my-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="m-0 w-full border-collapse text-sm leading-tight">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            {headers.map((h, idx) => (
              <th
                key={`header-${idx}`}
                colSpan={isTableCellObject(h) ? h.colSpan : undefined}
                rowSpan={isTableCellObject(h) ? h.rowSpan : undefined}
                className={`px-3 py-2 text-left font-semibold ${
                  isTableCellObject(h) && h.className ? h.className : ""
                }`}
              >
                {isTableCellObject(h) ? h.content : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={`row-${rIdx}`} className="border-t border-slate-200">
              {row.map((cell, cIdx) => (
                <td
                  key={`cell-${rIdx}-${cIdx}`}
                  rowSpan={isTableCellObject(cell) ? cell.rowSpan : undefined}
                  colSpan={isTableCellObject(cell) ? cell.colSpan : undefined}
                  className={`px-3 py-2 text-slate-700 ${
                    isTableCellObject(cell) && cell.className ? cell.className : ""
                  }`}
                >
                  {isTableCellObject(cell) ? cell.content : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
