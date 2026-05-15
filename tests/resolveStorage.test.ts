import { describe, it, expect, vi, afterEach } from 'vitest'
import { unlinkSync, existsSync } from 'fs'
import { resolveStorage } from '../src/adapters/shared'
import { MemoryStorage } from '../src/storage/MemoryStorage'
import { FileStorage } from '../src/storage/FileStorage'
import { SQLiteStorage } from '../src/storage/SQLiteStorage'

const TEST_FILE_PATH = './test-resolve-storage.json'
const TEST_DB_PATH = './test-resolve-storage.db'
const created: SQLiteStorage[] = []

afterEach(() => {
  // Close open SQLite connections before deleting files (Windows requires this)
  for (const s of created) s.close()
  created.length = 0
  if (existsSync(TEST_FILE_PATH)) unlinkSync(TEST_FILE_PATH)
  if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH)
})

describe('resolveStorage', () => {
  it('returns MemoryStorage when storage is undefined', () => {
    expect(resolveStorage({})).toBeInstanceOf(MemoryStorage)
  })

  it("returns MemoryStorage for storage: 'memory'", () => {
    expect(resolveStorage({ storage: 'memory' })).toBeInstanceOf(MemoryStorage)
  })

  it("returns FileStorage for storage: 'file' with default path", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = resolveStorage({ storage: 'file' }) as any
    expect(s).toBeInstanceOf(FileStorage)
    expect(s.path).toBe('./llm-cacher.json')
  })

  it("returns FileStorage with storagePath when provided", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = resolveStorage({ storage: 'file', storagePath: TEST_FILE_PATH }) as any
    expect(s).toBeInstanceOf(FileStorage)
    expect(s.path).toBe(TEST_FILE_PATH)
  })

  it("returns SQLiteStorage for storage: 'sqlite'", () => {
    const s = resolveStorage({ storage: 'sqlite', storagePath: TEST_DB_PATH }) as SQLiteStorage
    created.push(s)
    expect(s).toBeInstanceOf(SQLiteStorage)
  })

  it("returns SQLiteStorage with storagePath when provided", () => {
    const s = resolveStorage({ storage: 'sqlite', storagePath: TEST_DB_PATH }) as SQLiteStorage
    created.push(s)
    expect(s).toBeInstanceOf(SQLiteStorage)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((s as any).db.name).toContain('test-resolve-storage.db')
  })

  it('returns custom IStorage instance unchanged', () => {
    const custom = { get: vi.fn(), set: vi.fn(), delete: vi.fn(), clear: vi.fn() }
    expect(resolveStorage({ storage: custom })).toBe(custom)
  })
})

