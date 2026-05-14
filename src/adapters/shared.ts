import { MemoryStorage } from '../storage/MemoryStorage'
import { FileStorage } from '../storage/FileStorage'
import { SQLiteStorage } from '../storage/SQLiteStorage'
import { CacheManager } from '../core/CacheManager'
import { KeyBuilder } from '../core/KeyBuilder'
import type { IStorage } from '../storage/IStorage'
import type { LlmCacheOptions } from './base'

const DEFAULT_FILE_STORAGE_PATH = './llm-cache.json'
const DEFAULT_SQLITE_STORAGE_PATH = './llm-cache.db'

export function resolveStorage(opts: LlmCacheOptions): IStorage {
  const s = opts.storage
  if (!s || s === 'memory') return new MemoryStorage({ maxSize: opts.maxSize })
  if (s === 'file') return new FileStorage({ path: opts.storagePath ?? DEFAULT_FILE_STORAGE_PATH })
  if (s === 'sqlite') return new SQLiteStorage({ path: opts.storagePath ?? DEFAULT_SQLITE_STORAGE_PATH })
  return s
}

export function buildManager(options: LlmCacheOptions): CacheManager {
  return new CacheManager({
    storage: resolveStorage(options),
    ttl: options.ttl,
    onStorageError: options.onStorageError,
    semantic: options.semantic,
  })
}

export async function* replayStream(chunks: unknown[]): AsyncGenerator<unknown> {
  for (const chunk of chunks) yield chunk
}

export function extractText(params: Record<string, unknown>): string | undefined {
  const messages = params.messages as { role: string; content: string }[] | undefined
  if (!messages?.length) return undefined
  return messages.map(m => `${m.role}: ${m.content}`).join('\n')
}

export function buildCachedCreate(
  originalCreate: (...args: unknown[]) => unknown,
  manager: CacheManager,
) {
  return async (params: Record<string, unknown>) => {
    const key = KeyBuilder.build(params)
    const text = extractText(params)

    if (params.stream) {
      const cached = await manager.get(key, text)
      if (cached?.type === 'stream' && cached.chunks) return replayStream(cached.chunks)

      const stream = (await originalCreate(params)) as AsyncIterable<unknown>
      return (async function* () {
        const chunks: unknown[] = []
        for await (const chunk of stream) {
          chunks.push(chunk)
          yield chunk
        }
        await manager.set(key, { type: 'stream', value: null, chunks }, text)
      })()
    }

    const cached = await manager.get(key, text)
    if (cached?.type === 'full') return cached.value

    const response = await originalCreate(params)
    await manager.set(key, { type: 'full', value: response }, text)
    return response
  }
}
