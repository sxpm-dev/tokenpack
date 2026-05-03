import { describe, it, expect } from 'vitest'
import { applyStyle, reverseStyle } from '../src/style.js'
import type { HeaderData } from '../src/types.js'

function makeHeader(overrides: Partial<HeaderData> = {}): HeaderData {
  return {
    version: 1, algorithmId: 0, fileLength: 100,
    width: 10, height: 10, styleFlags: 0, ecLevel: 0,
    codecMeta: new Uint8Array(16),
    gradientFrom: [255, 0, 0], gradientTo: [0, 0, 255],
    gradientDirection: 1, backgroundOpacity: 0,
    backgroundColor: [0, 0, 0],
    ...overrides,
  }
}

describe('style', () => {
  it('does not modify header pixels (first 32)', () => {
    const pixels = new Uint8Array(10 * 10 * 3)
    for (let i = 0; i < pixels.length; i++) pixels[i] = 0xAB
    const header = makeHeader({ styleFlags: 0b01 })
    applyStyle(pixels, 10, 10, header, 0.5)
    for (let i = 0; i < 96; i++) expect(pixels[i]).toBe(0xAB)
  })

  it('roundtrips with opacity=1.0 (no blend)', () => {
    const pixels = new Uint8Array(10 * 10 * 3)
    for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 13) % 256
    const original = new Uint8Array(pixels)
    const header = makeHeader({ styleFlags: 0b01 })
    applyStyle(pixels, 10, 10, header, 1.0)
    expect(pixels).toEqual(original)
    reverseStyle(pixels, 10, 10, header, 1.0)
    expect(pixels).toEqual(original)
  })

  it('apply then reverse recovers original within ±1 (opacity=0.8)', () => {
    const pixels = new Uint8Array(10 * 10 * 3)
    for (let i = 96; i < pixels.length; i++) pixels[i] = (i * 7 + 50) % 200
    const original = new Uint8Array(pixels)
    const header = makeHeader({ styleFlags: 0b01 })
    applyStyle(pixels, 10, 10, header, 0.8)
    reverseStyle(pixels, 10, 10, header, 0.8)
    for (let i = 96; i < pixels.length; i++) {
      expect(Math.abs(pixels[i] - original[i])).toBeLessThanOrEqual(1)
    }
  })
})
