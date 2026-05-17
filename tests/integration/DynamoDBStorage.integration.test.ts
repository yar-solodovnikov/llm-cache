import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
} from '@aws-sdk/client-dynamodb'
import { DynamoDBStorage } from '../../src/storage/DynamoDBStorage'
import type { CacheEntry } from '../../src/storage/IStorage'

const ENDPOINT = process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:4566'
const TABLE_NAME = 'llm-cacher-integration-test'
const REGION = 'us-east-1'
const FAKE_CREDENTIALS = { accessKeyId: 'test', secretAccessKey: 'test' }

function makeEntry(key: string, overrides: Partial<CacheEntry> = {}): CacheEntry {
  return {
    key,
    type: 'full',
    value: { result: key },
    createdAt: Date.now(),
    expiresAt: null,
    ...overrides,
  }
}

function makeAdminClient(): DynamoDBClient {
  return new DynamoDBClient({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: FAKE_CREDENTIALS,
  })
}

describe('DynamoDBStorage (integration)', () => {
  let adminClient: DynamoDBClient
  let storage: DynamoDBStorage

  beforeAll(async () => {
    adminClient = makeAdminClient()

    await adminClient.send(
      new CreateTableCommand({
        TableName: TABLE_NAME,
        AttributeDefinitions: [{ AttributeName: 'pk', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'pk', KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST',
      }),
    )

    storage = new DynamoDBStorage({ tableName: TABLE_NAME, client: adminClient })
  })

  afterAll(async () => {
    await adminClient.send(new DeleteTableCommand({ TableName: TABLE_NAME }))
    adminClient.destroy()
  })

  afterEach(async () => {
    await storage.clear()
  })

  it('stores and retrieves an entry', async () => {
    const entry = makeEntry('k1')
    await storage.set('k1', entry)
    expect(await storage.get('k1')).toEqual(entry)
  })

  it('returns null for missing key', async () => {
    expect(await storage.get('does-not-exist')).toBeNull()
  })

  it('deletes an entry', async () => {
    await storage.set('k1', makeEntry('k1'))
    await storage.delete('k1')
    expect(await storage.get('k1')).toBeNull()
  })

  it('clears all entries', async () => {
    await storage.set('a', makeEntry('a'))
    await storage.set('b', makeEntry('b'))
    await storage.clear()
    expect(await storage.get('a')).toBeNull()
    expect(await storage.get('b')).toBeNull()
  })

  it('returns null for client-side expired entry', async () => {
    const entry = makeEntry('expired', { expiresAt: Date.now() - 1 })
    await storage.set('expired', entry)
    expect(await storage.get('expired')).toBeNull()
  })

  it('clear() handles more than the batch write limit (25) entries', async () => {
    const N = 30
    await Promise.all(
      Array.from({ length: N }, (_, i) => storage.set(`bulk-${i}`, makeEntry(`bulk-${i}`))),
    )
    await storage.clear()
    const results = await Promise.all(
      Array.from({ length: N }, (_, i) => storage.get(`bulk-${i}`)),
    )
    expect(results.every(r => r === null)).toBe(true)
  })

  it('works with custom attribute names', async () => {
    const customTable = `${TABLE_NAME}-custom`
    await adminClient.send(
      new CreateTableCommand({
        TableName: customTable,
        AttributeDefinitions: [{ AttributeName: 'cacheKey', AttributeType: 'S' }],
        KeySchema: [{ AttributeName: 'cacheKey', KeyType: 'HASH' }],
        BillingMode: 'PAY_PER_REQUEST',
      }),
    )

    const customStorage = new DynamoDBStorage({
      tableName: customTable,
      client: adminClient,
      keyAttribute: 'cacheKey',
      valueAttribute: 'payload',
      ttlAttribute: 'expiresAt',
    })

    const entry = makeEntry('custom-k1')
    await customStorage.set('custom-k1', entry)
    expect(await customStorage.get('custom-k1')).toEqual(entry)
    await customStorage.delete('custom-k1')
    expect(await customStorage.get('custom-k1')).toBeNull()

    await adminClient.send(new DeleteTableCommand({ TableName: customTable }))
  })
})
