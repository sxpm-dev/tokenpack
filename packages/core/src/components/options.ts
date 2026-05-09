// Tunable options schema declared by component classes (codec/surface/compressor/
// drawer/fec). Algorithm classes compose component schemas into one schema that
// the dashboard reads to auto-render selectors. No more hardcoded UI sections —
// adding a new option to a component automatically propagates to every algorithm
// that uses that component.

export type OptionType = 'enum' | 'number' | 'color'

export interface OptionDef<TValue = unknown> {
  /** Discriminated by `type`; `enum` carries `values`, `number` carries `range`. */
  type: OptionType
  /** Human-readable label for UI. */
  label?: string
  /** Longer description for tooltips / help text. */
  description?: string
  /** Default value used when no explicit option is supplied. */
  default: TValue
  /** Allowed values for `type === 'enum'`. */
  values?: readonly TValue[]
  /** Inclusive range for `type === 'number'`. */
  range?: readonly [number, number]
  /** Step for `type === 'number'`. Defaults to 1. */
  step?: number
  /** Conditional visibility — only show this option when another option has the given value. */
  dependsOn?: { key: string; value: unknown }
}

/**
 * Map from option key to its schema. Component classes declare a static
 * `optionsSchema` of this shape; algorithms namespace+merge them by component:
 *   { codec: { ... }, surface: { ... }, compressor: { ... }, drawer: { ... }, fec: { ... } }
 */
export interface OptionsSchema {
  [key: string]: OptionDef
}

/** Helper for declaring an enum option with literal-typed values. */
export function enumOption<T>(
  values: readonly T[],
  default_: T,
  meta: { label?: string; description?: string } = {},
): OptionDef<T> {
  return { type: 'enum', values, default: default_, ...meta }
}

/** Helper for declaring a number option with a [min, max] range. */
export function numberOption(
  range: readonly [number, number],
  default_: number,
  meta: { label?: string; description?: string; step?: number } = {},
): OptionDef<number> {
  return { type: 'number', range, default: default_, ...meta }
}

/** Helper for declaring a color option (hex string like `'#ff0050'`). */
export function colorOption(
  default_: string,
  meta: { label?: string; description?: string } = {},
): OptionDef<string> {
  return { type: 'color', default: default_, ...meta }
}
