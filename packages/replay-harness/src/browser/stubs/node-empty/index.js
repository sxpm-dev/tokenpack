// Empty stub for Node built-ins (node:fs, node:os, node:path) imported by
// transitive `@tokenpack/core` modules that aren't reachable from the browser
// bridge's actual code path (we only call decodeStream + extractAll).
const noop = () => {
  throw new Error('node: builtin called from browser bundle')
}
export default new Proxy({}, { get: () => noop })
export const tmpdir = noop
export const readFile = noop
export const readFileSync = noop
export const writeFileSync = noop
export const existsSync = noop
export const join = noop
export const resolve = noop
export const dirname = noop
export const basename = noop
export const extname = noop
