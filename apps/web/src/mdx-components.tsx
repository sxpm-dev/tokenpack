import type { MDXComponents } from 'nextra/mdx-components'

import { MaterializeBlock } from '@/components/HowItWorks/MaterializeBlock'
import { RangeFetchTabs } from '@/components/RangeFetchSection/RangeFetchTabs'
import { DiffDiagram } from '@/components/Rough/DiffDiagram'
import { PixelToken } from '@/components/Rough/PixelToken'
import { RangeStrategiesDiagram } from '@/components/Rough/RangeStrategiesDiagram'
import { RouterEncoderDiagram } from '@/components/Rough/RouterEncoderDiagram'
import { RuntimeFlowDiagram } from '@/components/Rough/RuntimeFlowDiagram'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    DiffDiagram,
    MaterializeBlock,
    PixelToken,
    RangeFetchTabs,
    RangeStrategiesDiagram,
    RouterEncoderDiagram,
    RuntimeFlowDiagram,
  }
}
