import { describe, it, expect, vi } from 'vitest'
import { CacheManager } from '../src/core/CacheManager'
import { MemoryStorage } from '../src/storage/MemoryStorage'
import type { IEmbedder } from '../src/embeddings/IEmbedder'

// mock embedder: returns predictable vectors based on text
function makeMockEmbedder(map: Record<string, number[]>): IEmbedder {
  return {
    dimensions: 3,
    embed: vi.fn(async (text: string) => {
      return map[text] ?? [0, 0, 0]
    }),
  }
}

describe('CacheManager — semantic cache', () => {
  it('returns exact match without calling embedder', async () => {
    const embedder = makeMockEmbedder({})
    const manager = new CacheManager({
      storage: new MemoryStorage(),
      semantic: { embedder, threshold: 0.9 },
    })

    await manager.set('key1', { type: 'full', value: 'response' }, 'hello')
    vi.clearAllMocks() // reset call count after set
    // get by exact key — should NOT call embedder again
    const result = await manager.get('key1')
    expect(result?.value).toBe('response')
    expect(embedder.embed).not.toHaveBeenCalled()
  })

  it('finds semantically similar entry', async () => {
    const embedder = makeMockEmbedder({
      'user: explain async/await': [1, 0, 0],
      'user: what is async/await?': [0.99, 0.1, 0],
    })
    const manager = new CacheManager({
      storage: new MemoryStorage(),
      semantic: { embedder, threshold: 0.9 },
    })

    await manager.set('key1', { type: 'full', value: 'cached response' }, 'user: explain async/await')

    // different key, similar text
    const result = await manager.get('key2', 'user: what is async/await?')
    expect(result?.value).toBe('cached response')
  })

  it('returns null when similarity is below threshold', async () => {
    const embedder = makeMockEmbedder({
      'user: explain async/await': [1, 0, 0],
      'user: what is the weather?': [0, 1, 0],
    })
    const manager = new CacheManager({
      storage: new MemoryStorage(),
      semantic: { embedder, threshold: 0.9 },
    })

    await manager.set('key1', { type: 'full', value: 'cached' }, 'user: explain async/await')
    const result = await manager.get('key2', 'user: what is the weather?')
    expect(result).toBeNull()
  })

  it('does not use semantic when no text is provided', async () => {
    const embedder = makeMockEmbedder({})
    const manager = new CacheManager({
      storage: new MemoryStorage(),
      semantic: { embedder, threshold: 0.9 },
    })

    await manager.set('key1', { type: 'full', value: 'response' }, 'some text')
    vi.clearAllMocks() // reset call count after set
    const result = await manager.get('key2') // no text — should not call embedder
    expect(result).toBeNull()
    expect(embedder.embed).not.toHaveBeenCalled()
  })
})
