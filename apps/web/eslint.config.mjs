import nextConfig from 'tokenpack-eslint-config/next'

const config = [...nextConfig, { ignores: ['.next/**', 'node_modules/**', 'tsconfig.tsbuildinfo'] }]

export default config
