export class TtlCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();

  constructor(private readonly maxSize = 5000) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) {
      return undefined;
    }
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (ttlMs <= 0) {
      return;
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    if (this.store.size > this.maxSize) {
      this.prune();
    }
  }

  size(): number {
    return this.store.size;
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
    while (this.store.size > this.maxSize) {
      const first = this.store.keys().next().value;
      if (!first) {
        break;
      }
      this.store.delete(first);
    }
  }
}
