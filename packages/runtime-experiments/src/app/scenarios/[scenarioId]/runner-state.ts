// Per-variant lifecycle state machine. Page-local — used only by the
// `[scenarioId]` template and its child components.

import type { AggregatedRow } from '@/lib/runner'

export type VariantStatus =
  | { state: 'pending' }
  | { state: 'running' }
  | { state: 'done'; row: AggregatedRow }
  | { state: 'errored'; error: string }
  | { state: 'skipped'; reason: string }

export type StatusMap = Map<string, VariantStatus>
