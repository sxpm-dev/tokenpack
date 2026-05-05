import type { NextConfig } from 'next'
import path from 'path'

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  transpilePackages: ['tokenpack'],
  serverExternalPackages: ['sharp'],
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
  },
  webpack(cfg, { isServer }) {
    if (isServer) {
      cfg.externals = [
        ...(Array.isArray(cfg.externals) ? cfg.externals : [cfg.externals ?? {}]),
        'sharp',
        '@mongodb-js/zstd',
      ]
    }
    return cfg
  },
}

export default config
