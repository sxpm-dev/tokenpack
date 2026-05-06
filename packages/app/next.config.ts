import type { NextConfig } from 'next'
import path from 'path'

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  outputFileTracingIncludes: {
    '/api/benchmark': ['./benchmark-results/**'],
    '/api/benchmark/extended': ['./benchmark-results/**'],
    '/api/benchmark/archives': ['./benchmark-results/**'],
    '/api/runtime-benchmark/manifest': [
      '../../benchmark/sources/**',
      '../../benchmark/tokens/**',
      './runtime-fixtures/**',
    ],
    '/api/runtime-benchmark/text': ['../../benchmark/sources/**', './runtime-fixtures/**'],
    '/api/runtime-benchmark/token': ['../../benchmark/tokens/**', './runtime-fixtures/**'],
    '/api/runtime-benchmark/script-token': ['./runtime-fixtures/**'],
  },
  transpilePackages: ['tokenpack', '@tokenpack/browser', '@tokenpack/node'],
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
