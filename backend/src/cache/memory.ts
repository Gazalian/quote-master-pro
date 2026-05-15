/**
 * Tiny TTL cache for pricing tables, bootstrap snapshots, regional prices.
 * In-process only — fine for a single backend instance.  Promote to Redis when
 * the backend goes horizontal.
 */

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class MemoryCache<K extends string, V> {
  private store = new Map<K, Entry<V>>();

  constructor(private readonly ttlMs: number, private readonly maxEntries = 500) {}

  get(key: K): V | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: K, value: V): void {
    if (this.store.size >= this.maxEntries) {
      // Evict the oldest entry. Map preserves insertion order.
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  async getOrLoad(key: K, loader: () => Promise<V>): Promise<V> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = await loader();
    this.set(key, value);
    return value;
  }
}
