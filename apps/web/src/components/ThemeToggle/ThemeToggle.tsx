'use client'

import { Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

const noop = () => {}
const emptyUnsubscribe = () => noop

function useIsClient(): boolean {
  return useSyncExternalStore(emptyUnsubscribe, getTrue, getFalse)
}

function getTrue(): boolean {
  return true
}
function getFalse(): boolean {
  return false
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useIsClient()
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="group inline-flex h-9 w-9 items-center justify-center rounded-md border border-tp-border bg-tp-elev text-tp-fg transition-colors hover:border-tp-fg/40"
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" weight="duotone" />
        ) : (
          <Moon className="h-4 w-4" weight="duotone" />
        )
      ) : (
        <span className="block h-4 w-4" />
      )}
    </button>
  )
}
