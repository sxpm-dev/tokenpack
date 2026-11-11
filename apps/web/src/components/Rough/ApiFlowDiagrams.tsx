import { generateRoughPaths } from './rough-paths'

const FLOW_W = 940
const ROW_PAD_Y = 24

// Column anchors
const CALL_X = 20
const CALL_W = 230
const REQ_X = 320
const REQ_W = 360
const RESP_X = 730
const RESP_W = 190

interface Request {
  http: string
  /** Optional note shown below the http line, e.g. "manifest only" */
  note?: string
}

interface ResponseShape {
  kind: 'json' | 'string' | 'map' | 'side-effect' | 'none'
  label: string
  /** Short sample / preview, max 3 lines */
  sample?: string[]
}

export interface Flow {
  /** Section number like "01". */
  n: string
  /** Method name with parens, e.g. "list()". */
  title: string
  /** Plain-english summary, one short sentence. */
  blurb: string
  /** Code line showing the call, e.g. "await router.list()". */
  call: string
  requests: Request[]
  response: ResponseShape
}

export const FLOWS: Flow[] = [
  {
    n: '01',
    title: 'list()',
    blurb:
      'Read file paths from the manifest. No chunks fetched — the manifest is in memory after decodeRouter().',
    call: 'await router.list()',
    requests: [{ http: '∅', note: 'no HTTP — manifest already in memory' }],
    response: {
      kind: 'json',
      label: 'FileEntry[]',
      sample: [
        "[{ path: 'app.js', size: 184320 },",
        " { path: 'styles.css', size: 24576 },",
        ' …]',
      ],
    },
  },
  {
    n: '02',
    title: "json('config.json')",
    blurb:
      'One file that fits in one chunk. The runtime translates the path into a byte range and issues a single Range request.',
    call: "await router.json('config.json')",
    requests: [{ http: 'GET chunk-0.png   Range: bytes=B-C', note: 'one chunk · one slice' }],
    response: {
      kind: 'json',
      label: 'parsed JSON',
      sample: ['{ theme: "dark",', '  api: "https://…",', '  flags: { … } }'],
    },
  },
  {
    n: '03',
    title: "text('app.js')",
    blurb:
      'A medium file lives entirely inside one chunk. Single Range request; the rest of the chunk never crosses the wire.',
    call: "await router.text('app.js')",
    requests: [{ http: 'GET chunk-1.png   Range: bytes=B-C', note: 'one chunk · one slice' }],
    response: {
      kind: 'string',
      label: 'string · 180 KB',
      sample: ["\"import React from 'react';\\n", ' export function App() { … }"'],
    },
  },
  {
    n: '04',
    title: "text('vendor.js') · split file",
    blurb:
      'A big file was split across N chunks at encode time. The planner fans out N parallel Range requests; the decoder reassembles by fileOffset.',
    call: "await router.text('vendor/react.js')",
    requests: [
      { http: 'GET chunk-2.png   Range: bytes=0-1M' },
      { http: 'GET chunk-3.png   Range: bytes=0-1M' },
      {
        http: 'GET chunk-4.png   Range: bytes=0-300K',
        note: '3 parallel · reassembled by fileOffset',
      },
    ],
    response: {
      kind: 'string',
      label: 'string · 2.3 MB',
      sample: ['"…the full concatenated', ' bundle, in source order"'],
    },
  },
  {
    n: '05',
    title: "text(['a', 'b']) · same chunk",
    blurb:
      'When the requested files all live in the same chunk, the runtime merges them into one HTTP multi-range request — one round-trip, several byte ranges.',
    call: "await router.text(['app.js', 'styles.css'])",
    requests: [{ http: 'GET chunk-1.png   Range: bytes=B-C, D-E', note: '1 request · 2 ranges' }],
    response: {
      kind: 'map',
      label: 'Map<string, string>',
      sample: ["Map { 'app.js' => '…',", "      'styles.css' => '…' }"],
    },
  },
  {
    n: '06',
    title: "text(['a', 'b']) · cross-chunk",
    blurb:
      'When the requested files live in different chunks, the runtime issues one Range request per chunk in parallel.',
    call: "await router.text(['app.js', 'big.json'])",
    requests: [
      { http: 'GET chunk-1.png   Range: bytes=B-C' },
      { http: 'GET chunk-7.png   Range: bytes=F-G', note: '2 chunks · 2 parallel requests' },
    ],
    response: {
      kind: 'map',
      label: 'Map<string, string>',
      sample: ["Map { 'app.js' => '…',", "      'big.json' => '…' }"],
    },
  },
  {
    n: '07',
    title: "materialize(['app.js', 'styles.css'])",
    blurb:
      'Fetches the files like text(), then injects CSS into <head> and executes JS in <body>. The return value is a side effect on your DOM.',
    call: "await router.materialize(['app.js', 'styles.css'])",
    requests: [{ http: 'GET chunk-1.png   Range: bytes=B-C, D-E', note: '1 request · 2 ranges' }],
    response: {
      kind: 'side-effect',
      label: 'side effect · DOM',
      sample: ['<style>…styles.css…</style>', 'executes app.js in <body>'],
    },
  },
]

const strokeForRole = (role: string | null): string => {
  if (role === 'accent') return 'var(--accent)'
  if (role === 'muted') return 'var(--soft)'

  return 'var(--fg)'
}

function splitCall(call: string) {
  const routerPrefix = 'await router.'

  if (!call.startsWith(routerPrefix)) return [call]

  return ['await router', `.${call.slice(routerPrefix.length)}`]
}

interface FlowSvgProps {
  flow: Flow
}

export function FlowSvg({ flow }: FlowSvgProps) {
  const reqH = 38
  const reqGap = 8
  const reqCount = flow.requests.length
  const reqStackH = reqCount * reqH + (reqCount - 1) * reqGap
  const minH = 120
  const minPad = 24
  const innerH = Math.max(minH, reqStackH + minPad * 2)
  const flowH = innerH + ROW_PAD_Y * 2

  // Vertical centering for the call + response single boxes
  const callH = 56
  const respH = Math.min(120, 32 + (flow.response.sample?.length ?? 0) * 14 + 12)
  const callY = ROW_PAD_Y + (innerH - callH) / 2
  const respY = ROW_PAD_Y + (innerH - respH) / 2

  // Requests stack vertically centered too
  const reqStartY = ROW_PAD_Y + (innerH - reqStackH) / 2
  const callLines = splitCall(flow.call)

  const paths = generateRoughPaths(b => {
    // Call box
    b.rectangle(CALL_X, callY, CALL_W, callH, { strokeWidth: 1.2 })

    // Request boxes
    flow.requests.forEach((_, i) => {
      const y = reqStartY + i * (reqH + reqGap)

      b.rectangle(REQ_X, y, REQ_W, reqH, { strokeWidth: 1, role: 'accent' })
    })

    // Response box
    b.rectangle(RESP_X, respY, RESP_W, respH, { strokeWidth: 1.2 })

    // Arrows: call → each request, each request → response
    flow.requests.forEach((_, i) => {
      const reqY = reqStartY + i * (reqH + reqGap) + reqH / 2

      b.arrow(CALL_X + CALL_W + 4, callY + callH / 2, REQ_X - 6, reqY, {
        strokeWidth: 0.9,
        roughness: 1.4,
        role: 'muted',
      })
      b.arrow(REQ_X + REQ_W + 4, reqY, RESP_X - 6, respY + respH / 2, {
        strokeWidth: 0.9,
        roughness: 1.4,
        role: 'muted',
      })
    })
  })

  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      viewBox={`0 0 ${FLOW_W} ${flowH}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Column headers */}
      <text className="font-mono" fill="var(--soft)" fontSize={9} x={CALL_X} y={16}>
        call
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={9} x={REQ_X} y={16}>
        http requests
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={9} x={RESP_X} y={16}>
        response
      </text>

      {/* Rough strokes */}
      {paths.map((p, idx) => (
        <path
          key={idx}
          d={p.d}
          fill="none"
          stroke={strokeForRole(p.role)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={p.strokeWidth}
        />
      ))}

      {/* Call content */}
      {callLines.map((line, i) => (
        <text
          key={`${flow.n}-call-${i}`}
          className="font-mono"
          fill={i === 0 ? 'var(--fg)' : 'var(--accent)'}
          fontSize={i === 0 ? 11.5 : 12}
          x={CALL_X + 14}
          y={callY + 24 + i * 18}
        >
          {line}
        </text>
      ))}

      {/* Request content */}
      {flow.requests.map((req, i) => {
        const y = reqStartY + i * (reqH + reqGap)

        return (
          <g key={`${flow.n}-req-${i}`}>
            <text className="font-mono" fill="var(--fg)" fontSize={10.5} x={REQ_X + 12} y={y + 16}>
              {req.http}
            </text>
            {req.note && (
              <text className="font-mono" fill="var(--soft)" fontSize={9} x={REQ_X + 12} y={y + 30}>
                {req.note}
              </text>
            )}
          </g>
        )
      })}

      {/* Response content */}
      <text className="font-mono" fill="var(--accent)" fontSize={11} x={RESP_X + 12} y={respY + 18}>
        {flow.response.label}
      </text>
      {flow.response.sample?.map((line, i) => (
        <text
          key={`${flow.n}-resp-${i}`}
          className="font-mono"
          fill="var(--soft)"
          fontSize={9.5}
          x={RESP_X + 12}
          y={respY + 34 + i * 13}
        >
          {line}
        </text>
      ))}
    </svg>
  )
}

export function ApiFlowDiagrams() {
  return (
    <div className="flex flex-col">
      {FLOWS.map((flow, idx) => (
        <article
          key={flow.n}
          className={`flex flex-col gap-4 px-6 py-7 ${idx === 0 ? '' : 'border-t border-tp-border'}`}
        >
          <header className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] text-tp-soft">{flow.n}</span>
            <h4 className="text-[15.5px] font-medium tracking-tight">{flow.title}</h4>
            <span className="h-px flex-1 bg-tp-border" />
          </header>
          <p className="max-w-3xl text-[13px] leading-relaxed text-tp-muted">{flow.blurb}</p>
          <div className="rounded-md border border-tp-border bg-tp-bg p-3">
            <FlowSvg flow={flow} />
          </div>
        </article>
      ))}
    </div>
  )
}
