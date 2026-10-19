import 'server-only';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CODE_PATTERN = /^[A-Za-z0-9_-]{22}$/;

export function getPublicPollId(id: string): string | null {
  if (!UUID_PATTERN.test(id)) return null;

  const hex = id.replace(/-/g, '');

  return Buffer.from(hex, 'hex').toString('base64url');
}

export function decodePublicPollId(code: string): string | null {
  if (!CODE_PATTERN.test(code)) return null;

  try {
    const bytes = Buffer.from(code, 'base64url');

    if (
      bytes.length !== 16 ||
      bytes.toString('base64url') !== code
    ) {
      return null;
    }

    const hex = bytes.toString('hex');

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join('-');
  } catch {
    return null;
  }
}

export function getPollSharePath(id: string): string {
  const code = getPublicPollId(id);

  return code
    ? `/p/${code}`
    : `/poll/${encodeURIComponent(id)}`;
}