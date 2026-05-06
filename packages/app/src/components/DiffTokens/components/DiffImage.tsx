interface DiffImageProps {
  url: string
}

export function DiffImage({ url }: DiffImageProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-white/40 uppercase tracking-wider">
        Diff ·{' '}
        <span className="text-white/60">dark = unchanged · blue/orange/red = changed bytes</span>
      </div>
      <img
        alt="Diff"
        className="w-full rounded-xl border border-white/10"
        src={url}
        style={{ imageRendering: 'pixelated', background: '#0a0a0a' }}
      />
      <a
        className="text-xs text-blue-400 hover:text-blue-300 underline"
        download="diff.png"
        href={url}
      >
        Download diff.png
      </a>
    </div>
  )
}
