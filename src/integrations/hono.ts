import type { Context, Next } from 'hono'
import { createCachedClient } from '../adapters/openai'
import type { LlmCacheOptions } from '../adapters/base'

type WithCache = <T extends object>(client: T) => T

declare module 'hono' {
  interface ContextVariableMap {
    withCache: WithCache
  }
}

/**
 * Hono middleware that attaches `c.get('withCache')(client)` to every request.
 *
 * @example
 * app.use(llmCacheMiddleware({ ttl: '24h', storage: 'memory' }))
 *
 * app.post('/chat', async (c) => {
 *   const openai = c.get('withCache')(new OpenAI())
 *   const response = await openai.chat.completions.create({ ... })
 *   return c.json(response)
 * })
 */
export function llmCacheMiddleware(options: LlmCacheOptions = {}) {
  return async (c: Context, next: Next): Promise<void> => {
    c.set('withCache', <T extends object>(client: T) => createCachedClient(client, options))
    await next()
  }
}
