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
  async redirects() {
    // 301s for the bench-page rename round (May 2026). Kept after the rename
    // so any external links / dev-history bookmarks land on the new routes.
    // Safe to remove once we're confident nothing references the old paths.
    return [
      { source: '/benchmark-extended', destination: '/encode-decode-bench', permanent: true },
      { source: '/runtime-benchmark', destination: '/browser-fetch-bench', permanent: true },
      { source: '/benchmark', destination: '/server-fetch-bench', permanent: true },
    ]
  },
}

export default config
