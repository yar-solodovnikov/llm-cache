# Framework Integrations

## Express

```ts
import express from 'express'
import OpenAI from 'openai'
import { llmCacheMiddleware } from 'llm-cacher/express'

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

The middleware attaches `req.withCache(client)` to every request. The TypeScript type for `Request` is augmented automatically â€” no extra imports needed.

## Hono

```ts
import { Hono } from 'hono'
import OpenAI from 'openai'
import { llmCacheMiddleware } from 'llm-cacher/hono'

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

Uses Hono's `ContextVariableMap` augmentation â€” `c.get('withCache')` is fully typed.

## NestJS

Install NestJS peer dependencies if you haven't already:

```bash
npm install @nestjs/common @nestjs/core reflect-metadata
```

**Register the module** (global, so it's available everywhere):

```ts
// app.module.ts
import { Module } from '@nestjs/common'
import Redis from 'ioredis'
import { LlmCacheModule } from 'llm-cacher/nestjs'
import { RedisStorage } from 'llm-cacher'

@Module({
  imports: [
    LlmCacheModule.forRoot({
      ttl: '24h',
      storage: new RedisStorage({ client: new Redis() }),
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
import { LlmCacheService, InjectLlmCache } from 'llm-cacher/nestjs'

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

