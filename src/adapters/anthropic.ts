import { buildManager, buildCachedCreate } from './shared'
import type { LlmCacheOptions } from './base'

export function createCachedAnthropicClient<T extends object>(client: T, options: LlmCacheOptions = {}): T {
  const manager = buildManager(options)

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
