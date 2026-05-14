import { buildManager, buildCachedCreate } from './shared'
import type { LlmCacheOptions } from './base'

export function createCachedClient<T extends object>(client: T, options: LlmCacheOptions = {}): T {
  const manager = buildManager(options)

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop !== 'chat') return Reflect.get(target, prop, receiver)

      const chat = Reflect.get(target, prop, receiver) as Record<string, unknown>
      return new Proxy(chat, {
        get(chatTarget, chatProp, chatReceiver) {
          if (chatProp !== 'completions') return Reflect.get(chatTarget, chatProp, chatReceiver)

          const completions = Reflect.get(chatTarget, chatProp, chatReceiver) as Record<string, unknown>
          return new Proxy(completions, {
            get(compTarget, compProp, compReceiver) {
              if (compProp !== 'create') return Reflect.get(compTarget, compProp, compReceiver)

              const originalCreate = (Reflect.get(compTarget, compProp, compReceiver) as (...args: unknown[]) => unknown).bind(compTarget)
              return buildCachedCreate(originalCreate, manager)
            },
          })
        },
      })
    },
  })
}
