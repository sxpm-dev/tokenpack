import type { Metadata } from 'next'

import { BytesShapeDiagram } from '@/components/BytesShapeDiagram/BytesShapeDiagram'
import { CodeBlock } from '@/components/CodeBlock/CodeBlock'
import { LandingNav } from '@/components/LandingNav/LandingNav'
import { RangeFetchStill } from '@/components/RangeFetchStill/RangeFetchStill'
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
  title: 'Pixel Range Token',
  description:
    'A pixel-range token hides the payload at a known spot inside the image. The pixels are decoration. Readers can fetch just the slice of bytes they need.',
}

const ENCODE_CODE = `import { encode, NodePackBuilder } from '@tokenpack/node'

const r = await encode(
  new NodePackBuilder()
    .withFile('readme.md', '# title')
    .withFile('main.ts', '…'),
  { algo: 'pixel-range' },
)`

const FETCH_CODE = `// Reader knows where the payload sits inside cover.png.
// It asks for just that range — the rest of the image is never downloaded.

const response = await fetch('/post/cover.png', {
  headers: { Range: 'bytes=420-980' },
})

const slice = new Uint8Array(await response.arrayBuffer())
// slice contains exactly the payload bytes you wanted.`

export default function PixelRangeTokenPage() {
  return (
    <div className="min-h-screen bg-tp-bg text-tp-fg">
      <LandingNav />
      <StoryPage>
        <StoryHeader
          lede="A pixel-range token hides the payload at a known spot inside the image. The pixels become decoration — a cover, a thumbnail, anything you want — while the bytes you actually care about live in a stable slot the reader can fetch on its own."
          title="Pixel Range Token"
        />

        <Prose>
          <H2>What it is</H2>
          <p>
            A pixel-range token is built around a single trick: the image you see and the data you
            ship are two different things in the same file. The pixels can show whatever you like —
            a cover image, a placeholder, a generated thumbnail — and the real payload sits at a
            known offset inside the image file, untouched by the rendering layer.
          </p>
          <p>
            That separation is the whole point. Because the payload has a fixed, predictable
            location inside the image, a reader can ask for just those bytes and skip the rest. The
            image looks like an image to anything that does not know better. To a reader that does,
            it is a slice-able container.
          </p>
        </Prose>

        <Prose>
          <H2>Where the bytes live</H2>
          <p>
            The two shapes an Image Token can take, side by side. The pixel-range shape is the one
            on the right: the pixels are something to look at, and the payload lives in its own slot
            inside the file.
          </p>
        </Prose>

        <Diagram>
          <BytesShapeDiagram />
        </Diagram>

        <Prose>
          <p>
            Two things follow from this. First, the cover image can be anything that compresses well
            — a logo, a gradient, an art piece, a low-res preview of the content. Second, the
            payload bytes do not move around: encode the same content twice, the slot lands at the
            same place. Both properties are what make range-fetching possible.
          </p>
        </Prose>

        <Prose>
          <H2>The range-fetch trick</H2>
          <p>
            Once the payload sits at a fixed spot inside the image, you do not have to download the
            whole image to read it. HTTP has had a way to ask for a slice of a file for a long time:
            the <Code>Range</Code> header. Any CDN worth its name honors it. A reader who knows
            where the payload lives sends one request for that exact byte range, and gets back just
            those bytes — not the cover image, not the file headers, just the data.
          </p>
        </Prose>

        <Diagram>
          <RangeFetchStill
            caption={<>one image · one slice · the rest of the file never crosses the wire</>}
            variant="single"
          />
        </Diagram>

        <Prose>
          <p>The call itself is something every HTTP client can already do:</p>
        </Prose>

        <Diagram>
          <CodeBlock code={FETCH_CODE} lang="ts" />
        </Diagram>

        <Prose>
          <p>
            In practice you do not write the <Code>Range</Code> request by hand. The TokenPack
            decoder reads a tiny header from the front of the image to learn where the slot sits,
            then issues the slice request for you. From your code&apos;s perspective, you ask for a
            file and you get bytes back. Under the hood, only the bytes you actually needed travel
            from the server to your machine.
          </p>
        </Prose>

        <Prose>
          <H2>Parallel fetches against the same image</H2>
          <p>
            The bigger payoff shows up when the payload inside the image is itself a pack of several
            files. Each file inside the pack has its own range. To pull four of them, you do not
            make one request after another — you make four range requests in parallel against the
            same image. They hit the same cached file on the CDN, fan out across different bytes,
            and arrive together.
          </p>
        </Prose>

        <Diagram>
          <RangeFetchStill
            caption={<>four slices · four requests · one image · same round-trip</>}
            variant="parallel"
          />
        </Diagram>

        <Prose>
          <p>
            This is what makes pixel-range a good fit for medium-sized bundles. The cover image sits
            in the CDN like any other static asset. Readers who need the whole pack pay the same
            bandwidth as a regular download. Readers who only need one file pay for one file. And
            readers who need a handful of files pay for that handful, all at once, with no extra
            round-trips.
          </p>
        </Prose>

        <Prose>
          <H2>Encoding it</H2>
          <p>
            Encoding a pixel-range token looks the same as encoding any other Image Token. You hand{' '}
            <Code>encode()</Code> your payload — a string, a buffer, or a pack — and pass{' '}
            <Code>{`{ algo: 'pixel-range' }`}</Code> to choose this shape.
          </p>
        </Prose>

        <Diagram>
          <CodeBlock code={ENCODE_CODE} lang="ts" />
        </Diagram>

        <Prose>
          <p>
            The encoder writes the payload into the slot, generates a cover image around it, and
            hands you back a single PNG. That PNG is what you upload, what you serve, what readers
            link to. The slot offsets are deterministic, so any reader with the right decoder can
            find the payload without a separate manifest.
          </p>
        </Prose>

        <Prose>
          <H2>When to reach for it</H2>
          <p>
            Pixel-range tokens are the right call when you want both a presentable image and a
            payload, in the same file, served from one URL. A blog post that ships its source as the
            cover graphic. A generated artifact whose thumbnail is also its archive. A bundle small
            enough that you do not want to split it into many chunks, but large enough that you want
            readers to pull only the parts they need.
          </p>
          <p>
            They are also the right call when partial reads matter. If your readers fetch many small
            files out of one bundle, the parallel range-fetch story is a real win: one cached asset
            on the CDN, many slices pulled in parallel, no per-file requests.
          </p>
          <p>
            Reach for the <PageLink href="/linear-token">linear token</PageLink> when the payload is
            tiny enough that the whole image is cheap to read. Reach for the{' '}
            <PageLink href="/router-tokens">router token</PageLink> when the bundle is large enough
            that it should be spread across several images, with a planner deciding what goes where.
          </p>
        </Prose>
      </StoryPage>
    </div>
  )
}
