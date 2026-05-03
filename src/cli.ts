import { Command } from 'commander'
import fs from 'fs'
import { encodeFile } from './encoder.js'
import { decode } from './decoder.js'
import { listCodecs } from './codecs/registry.js'
import { PRESETS, getPreset } from './presets.js'
import './codecs/register-all.js'

const program = new Command()

program
  .name('codeart')
  .description('Encode source files into images and decode them back')
  .version('0.1.0')

program
  .command('encode <input>')
  .description('Encode a source file into a PNG image')
  .requiredOption('-o, --out <path>', 'output PNG path')
  .option('--algo <name>', 'codec algorithm (overrides preset)')
  .option('--preset <name>', 'visual preset (see: codeart presets)')
  .option('--width <n>', 'override image width', (v) => parseInt(v, 10))
  .option('--style <json>', 'style config as JSON string or path to .json file (overrides preset)')
  .action((input: string, opts: { out: string; algo?: string; preset?: string; width?: number; style?: string }) => {
    let algo = opts.algo
    let style

    if (opts.preset) {
      const preset = getPreset(opts.preset)
      if (!preset) {
        console.error(`Unknown preset "${opts.preset}". Run \`codeart presets\` to see available presets.`)
        process.exit(1)
      }
      algo ??= preset.algo
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

    encodeFile(input, { out: opts.out, algo, width: opts.width, style })
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
  .command('list')
  .description('List available codec algorithms')
  .action(() => {
    for (const codec of listCodecs()) {
      console.log(`  ${codec.id}  ${codec.name}`)
    }
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
