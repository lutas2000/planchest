// localStorage for per-viewer conveniences (open panels, theme). It can be
// unavailable (private windows, file:// in some browsers), so every access
// is guarded and the pages work without it.

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
