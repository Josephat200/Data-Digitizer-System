export interface CsvColumn {
  key: string;
  label: string;
}

export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns: CsvColumn[]
) {
  const escape = (val: unknown) => {
    if (val == null) return "";
    const s = String(val);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const header = columns.map(c => escape(c.label)).join(",");
  const lines = rows.map(row =>
    columns.map(c => escape(row[c.key])).join(",")
  );

  const csv = [header, ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csv, ""], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}
