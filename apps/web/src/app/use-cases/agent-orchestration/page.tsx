import { AgentOrchestrationDiagram } from '@/components/Rough/AgentOrchestrationDiagram'
import { OrchestrationLegacyDiagram } from '@/components/Rough/OrchestrationLegacyDiagram'
import { ParallelStreamDiagram } from '@/components/Rough/ParallelStreamDiagram'
import { UseCaseStory } from '@/components/UseCaseStory/UseCaseStory'

const CODE = `import { encode, NodePackBuilder, decodeRouter } from '@tokenpack/node'

// 1. Orchestrator encodes the input as a router token.
//    Each slice gets a name — workers will fetch by path.
const input = await encode(
  new NodePackBuilder()
    .withBuffer('slice-a/data.json', sliceA)
    .withBuffer('slice-b/data.json', sliceB)
    .withBuffer('slice-c/data.json', sliceC)
    .withFile('plan.md', plan),
  { algo: 'router' },
)
const inputUrl = await publishToStaticHost(input)

// 2. Dispatch — each worker gets the URL + its slice path.
const results = await Promise.all([
  callAgent('agent-a', { token: inputUrl, slice: 'slice-a/data.json' }),
  callAgent('agent-b', { token: inputUrl, slice: 'slice-b/data.json' }),
  callAgent('agent-c', { token: inputUrl, slice: 'slice-c/data.json' }),
])

// 3. On the worker side — one range-fetch for its slice only.
async function worker(args: { token: string; slice: string }) {
  const router = await decodeRouter(args.token)
  const data = await router.json(args.slice)   // one Range request
  return runAgent(data)
}

// 4. Aggregate results into a new token. Hash it for replay.
const output = await encode(
  new NodePackBuilder()
    .withBuffer('result-a.json', results[0])
    .withBuffer('result-b.json', results[1])
    .withBuffer('result-c.json', results[2]),
  { algo: 'router' },
)`

export default async function Page() {
  return (
    <UseCaseStory
      audience={[
        'Orchestration platforms',
        'Multi-agent SDKs',
        'Parallel eval / batch',
        'Reproducible research',
      ]}
      chapters={[
        {
          n: '01',
          tag: 'The problem',
          heading: (
            <>
              Multi-agent workflows need a{' '}
              <span className="italic-display text-tp-muted">shared artifact</span> — and
              that&apos;s where it gets ugly.
            </>
          ),
          lede: (
            <>
              The shape of the work is simple: <em>fan out a job, gather results</em>. The shape of
              the infrastructure to support it isn&apos;t.
            </>
          ),
          body: (
            <>
              <p>
                As soon as two agents need to read or write the same artifact, you have an
                integration problem. The orchestrator has a payload; N workers want pieces of it; an
                aggregator wants the outputs. The artifact has to travel between processes, hosts,
                accounts — sometimes vendors.
              </p>
              <p>
                What does &ldquo;the artifact&rdquo; mean? A screenshot, a transcript, a tool
                output, a chunk of code, a JSON tree. Binary, structured, sometimes huge. Workers
                shouldn&apos;t need the whole thing to act on a slice.
              </p>
              <p>
                The pain compounds: <strong className="text-tp-fg">partial reads</strong> matter
                (you don&apos;t want every worker fetching 200 MB),{' '}
                <strong className="text-tp-fg">replay</strong> matters (which input produced this
                output?), and <strong className="text-tp-fg">cross-host portability</strong> matters
                (workers can live anywhere — your cluster, a vendor, a researcher&apos;s laptop).
              </p>
            </>
          ),
        },
        {
          n: '02',
          tag: 'How people solve it today',
          heading: (
            <>
              Three workarounds.{' '}
              <span className="italic-display text-tp-muted">All three leak.</span>
            </>
          ),
          lede: (
            <>
              There are three common shapes — JSON over a bus, zip/tar on S3, a shared filesystem.
              Each one fails at a different point.
            </>
          ),
          body: (
            <>
              <p>
                <strong className="text-tp-fg">JSON over a message bus.</strong> Fine for tiny
                coordination state. Falls over the moment binary data, large tool outputs, or
                screenshots need to move. You start base64-encoding things and the bus complains.
              </p>
              <p>
                <strong className="text-tp-fg">Zip / tar.gz on S3 + signed URLs.</strong> Workers
                download the whole archive to read one entry. IAM per worker. Bucket layout becomes
                an undocumented contract — &ldquo;the slice for agent-b is at{' '}
                <code>slice-b/data.json</code>&rdquo; lives in tribal knowledge. Replay means hoping
                the bucket version is still pinned.
              </p>
              <p>
                <strong className="text-tp-fg">Shared filesystem / database.</strong> Works on one
                host. Doesn&apos;t cross org boundaries. Reproducibility is &ldquo;hope the rows are
                still there.&rdquo;
              </p>
              <p>
                None of these support what orchestration actually wants: <em>partial reads</em>,{' '}
                <em>static URLs</em>, <em>a manifest as the contract</em>, and{' '}
                <em>a hash to pin the version</em>.
              </p>
            </>
          ),
          visual: <OrchestrationLegacyDiagram />,
        },
        {
          n: '03',
          tag: 'The token approach',
          heading: (
            <>
              The artifact <span className="italic-display text-tp-muted">is</span> the protocol.
            </>
          ),
          lede: (
            <>
              A router token is an Image Token. The manifest inside it is the slice index. Workers
              range-fetch the slice they care about — one HTTP request, one byte range, no auth, no
              bucket, no schema.
            </>
          ),
          body: (
            <>
              <p>
                The orchestrator encodes the input as a router token: each slice is a named path in
                the manifest. The token is published to any static host — a CDN, an object bucket, a
                Pages site. The orchestrator hands each worker the same URL plus the path it cares
                about.
              </p>
              <p>
                The worker decodes the manifest (a few KB) and issues a single HTTP Range request
                for its slice. The other slices never touch its wire. The token URL is the contract;
                the manifest is the schema; the sha256 of the bytes is the version.
              </p>
              <p>
                Output is the same shape: workers emit small tokens; the aggregator merges them into
                a final token. The whole pipeline lives in static files. No bucket, no IAM, no
                shared state.
              </p>
            </>
          ),
          visual: <AgentOrchestrationDiagram />,
          visualFirst: true,
        },
        {
          n: '04',
          tag: "Why it's better",
          heading: (
            <>
              Range-fetch + manifest <span className="italic-display text-tp-muted">replace</span>{' '}
              bucket + IAM + tribal knowledge.
            </>
          ),
          body: (
            <>
              <p>
                <strong className="text-tp-fg">Partial reads are free.</strong> The token lives on a
                CDN. Workers issue an HTTP Range; only the byte range they need crosses the wire. No
                special server, no API.
              </p>
              <p>
                <strong className="text-tp-fg">Auth disappears.</strong> The URL is the access
                token. No per-worker IAM, no signed URL TTL juggling, no cross-org permission
                tickets.
              </p>
              <p>
                <strong className="text-tp-fg">Replay is by hash.</strong> The orchestrator stores
                the sha256 of the input token. Anyone, anywhere, anytime, can fetch the same bytes
                and reconstruct the run.
              </p>
              <p>
                <strong className="text-tp-fg">The manifest is the schema.</strong> What was a
                bucket layout — &ldquo;always read <code>slice-{'{worker}'}/data.json</code>&rdquo;
                — is now a JSON manifest every worker reads the same way. Adding a worker means
                adding a key; nothing else changes.
              </p>
              <p>
                <strong className="text-tp-fg">Streaming is built in.</strong> When a slice
                doesn&apos;t fit one HTTP request, the runtime fans out parallel range requests
                automatically. Workers don&apos;t orchestrate transport; they just call{' '}
                <code>router.json(path)</code>.
              </p>
            </>
          ),
          visual: <ParallelStreamDiagram />,
        },
        {
          n: '05',
          tag: 'Why it fits',
          heading: (
            <>
              The workflow shape is{' '}
              <span className="italic-display text-tp-muted">fan-out, fan-in</span>.
            </>
          ),
          lede: (
            <>
              This pattern earns its keep when the workflow is genuinely parallel and the artifact
              is the unit of coordination.
            </>
          ),
          body: (
            <>
              <p>
                <strong className="text-tp-fg">Sweet spot:</strong> orchestrator → N workers →
                optional aggregator, where each worker reads a subset of the input and writes a
                subset of the output. Eval suites, batch scoring, parallel code analysis,
                distributed RAG over a large corpus, multi-vendor research pipelines.
              </p>
              <p>
                <strong className="text-tp-fg">Not the right shape:</strong> chatty workflows where
                workers continuously stream small state updates to each other. A token is a static
                artifact, not a live channel — for sub-second back-and-forth, you still want a bus.
                You can mix the two: tokens for the heavy payloads, bus messages for the
                coordination.
              </p>
              <p>
                <strong className="text-tp-fg">Also a fit:</strong> any time you want a researcher
                to be able to{' '}
                <em>re-run the experiment six months later from a single URL plus the seed.</em>
              </p>
            </>
          ),
        },
      ]}
      closing={
        <>
          Orchestration is fundamentally <em>passing artifacts between workers</em>. A router token
          turns that into a static URL and a JSON manifest. Scatter-gather becomes{' '}
          <strong className="text-tp-fg">fetch one path, encode result, return URL</strong> —
          that&apos;s the whole protocol.
        </>
      }
      code={{ code: CODE, label: 'orchestrator · scatter · gather' }}
      index="05"
      nextUseCase={{ href: '/use-cases/vibe-artifacts', label: 'Vibe-coded apps as PNGs' }}
      tag="Multi-agent orchestration"
      tagline={
        <>
          Scatter-gather over tokens, not a shared bucket. The artifact <em>is</em> the protocol;
          the URL is the auth; the hash is the version.
        </>
      }
      title={
        <>
          Coordinate agents{' '}
          <span className="italic-display text-tp-muted">without a shared bucket.</span>
        </>
      }
    />
  )
}
