/** djb2 string hash → unsigned 32-bit integer. Deterministic. */
export function djb2(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  return hash >>> 0;
}

/** djb2 hash as a base-16 string (no prefix). */
export function djb2Hex(s: string): string {
  return djb2(s).toString(16);
}
