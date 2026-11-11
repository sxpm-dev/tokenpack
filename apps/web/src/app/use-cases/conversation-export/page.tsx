import { UseCasePage } from '@/components/UseCasePage/UseCasePage'

const CODE = `// Export — a chat session with attachments to one Image Token
import { encode, NodePackBuilder } from '@tokenpack/node'

const transcript = JSON.stringify(session.messages, null, 2)

const artifacts = await encode(
  new NodePackBuilder()
    .withFile('transcript.json', transcript)
    .withFile('metadata.json', JSON.stringify(session.metadata))
    .withBuffer('attachments/screenshot.png', screenshotBytes)
    .withBuffer('attachments/diagram.svg',     diagramBytes)
    .withFile('tools/output-1.json', toolCallOutput),
  { algo: 'router', name: \`session-\${session.id}\` },
)

// Import — re-hydrate the session on another machine
import { decodeRouter } from '@tokenpack/node'

const router = await decodeRouter('https://share.example.com/session-abc.png')
const transcript = JSON.parse(await router.text('transcript.json'))
const metadata   = JSON.parse(await router.text('metadata.json'))
// Attachments stay lazy — only fetch what the UI renders.`

export default async function Page() {
  return (
    <UseCasePage
      audience={[
        {
          who: 'Product / DevRel',
          pain: 'Sharing reproducible bug repros with screenshots, tool outputs, transcripts.',
        },
        {
          who: 'Researchers',
          pain: 'Linking model behavior to specific multi-modal session state.',
        },
        {
          who: 'Customer support',
          pain: 'Attaching "here is the session" to a ticket without losing fidelity.',
        },
        {
          who: 'AI app builders',
          pain: 'Letting users export + replay full conversations across devices.',
        },
      ]}
      closingBody={
        <>
          <p>
            JSON exports lose attachments. Zip exports don&apos;t travel through chat channels. A
            TokenPack <strong>does both</strong> — it&apos;s a single image that, when opened by an
            aware runtime, becomes a fully re-hydratable session including screenshots, tool
            outputs, and traces.
          </p>
          <p>
            The host runtime decides what to load eagerly (the transcript) and what stays lazy (the
            8 MB of screenshots).
          </p>
        </>
      }
      closingTitle={
        <>
          A session you can{' '}
          <span className="italic-display">paste into a chat to replay later.</span>
        </>
      }
      code={CODE}
      codeLabel="export + re-hydrate"
      comparisons={[
        {
          title: 'JSON export',
          rows: [
            { label: 'transcript', value: 'yes', tone: 'good' },
            { label: 'attachments', value: 'base64-inflated or external links', tone: 'bad' },
            { label: 'tool outputs', value: 'truncated or stringified', tone: 'bad' },
            { label: 'shareable', value: 'attach .json file', tone: 'neutral' },
            { label: 'lazy load', value: 'no — re-parse whole thing', tone: 'bad' },
          ],
        },
        {
          title: 'router Image Token export',
          rows: [
            { label: 'transcript', value: 'yes — inside the manifest', tone: 'good' },
            { label: 'attachments', value: 'binary, lossless, lazy', tone: 'good' },
            { label: 'tool outputs', value: 'preserved as JSON files', tone: 'good' },
            { label: 'shareable', value: 'drop the Image Token anywhere', tone: 'good' },
            { label: 'lazy load', value: 'fetch each key on demand', tone: 'good' },
          ],
        },
      ]}
      index="05"
      nextUseCase={{ href: '/use-cases/lightweight-rag', label: 'Lightweight RAG' }}
      problem={
        <>
          <p>
            Modern AI conversations aren&apos;t just text. They include uploaded screenshots,
            generated images, tool-call outputs, diagrams, and (sometimes) traces. Exporting a
            session into a single artifact that someone else can re-import is harder than it should
            be.
          </p>
          <p>
            <strong>JSON exports</strong> base64-inflate attachments or drop them entirely.{' '}
            <strong>Zip exports</strong> work — but they don&apos;t travel through chat channels,
            support previews, or stream. <strong>&ldquo;Share link&rdquo;</strong> features tie the
            session to a vendor; users want a portable, offline-capable artifact.
          </p>
        </>
      }
      solutionBody={
        <>
          <p>
            A router token captures the entire session: transcript, attachments, tool outputs,
            metadata. Transcript loads eagerly (small JSON). Attachments stay lazy until the
            renderer asks for them. The artifact is one Image Token you paste into chat, attach to a
            ticket, or drop in a shared drive.
          </p>
          <p>
            <strong>The format is the medium.</strong> Image-handling pipes accept it everywhere.
            Storage costs are the same as the underlying compressed bytes. Re-hydration is one call.
          </p>
        </>
      }
      solutionSteps={[
        {
          label: 'Capture',
          detail: 'Build the bundle: transcript + attachments + tool outputs + metadata.',
        },
        {
          label: 'Encode',
          detail: 'Wrap into a router token. The manifest names every component.',
        },
        { label: 'Share', detail: 'Drop the Image Token into chat, email, or a storage URL.' },
        {
          label: 'Replay',
          detail: 'Receiver decodes the manifest; UI lazy-loads attachments as needed.',
        },
      ]}
      solutionTitle={
        <>
          Transcript + attachments + tool outputs ={' '}
          <span className="italic-display text-tp-muted">one Image Token you can paste.</span>
        </>
      }
      tag="Session export"
      title={
        <>
          Conversation export{' '}
          <span className="italic-display text-tp-muted">with attachments,</span> as one Image
          Token.
        </>
      }
    />
  )
}
