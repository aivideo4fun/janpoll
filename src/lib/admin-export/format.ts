export function csvCell(value: unknown): string {
  let text = String(value ?? '').replace(/\0/g, '');
  // Spreadsheet quoting alone does not stop formula execution.
  if (/^[\s\uFEFF]*[=+\-@]/u.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function toCsv(headers: string[], rows: unknown[][]): string {
  return '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
export function normalizeEmail(value: string | null | undefined) { return value?.trim().toLowerCase() || ''; }
export function normalizePhone(value: string | null | undefined) {
  const raw = value?.trim() || ''; if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+') && digits) return '+' + digits;
  if (/^\d{10}$/.test(digits)) return '+91' + digits;
  if (/^91\d{10}$/.test(digits)) return '+' + digits;
  return raw.startsWith('+') && digits ? '+' + digits : raw;
}
export function indiaTimestamp(date: Date) {
  return new Date(date.getTime() + 330 * 60000).toISOString().slice(0, 19) + '+05:30';
}
export function dateBounds(from: string, to: string): { gte?: Date; lt?: Date } | undefined {
  function parse(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use a valid YYYY-MM-DD date.');
    const utc = new Date(value + 'T00:00:00.000Z');
    if (!Number.isFinite(utc.getTime()) || utc.toISOString().slice(0, 10) !== value) throw new Error('Invalid calendar date.');
    return new Date(utc.getTime() - 330 * 60000);
  }
  const gte = from ? parse(from) : undefined;
  const end = to ? parse(to) : undefined;
  if (gte && end && gte > end) throw new Error('The start date must be on or before the end date.');
  return gte || end ? { ...(gte ? { gte } : {}), ...(end ? { lt: new Date(end.getTime() + 86400000) } : {}) } : undefined;
}
