#!/usr/bin/env -S tsx
// tokenpack CLI — encode/decode/pack/expand/diff/list.
//
// Skill-specific subcommands (open / ls / read / search / close / packs /
// apply-diff / diff-pack) live in `tokenpack-claude-skill`'s own binary.

import { decode, encode as nodeEncode, PackBuilder } from '@tokenpack/node'
import { nodeAlgorithmCatalog as algorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import { extract } from '@tokenpack/node/extract'
import { Command } from 'commander'
import fs from 'fs'
import { computeTextDiff } from 'tokenpack/diff'

const program = new Command()

program
  .name('tokenpack')
  .description('Encode source files into images and decode them back')
  .version('0.1.0')

interface CommonEncodeOpts {
  algo?: string
  level?: number
  bpp?: number
  key?: string
  out: string
}

function buildEncodeOpts(opts: CommonEncodeOpts): {
  algo: string
  algoOptions?: { compressor?: { level: number }; surface?: { channels: 1 | 2 | 3 | 4 } }
  key?: string
  out: string
} {
  const out: ReturnType<typeof buildEncodeOpts> = {
    algo: opts.algo ?? 'linear',
    out: opts.out,
  }

  if (opts.key) out.key = opts.key
  const algoOptions: NonNullable<typeof out.algoOptions> = {}

  if (opts.level !== undefined) algoOptions.compressor = { level: opts.level }
  if (opts.bpp !== undefined) {
    algoOptions.surface = { channels: opts.bpp as 1 | 2 | 3 | 4 }
  }
  if (Object.keys(algoOptions).length > 0) out.algoOptions = algoOptions

  return out
}

program
  .command('encode <input>')
  .description('Encode a source file into an image')
  .requiredOption('-o, --out <path>', 'output image path')
  .option('--algo <name>', 'catalog algorithm name (run `tokenpack list`)')
  .option('--level <n>', 'compressor level', v => parseInt(v, 10))
  .option('--bpp <n>', 'channels per pixel: 1, 2, 3, or 4 (default 3)', v => parseInt(v, 10))
  .option('--key <password>', 'encrypt token with AES-256-GCM (optional)')
  .action(async (input: string, opts: CommonEncodeOpts) => {
    await nodeEncode(input, buildEncodeOpts(opts))
    console.log(`Encoded → ${opts.out}`)
  })

program
  .command('decode <input>')
  .description('Decode an image back to its original payload')
  .requiredOption('-o, --out <path>', 'output path (file or directory)')
  .option('--key <password>', 'decryption key (required if token was encrypted)')
  .action(async (input: string, opts: { out: string; key?: string }) => {
    const pack = await decode(input, opts.key ? { key: opts.key } : {})

    if (pack.isPack()) {
      const written = await extract(pack, opts.out)

      console.log(`Decoded ${written.length} files → ${opts.out}`)

      return
    }
    if (pack.isDiff()) {
      console.error('error: input is a diff token. Use `tokenpack apply-diff` (skill CLI).')
      process.exit(1)
    }
    const bytes = await pack.content()

    fs.writeFileSync(opts.out, bytes)
    console.log(`Decoded file → ${opts.out}`)
  })

program
  .command('pack <dirs...>')
  .description('Pack one or more directories into an image token')
  .requiredOption('-o, --out <path>', 'output image path')
  .option('--algo <name>', 'catalog algorithm name (run `tokenpack list`)')
  .option('--level <n>', 'compressor level', v => parseInt(v, 10))
  .option('--bpp <n>', 'channels per pixel: 1, 2, 3, or 4 (default 3)', v => parseInt(v, 10))
  .option('--key <password>', 'encrypt token with AES-256-GCM (optional)')
  .option('--ignore <names>', 'comma-separated extra names to ignore', v => v.split(','))
  .action(async (dirs: string[], opts: CommonEncodeOpts & { ignore?: string[] }) => {
    const builder = new PackBuilder()
    const { packDirs } = await import('tokenpack/archive')
    const archive = packDirs(dirs, opts.ignore)

    builder.withFile(
      'archive.cart',
      new Uint8Array(archive.buffer, archive.byteOffset, archive.byteLength),
    )

    // Bypass the multi-file builder for single-archive case: just encode the
    // CART buffer directly. Keeps the resulting token a plain FilePack.
    await nodeEncode(archive, buildEncodeOpts(opts))
    console.log(`Packed [${dirs.join(', ')}] → ${opts.out}`)
  })

program
  .command('expand <image>')
  .description('Expand a packed image token into a directory')
  .option('-o, --out <dir>', 'output directory (required unless --list)')
  .option('--list', 'list files without extracting')
  .option('--key <password>', 'decryption key (required if token was encrypted)')
  .action(async (image: string, opts: { out?: string; list?: boolean; key?: string }) => {
    const pack = await decode(image, opts.key ? { key: opts.key } : {})

    if (!pack.isPack()) {
      console.error('error: token is not a packed directory. Use `tokenpack decode` instead.')
      process.exit(1)
    }

    if (opts.list) {
      for (const entry of pack.entries) {
        console.log(`  ${(entry.size / 1024).toFixed(1)}K\t${entry.path}`)
      }

      return
    }
    if (!opts.out) {
      console.error('error: -o / --out <dir> is required')
      process.exit(1)
    }
    const files = await extract(pack, opts.out)

    console.log(`Expanded ${files.length} files → ${opts.out}`)
  })

program
  .command('list')
  .description('List available algorithms')
  .action(() => {
    for (const Algo of algorithmCatalog.list()) {
      console.log(`  ${Algo.id}  ${Algo.name}`)
    }
  })

program
  .command('diff <tokenA> <tokenB>')
  .description('Structural diff between two tokens — emit a patch token or text diff')
  .option('-o, --out <path>', 'write diff token to this path (the result is itself a token)')
  .option('--text', 'print line-level diff as text instead of writing a token')
  .action(async (tokenA: string, tokenB: string, opts: { out?: string; text?: boolean }) => {
    if (opts.text) {
      const [packA, packB] = await Promise.all([decode(tokenA), decode(tokenB)])
      const fileDiffs = await computeTextDiff(packA, packB)

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
      console.error('error: -o / --out <path> required (or pass --text for text output)')
      process.exit(1)
    }
    const [packA, packB] = await Promise.all([decode(tokenA), decode(tokenB)])

    if (!packA.isPack() || !packB.isPack()) {
      console.error('error: diff token output requires two packed directory tokens')
      process.exit(1)

      return
    }
    const tokenBytes = ((await packA.diffTo(packB)) as { bytes: Uint8Array }).bytes

    fs.writeFileSync(opts.out, tokenBytes)
    const diffPack = await decode(tokenBytes)

    if (!diffPack.isDiff()) {
      console.error('warning: diff token did not decode to a DiffPack — unexpected')

      return
    }
    const counts: Record<string, number> = {}

    for (const e of diffPack.entries) counts[e.op] = (counts[e.op] ?? 0) + 1
    console.log(`Diff → ${opts.out}`)
    console.log(`  added:    ${counts.add ?? 0}`)
    console.log(`  modified: ${counts.modify ?? 0}`)
    console.log(`  deleted:  ${counts.delete ?? 0}`)
    console.log(`  renamed:  ${counts.rename ?? 0}`)
  })

program.parseAsync()
