import { RangeFetchDiagram } from '@/components/Rough/RangeFetchDiagram'
import { UseCasePage } from '@/components/UseCasePage/UseCasePage'

const CODE = `// Producer — pack a big JSON tree by path.
//   Each addressable path becomes a named entry in the manifest.
import { encode, NodePackBuilder } from '@tokenpack/node'

const json = (v: unknown) => Buffer.from(JSON.stringify(v))

const builder = new NodePackBuilder()
  .withBuffer('config',          json(config))   //  4 KB
  .withBuffer('users/42',        json(users[42])) // ≈ 1 KB
  .withBuffer('events/page-0',   json(eventsPage(0)))
  .withBuffer('events/page-1',   json(eventsPage(1)))
// …pack as many paths as you want — the manifest scales fine.

const r = await encode(builder, { algo: 'router' })
// → data.png (one image · everything inside)

// Consumer — fetch by path. The runtime issues one Range request.
import { decodeRouter } from '@tokenpack/browser'

const router = await decodeRouter('https://cdn.example.com/data.png')

// Whole config — one HTTP Range request · KB over the wire.
const cfg = await router.json('config')

// Deep path — planner range-fetches the smallest covering slice.
const user42 = await router.json('users/42')

// Lazy event scan — pull pages as the user scrolls.
for (let p = 0; p < 10; p += 1) {
  const page = await router.json(\`events/page-\${p}\`)
  render(page)
}`

export default async function Page() {
  return (
    <UseCasePage
      audience={[
        {
          who: 'Dashboard / analytics builders',
          pain: 'Frontend loads 50 MB of JSON to render one widget — page hangs, parsers stall.',
        },
        {
          who: 'Config-heavy services',
          pain: 'Boot pulls a giant config blob; each service only reads its own slice.',
        },
        {
          who: 'Data viewers / explorers',
          pain: 'User opens a record; client downloads the whole table to find it.',
        },
        {
          who: 'AI agents',
          pain: 'Context bloat — agents read the whole JSON when they only need one path.',
        },
      ]}
      closingBody={
        <>
          <p>
            JSON wasn&apos;t designed for partial reads. The format is one stream of nested tokens;
            you can&apos;t skip ahead without parsing the bytes before. So today the answer is
            &ldquo;build a server endpoint per path,&rdquo; which means schema + routing + auth +
            cache layer just to serve a slice of a static file.
          </p>
          <p>
            A router token treats JSON like a key-addressable object on a CDN. The manifest says
            where each path lives in the Image Token; a single HTTP Range request pulls that slice.
            The static file becomes its own API — no server in the middle.
          </p>
        </>
      }
      closingTitle={
        <>
          Make any JSON file a <span className="italic-display">key-addressable API.</span>
        </>
      }
      code={CODE}
      codeLabel="pack json · range-fetch by path"
      comparisons={[
        {
          title: 'custom server endpoints',
          rows: [
            { label: 'bandwidth', value: 'only the requested path', tone: 'good' },
            { label: 'parser cost', value: 'pre-sliced on server', tone: 'good' },
            { label: 'partial read', value: 'per endpoint, per route', tone: 'neutral' },
            { label: 'caching', value: 'per endpoint · easy to invalidate', tone: 'neutral' },
            { label: 'setup', value: 'API + routing + auth + cache', tone: 'bad' },
          ],
        },
        {
          title: 'TokenPack router JSON',
          rows: [
            { label: 'bandwidth', value: 'one Range request · KB', tone: 'good' },
            { label: 'parser cost', value: 'parse only the slice', tone: 'good' },
            { label: 'partial read', value: 'any manifest path', tone: 'good' },
            { label: 'caching', value: 'sha256 of the token', tone: 'good' },
            { label: 'setup', value: 'static URL · no infra', tone: 'good' },
          ],
        },
      ]}
      heroDiagram={<RangeFetchDiagram />}
      index="08"
      nextUseCase={{
        href: '/use-cases/conversation-export',
        label: 'Conversation export & replay',
      }}
      problem={
        <>
          <p>
            JSON is the lingua franca of structured data, but the format itself
            <strong> doesn&apos;t support partial reads.</strong> The bytes are one stream of nested
            tokens — to find <code>users[42]</code> in a 50 MB users.json, a parser walks every byte
            before it.
          </p>
          <p>The two existing workarounds both lose something:</p>
          <p>
            <strong>Whole-file download.</strong> Cheap to host, brutal on the wire. A dashboard
            widget that needs one row pulls 50 MB. The parser then chokes the main thread for half a
            second. <strong>Per-path server endpoints.</strong> Cheap on the wire, expensive in
            infra. Now you have an API, schema validation, routing, auth, cache invalidation — for
            what was a static file.
          </p>
        </>
      }
      solutionBody={
        <>
          <p>
            <strong>Pack the JSON tree as a router token.</strong> Each top-level key (or deeper
            path you choose) becomes a named entry in the manifest. The Image Token holds the bytes;
            the manifest holds the offsets.
          </p>
          <p>
            <strong>Range-fetch by path.</strong> <code>router.json(&apos;users/42&apos;)</code>{' '}
            issues a single HTTP Range request for the smallest covering slice. The client parses
            only those bytes. The CDN caches the whole token; clients pay the slice cost. A static
            file is now a key-addressable API.
          </p>
          <p>
            <strong>This is what partial fetch means in TokenPack:</strong> the runtime planner
            translates your <em>logical key</em> into a <em>byte range</em>, asks the CDN for those
            bytes, and streams the result.
          </p>
        </>
      }
      solutionSteps={[
        {
          label: 'Pack',
          detail: 'Encode JSON with one entry per addressable path. Manifest lists offsets.',
        },
        { label: 'Publish', detail: 'Drop the Image Token on a CDN. Pin by sha256. Zero server.' },
        {
          label: 'Range-fetch',
          detail: 'router.json(path) → one Range request → byte slice → parse.',
        },
        {
          label: 'Scale',
          detail: 'Add paths without redeploying anything. The manifest IS the schema.',
        },
      ]}
      solutionTitle={
        <>
          JSON as a <span className="italic-display text-tp-muted">key-addressable</span> token.
        </>
      }
      tag="JSON partial fetch"
      title={
        <>
          Pack big JSON.{' '}
          <span className="italic-display text-tp-muted">Fetch only what you need.</span>
        </>
      }
    />
  )
}
