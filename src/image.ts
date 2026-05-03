import { PNG } from 'pngjs'
import fs from 'fs'

export function writePNG(filePath: string, pixels: Uint8Array, width: number, height: number): void {
  const png = new PNG({ width, height, filterType: -1 })
  png.data = Buffer.alloc(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    png.data[i * 4]     = pixels[i * 3]
    png.data[i * 4 + 1] = pixels[i * 3 + 1]
    png.data[i * 4 + 2] = pixels[i * 3 + 2]
    png.data[i * 4 + 3] = 255
  }
  fs.writeFileSync(filePath, PNG.sync.write(png))
}

export function readPNG(filePath: string): { pixels: Uint8Array; width: number; height: number } {
  const png = PNG.sync.read(fs.readFileSync(filePath))
  const rgb = new Uint8Array(png.width * png.height * 3)
  for (let i = 0; i < png.width * png.height; i++) {
    rgb[i * 3]     = png.data[i * 4]
    rgb[i * 3 + 1] = png.data[i * 4 + 1]
    rgb[i * 3 + 2] = png.data[i * 4 + 2]
  }
  return { pixels: rgb, width: png.width, height: png.height }
}
