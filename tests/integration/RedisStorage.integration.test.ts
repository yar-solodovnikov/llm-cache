import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import Redis from 'ioredis'
import { RedisStorage } from '../../src/storage/RedisStorage'
import type { CacheEntry } from '../../src/storage/IStorage'

const TEST_PREFIX = 'llm-cacher-test:'
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

function makeEntry(key: string, overrides: Partial<CacheEntry> = {}): CacheEntry {
  return {
    key,
    type: 'full',
    value: { result: key },
    createdAt: Date.now(),
    expiresAt: null,
    ...overrides,
  }
}

describe('RedisStorage (integration)', () => {
  let redis: Redis
  let storage: RedisStorage

  beforeAll(async () => {
    redis = new Redis(REDIS_URL, { lazyConnect: true, connectTimeout: 3_000 })
    await redis.connect()
    await redis.ping()
    storage = new RedisStorage({ client: redis, keyPrefix: TEST_PREFIX })
  })

  afterAll(async () => {
    await storage.clear()
    await redis.quit()
  })

  afterEach(async () => {
    await storage.clear()
  })

  it('stores and retrieves an entry', async () => {
    const entry = makeEntry('k1')
    await storage.set('k1', entry)
    expect(await storage.get('k1')).toEqual(entry)
  })

  it('returns null for missing key', async () => {
    expect(await storage.get('does-not-exist')).toBeNull()
  })

  it('deletes an entry', async () => {
    await storage.set('k1', makeEntry('k1'))
    await storage.delete('k1')
    expect(await storage.get('k1')).toBeNull()
  })

  it('clears all entries', async () => {
    await storage.set('a', makeEntry('a'))
    await storage.set('b', makeEntry('b'))
    await storage.set('c', makeEntry('c'))
    await storage.clear()
    expect(await storage.get('a')).toBeNull()
    expect(await storage.get('b')).toBeNull()
    expect(await storage.get('c')).toBeNull()
  })

  it('TTL actually expires in Redis', async () => {
    const entry = makeEntry('ttl-key', { expiresAt: Date.now() + 300 })
    await storage.set('ttl-key', entry)
    expect(await storage.get('ttl-key')).toEqual(entry)
    await new Promise(r => setTimeout(r, 400))
    expect(await storage.get('ttl-key')).toBeNull()
  })

  it('clear() handles more than SCAN COUNT (100) entries', async () => {
    const N = 150
    await Promise.all(
      Array.from({ length: N }, (_, i) => storage.set(`bulk-${i}`, makeEntry(`bulk-${i}`))),
    )
    await storage.clear()
    const results = await Promise.all(
      Array.from({ length: N }, (_, i) => storage.get(`bulk-${i}`)),
    )
    expect(results.every(r => r === null)).toBe(true)
  })

  it('key prefix isolates entries from other prefixes', async () => {
    const other = new RedisStorage({ client: redis, keyPrefix: 'other-prefix:' })
    await other.set('shared-key', makeEntry('shared-key'))
    expect(await storage.get('shared-key')).toBeNull()
    await other.clear()
  })
})
