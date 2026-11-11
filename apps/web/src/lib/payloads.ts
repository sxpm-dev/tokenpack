// Deterministic payload generator for benchmark fixtures.
// Same seed + size always produces the same JSON, so reruns are comparable.

interface Item {
  id: number
  name: string
  email: string
  active: boolean
  score: number
  tags: string[]
  notes: string
}

// Mulberry32 PRNG — small, deterministic.
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = seed

    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST_NAMES = ['Ava', 'Liam', 'Sofia', 'Ethan', 'Mia', 'Noah', 'Zoe', 'Leo', 'Nora', 'Kai']
const LAST_NAMES = [
  'Park',
  'Singh',
  'Chen',
  'Garcia',
  'Müller',
  'Tanaka',
  'Okafor',
  'Silva',
  'Lopez',
  'Kim',
]
const TAG_POOL = [
  'vip',
  'churn-risk',
  'beta',
  'alpha',
  'paid',
  'trial',
  'engaged',
  'dormant',
  'flagged',
  'verified',
]

function makeItem(rand: () => number, id: number): Item {
  const f = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
  const l = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
  const tags = Array.from(
    { length: Math.floor(rand() * 4) },
    () => TAG_POOL[Math.floor(rand() * TAG_POOL.length)],
  )
  const notes =
    [
      'Customer requested an invoice for the annual subscription.',
      'Workspace migration completed. Team permissions were reviewed.',
      'Follow up after the onboarding session to confirm the integration.',
      'Support ticket resolved after updating the billing contact.',
      'Account owner enabled single sign-on for the engineering team.',
    ][Math.floor(rand() * 5)] + ` Reference CRM-${String(id).padStart(7, '0')}.`

  return {
    id,
    name: `${f} ${l}`,
    email: `${f.toLowerCase()}.${l.toLowerCase()}@example.com`,
    active: rand() > 0.3,
    score: Math.floor(rand() * 1000),
    tags,
    notes,
  }
}

/**
 * Generate a JSON payload of approximately `sizeKB` kilobytes.
 * Deterministic: same sizeKB → same payload.
 */
export function generatePayload(sizeKB: number): { items: Item[] } {
  const targetBytes = sizeKB * 1024
  const rand = rng(sizeKB * 1000)
  const items: Item[] = []
  let currentBytes = 16 // wrapper overhead

  while (currentBytes < targetBytes) {
    const item = makeItem(rand, items.length)

    items.push(item)
    currentBytes += new TextEncoder().encode(JSON.stringify(item)).byteLength + 1
  }

  return { items }
}
