const IST = 'Asia/Kolkata';

/** तारीख़ — भारतीय समय (IST) में, जैसे "9 अक्टूबर 2026" */
export function formatIndiaDate(value: Date | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('hi-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** तारीख़ और समय — भारतीय समय (IST) में */
export function formatIndiaDateTime(value: Date | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('hi-IN', {
    timeZone: IST,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** व्हाट्सएप लिंक के लिए सिर्फ़ अंक; 10 अंक का नंबर हो तो 91 जोड़ देता है */
export function whatsappDigits(value: string): string {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}