// localStorage for per-viewer conveniences (open panels, theme). It can be
// unavailable (private windows, file:// in some browsers), so every access
// is guarded and the pages work without it.

/** The stored string, or null when there is none or storage is unavailable. */
export function readText(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeText(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/** A value stored as JSON, or `fallback` when it is missing or unreadable. */
export function readStored<T>(key: string, fallback: T): T {
  const raw = readText(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): void {
  writeText(key, JSON.stringify(value));
}
