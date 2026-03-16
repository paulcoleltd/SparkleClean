import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LRUCache } from '../lruCache'

describe('LRUCache', () => {
  // ─── Basic get / set ──────────────────────────────────────────────────────────

  it('returns undefined for an unknown key', () => {
    const cache = new LRUCache<string, number>()
    expect(cache.get('missing')).toBeUndefined()
  })

  it('returns the stored value', () => {
    const cache = new LRUCache<string, string>()
    cache.set('hello', 'world')
    expect(cache.get('hello')).toBe('world')
  })

  it('caches null as a valid "not found" sentinel', () => {
    const cache = new LRUCache<string, null | { id: string }>()
    cache.set('SC-NOTFOUND', null)
    expect(cache.get('SC-NOTFOUND')).toBeNull()
  })

  it('updates an existing key and moves it to most-recently-used', () => {
    const cache = new LRUCache<string, number>({ maxSize: 2 })
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('a', 99)  // update — should NOT evict 'a'
    cache.set('c', 3)   // evicts LRU which is now 'b'
    expect(cache.get('a')).toBe(99)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBe(3)
  })

  // ─── Eviction ────────────────────────────────────────────────────────────────

  it('evicts the least-recently-used entry when full', () => {
    const cache = new LRUCache<string, number>({ maxSize: 3 })
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    cache.get('a')      // access 'a' so 'b' becomes LRU
    cache.set('d', 4)   // should evict 'b'
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('a')).toBe(1)
    expect(cache.get('c')).toBe(3)
    expect(cache.get('d')).toBe(4)
  })

  it('size reflects the number of entries held', () => {
    const cache = new LRUCache<string, number>({ maxSize: 5 })
    cache.set('x', 1)
    cache.set('y', 2)
    expect(cache.size).toBe(2)
  })

  // ─── TTL / expiry ─────────────────────────────────────────────────────────────

  it('returns undefined for an expired entry', () => {
    vi.useFakeTimers()
    const cache = new LRUCache<string, string>({ ttlMs: 1000 })
    cache.set('key', 'value')
    vi.advanceTimersByTime(1001)
    expect(cache.get('key')).toBeUndefined()
    vi.useRealTimers()
  })

  it('returns a value that has NOT yet expired', () => {
    vi.useFakeTimers()
    const cache = new LRUCache<string, string>({ ttlMs: 1000 })
    cache.set('key', 'value')
    vi.advanceTimersByTime(999)
    expect(cache.get('key')).toBe('value')
    vi.useRealTimers()
  })

  // ─── delete ───────────────────────────────────────────────────────────────────

  it('delete removes an entry', () => {
    const cache = new LRUCache<string, number>()
    cache.set('a', 1)
    cache.delete('a')
    expect(cache.get('a')).toBeUndefined()
    expect(cache.size).toBe(0)
  })

  it('delete is a no-op for unknown keys', () => {
    const cache = new LRUCache<string, number>()
    expect(() => cache.delete('ghost')).not.toThrow()
  })
})
