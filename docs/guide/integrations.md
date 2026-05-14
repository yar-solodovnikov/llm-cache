# Framework Integrations

## Express

```ts
import express from 'express'
import OpenAI from 'openai'
import { llmCacheMiddleware } from 'llm-cache/express'

const app = express()
app.use(llmCacheMiddleware({ ttl: '24h', storage: 'memory' }))

app.post('/chat', async (req, res) => {
  const openai = req.withCache(new OpenAI())
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: req.body.messages,
  })
  res.json(response)
})
```

The middleware attaches `req.withCache(client)` to every request. The TypeScript type for `Request` is augmented automatically — no extra imports needed.

## Hono

```ts
import { Hono } from 'hono'
import OpenAI from 'openai'
import { llmCacheMiddleware } from 'llm-cache/hono'

const app = new Hono()
app.use(llmCacheMiddleware({ ttl: '24h', storage: 'sqlite' }))

app.post('/chat', async (c) => {
  const openai = c.get('withCache')(new OpenAI())
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: await c.req.json(),
  })
  return c.json(response)
})
```

Uses Hono's `ContextVariableMap` augmentation — `c.get('withCache')` is fully typed.

## NestJS

Install NestJS peer dependencies if you haven't already:

```bash
npm install @nestjs/common @nestjs/core reflect-metadata
```

**Register the module** (global, so it's available everywhere):

```ts
// app.module.ts
import { Module } from '@nestjs/common'
import { LlmCacheModule } from 'llm-cache/nestjs'

@Module({
  imports: [
    LlmCacheModule.forRoot({
      ttl: '24h',
      storage: 'redis',
      storageOptions: { client: redisClient },
      onStorageError: 'passthrough',
    }),
  ],
})
export class AppModule {}
```

**Inject into a service:**

```ts
// chat.service.ts
import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'
import { LlmCacheService, InjectLlmCache } from 'llm-cache/nestjs'

@Injectable()
export class ChatService {
  private readonly openai: OpenAI

  constructor(@InjectLlmCache() private readonly llmCache: LlmCacheService) {
    this.openai = this.llmCache.wrap(new OpenAI())
  }

  async chat(messages: OpenAI.ChatCompletionMessageParam[]) {
    return this.openai.chat.completions.create({ model: 'gpt-4o', messages })
  }
}
```

`LlmCacheService.wrap(client)` wraps any LLM client with caching using the options from `forRoot`.
