import { isCompactToken, readHeader } from '../header'
import { DenseDrawer } from './dense-drawer'
import { DotDrawer } from './dot-drawer'
import type { AbstractDrawer } from './types'

export { DenseDrawer } from './dense-drawer'
export { DotDrawer } from './dot-drawer'
export {
  AbstractDrawer,
  type ChunkReadResult,
  type DrawContext,
  type DrawerCapabilities,
  type DrawnArtifact,
  type DrawnChunk,
  type ReadContext,
} from './types'

export function pickDrawerForPixels(pixels: Uint8Array): AbstractDrawer {
  if (isCompactToken(pixels)) return new DenseDrawer()
  const header = readHeader(pixels)

  return header.cellSize > 1 ? new DotDrawer() : new DenseDrawer()
}
