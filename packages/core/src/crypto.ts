// AES-256-GCM with PBKDF2-SHA256 key derivation, implemented via Web Crypto.
//
// Wire layout (unchanged from the previous Node-crypto implementation,
// so old tokens decrypt cleanly under the new code):
//   [salt:16][iv:12][ciphertext:N][tag:16]
//
// Web Crypto's AES-GCM bundles the auth tag at the end of `subtle.encrypt`'s
// output, so we can lay out the wire format with one final concat and avoid
// a separate "getAuthTag" step.

const SALT_LEN = 16
const IV_LEN = 12
const TAG_LEN = 16
const KEY_BITS = 256
const PBKDF2_ITER = 10_000

export const CRYPTO_OVERHEAD = SALT_LEN + IV_LEN + TAG_LEN // 44 bytes

const passwordEncoder = new TextEncoder()

// TS 5.7+ tightened Uint8Array's generic to `Uint8Array<ArrayBufferLike>` and
// Web Crypto signatures want `Uint8Array<ArrayBuffer>` — explicit cast to ease
// downstream consumers using stricter TS.
// TS 5.7+ tightened Uint8Array's generic; brute cast to BufferSource keeps the
// Web Crypto calls compiling under both core's TS 6.0 and consumer TS 5.8.
function asBufferSource(data: ArrayBuffer | ArrayBufferView): BufferSource {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    asBufferSource(passwordEncoder.encode(password)),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )

  return globalThis.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: asBufferSource(salt), iterations: PBKDF2_ITER, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_BITS },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptData(data: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LEN))
  const key = await deriveKey(password, salt)
  // AES-GCM output = ciphertext || tag (tag length defaults to 128 bits = 16 bytes).
  const ctAndTag = new Uint8Array(
    await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: asBufferSource(iv) },
      key,
      asBufferSource(data),
    ),
  )

  const out = new Uint8Array(SALT_LEN + IV_LEN + ctAndTag.length)

  out.set(salt, 0)
  out.set(iv, SALT_LEN)
  out.set(ctAndTag, SALT_LEN + IV_LEN)

  return out
}

export async function decryptData(data: Uint8Array, password: string): Promise<Uint8Array> {
  if (data.length < CRYPTO_OVERHEAD) throw new Error('Encrypted payload too short')
  const salt = data.subarray(0, SALT_LEN)
  const iv = data.subarray(SALT_LEN, SALT_LEN + IV_LEN)
  const ctAndTag = data.subarray(SALT_LEN + IV_LEN)
  const key = await deriveKey(password, salt)

  try {
    const plaintext = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: asBufferSource(iv) },
      key,
      asBufferSource(ctAndTag),
    )

    return new Uint8Array(plaintext)
  } catch {
    throw new Error('Decryption failed — wrong key or corrupted data')
  }
}
