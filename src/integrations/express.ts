import type { Request, Response, NextFunction } from 'express'
import { createCachedClientFromManager } from '../adapters/openai'
import { buildManager } from '../adapters/shared'
import type { LlmCacheOptions } from '../adapters/base'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      withCache: <T extends object>(client: T) => T
    }
  }
}

/**
 * Express middleware that attaches `req.withCache(client)` to every request.
 *
 * @example
 * app.use(llmCacheMiddleware({ ttl: '24h', storage: 'memory' }))
 *
 * app.post('/chat', async (req, res) => {
 *   const openai = req.withCache(new OpenAI())
 *   const response = await openai.chat.completions.create({ ... })
 *   res.json(response)
 * })
 */
export function llmCacheMiddleware(options: LlmCacheOptions = {}) {
  const manager = buildManager(options)
  return (_req: Request, _res: Response, next: NextFunction): void => {
    _req.withCache = <T extends object>(client: T) => createCachedClientFromManager(client, manager)
    next()
  }
}
