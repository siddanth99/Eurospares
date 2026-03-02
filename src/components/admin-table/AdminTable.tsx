export type AdminTableColumn<T> = {
  header: string;
  accessor: keyof T;
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
};

type AdminTableProps<T> = {
  columns: AdminTableColumn<T>[];
  data: T[];
};

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
}: AdminTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          No records found.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {columns.map((col) => (
              <th
                key={String(col.accessor)}
                className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground ${alignClass[col.align ?? "left"]}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border transition-colors hover:bg-muted/40 last:border-b-0"
            >
              {columns.map((col) => (
                <td
                  key={String(col.accessor)}
                  className={`px-4 py-3 ${alignClass[col.align ?? "left"]}`}
                >
                  {col.cell
                    ? col.cell(row)
                    : String(row[col.accessor] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
