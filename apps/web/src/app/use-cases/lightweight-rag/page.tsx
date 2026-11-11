import { UseCasePage } from '@/components/UseCasePage/UseCasePage'

const CODE = `// Pack the docs site as a router token
import { encode, NodePackBuilder } from '@tokenpack/node'

const artifacts = await encode(
  new NodePackBuilder().withFileSystem('./docs', { include: ['**/*.md'] }),
  { algo: 'router', name: 'docs' },
)

// Retrieval — filename / glob, no vector DB
import { decodeRouter } from '@tokenpack/node'

const router = await decodeRouter('https://cdn.example.com/docs/router.png')

// "Give me everything under guides/"
const guides = (await router.list()).filter(p => p.startsWith('guides/'))
for (const p of guides) {
  const text = await router.text(p)         // one HTTP Range per file
  await agent.context.add(p, text)
}

// "Give me the API reference for encode"
const ref = await router.text('reference/encode.md')`

export default async function Page() {
  return (
    <UseCasePage
      audience={[
        {
          who: 'Docs / SDK teams',
          pain: "Embedding their docs in someone else's agent without standing up a retrieval API.",
        },
        {
          who: 'Tool authors',
          pain: 'Bundling tool reference material with the binary in a single ship.',
        },
        {
          who: 'Agent builders',
          pain: 'Filename-based retrieval is enough for 80% of cases — the rest of vector DB is overhead.',
        },
        {
          who: 'Privacy-aware deployments',
          pain: 'Avoiding sending raw content to a hosted embeddings service.',
        },
      ]}
      closingBody={
        <>
          <p>
            Real retrieval is split into two problems: <em>find the relevant document</em>
            and <em>load its contents</em>. Vector DBs do the first well. Filename retrieval does
            the first <strong>well enough</strong> for many real workloads (docs sites, tool
            references, codebases, API specs). For the second problem, TokenPack is already optimal:
            range-fetch the bytes you need.
          </p>
          <p>
            Use TokenPack for the second; layer your own keyword or filename heuristics for the
            first. Reach for a real vector DB only when semantic similarity over millions of
            paragraphs is the actual need.
          </p>
        </>
      }
      closingTitle={
        <>
          The manifest <span className="italic-display">is</span> your index.
        </>
      }
      code={CODE}
      codeLabel="docs as router · filename retrieval"
      comparisons={[
        {
          title: 'Vector DB',
          rows: [
            { label: 'setup', value: 'embed pipeline + storage + index', tone: 'bad' },
            { label: 'cost per query', value: 'embedding + similarity', tone: 'neutral' },
            { label: 'updates', value: 're-embed on every edit', tone: 'bad' },
            { label: 'host', value: 'managed service or self-host', tone: 'neutral' },
            { label: 'best at', value: 'semantic similarity over many chunks', tone: 'good' },
          ],
        },
        {
          title: 'router Image Token (filename retrieval)',
          rows: [
            { label: 'setup', value: 'one encode pass', tone: 'good' },
            { label: 'cost per query', value: 'manifest lookup (free) + HTTP Range', tone: 'good' },
            { label: 'updates', value: 're-encode · ship diff tokens', tone: 'good' },
            { label: 'host', value: 'any static CDN', tone: 'good' },
            { label: 'best at', value: 'filename / glob / structured lookup', tone: 'good' },
          ],
        },
      ]}
      index="06"
      nextUseCase={{ href: '/use-cases/mobile-agents', label: 'On-device / mobile agents' }}
      problem={
        <>
          <p>
            Retrieval-augmented generation pipelines default to vector DBs even when the retrieval
            question is mundane: <em>&ldquo;give me the file at this path&rdquo;</em> or{' '}
            <em>&ldquo;give me everything under guides/&rdquo;</em>. That&apos;s filename retrieval,
            not semantic search.
          </p>
          <p>
            For filename-shaped retrieval, the vector DB is overhead: embedding pipeline, storage,
            query infra, re-embed on every edit. The real need is{' '}
            <em>fast random access into a known document set</em>. The right primitive is an index —
            and a router-token manifest already <strong>is</strong> the index.
          </p>
        </>
      }
      solutionBody={
        <>
          <p>
            Pack your docs site, your tool reference, or your code-as-context into a router token.
            The manifest indexes every file by path. Retrieval is{' '}
            <strong>`router.text(path)`</strong> — one HTTP Range request.
          </p>
          <p>
            For semantic queries, layer a tiny BM25 index on top (manifest paths + first 200 tokens
            of each file). For everything else, the manifest is enough. Skip the embeddings, the
            vector store, and the re-embed pipeline.
          </p>
        </>
      }
      solutionSteps={[
        {
          label: 'Pack',
          detail: 'Encode the document set as a router token. Manifest names every file.',
        },
        { label: 'Distribute', detail: 'Static host. Versioned by hash. Mirror anywhere.' },
        {
          label: 'Query',
          detail: 'Filename / glob / prefix — done with the manifest. No embed step.',
        },
        {
          label: 'Fetch',
          detail: 'Range-fetch only the documents the agent actually loads into context.',
        },
      ]}
      solutionTitle={
        <>
          For filename-shaped retrieval,{' '}
          <span className="italic-display text-tp-muted">the manifest is the index.</span>
        </>
      }
      tag="RAG"
      title={
        <>
          Filename retrieval{' '}
          <span className="italic-display text-tp-muted">without a vector DB.</span>
        </>
      }
    />
  )
}
