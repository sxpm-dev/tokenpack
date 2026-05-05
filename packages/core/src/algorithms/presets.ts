import { compressorRegistry } from '../compressors/registry'
import { DenseDrawer, DotDrawer } from '../drawers'
import { PRESETS } from '../presets'
import { surfaceRegistry } from '../surfaces/registry'
import { Algorithm } from './algorithm'
import { algorithmCatalog } from './catalog'

export function registerPresetAlgorithms(): void {
  for (const preset of PRESETS) {
    const codec = algorithmCatalog.getCodecByName(preset.algo)
    const compressor = compressorRegistry.byMode(preset.compress ? 'brotli-11' : 'none')
    const drawer = preset.cellSize > 1 ? new DotDrawer() : new DenseDrawer()
    const surface = surfaceRegistry.byFormat('png')

    algorithmCatalog.register(
      new Algorithm({
        codec,
        compressor,
        drawer,
        surface,
        name: preset.name,
        title: preset.name,
        description: `${preset.description}. Preset wired with ${preset.algo} codec, ${compressor.label.toLowerCase()} compressor, ${drawer.label.toLowerCase()} drawer, and ${surface.label} surface.`,
        defaults: {
          style: preset.style,
          cellSize: preset.cellSize,
          compress: preset.compress,
        },
      }),
    )
  }
}
