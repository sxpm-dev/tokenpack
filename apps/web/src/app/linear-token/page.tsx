import type { Metadata } from 'next'

import { BytesShapeDiagram } from '@/components/BytesShapeDiagram/BytesShapeDiagram'
import { CodeBlock } from '@/components/CodeBlock/CodeBlock'
import { EncodeStill } from '@/components/EncodeStill/EncodeStill'
import { LandingNav } from '@/components/LandingNav/LandingNav'
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
  title: 'Linear Token',
  description:
    'A linear token is the simplest shape: take one payload, compress it, write it into a single image. The image is the data.',
}

const ENCODE_CODE = `import { encode, NodePackBuilder } from '@tokenpack/node'

const r = await encode(
  new NodePackBuilder()
    .withFile('readme.md', '# title')
    .withFile('main.ts', '…'),
)`

const DECODE_CODE = `import { decode } from '@tokenpack/browser'

const pack = await decode('/post/token.png')

const list = await pack.list()        // ['readme.md', 'main.ts']
const readme = await pack.text('readme.md')`

const ENCODE_FILES: FileRegion[] = [
  { x: 0, y: 0, width: 0.6, height: 0.35, role: 'file-a', label: 'readme.md' },
  { x: 0.6, y: 0, width: 0.4, height: 0.35, role: 'file-b', label: 'main.ts' },
  { x: 0, y: 0.35, width: 1, height: 0.65, role: 'file-c', label: 'src/app.ts' },
]

export default function LinearTokenPage() {
  return (
    <div className="min-h-screen bg-tp-bg text-tp-fg">
      <LandingNav />
      <StoryPage>
        <StoryHeader
          lede="A linear token is the simplest shape an Image Token can take. One payload goes in, one image comes out, one call reads it back. The image is the data."
          title="Linear Token"
        />

        <Prose>
          <H2>What it is</H2>
          <p>
            Think of a linear token as a sealed envelope for a single piece of data. The thing
            inside can be a short string, a JSON blob, a small file, or a pack of several files
            treated as one bundle. Whatever you put in, the encoder compresses it and paints the
            result into a single image.
          </p>
          <p>
            That image is now portable. It travels through chat threads, CDNs, image proxies, file
            storage — anywhere bytes flow as an image. When somebody on the other side decodes it,
            they get the exact same payload back. Nothing is hidden in headers or side metadata; the
            image <em>is</em> the data.
          </p>
          <p>
            It is called linear because the bytes are read straight through, beginning to end. There
            is no index, no path lookup, no per-file fetch plan. The shape is the simplest possible,
            and that simplicity is the whole point.
          </p>
        </Prose>

        <Prose>
          <H2>Where the bytes live</H2>
          <p>
            All Image Tokens fall into one of two shapes. A linear token uses the first one: every
            byte of the compressed payload is written directly into the pixel data of the image.
            Read the pixels, you read the bytes.
          </p>
        </Prose>

        <Diagram>
          <BytesShapeDiagram />
        </Diagram>

        <Prose>
          <p>
            The trade-off is the flip side of the simplicity. Because the bytes are spread across
            the whole image, you cannot ask for a slice of them. To get anything out, the reader has
            to fetch and decode the whole token. For small payloads that is exactly what you want.
            For bigger ones, the pixel-range and router shapes give you a way to grab just the part
            you need.
          </p>
        </Prose>

        <Prose>
          <H2>Encoding it</H2>
          <p>
            <Code>encode()</Code> takes a string, a buffer, or a pack of files and returns an Image
            Token. Linear is the default shape, so you do not need to pass an algorithm option —
            call <Code>encode</Code> with your input and you have an image to ship.
          </p>
        </Prose>

        <Diagram>
          <EncodeStill
            caption={
              <>
                <span className="text-tp-fg">token.png</span> · 1 pack · 3 files
              </>
            }
            code={ENCODE_CODE}
            footnote={
              <>
                Same API in <span className="text-tp-fg">@tokenpack/node</span> and{' '}
                <span className="text-tp-fg">@tokenpack/browser</span>.
              </>
            }
            visual={
              <PixelToken files={ENCODE_FILES} seed="linear-encode" size={14} viewSize={240} />
            }
          />
        </Diagram>

        <Prose>
          <p>
            For the smallest case you can pass a string directly:{' '}
            <Code>encode(&apos;Hello, world&apos;)</Code> gives you back an image whose pixels are a
            few bytes of deflate. For multi-file payloads, use <Code>NodePackBuilder</Code> to add
            files by path and content, then hand the builder to <Code>encode</Code> just the same
            way.
          </p>
        </Prose>

        <Prose>
          <H2>Decoding it</H2>
          <p>
            On the other side, <Code>decode()</Code> turns the image back into a pack. It accepts
            almost anything you can hand it — a URL, a Blob, a Buffer, an <Code>ImageBitmap</Code>,
            even an <Code>&lt;img&gt;</Code> already in the page.
          </p>
        </Prose>

        <Diagram>
          <CodeBlock code={DECODE_CODE} lang="ts" />
        </Diagram>

        <Prose>
          <p>
            From there the pack exposes a small read API: <Code>list()</Code> tells you what is
            inside, <Code>text(path)</Code> and <Code>json(path)</Code> read individual files,{' '}
            <Code>bytes(path)</Code> hands you raw bytes for the binary cases. Same calls whether
            the token is one string or a bundle of files.
          </p>
        </Prose>

        <Prose>
          <H2>When to reach for it</H2>
          <p>
            Linear tokens are the right call when the payload is small enough that the reader is
            going to consume the whole thing anyway. A prompt, a saved conversation, a snippet of
            JSON, a small batch of generated files, a single image attached to a comment — all good
            fits.
          </p>
          <p>
            They are also the right call when the destination cannot do partial reads. If your token
            has to land in a chat thread, get re-uploaded by humans, or pass through caching layers
            that do not honor HTTP Range, the linear shape is the only one that gives you the same
            answer everywhere.
          </p>
          <p>
            Reach for a different shape when the payload grows past roughly a megabyte, or when the
            reader needs just one file out of many. The{' '}
            <PageLink href="/pixel-range-token">pixel-range token</PageLink> lets a reader fetch a
            slice of the bytes without downloading the whole image. The{' '}
            <PageLink href="/router-tokens">router token</PageLink> spreads many files across
            several images and lets the reader ask for one path at a time.
          </p>
        </Prose>
      </StoryPage>
    </div>
  )
}
