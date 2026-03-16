/**
 * Generic LRU (Least Recently Used) in-memory cache.
 *
 * Designed for server-side use in Next.js (module-level singleton per process).
 * Backed by a Map, which preserves insertion order — oldest entries are at the
 * front and are evicted when `maxSize` is reached.
 *
 * Usage:
 *   const cache = new LRUCache<string, MyValue>({ maxSize: 500, ttlMs: 10 * 60_000 })
 *   cache.set('key', value)
 *   cache.get('key') // returns value or undefined (if expired / evicted)
 */

interface LRUOptions {
  /** Maximum number of entries before the oldest is evicted. Default: 500 */
  maxSize?: number
  /** Time-to-live in milliseconds. Entries older than this are treated as misses. Default: 10 min */
  ttlMs?: number
}

interface Entry<V> {
  value: V
  expiresAt: number
}

export class LRUCache<K, V> {
  private readonly map   = new Map<K, Entry<V>>()
  private readonly max:  number
  private readonly ttl:  number

  constructor({ maxSize = 500, ttlMs = 10 * 60_000 }: LRUOptions = {}) {
    this.max = maxSize
    this.ttl = ttlMs
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined

    // Expired — evict and return miss
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key)
      return undefined
    }

    // Move to end (most recently used)
    this.map.delete(key)
    this.map.set(key, entry)
    return entry.value
  }

  set(key: K, value: V): void {
    // Evict existing entry so it gets re-inserted at the end
    if (this.map.has(key)) this.map.delete(key)

    // Evict oldest entry when at capacity
    if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value
      if (oldest !== undefined) this.map.delete(oldest)
    }

    this.map.set(key, { value, expiresAt: Date.now() + this.ttl })
  }

  /** Remove a single entry (e.g. after a write invalidates it). */
  delete(key: K): void {
    this.map.delete(key)
  }

  /** Number of live (non-expired) entries currently held. */
  get size(): number {
    return this.map.size
  }
}
