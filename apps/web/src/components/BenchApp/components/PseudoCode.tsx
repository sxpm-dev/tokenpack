import type { ReactNode } from 'react'

interface PseudoCodeProps {
  lines: readonly string[]
}

export function PseudoCode({ lines }: PseudoCodeProps) {
  return (
    <div className="overflow-hidden rounded-md border border-tp-border bg-tp-bg">
      <div className="border-b border-tp-border px-3 py-2 font-mono text-[9px] tracking-[0.14em] text-tp-soft uppercase">
        How it runs
      </div>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-[11px] leading-relaxed text-tp-muted">
        {lines.map((line, index) => (
          <code key={line} className="block">
            <span className="mr-3 text-tp-soft">{String(index + 1).padStart(2, '0')}</span>
            {highlightPseudo(line)}
          </code>
        ))}
      </pre>
    </div>
  )
}

function highlightPseudo(line: string): ReactNode[] {
  const tokens = line.split(
    /(\/\/.*$|\b(?:await|const|for|of|new|return|then|button|onclick|fetch|fetchText|decodeRouter|materialize|loadManifest|selectAll|selectRandom50|buildHtml|createScriptsAndStyles|createImages|injectScript|injectStyle|load|loadLazyChunks|renderSelectedModules|renderScene|fetchLazyImages|globalThis|performance|now|window)\b|(?:'[^']*'|"[^"]*"|`[^`]*`)|<\/?script\b|<\/?link\b|<\/?img\b|=>)/g,
  )

  return tokens.filter(Boolean).map((token, index) => {
    const key = `${token}-${index}`

    if (/^\/\/.*$/.test(token))
      return (
        <span key={key} className="text-tp-soft">
          {token}
        </span>
      )
    if (/^(?:await|const|for|of|new|return|then)$/.test(token))
      return (
        <span key={key} className="text-[#ff766d]">
          {token}
        </span>
      )
    if (
      /^(?:fetch|fetchText|decodeRouter|materialize|loadManifest|selectAll|selectRandom50|buildHtml|createScriptsAndStyles|createImages|injectScript|injectStyle|load|loadLazyChunks|renderSelectedModules|renderScene|fetchLazyImages|now)$/.test(
        token,
      )
    )
      return (
        <span key={key} className="text-[#67b7ff]">
          {token}
        </span>
      )
    if (/^(?:button|onclick|window|globalThis|performance)$/.test(token))
      return (
        <span key={key} className="text-[#caa7ff]">
          {token}
        </span>
      )
    if (/^(?:'[^']*'|"[^"]*"|`[^`]*`)$/.test(token))
      return (
        <span key={key} className="text-[#9ee559]">
          {token}
        </span>
      )
    if (/^<\/?(?:script|link|img)\b/.test(token) || token === '=>')
      return (
        <span key={key} className="text-[#ff9f40]">
          {token}
        </span>
      )

    return <span key={key}>{token}</span>
  })
}
