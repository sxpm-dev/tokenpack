import { Command } from 'commander'
import fs from 'fs'
import { encode, encodeFile } from './encoder'
import { decode, decodeToBuffer } from './decoder'
import { listCodecs } from './codecs/registry'
import { PRESETS, getPreset } from './presets'
import { packDirs, unpackDir, listArchive } from './archive'
import { diffTokens, diffText } from './diff'
import './codecs/register-all'
import type { ImageFormat } from './types'

const program = new Command()

program
  .name('tokenpack')
  .description('Encode source files into images and decode them back')
  .version('0.1.0')

program
  .command('encode <input>')
  .description('Encode a source file into an image')
  .requiredOption('-o, --out <path>', 'output image path')
  .option('--algo <name>', 'codec algorithm (overrides preset)')
  .option('--preset <name>', 'visual preset (see: tokenpack presets)')
  .option('--width <n>', 'override image width', v => parseInt(v, 10))
  .option('--style <json>', 'style config as JSON string or path to .json file (overrides preset)')
  .option('--compress', 'compress with brotli before encoding (fewer pixels, exact decode)')
  .option('--compression <mode>', 'compression mode: none, deflate-1, deflate-6, deflate-9, brotli-4, brotli-6, brotli-11 (overrides --compress)')
  .option(
    '--cell-size <n>',
    'dot cell size: 1=dense (default), 5=sparse dots like reference image',
    v => parseInt(v, 10),
  )
  .option('--key <password>', 'encrypt token with AES-256-GCM (optional)')
  .option('--bpp <n>', 'bytes of data per pixel: 1, 2, 3, or 4 (default 3)', v => parseInt(v, 10))
  .option('--format <fmt>', 'image format: png, avif, webp (default png)')
  .action(
    async (
      input: string,
      opts: {
        out: string
        algo?: string
        preset?: string
        width?: number
        style?: string
        compress?: boolean
        compression?: string
        cellSize?: number
        key?: string
        bpp?: number
        format?: string
      },
    ) => {
      let algo = opts.algo
      let style
      let cellSize = opts.cellSize
      let compress = opts.compress

      if (opts.preset) {
        const preset = getPreset(opts.preset)
        if (!preset) {
          console.error(
            `Unknown preset "${opts.preset}". Run \`tokenpack presets\` to see available presets.`,
          )
          process.exit(1)
        }
        algo ??= preset.algo
        cellSize ??= preset.cellSize
        compress = compress ?? preset.compress ?? false
        style = { ...preset.style }
      }

      algo ??= 'linear'

      if (opts.style) {
        try {
          style = JSON.parse(opts.style)
        } catch {
          style = JSON.parse(fs.readFileSync(opts.style, 'utf8'))
        }
      }

      const channels = opts.bpp as 1 | 2 | 3 | 4 | undefined
      const format = opts.format as ImageFormat | undefined

      await encodeFile(input, { out: opts.out, algo, width: opts.width, style, compress, compressionMode: opts.compression, cellSize, key: opts.key, channels, format })
      console.log(`Encoded → ${opts.out}`)
    },
  )

program
  .command('decode <input>')
  .description('Decode an image back to source')
  .requiredOption('-o, --out <path>', 'output file path')
  .option('--key <password>', 'decryption key (required if token was encrypted)')
  .action(async (input: string, opts: { out: string; key?: string }) => {
    await decode(input, { out: opts.out, key: opts.key })
    console.log(`Decoded → ${opts.out}`)
  })

program
  .command('pack <dirs...>')
  .description('Pack a directory into an image token')
  .requiredOption('-o, --out <path>', 'output image path')
  .option('--preset <name>', 'visual preset')
  .option('--algo <name>', 'codec algorithm')
  .option('--cell-size <n>', 'dot cell size (default 5)', v => parseInt(v, 10))
  .option('--ignore <names>', 'comma-separated extra names to ignore', v => v.split(','))
  .option('--no-compress', 'skip brotli compression')
  .option('--compression <mode>', 'compression mode: none, deflate-1, deflate-6, deflate-9, brotli-4, brotli-6, brotli-11 (overrides --compress/--no-compress)')
  .option('--key <password>', 'encrypt token with AES-256-GCM (optional)')
  .option('--bpp <n>', 'bytes of data per pixel: 1, 2, 3, or 4 (default 3)', v => parseInt(v, 10))
  .option('--format <fmt>', 'image format: png, avif, webp (default png)')
  .action(
    async (
      dirs: string[],
      opts: {
        out: string
        preset?: string
        algo?: string
        cellSize?: number
        ignore?: string[]
        compress: boolean
        compression?: string
        key?: string
        bpp?: number
        format?: string
      },
    ) => {
      let algo = opts.algo
      let style
      let cellSize = opts.cellSize
      let compress = opts.compress

      if (opts.preset) {
        const preset = getPreset(opts.preset)
        if (!preset) {
          console.error(`Unknown preset "${opts.preset}"`)
          process.exit(1)
        }
        algo ??= preset.algo
        cellSize ??= preset.cellSize
        compress = compress ?? preset.compress ?? true
        style = { ...preset.style }
      }

      algo ??= 'linear'
      cellSize ??= 1
      if (compress === undefined) compress = true

      const channels = opts.bpp as 1 | 2 | 3 | 4 | undefined
      const format = opts.format as ImageFormat | undefined

      const archive = packDirs(dirs, opts.ignore)
      await encode(archive, { out: opts.out, algo, style, cellSize, compress, compressionMode: opts.compression, key: opts.key, channels, format })
      console.log(`Packed [${dirs.join(', ')}] → ${opts.out}`)
    },
  )

program
  .command('expand <image>')
  .description('Expand an image token into a directory')
  .option('-o, --out <dir>', 'output directory (required unless --list)')
  .option('--list', 'list files without extracting')
  .option('--key <password>', 'decryption key (required if token was encrypted)')
  .action(async (image: string, opts: { out: string; list?: boolean; key?: string }) => {
    const data = await decodeToBuffer(image, opts.key)
    if (opts.list) {
      const entries = listArchive(data)
      for (const e of entries) console.log(`  ${(e.size / 1024).toFixed(1)}K\t${e.filePath}`)
      return
    }
    if (!opts.out) {
      console.error('error: -o / --out <dir> is required')
      process.exit(1)
    }
    const files = unpackDir(data, opts.out)
    console.log(`Expanded ${files.length} files → ${opts.out}`)
  })

program
  .command('list')
  .description('List available codec algorithms')
  .action(() => {
    for (const codec of listCodecs()) {
      console.log(`  ${codec.id}  ${codec.name}`)
    }
  })

program
  .command('diff <tokenA> <tokenB>')
  .description('Visual diff of two tokens — changed bytes as colored pixels')
  .option('-o, --out <path>', 'output diff PNG path')
  .option('--text', 'print byte-level diff as text instead of image')
  .action(async (tokenA: string, tokenB: string, opts: { out?: string; text?: boolean }) => {
    if (opts.text) {
      const fileDiffs = await diffText(tokenA, tokenB)
      if (!fileDiffs.length) {
        console.log('No differences found.')
        return
      }
      for (const fd of fileDiffs) {
        console.log(`\n${'━'.repeat(60)}`)
        console.log(`  ${fd.filePath}  (+${fd.added} -${fd.removed})`)
        console.log(`${'━'.repeat(60)}`)
        for (const hunk of fd.hunks) {
          console.log(`  @@ line ${hunk.lineA} @@`)
          for (const line of hunk.lines) {
            const prefix = line.type === '+' ? '+ ' : line.type === '-' ? '- ' : '  '
            console.log(`  ${prefix}${line.text}`)
          }
        }
      }
      const totalAdded = fileDiffs.reduce((s, f) => s + f.added, 0)
      const totalRemoved = fileDiffs.reduce((s, f) => s + f.removed, 0)
      console.log(`\n${fileDiffs.length} file(s) changed  +${totalAdded} -${totalRemoved} lines`)
      return
    }
    if (!opts.out) {
      console.error('error: -o / --out <path> required for image diff')
      process.exit(1)
    }
    const stats = diffTokens(tokenA, tokenB, opts.out)
    console.log(`Diff → ${opts.out}`)
    console.log(
      `  changed:   ${stats.changedPixels} pixels / ${stats.changedBytes} bytes (${stats.changePercent}%)`,
    )
    console.log(`  unchanged: ${stats.unchangedPixels} pixels`)
    console.log(`  size:      ${stats.sizeA} bytes → ${stats.sizeB} bytes`)
  })

program
  .command('presets')
  .description('List available visual presets')
  .action(() => {
    for (const p of PRESETS) {
      console.log(`  ${p.name.padEnd(12)}${p.description}`)
    }
  })

program.parseAsync()
