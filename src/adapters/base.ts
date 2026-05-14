import type { IStorage } from '../storage/IStorage'
import type { StorageErrorStrategy, SemanticOptions } from '../core/CacheManager'

export interface LlmCacheOptions {
  ttl?: string | number
  storage?: 'memory' | 'file' | 'sqlite' | IStorage
  storagePath?: string
  maxSize?: number
  onStorageError?: StorageErrorStrategy
  semantic?: SemanticOptions
}
