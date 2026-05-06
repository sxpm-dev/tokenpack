// Shared types for the decompression callback used by both pack and diff
// readers. The function is injected by env packages (Node zlib / browser
// CompressionStream) so the format readers stay env-neutral.

export interface DecompressMeta {
  level: number
  uncompressedLength: number
}

export interface DecompressFn {
  (bytes: Uint8Array, compressor: string, meta: DecompressMeta): Promise<Uint8Array>
}
