import { MemoryStorage } from '../storage/MemoryStorage'
import { CacheManager } from '../core/CacheManager'
import { KeyBuilder } from '../core/KeyBuilder'
import type { IStorage } from '../storage/IStorage'
import type { LlmCacheOptions } from './base'

function resolveStorage(opts: LlmCacheOptions): IStorage {
  if (!opts.storage || opts.storage === 'memory') {
    return new MemoryStorage({ maxSize: opts.maxSize })
  }
  return opts.storage
}

async function* replayStream(chunks: unknown[]): AsyncGenerator<unknown> {
  for (const chunk of chunks) {
    yield chunk
  }
}

function extractText(params: Record<string, unknown>): string | undefined {
  const messages = params.messages as { role: string; content: string }[] | undefined
  if (!messages?.length) return undefined
  return messages.map(m => `${m.role}: ${m.content}`).join('\n')
}

function buildCachedCreate(
  originalCreate: (...args: unknown[]) => unknown,
  manager: CacheManager,
) {
  return async (params: Record<string, unknown>) => {
    const key = KeyBuilder.build(params)
    const text = extractText(params)

    if (params.stream) {
      const cached = await manager.get(key, text)
      if (cached?.type === 'stream' && cached.chunks) {
        return replayStream(cached.chunks)
      }

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

export function createCachedAnthropicClient<T extends object>(client: T, options: LlmCacheOptions = {}): T {
  const storage = resolveStorage(options)
  const manager = new CacheManager({
    storage,
    ttl: options.ttl,
    onStorageError: options.onStorageError,
    semantic: options.semantic,
  })

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop !== 'messages') return Reflect.get(target, prop, receiver)

      const messages = Reflect.get(target, prop, receiver) as Record<string, unknown>
      return new Proxy(messages, {
        get(msgTarget, msgProp, msgReceiver) {
          if (msgProp !== 'create') return Reflect.get(msgTarget, msgProp, msgReceiver)

          const originalCreate = (Reflect.get(msgTarget, msgProp, msgReceiver) as (...args: unknown[]) => unknown).bind(msgTarget)
          return buildCachedCreate(originalCreate, manager)
        },
      })
    },
  })
}
