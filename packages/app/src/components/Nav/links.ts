import type { Icon } from '@phosphor-icons/react'
import {
  BracketsCurlyIcon,
  ChartBarIcon,
  CpuIcon,
  GaugeIcon,
  GitDiffIcon,
  LightningIcon,
  SquaresFourIcon,
} from '@phosphor-icons/react'

export interface NavLinkItem {
  href: string
  label: string
  icon: Icon
}

export const NAV_LINKS: readonly NavLinkItem[] = [
  { href: '/', label: 'Dashboard', icon: SquaresFourIcon },
  { href: '/algorithms', label: 'Algorithms', icon: CpuIcon },
  { href: '/encode-decode-bench', label: 'Encode / Decode Bench', icon: GaugeIcon },
  { href: '/server-fetch-bench', label: 'Server Fetch Bench', icon: ChartBarIcon },
  { href: '/browser-fetch-bench', label: 'Browser Fetch Bench', icon: LightningIcon },
  { href: '/apply-diff-bench', label: 'Apply Diff Bench', icon: GitDiffIcon },
  { href: '/json-playground', label: 'JSON Playground', icon: BracketsCurlyIcon },
] as const
