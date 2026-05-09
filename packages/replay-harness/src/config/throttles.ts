import type { ThrottleConfig } from './types.js'

export const NONE: ThrottleConfig = {
  downloadKbps: 1_000_000,
  uploadKbps: 1_000_000,
  rttMs: 0,
  cpuSlowdownFactor: 1,
}

export const FAST_4G: ThrottleConfig = {
  downloadKbps: 9_000,
  uploadKbps: 1_500,
  rttMs: 170,
  cpuSlowdownFactor: 1,
}

export const REGULAR_4G: ThrottleConfig = {
  downloadKbps: 4_000,
  uploadKbps: 750,
  rttMs: 200,
  cpuSlowdownFactor: 1,
}

export const REGULAR_3G: ThrottleConfig = {
  downloadKbps: 1_600,
  uploadKbps: 750,
  rttMs: 300,
  cpuSlowdownFactor: 4,
}

export const PRESETS: Readonly<Record<string, ThrottleConfig>> = Object.freeze({
  NONE,
  FAST_4G,
  REGULAR_4G,
  REGULAR_3G,
})
