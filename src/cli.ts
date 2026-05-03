import { Command } from 'commander'
import fs from 'fs'
import { encodeFile } from './encoder.js'
import { decode } from './decoder.js'
import { listCodecs } from './codecs/registry.js'
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
  .option('--algo <name>', 'codec algorithm', 'linear')
  .option('--width <n>', 'override image width', (v) => parseInt(v, 10))
  .option('--style <json>', 'style config as JSON string or path to .json file')
  .action((input: string, opts: { out: string; algo: string; width?: number; style?: string }) => {
    let style
    if (opts.style) {
      try {
        style = JSON.parse(opts.style)
      } catch {
        style = JSON.parse(fs.readFileSync(opts.style, 'utf8'))
      }
    }
    encodeFile(input, { out: opts.out, algo: opts.algo, width: opts.width, style })
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

program.parse()
