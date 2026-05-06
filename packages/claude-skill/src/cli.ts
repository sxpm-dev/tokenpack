#!/usr/bin/env -S tsx
// tokenpack-skill — CLI for the Claude Code skill.
//
// Subcommands operate on a sandboxed pack cache at ~/.tokenpack/cache/<id>/
// so the agent can inspect a pasted Context Pack PNG without writing files
// into the user's workspace.

import { Command } from 'commander'

import * as packCache from './pack-cache'

const program = new Command()

program
  .name('tokenpack-skill')
  .description('TokenPack Context Pack skill — virtual-mount inspection of token PNGs')
  .version('0.0.1')

program
  .command('open <png>')
  .description('Open a token PNG into the local cache for inspection')
  .option('--key <password>', 'decryption key (if pack is encrypted)')
  .option('--prompt-key', 'prompt for the decryption key on stdin (TTY only)', false)
  .action(async (png: string, opts: { key?: string; promptKey: boolean }) => {
    let key = opts.key

    try {
      if (opts.promptKey && !key) key = await readPasswordFromTTY('decryption key: ')

      try {
        const result = await packCache.open(png, key)

        console.log(JSON.stringify(result, null, 2))
      } catch (e: unknown) {
        if (
          !key
          && process.stdin.isTTY
          && e instanceof Error
          && /encrypted/i.test(e.message)
        ) {
          key = await readPasswordFromTTY('decryption key: ')
          const result = await packCache.open(png, key)

          console.log(JSON.stringify(result, null, 2))

          return
        }
        throw e
      }
    } catch (e: unknown) {
      console.error('open failed:', e instanceof Error ? e.message : e)
      process.exit(1)
    }
  })

program
  .command('ls <id>')
  .description('List manifest entries of an open pack')
  .option('--glob <pattern>', 'simple substring filter on path')
  .action((id: string, opts: { glob?: string }) => {
    try {
      let manifest = packCache.readManifest(id)

      if (opts.glob) manifest = manifest.filter(e => e.path.includes(opts.glob!.replace(/\*/g, '')))
      console.log(JSON.stringify(manifest, null, 2))
    } catch (e: unknown) {
      console.error('ls failed:', e instanceof Error ? e.message : e)
      process.exit(1)
    }
  })

program
  .command('read <id> <path>')
  .description('Read a file from an open pack')
  .option('--bin', 'output as base64 (for binary files)', false)
  .action((id: string, filePath: string, opts: { bin: boolean }) => {
    try {
      const manifest = packCache.readManifest(id)
      const entry = manifest.find(e => e.path === filePath)

      if (!entry) {
        console.error(`file not found in pack: ${filePath}`)
        process.exit(1)
      }
      const bytes = packCache.readBlob(id, entry.sha256)

      if (opts.bin || entry.type === 'binary') {
        process.stdout.write(Buffer.from(bytes).toString('base64'))
      } else {
        process.stdout.write(new TextDecoder('utf-8').decode(bytes))
      }
    } catch (e: unknown) {
      console.error('read failed:', e instanceof Error ? e.message : e)
      process.exit(1)
    }
  })

program
  .command('search <id> <query>')
  .description('Search across text files in an open pack')
  .option('--regex', 'treat query as a regex', false)
  .option('--max <n>', 'max results', '50')
  .action((id: string, query: string, opts: { regex: boolean; max: string }) => {
    try {
      const manifest = packCache.readManifest(id)
      const max = parseInt(opts.max, 10)
      const re = opts.regex ? new RegExp(query) : null
      const results: { path: string; line: number; snippet: string }[] = []

      for (const entry of manifest) {
        if (entry.type !== 'text') continue
        if (results.length >= max) break
        const text = new TextDecoder('utf-8').decode(packCache.readBlob(id, entry.sha256))
        const lines = text.split('\n')

        for (let i = 0; i < lines.length; i++) {
          if (re ? re.test(lines[i]) : lines[i].includes(query)) {
            results.push({ path: entry.path, line: i + 1, snippet: lines[i].trim().slice(0, 240) })
            if (results.length >= max) break
          }
        }
      }
      console.log(JSON.stringify(results, null, 2))
    } catch (e: unknown) {
      console.error('search failed:', e instanceof Error ? e.message : e)
      process.exit(1)
    }
  })

program
  .command('apply-diff <id> <diff>')
  .description('Apply a diff token PNG to an open pack')
  .option('--key <password>', 'decryption key (if diff is encrypted)')
  .action(async (id: string, diffPath: string, opts: { key?: string }) => {
    try {
      const result = await packCache.applyDiffToPack(id, diffPath, opts.key)

      console.log(JSON.stringify(result, null, 2))
    } catch (e: unknown) {
      console.error('apply-diff failed:', e instanceof Error ? e.message : e)
      process.exit(1)
    }
  })

program
  .command('diff-pack <prev> <next>')
  .description('Produce a re-applyable diff token PNG between two pack PNGs')
  .requiredOption('-o, --out <path>', 'output diff PNG path')
  .option('--algo <name>', 'codec algorithm (default linear)')
  .option('--compression <mode>', 'compression mode (default brotli-6)')
  .option('--key <password>', 'encryption key (applies to both inputs and output)')
  .action(
    async (
      prev: string,
      next: string,
      opts: { out: string; algo?: string; compression?: string; key?: string },
    ) => {
      try {
        const result = await packCache.produceDiffToken(prev, next, opts.out, {
          algo: opts.algo,
          compressionMode: opts.compression,
          key: opts.key,
        })

        console.log(JSON.stringify({ diff: opts.out, ...result }, null, 2))
      } catch (e: unknown) {
        console.error('diff-pack failed:', e instanceof Error ? e.message : e)
        process.exit(1)
      }
    },
  )

program
  .command('close <id>')
  .description('Evict a pack from the local cache')
  .action((id: string) => {
    packCache.close(id)
    console.log(JSON.stringify({ id, closed: true }))
  })

program
  .command('packs')
  .description('List all currently-open packs (or evict stale ones)')
  .option('--prune', 'evict packs older than --max-age days (default 7)', false)
  .option('--max-age <days>', 'age threshold for --prune', '7')
  .action((opts: { prune: boolean; maxAge: string }) => {
    const ids = packCache.listIds()
    const summaries = ids.map(id => {
      try {
        const meta = packCache.readMeta(id)
        const manifest = packCache.readManifest(id)

        return { id, source: meta.source, fileCount: manifest.length, openedAt: meta.openedAt }
      } catch {
        return { id, error: 'corrupted' as const }
      }
    })

    if (opts.prune) {
      const cutoffMs = Date.now() - parseFloat(opts.maxAge) * 86400_000
      const evicted: string[] = []

      for (const s of summaries) {
        if ('error' in s) {
          packCache.close(s.id)
          evicted.push(s.id)
          continue
        }
        if (new Date(s.openedAt!).getTime() < cutoffMs) {
          packCache.close(s.id)
          evicted.push(s.id)
        }
      }
      console.log(JSON.stringify({ evicted, remaining: summaries.length - evicted.length }, null, 2))

      return
    }

    console.log(JSON.stringify(summaries, null, 2))
  })

async function readPasswordFromTTY(prompt: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('--prompt-key requires a TTY'))

      return
    }
    process.stderr.write(prompt)
    process.stdin.setRawMode?.(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    let buffer = ''
    const onData = (ch: string): void => {
      if (ch === '\r' || ch === '\n' || ch === '') {
        process.stdin.setRawMode?.(false)
        process.stdin.pause()
        process.stdin.removeListener('data', onData)
        process.stderr.write('\n')
        resolve(buffer)
      } else if (ch === '') {
        process.stderr.write('\n')
        process.exit(130)
      } else if (ch === '\b') {
        buffer = buffer.slice(0, -1)
      } else {
        buffer += ch
      }
    }

    process.stdin.on('data', onData)
  })
}

program.parseAsync().catch(e => {
  console.error('fatal:', e)
  process.exit(1)
})
