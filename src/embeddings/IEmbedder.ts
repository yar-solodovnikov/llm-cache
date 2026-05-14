export interface IEmbedder {
  readonly dimensions: number
  embed(text: string): Promise<number[]>
}
