import nextConfig from 'tokenpack-eslint-config/next'

export default [...nextConfig, { ignores: ['.next/**', 'node_modules/**', 'tsconfig.tsbuildinfo'] }]
