import type { Style } from './types'

export interface Preset {
  name: string
  description: string
  algo: string
  style: Partial<Style>
  cellSize: number
  compress?: boolean
}

export const PRESETS: Preset[] = [
  // ── Dot mode presets (sparse grid + gradient background — the reference look) ─
  {
    name: 'sunset',
    description: 'Red→blue diagonal, brotli+linear dots',
    algo: 'linear',
    cellSize: 5,
    compress: true,
    style: {
      gradient: { from: [255, 0, 80], to: [0, 80, 255], direction: 'diagonal' },
      opacity: 1.0,
    },
  },
  {
    name: 'aurora',
    description: 'Green→purple diagonal, brotli+linear dots',
    algo: 'linear',
    cellSize: 5,
    compress: true,
    style: {
      gradient: { from: [0, 220, 160], to: [100, 0, 255], direction: 'diagonal' },
      opacity: 1.0,
    },
  },
  {
    name: 'candy',
    description: 'Pink→sky diagonal, brotli+linear dots',
    algo: 'linear',
    cellSize: 5,
    compress: true,
    style: {
      gradient: { from: [255, 80, 180], to: [80, 180, 255], direction: 'diagonal' },
      opacity: 1.0,
    },
  },
  {
    name: 'midnight',
    description: 'Navy→violet vertical, brotli+linear dots',
    algo: 'linear',
    cellSize: 5,
    compress: true,
    style: {
      gradient: { from: [10, 10, 80], to: [120, 0, 180], direction: 'vertical' },
      opacity: 1.0,
    },
  },
  {
    name: 'fire',
    description: 'Red→gold diagonal, brotli+linear dots',
    algo: 'linear',
    cellSize: 5,
    compress: true,
    style: {
      gradient: { from: [200, 0, 0], to: [255, 180, 0], direction: 'diagonal' },
      opacity: 1.0,
    },
  },
  {
    name: 'matrix',
    description: 'Black→green vertical, brotli+linear dots',
    algo: 'linear',
    cellSize: 5,
    compress: true,
    style: {
      gradient: { from: [0, 0, 0], to: [0, 200, 60], direction: 'vertical' },
      opacity: 1.0,
    },
  },
  // ── Dense mode presets ────────────────────────────────────────────────────────
  {
    name: 'shuffle',
    description: 'Every 3rd pixel swapped — scrambled look  [interleaved, dense]',
    algo: 'interleaved',
    cellSize: 1,
    style: { opacity: 1.0 },
  },
  {
    name: 'raw',
    description: 'Plain dense encoding, no processing  [linear, dense]',
    algo: 'linear',
    cellSize: 1,
    style: { opacity: 1.0 },
  },
]

export function getPreset(name: string): Preset | undefined {
  return PRESETS.find(p => p.name === name)
}
