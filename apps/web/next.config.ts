import type { NextConfig } from 'next'
import nextra from 'nextra'

const withNextra = nextra({
  contentDirBasePath: '/docs',
  mdxOptions: {
    rehypePrettyCodeOptions: {
      theme: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
      keepBackground: true,
    },
  },
})

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd() + '/../..',
  outputFileTracingIncludes: {
    '/api/bench-runs': ['./benchmark-results/playground-runs/**/*', './benchmark-fixtures/**/manifest.json', './runtime-fixtures/manifest.json', './benchmark-fixtures/json-playground/*.meta.json', './public/bench-app/*/assets/manifest.json'],
    '/api/benchmark/provenance': ['./benchmark-results/provenance.json'],
    '/api/benchmark': ['./benchmark-results/results.json'],
    '/api/benchmark/extended': ['./benchmark-results/results-extended.json'],
    '/api/benchmark/archives': ['./benchmark-results/archive-times.json'],
    '/api/json-playground/*': ['./benchmark-fixtures/json-playground/**/*', '../../benchmark/sources/client-spec-map.json'],
    '/api/apply-diff-benchmark/*': ['./benchmark-fixtures/apply-diff/**/*'],
    '/api/runtime-benchmark/**/*': ['./benchmark-fixtures/runtime/**/*'],
    '/api/fixtures/**/*': ['./runtime-fixtures/**/*'],
    '/scenarios/**/*': ['./runtime-fixtures/manifest.json'],
  },
  transpilePackages: ['tokenpack', '@tokenpack/browser', '@tokenpack/node'],
  serverExternalPackages: ['sharp'],
}

export default withNextra(config)
