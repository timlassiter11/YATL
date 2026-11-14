/**
 * A random version 4 UUID.
 *
 * `crypto.randomUUID()` only exists in secure contexts (HTTPS, or a page
 * loaded from localhost), so a page served over plain HTTP doesn't have it.
 * `crypto.getRandomValues()` is available everywhere and gives the same
 * kind of id, so it's used when `randomUUID` is missing.
 *
 * Internal: yatl-ui keeps its own copy rather than importing this, so the
 * two packages' version ranges stay independent.
 */
export function randomUUID(): string {
  // The DOM types declare randomUUID as always present; in an insecure
  // context it is undefined at run time.
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}
