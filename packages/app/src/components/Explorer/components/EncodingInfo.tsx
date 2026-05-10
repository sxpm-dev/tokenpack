import { Chip } from '@heroui/react'
import type { InspectInfo } from '@tokenpack/browser/inspect'

interface EncodingInfoProps {
  info: InspectInfo
}

export function EncodingInfo({ info }: EncodingInfoProps) {
  const { algorithm: a, header: h } = info

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-white/40">Encoded with</span>
        <span className="font-mono text-[12px] text-white/85">{a.name}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip size="sm" title={a.codecDescription} variant="tertiary">
          codec: {a.codec}
        </Chip>
        <Chip size="sm" title={a.surfaceDescription} variant="tertiary">
          surface: {a.surface}
        </Chip>
        <Chip size="sm" title={a.compressorDescription} variant="tertiary">
          compressor: {a.compressor}
        </Chip>
        <Chip size="sm" title={a.drawerDescription} variant="tertiary">
          drawer: {a.drawer}
        </Chip>
        {a.streamable && (
          <Chip color="success" size="sm" variant="soft">
            streamable
          </Chip>
        )}
      </div>
      {h && (
        <div className="flex flex-wrap gap-1.5">
          {h.width && h.height && (
            <Chip size="sm" title="Image dimensions" variant="tertiary">
              {h.width} × {h.height} px
            </Chip>
          )}
          <Chip size="sm" title="Bytes per pixel used by the codec." variant="tertiary">
            {h.channels} ch
          </Chip>
          {h.cellSize > 1 && (
            <Chip size="sm" title="Dot drawer cell size in pixels." variant="tertiary">
              cell: {h.cellSize}px
            </Chip>
          )}
          {h.compressionLevel > 0 && (
            <Chip
              size="sm"
              title="Compression magnitude byte from the pixel header."
              variant="tertiary"
            >
              level: {h.compressionLevel}
            </Chip>
          )}
          {h.fecLevel > 0 && (
            <Chip
              color="warning"
              size="sm"
              title="Forward error correction level (Reed–Solomon)."
              variant="soft"
            >
              fec: {fecLabel(h.fecLevel)}
            </Chip>
          )}
          {h.encrypted && (
            <Chip color="warning" size="sm" title="AES-256 encrypted payload." variant="soft">
              encrypted
            </Chip>
          )}
        </div>
      )}
    </div>
  )
}

function fecLabel(level: number): string {
  if (level === 1) return 'rs-5'
  if (level === 2) return 'rs-15'
  if (level === 3) return 'rs-25'

  return String(level)
}
