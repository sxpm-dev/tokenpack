import type { CDPSession } from 'playwright'

import type { ThrottleConfig } from '../config/types.js'

export async function applyThrottle(client: CDPSession, throttle: ThrottleConfig): Promise<void> {
  const downloadBps = (throttle.downloadKbps * 1024) / 8
  const uploadBps = (throttle.uploadKbps * 1024) / 8

  await client.send('Network.enable')
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: throttle.rttMs,
    downloadThroughput: downloadBps,
    uploadThroughput: uploadBps,
  })

  await client.send('Emulation.setCPUThrottlingRate', { rate: throttle.cpuSlowdownFactor })
}
