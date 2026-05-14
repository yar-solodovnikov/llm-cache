import type { IStorage } from '../storage/IStorage'
import type { StorageErrorStrategy, SemanticOptions } from '../core/CacheManager'

export interface LlmCacheOptions {
  ttl?: string | number
  storage?: 'memory' | IStorage
  maxSize?: number
  onStorageError?: StorageErrorStrategy
  semantic?: SemanticOptions
}
