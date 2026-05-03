import type { Style } from './types.js'

export interface Preset {
  name: string
  description: string
  algo: string
  style: Partial<Style>
}

// All presets use opacity: 1.0 → exact decode guaranteed.
// Gradient from/to colors are stored in the header for future display rendering
// but are NOT blended into pixel data (blending at opacity < 1.0 causes ±1 byte
// corruption that makes decoded text invalid).
export const PRESETS: Preset[] = [
  // ── Semantic (keyword-aware) — colorful keyword blocks ────────────────────
  {
    name: 'sunset',
    description: 'Keyword colors on red→blue gradient canvas  [semantic, exact]',
    algo: 'semantic',
    style: {
      gradient: { from: [255, 0, 80], to: [0, 80, 255], direction: 'diagonal' },
      opacity: 1.0,
    },
  },
  {
    name: 'aurora',
    description: 'Keyword colors on green→purple gradient canvas  [semantic, exact]',
    algo: 'semantic',
    style: {
      gradient: { from: [0, 255, 180], to: [120, 0, 255], direction: 'diagonal' },
      opacity: 1.0,
    },
  },
  {
    name: 'candy',
    description: 'Keyword colors on pink→sky gradient canvas  [semantic, exact]',
    algo: 'semantic',
    style: {
      gradient: { from: [255, 100, 200], to: [100, 200, 255], direction: 'diagonal' },
      opacity: 1.0,
    },
  },
  {
    name: 'midnight',
    description: 'Keyword colors on navy→violet gradient canvas  [semantic, exact]',
    algo: 'semantic',
    style: {
      gradient: { from: [10, 10, 80], to: [120, 0, 180], direction: 'vertical' },
      opacity: 1.0,
    },
  },
  // ── Non-semantic — different spatial layouts ───────────────────────────────
  {
    name: 'spiral',
    description: 'Data radiates outward from image center  [radial, exact]',
    algo: 'radial',
    style: {
      gradient: { from: [220, 0, 0], to: [255, 200, 0], direction: 'vertical' },
      opacity: 1.0,
    },
  },
  {
    name: 'shuffle',
    description: 'Every 3rd pixel swapped — scrambled look  [interleaved, exact]',
    algo: 'interleaved',
    style: {
      gradient: { from: [0, 0, 0], to: [0, 255, 80], direction: 'vertical' },
      opacity: 1.0,
    },
  },
  {
    name: 'raw',
    description: 'Plain dense encoding, no visual processing  [linear, exact]',
    algo: 'linear',
    style: { opacity: 1.0 },
  },
]

export function getPreset(name: string): Preset | undefined {
  return PRESETS.find(p => p.name === name)
}
