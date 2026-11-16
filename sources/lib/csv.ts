/**
 * Sinh CSV theo RFC 4180 để admin tải về mở bằng Excel/Google Sheets.
 *
 * - Có BOM (UTF-8) để Excel nhận đúng tiếng Việt.
 * - Ô chứa dấu phẩy, dấu nháy kép hoặc xuống dòng đều được bọc nháy kép.
 * - Chặn CSV injection: ô bắt đầu bằng `=`, `+`, `-`, `@` được thêm dấu nháy đơn
 *   (Excel sẽ không thực thi công thức). Đây là dữ liệu khách nhập nên phải chặn.
 */

export type CsvValue = string | number | null | undefined;

const INJECTION_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";

  let text = String(value);

  if (INJECTION_PREFIXES.some((prefix) => text.startsWith(prefix))) {
    text = `'${text}`;
  }

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv(
  rows: CsvValue[][],
  options: { bom?: boolean } = {},
): string {
  const { bom = true } = options;
  const body = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return `${bom ? "\uFEFF" : ""}${body}`;
}
