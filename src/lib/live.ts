const cache = new Map<string, Promise<unknown>>();

export function liveJson<T>(path: string): Promise<T | null> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(path)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    cache.set(path, p);
  }
  return p as Promise<T | null>;
}
