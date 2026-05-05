import { Card } from '@heroui/react'
import type { SizeStats } from '../types'
import { SizeBadge } from './SizeBadge'

interface TokenResultProps {
  url: string
  fileName: string
  stats: SizeStats
}

export function TokenResult({ url, fileName, stats }: TokenResultProps) {
  return (
    <Card variant="secondary">
      <Card.Content className="p-4 flex flex-col gap-3">
        <SizeBadge stats={stats} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-white/30 truncate">{fileName}</span>
          <a
            href={url}
            download={fileName}
            className="text-sm text-blue-400 hover:text-blue-300 underline shrink-0"
          >
            Download
          </a>
        </div>
        <img
          src={url}
          alt="Generated token"
          className="w-full rounded-lg border border-white/10"
          style={{ imageRendering: 'pixelated', background: '#111' }}
        />
      </Card.Content>
    </Card>
  )
}
