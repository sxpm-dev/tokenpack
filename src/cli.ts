import { Command } from 'commander'
import fs from 'fs'
import { encodeFile } from './encoder.js'
import { decode } from './decoder.js'
import { listCodecs } from './codecs/registry.js'
import { PRESETS, getPreset } from './presets.js'
import { packDirs, unpackDir, listArchive } from './archive.js'
import { encode } from './encoder.js'
import { decodeToBuffer } from './decoder.js'
import { diffTokens } from './diff.js'
import './codecs/register-all.js'

const program = new Command()

program
  .name('tokenpack')
  .description('Encode source files into images and decode them back')
  .version('0.1.0')

program
  .command('encode <input>')
  .description('Encode a source file into a PNG image')
  .requiredOption('-o, --out <path>', 'output PNG path')
  .option('--algo <name>', 'codec algorithm (overrides preset)')
  .option('--preset <name>', 'visual preset (see: tokenpack presets)')
  .option('--width <n>', 'override image width', (v) => parseInt(v, 10))
  .option('--style <json>', 'style config as JSON string or path to .json file (overrides preset)')
  .option('--compress', 'compress with brotli before encoding (fewer pixels, exact decode)')
  .option('--cell-size <n>', 'dot cell size: 1=dense (default), 5=sparse dots like reference image', (v) => parseInt(v, 10))
  .action((input: string, opts: { out: string; algo?: string; preset?: string; width?: number; style?: string; compress?: boolean; cellSize?: number }) => {
    let algo = opts.algo
    let style
    let cellSize = opts.cellSize
    let compress = opts.compress

    if (opts.preset) {
      const preset = getPreset(opts.preset)
      if (!preset) {
        console.error(`Unknown preset "${opts.preset}". Run \`tokenpack presets\` to see available presets.`)
        process.exit(1)
      }
      algo     ??= preset.algo
      cellSize ??= preset.cellSize
      compress   = compress ?? preset.compress ?? false
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

    encodeFile(input, { out: opts.out, algo, width: opts.width, style, compress, cellSize })
    console.log(`Encoded → ${opts.out}`)
  })

program
  .command('decode <input>')
  .description('Decode a PNG image back to source')
  .requiredOption('-o, --out <path>', 'output file path')
  .action((input: string, opts: { out: string }) => {
    decode(input, { out: opts.out })
    console.log(`Decoded → ${opts.out}`)
  })

program
  .command('pack <dirs...>')
  .description('Pack a directory into a PNG image token')
  .requiredOption('-o, --out <path>', 'output PNG path')
  .option('--preset <name>', 'visual preset')
  .option('--algo <name>', 'codec algorithm')
  .option('--cell-size <n>', 'dot cell size (default 5)', (v) => parseInt(v, 10))
  .option('--ignore <names>', 'comma-separated extra names to ignore', (v) => v.split(','))
  .option('--no-compress', 'skip brotli compression')
  .action((dirs: string[], opts: { out: string; preset?: string; algo?: string; cellSize?: number; ignore?: string[]; compress: boolean }) => {
    let algo = opts.algo
    let style
    let cellSize = opts.cellSize
    let compress = opts.compress

    if (opts.preset) {
      const preset = getPreset(opts.preset)
      if (!preset) { console.error(`Unknown preset "${opts.preset}"`); process.exit(1) }
      algo     ??= preset.algo
      cellSize ??= preset.cellSize
      compress   = compress ?? preset.compress ?? true
      style = { ...preset.style }
    }

    algo     ??= 'linear'
    cellSize ??= 1
    if (compress === undefined) compress = true

    const archive = packDirs(dirs, opts.ignore)
    encode(archive, { out: opts.out, algo, style, cellSize, compress })
    console.log(`Packed [${dirs.join(', ')}] → ${opts.out}`)
  })

program
  .command('expand <image>')
  .description('Expand a PNG image token into a directory')
  .option('-o, --out <dir>', 'output directory (required unless --list)')
  .option('--list', 'list files without extracting')
  .action((image: string, opts: { out: string; list?: boolean }) => {
    const data = decodeToBuffer(image)
    if (opts.list) {
      const entries = listArchive(data)
      for (const e of entries) console.log(`  ${(e.size / 1024).toFixed(1)}K\t${e.filePath}`)
      return
    }
    if (!opts.out) { console.error('error: -o / --out <dir> is required'); process.exit(1) }
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
  .requiredOption('-o, --out <path>', 'output diff PNG path')
  .action((tokenA: string, tokenB: string, opts: { out: string }) => {
    const stats = diffTokens(tokenA, tokenB, opts.out)
    console.log(`Diff → ${opts.out}`)
    console.log(`  changed:   ${stats.changedPixels} pixels / ${stats.changedBytes} bytes (${stats.changePercent}%)`)
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

program.parse()
