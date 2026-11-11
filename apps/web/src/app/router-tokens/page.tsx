import type { Metadata } from 'next'

import { BytesShapeDiagram } from '@/components/BytesShapeDiagram/BytesShapeDiagram'
import { CodeBlock } from '@/components/CodeBlock/CodeBlock'
import { EncodeStill } from '@/components/EncodeStill/EncodeStill'
import { LandingNav } from '@/components/LandingNav/LandingNav'
import { RangeFetchTabs } from '@/components/RangeFetchSection/RangeFetchTabs'
import { type FileRegion, PixelToken } from '@/components/Rough/PixelToken'
import {
  Code,
  Diagram,
  H2,
  PageLink,
  Prose,
  StoryHeader,
  StoryPage,
} from '@/components/StoryPage/StoryPage'

export const metadata: Metadata = {
  title: 'Router Token',
  description:
    'A router token spreads many files across several images, with a small index image as the table of contents. Readers ask for one path at a time and only the bytes they need cross the wire.',
}

const ENCODE_CODE = `import { encode, NodePackBuilder } from '@tokenpack/node'

const artifacts = await encode(
  new NodePackBuilder()
    .withFile('index.html', '<!doctype html>…')
    .withFile('app.js', '/* bundle */')
    .withFile('styles.css', 'body{…}')
    .withFile('vendor/react.js', '/* big */'),
  { algo: 'router' },
)
// → router.png + chunk-N.png`

const DECODE_CODE = `import { decodeRouter } from '@tokenpack/browser'

const router = await decodeRouter('/bundle/router.png')

const files = await router.list()              // ['index.html', 'app.js', …]
const app = await router.text('app.js')        // one range request
const html = await router.text('index.html')   // another range request`

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

function RouterVisual() {
  return (
    <div className="flex items-center gap-3">
      <PixelToken files={ROUTER_MANIFEST} seed="router-page-m" size={8} viewSize={70} />
      <span className="font-mono text-[16px] text-tp-soft">→</span>
      <div className="grid grid-cols-3 gap-1.5">
        <PixelToken files={ROUTER_CHUNK_0} seed="router-page-c0" size={10} viewSize={70} />
        <PixelToken files={ROUTER_CHUNK_1} seed="router-page-c1" size={10} viewSize={70} />
        <PixelToken files={ROUTER_CHUNK_2} seed="router-page-c2" size={10} viewSize={70} />
      </div>
    </div>
  )
}

export default function RouterTokensPage() {
  return (
    <div className="min-h-screen bg-tp-bg text-tp-fg">
      <LandingNav />
      <StoryPage>
        <StoryHeader
          lede="A router token is a small static file server packed into images. One tiny image acts as the table of contents; the rest hold the file data. Readers ask for one path at a time, and only the bytes they need ever cross the wire."
          title="Router Token"
        />

        <Prose>
          <H2>What it is</H2>
          <p>
            A router token is what you reach for when one image is no longer the right shape. You
            have many files — a generated app, a documentation set, a snapshot of a codebase — and
            you want a reader to fetch them as they go, not all at once. A router token gives you
            exactly that: a handful of images that, together, behave like a static mini file server.
          </p>
          <p>
            One of those images is tiny. It is the index — the table of contents. It lists every
            path inside the bundle and, for each path, the exact image and byte range where its
            content lives. The other images are the chunks: they hold the actual file bytes, grouped
            by the encoder so that things often read together end up close together.
          </p>
          <p>
            When a reader wants a file, it asks the router for that path. The router looks the path
            up in the index, finds out which chunk holds it and at what offset, and pulls just that
            slice with an HTTP range request. The reader writes ordinary code; the network never
            moves a byte more than it has to.
          </p>
        </Prose>

        <Prose>
          <H2>Where the bytes live</H2>
          <p>
            Router tokens build on the same idea as pixel-range tokens. The payload sits at known
            offsets inside the image; the pixels are decoration. The router adds an index on top so
            many files in many images can be addressed by path.
          </p>
        </Prose>

        <Diagram>
          <BytesShapeDiagram />
        </Diagram>

        <Prose>
          <p>
            Two shapes underneath, one mechanism on top. Because every file in a router bundle is
            ultimately a byte range inside one of the chunk images, every read becomes a single
            range request, no matter how many files you have or how big the bundle gets.
          </p>
        </Prose>

        <Prose>
          <H2>Encoding it</H2>
          <p>
            Encoding a router token looks like encoding any other pack. You hand{' '}
            <Code>encode()</Code> a builder with the files you want to ship and ask for the router
            shape. The encoder runs a small planner: tiny files in the same directory get clustered
            into a shared chunk, medium files get their own, large files get split across chunks so
            the reader can pull them in parallel.
          </p>
        </Prose>

        <Diagram>
          <EncodeStill
            caption={
              <>
                <span className="text-tp-fg">router.png + chunk-0..2.png</span> · index points at 3
                chunks · range-fetchable
              </>
            }
            code={ENCODE_CODE}
            footnote={
              <>
                Same API in <span className="text-tp-fg">@tokenpack/node</span> and{' '}
                <span className="text-tp-fg">@tokenpack/browser</span>.
              </>
            }
            visual={<RouterVisual />}
          />
        </Diagram>

        <Prose>
          <p>
            The output is a small set of images: one router image and a handful of chunk images. You
            upload all of them to the same place, side by side. Readers only need the URL of the
            router image — it knows where its chunks live relative to itself.
          </p>
        </Prose>

        <Prose>
          <H2>Lazy-load by path</H2>
          <p>
            This is where the shape pays for itself. The router exposes a few simple calls —{' '}
            <Code>list()</Code>, <Code>text(path)</Code>, <Code>json(path)</Code> — and underneath
            each one turns into the smallest set of range requests that can answer the question.
            Small files hit one range in one chunk. Big files that the planner split across chunks
            come back as parallel ranges and get stitched together for you. Calls for several files
            at once batch into a single multi-range request when the server supports it.
          </p>
        </Prose>

        <Diagram>
          <RangeFetchTabs />
        </Diagram>

        <Prose>
          <p>
            The reader never thinks about chunks, ranges, or planning. It asks for a path; it gets
            bytes. The shape of the network traffic adapts to the shape of the request.
          </p>
        </Prose>

        <Prose>
          <H2>Decoding and reading</H2>
          <p>
            <Code>decodeRouter()</Code> takes the URL of the router image and gives you back a
            router object. From there the API is small enough to hold in your head: list the paths,
            read one as text or JSON or bytes.
          </p>
        </Prose>

        <Diagram>
          <CodeBlock code={DECODE_CODE} lang="ts" />
        </Diagram>

        <Prose>
          <p>
            Behind those calls the router fetches its index from the router image, caches it for the
            lifetime of the page, and turns every subsequent <Code>text</Code> or <Code>json</Code>{' '}
            call into the exact range request needed for that path. Open the network panel and you
            will see one request per file you actually asked for — nothing else.
          </p>
        </Prose>

        <Prose>
          <H2>When to reach for it</H2>
          <p>
            Router tokens are the right call when the bundle is too large to ship in one image, or
            when the reader is going to consume only a fraction of it. A built web app whose
            visitors load one route at a time. A documentation set the reader navigates one page at
            a time. A snapshot of a codebase an agent searches without reading every file. A
            generated UI an LLM materializes piece by piece.
          </p>
          <p>
            They also fit the case where you want to deploy something static, on any CDN, without
            running a server. The bundle is just files. The reader is just an HTTP client doing
            range requests. There is no API to host, no per-file URL to manage, no manifest endpoint
            to keep in sync — the router image is the manifest, and it lives next to its data.
          </p>
          <p>
            Reach for the <PageLink href="/linear-token">linear token</PageLink> when the payload is
            small enough to live in one image and the reader is going to consume the whole thing.
            Reach for the <PageLink href="/pixel-range-token">pixel-range token</PageLink> when one
            image is still the right shape but readers should be able to pull slices of it.
          </p>
        </Prose>
      </StoryPage>
    </div>
  )
}
