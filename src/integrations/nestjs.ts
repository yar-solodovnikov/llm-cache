import 'reflect-metadata'
import { Module, Injectable, Inject, type DynamicModule } from '@nestjs/common'
import { createCachedClient } from '../adapters/openai'
import type { LlmCacheOptions } from '../adapters/base'

const LLM_CACHE_OPTIONS = Symbol('LLM_CACHE_OPTIONS')

@Injectable()
export class LlmCacheService {
  constructor(
    @Inject(LLM_CACHE_OPTIONS) private readonly options: LlmCacheOptions,
  ) {}

  /**
   * Wraps any LLM client (OpenAI, Anthropic, etc.) with caching.
   *
   * @example
   * const openai = this.llmCache.wrap(new OpenAI())
   * const response = await openai.chat.completions.create({ ... })
   */
  wrap<T extends object>(client: T): T {
    return createCachedClient(client, this.options)
  }
}

@Module({})
export class LlmCacheModule {
  /**
   * @example
   * LlmCacheModule.forRoot({
   *   ttl: '24h',
   *   storage: 'redis',
   *   onStorageError: 'passthrough',
   * })
   */
  static forRoot(options: LlmCacheOptions): DynamicModule {
    return {
      module: LlmCacheModule,
      providers: [
        { provide: LLM_CACHE_OPTIONS, useValue: options },
        LlmCacheService,
      ],
      exports: [LlmCacheService],
      global: true,
    }
  }
}

/** Parameter decorator — injects LlmCacheService */
export const InjectLlmCache = (): ParameterDecorator => Inject(LlmCacheService)
