import type { NextConfig } from 'next'
import path from 'path'

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  // Prevent Next.js from bundling sharp (native module); load at runtime instead
  serverExternalPackages: ['sharp'],
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
  },
  webpack(cfg, { isServer }) {
    cfg.resolve.alias = {
      ...cfg.resolve.alias,
      '@tp': path.join(__dirname, '../src'),
      // Resolve sharp from dashboard/node_modules (for src files compiled in dashboard context)
      'sharp': path.join(__dirname, 'node_modules/sharp'),
    }
    // Allow modules imported via ../src/* to fall back to dashboard/node_modules
    // when they can't find packages by walking up (e.g. pngjs under Yarn PnP).
    cfg.resolve.modules = [
      'node_modules',
      path.join(__dirname, 'node_modules'),
    ]
    // Sharp uses native binaries — exclude from webpack bundling on server
    if (isServer) {
      cfg.externals = [...(Array.isArray(cfg.externals) ? cfg.externals : [cfg.externals ?? {}]), 'sharp']
    }
    return cfg
  },
}

export default config
