import type { Icon } from '@phosphor-icons/react'
import {
  ChartBarIcon,
  CpuIcon,
  GaugeIcon,
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
  { href: '/benchmark-extended', label: 'Extended Bench', icon: GaugeIcon },
  { href: '/benchmark', label: 'Benchmark', icon: ChartBarIcon },
  { href: '/runtime-benchmark', label: 'Runtime Bench', icon: LightningIcon },
] as const
