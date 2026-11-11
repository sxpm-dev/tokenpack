export function sizeTabClass(selected: boolean): string {
  return `cursor-pointer rounded-md border px-3 py-3 text-left font-mono transition-colors ${
    selected
      ? 'border-tp-accent bg-tp-accent text-tp-accent-fg shadow-[0_0_0_1px_rgba(158,229,89,0.22)]'
      : 'border-tp-border bg-tp-bg text-tp-muted hover:border-tp-fg/35 hover:text-tp-fg'
  }`
}

export function scopeTabClass(selected: boolean): string {
  return `cursor-pointer rounded-md border px-3 py-3 text-left font-mono transition-colors ${
    selected
      ? 'border-[#63d8ff] bg-[#63d8ff] text-[#071011] shadow-[0_0_0_1px_rgba(99,216,255,0.24)]'
      : 'border-tp-border bg-tp-bg text-tp-muted hover:border-[#63d8ff]/55 hover:text-[#bcefff]'
  }`
}

export function cacheTabClass(selected: boolean): string {
  return `cursor-pointer rounded-md border px-3 py-3 text-left font-mono transition-colors ${
    selected
      ? 'border-[#ffbd55] bg-[#ffbd55] text-[#171006] shadow-[0_0_0_1px_rgba(255,189,85,0.24)]'
      : 'border-tp-border bg-tp-bg text-tp-muted hover:border-[#ffbd55]/55 hover:text-[#ffd99a]'
  }`
}

export function repeatTabClass(selected: boolean): string {
  return `cursor-pointer rounded-md border px-3 py-3 text-left font-mono transition-colors ${
    selected
      ? 'border-[#caa7ff] bg-[#caa7ff] text-[#120a1c] shadow-[0_0_0_1px_rgba(202,167,255,0.24)]'
      : 'border-tp-border bg-tp-bg text-tp-muted hover:border-[#caa7ff]/55 hover:text-[#e4d4ff]'
  }`
}

export function scenarioTabClass(selected: boolean): string {
  return `cursor-pointer rounded-md border p-3 text-left font-mono text-[11px] transition-colors ${
    selected
      ? 'border-tp-accent bg-tp-bg text-tp-fg shadow-[inset_0_0_0_1px_rgba(158,229,89,0.28)]'
      : 'border-tp-border bg-tp-bg/65 text-tp-muted hover:border-tp-fg/35 hover:text-tp-fg'
  }`
}
