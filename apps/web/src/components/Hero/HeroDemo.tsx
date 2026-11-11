import { CodeBlock } from '@/components/CodeBlock/CodeBlock'
import { type FileRegion, PixelToken } from '@/components/Rough/PixelToken'

import { HeroDemoClient, type HeroDemoTab } from './HeroDemoClient'

const SIMPLE_CODE = `import { encode } from '@tokenpack/node'

const r = await encode('Hello, world')
// r.bytes is an Image Token.`

const PACK_CODE = `import { encode, NodePackBuilder } from '@tokenpack/node'

const r = await encode(
  new NodePackBuilder()
    .withFile('readme.md', '# title')
    .withFile('main.ts', '…'),
)`

const ROUTER_CODE = `import { encode, NodePackBuilder } from '@tokenpack/node'

const artifacts = await encode(
  new NodePackBuilder()
    .withFile('index.html', '<!doctype html>…')
    .withFile('app.js', '/* bundle */')
    .withFile('styles.css', 'body{…}')
    .withFile('vendor/react.js', '/* big */'),
  { algo: 'router' },
)
// → router.png + chunk-N.png`

// One small region in a tiny grid — communicates "tiny payload".
const SIMPLE_FILES: FileRegion[] = [
  { x: 0, y: 0, width: 1, height: 1, role: 'file-a', label: '"Hello, world"' },
]

const PACK_FILES: FileRegion[] = [
  { x: 0, y: 0, width: 0.6, height: 0.35, role: 'file-a', label: 'readme.md' },
  { x: 0.6, y: 0, width: 0.4, height: 0.35, role: 'file-b', label: 'main.ts' },
  { x: 0, y: 0.35, width: 1, height: 0.65, role: 'file-c', label: 'src/app.ts' },
]

const ROUTER_MANIFEST: FileRegion[] = [{ x: 0, y: 0, width: 1, height: 1, role: 'file-a' }]

const ROUTER_CHUNK_0: FileRegion[] = [
  { x: 0, y: 0, width: 0.6, height: 0.5, role: 'file-a' },
  { x: 0.6, y: 0, width: 0.4, height: 0.5, role: 'file-b' },
  { x: 0, y: 0.5, width: 1, height: 0.5, role: 'file-c' },
]
const ROUTER_CHUNK_1: FileRegion[] = [{ x: 0, y: 0, width: 1, height: 1, role: 'file-d' }]
const ROUTER_CHUNK_2: FileRegion[] = Array.from({ length: 6 }, (_, i) => ({
  x: (i % 3) / 3 + 0.02,
  y: Math.floor(i / 3) / 2 + 0.02,
  width: 1 / 3 - 0.04,
  height: 1 / 2 - 0.04,
  role: (['file-e', 'file-f', 'file-a', 'file-b', 'file-c', 'file-d'] as const)[i],
}))

export async function HeroDemo() {
  const tabs: HeroDemoTab[] = [
    {
      id: 'simple',
      label: 'string',
      description: (
        <>
          Wrap any string in a token. <strong className="text-tp-fg">encode(value)</strong> returns
          an Image Token whose pixel data <em>is</em> the deflate-compressed payload — no headers,
          no chunks, no manifest. Perfect for a single message, a prompt, or a tiny JSON blob.
        </>
      ),
      codeNode: <CodeBlock code={SIMPLE_CODE} lang="ts" />,
      // Tiny payload → a 3-pixel strip. Visually emphasises "almost no bytes".
      visual: (
        <div className="flex flex-col items-center gap-3">
          <PixelToken files={SIMPLE_FILES} height={1} seed="hero-simple" viewSize={180} width={3} />
          <div className="text-center">
            <div className="font-mono text-[11px] text-tp-fg">token.png</div>
            <div className="font-mono text-[10px] text-tp-soft">12 B in · 78 B image</div>
          </div>
        </div>
      ),
    },
    {
      id: 'pack',
      label: 'pack',
      description: (
        <>
          Bundle multiple files into one Image Token with{' '}
          <strong className="text-tp-fg">PackBuilder</strong>. Add files by path + content; the
          encoder lays them out and emits a single self-contained token. The receiver calls{' '}
          <code className="font-mono text-tp-fg">pack.text(path)</code> /
          <code className="font-mono text-tp-fg">pack.json(path)</code> to read them back.
        </>
      ),
      codeNode: <CodeBlock code={PACK_CODE} lang="ts" />,
      // Pack of files → mid-size grid.
      visual: (
        <div className="flex flex-col items-center gap-3">
          <PixelToken files={PACK_FILES} seed="hero-pack" size={14} viewSize={260} />
          <div className="text-center">
            <div className="font-mono text-[11px] text-tp-fg">token.png</div>
            <div className="font-mono text-[10px] text-tp-soft">1 pack · 3 files</div>
          </div>
        </div>
      ),
    },
    {
      id: 'router',
      label: 'router',
      description: (
        <>
          Pass <code className="font-mono text-tp-fg">{`{ algo: 'router' }`}</code> to encode a
          router token plus chunk images. The router exposes one API for{' '}
          <code className="font-mono text-tp-fg">list()</code> and per-file reads; the client uses
          HTTP Range requests to fetch only the byte ranges for the requested file or files, without
          downloading every chunk.
        </>
      ),
      codeNode: <CodeBlock code={ROUTER_CODE} lang="ts" />,
      // Router → tiny manifest + multiple chunks.
      visual: (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <PixelToken files={ROUTER_MANIFEST} seed="hero-router-m" size={8} viewSize={70} />
            <span className="font-mono text-[16px] text-tp-soft">→</span>
            <div className="grid grid-cols-3 gap-1.5">
              <PixelToken files={ROUTER_CHUNK_0} seed="hero-router-c0" size={10} viewSize={70} />
              <PixelToken files={ROUTER_CHUNK_1} seed="hero-router-c1" size={10} viewSize={70} />
              <PixelToken files={ROUTER_CHUNK_2} seed="hero-router-c2" size={10} viewSize={70} />
            </div>
          </div>
          <div className="text-center">
            <div className="font-mono text-[11px] text-tp-fg">router.png + chunk-0..2.png</div>
            <div className="font-mono text-[10px] text-tp-soft">
              manifest indexes 3 chunks · range-fetchable
            </div>
          </div>
        </div>
      ),
    },
  ]

  return <HeroDemoClient tabs={tabs} />
}
