// Manual sanity check for the Phase 1 archive.ts refactor.
// Vitest is broken on Node < 22 in this repo (rolldown requires util.styleText),
// so this script verifies the buffer-pure API + fs wrappers via tsx.

import fs from 'fs'
import os from 'os'
import path from 'path'

import {
  isCartArchive,
  listArchive,
  packBuffers,
  packDirs,
  unpackBuffers,
  unpackDir,
} from '../src/archive'

const enc = new TextEncoder()

let failures = 0
function check(label: string, ok: boolean): void {
  console.log(`  ${ok ? 'OK' : 'FAIL'}  ${label}`)
  if (!ok) failures++
}

console.log('Test 1: buffer-pure round-trip')
const entries = [
  { path: 'hello.txt', bytes: enc.encode('hello world') },
  { path: 'sub/dir/file.json', bytes: enc.encode('{"x":1}') },
  { path: 'binary.bin', bytes: new Uint8Array([0, 255, 128, 64, 32]) },
]
const packed = packBuffers(entries)

check('isCartArchive recognizes packed bytes', isCartArchive(packed))
check('packed length is non-zero', packed.length > 0)

const unpacked = unpackBuffers(packed)
check('entry count matches', unpacked.length === entries.length)
for (let i = 0; i < entries.length; i++) {
  check(`entry[${i}].path matches`, unpacked[i].path === entries[i].path)
  check(`entry[${i}].bytes length matches`, unpacked[i].bytes.length === entries[i].bytes.length)
  let bytesEq = true
  for (let j = 0; j < entries[i].bytes.length; j++) {
    if (unpacked[i].bytes[j] !== entries[i].bytes[j]) { bytesEq = false; break }
  }
  check(`entry[${i}].bytes content matches`, bytesEq)
}

const list = listArchive(packed)
check('listArchive entry count matches', list.length === entries.length)
check('listArchive paths match', list.every((e, i) => e.filePath === entries[i].path))
check('listArchive sizes match', list.every((e, i) => e.size === entries[i].bytes.length))

console.log('\nTest 2: fs round-trip via packDirs / unpackDir')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-test-'))
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'cart-out-'))
try {
  fs.writeFileSync(path.join(tmp, 'a.txt'), 'aaa')
  fs.mkdirSync(path.join(tmp, 'sub'))
  fs.writeFileSync(path.join(tmp, 'sub', 'b.txt'), 'bbb')

  const archive = packDirs([tmp], [], tmp)
  check('packDirs returned a Buffer', Buffer.isBuffer(archive))
  check('archive starts with CART magic', isCartArchive(new Uint8Array(archive)))

  const written = unpackDir(archive, out).sort()
  check('two files written', written.length === 2)
  check('file paths normalized', written.includes('a.txt') && written.includes('sub/b.txt'))

  check('a.txt content', fs.readFileSync(path.join(out, 'a.txt'), 'utf8') === 'aaa')
  check('sub/b.txt content', fs.readFileSync(path.join(out, 'sub', 'b.txt'), 'utf8') === 'bbb')
} finally {
  fs.rmSync(tmp, { recursive: true })
  fs.rmSync(out, { recursive: true })
}

console.log('\nTest 3: error handling')
try {
  unpackBuffers(new Uint8Array([1, 2, 3, 4, 5]))
  check('unpackBuffers rejects non-CART data', false)
} catch (e) {
  check('unpackBuffers rejects non-CART data', e instanceof Error && e.message.includes('CART'))
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failures`)
process.exit(failures === 0 ? 0 : 1)
