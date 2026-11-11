import { Card } from '@heroui/react'

import type { SizeStats } from '@/components/EncodeForm'
import { TokenPreview } from '@/components/TokenPreview'

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
        <TokenPreview fileName={fileName} url={url} />
      </Card.Content>
    </Card>
  )
}
