# Semantic Caching

Exact caching only hits when prompts are byte-for-byte identical. Semantic caching goes further — it embeds prompts into vectors and finds similar cached responses using cosine similarity.

> "What is 2+2?" and "What does 2 plus 2 equal?" will share the same cache entry.

## How it works

1. On **cache set**: the prompt text is embedded into a vector and stored alongside the response.
2. On **cache get**: the incoming prompt is embedded, then compared against all stored vectors. If the nearest match exceeds the `threshold`, that cached response is returned.

Exact match is always tried first. The semantic search only runs on a miss.

## Local model (no API key)

```bash
npm install @huggingface/transformers
```

Uses `all-MiniLM-L6-v2` — a 384-dimension model (~25 MB), downloaded once and cached locally. No API key or internet connection needed at inference time.

```ts
import { LocalEmbedder } from 'llm-cache'

createCachedClient(client, {
  storage: 'sqlite',
  semantic: {
    embedder: new LocalEmbedder(),
    threshold: 0.92,  // cosine similarity 0–1, higher = stricter
  },
})
```

## OpenAI embeddings

```bash
npm install openai
```

Uses `text-embedding-3-small` — 1536 dimensions. Requires an OpenAI API key; each embed call costs a small amount.

```ts
import OpenAI from 'openai'
import { OpenAIEmbedder } from 'llm-cache'

createCachedClient(client, {
  storage: 'redis',
  semantic: {
    embedder: new OpenAIEmbedder({ client: new OpenAI() }),
    threshold: 0.95,
  },
})
```

## HNSW index for large caches

```bash
npm install hnswlib-node
```

By default, the similarity search is **flat** (O(N) brute-force). For caches with more than ~10 000 entries, switch to the **HNSW** index for O(log N) lookup:

```ts
semantic: {
  embedder: new LocalEmbedder(),
  threshold: 0.92,
  indexType: 'hnsw',  // default: 'flat'
}
```

| Index | Complexity | Best for |
|---|---|---|
| `flat` | O(N) | < 10 000 entries |
| `hnsw` | O(log N) | 10 000+ entries |

## Threshold guide

The `threshold` is the minimum cosine similarity (0–1) required for a cache hit.

| Threshold | Behaviour |
|---|---|
| `0.99` | Near-identical only |
| `0.95` | Very similar phrasing |
| `0.92` | Default — good balance |
| `0.85` | More aggressive matching, higher false-positive risk |

Start at `0.92` and tune based on your use case. For factual Q&A you can go lower; for creative prompts stay higher.
