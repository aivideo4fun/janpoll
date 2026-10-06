export function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// हिंदी नामों की सही तुलना के लिए
export function normalizeName(value?: string | null) {
  return (value ?? '')
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function sameName(a?: string | null, b?: string | null) {
  return normalizeName(a) === normalizeName(b);
}