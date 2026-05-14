import { describe, it, expect } from 'vitest'
import { SimilarityEngine } from '../src/core/SimilarityEngine'

// simple 3-dim embeddings for testing
const vecA = [1, 0, 0]
const vecB = [0.99, 0.1, 0.05] // very similar to A
const vecC = [0, 1, 0]         // orthogonal to A

describe('SimilarityEngine — flat', () => {
  it('finds similar vector above threshold', () => {
    const engine = new SimilarityEngine({ threshold: 0.9 })
    engine.add('key-a', vecA)
    expect(engine.findSimilar(vecB)).toBe('key-a')
  })

  it('returns null when no vector exceeds threshold', () => {
    const engine = new SimilarityEngine({ threshold: 0.9 })
    engine.add('key-a', vecA)
    expect(engine.findSimilar(vecC)).toBeNull()
  })

  it('returns null when index is empty', () => {
    const engine = new SimilarityEngine({ threshold: 0.9 })
    expect(engine.findSimilar(vecA)).toBeNull()
  })

  it('removes an entry', () => {
    const engine = new SimilarityEngine({ threshold: 0.9 })
    engine.add('key-a', vecA)
    engine.remove('key-a')
    expect(engine.findSimilar(vecB)).toBeNull()
  })

  it('tracks size correctly', () => {
    const engine = new SimilarityEngine({ threshold: 0.9 })
    expect(engine.size).toBe(0)
    engine.add('a', vecA)
    engine.add('b', vecC)
    expect(engine.size).toBe(2)
    engine.remove('a')
    expect(engine.size).toBe(1)
  })

  it('returns best match among multiple entries', () => {
    const engine = new SimilarityEngine({ threshold: 0.5 })
    engine.add('key-a', vecA)
    engine.add('key-c', vecC)
    // vecB is closer to vecA
    expect(engine.findSimilar(vecB)).toBe('key-a')
  })
})
