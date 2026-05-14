import type { IEmbedder } from './IEmbedder'

// all-MiniLM-L6-v2 — 384 dims, ~25MB, no API key needed
const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2'
const DEFAULT_DIMENSIONS = 384

export interface LocalEmbedderOptions {
  model?: string
}

export class LocalEmbedder implements IEmbedder {
  readonly dimensions = DEFAULT_DIMENSIONS
  private readonly model: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pipeline: any = null

  constructor(opts: LocalEmbedderOptions = {}) {
    this.model = opts.model ?? DEFAULT_MODEL
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getPipeline(): Promise<any> {
    if (this.pipeline) return this.pipeline
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { pipeline } = require('@huggingface/transformers') as typeof import('@huggingface/transformers')
    this.pipeline = await pipeline('feature-extraction', this.model)
    return this.pipeline
  }

  async embed(text: string): Promise<number[]> {
    const extractor = await this.getPipeline()
    const output = await extractor(text, { pooling: 'mean', normalize: true })
    return Array.from(output.data as Float32Array) as number[]
  }
}
