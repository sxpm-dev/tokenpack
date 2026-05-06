interface DiffTextProps {
  content: string
}

function classifyLine(line: string): string {
  if (line.startsWith('+ ')) return 'text-green-400'
  if (line.startsWith('- ')) return 'text-red-400'
  if (line.startsWith('━') || line.startsWith('@@')) return 'text-blue-400/80'

  return 'text-white/50'
}

export function DiffText({ content }: DiffTextProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-white/40 uppercase tracking-wider">Line diff</div>
      <pre className="text-xs font-mono leading-relaxed max-h-[500px] overflow-auto bg-[#0f0f0f] border border-white/10 rounded-xl p-4 whitespace-pre-wrap">
        {content.split('\n').map((line, i) => (
          <span key={i} className={`block ${classifyLine(line)}`}>
            {line}
          </span>
        ))}
      </pre>
    </div>
  )
}
