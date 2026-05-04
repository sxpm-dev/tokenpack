import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from 'crypto'

// AES-256-GCM with PBKDF2 key derivation.
// Layout of encrypted buffer: [salt:16][iv:12][ciphertext:N][tag:16]

const SALT_LEN = 16
const IV_LEN = 12
const TAG_LEN = 16
const KEY_LEN = 32
const PBKDF2_ITER = 10_000

export const CRYPTO_OVERHEAD = SALT_LEN + IV_LEN + TAG_LEN // 44 bytes

function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITER, KEY_LEN, 'sha256')
}

export function encryptData(data: Buffer, password: string): Buffer {
  const salt = randomBytes(SALT_LEN)
  const iv = randomBytes(IV_LEN)
  const key = deriveKey(password, salt)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([salt, iv, ciphertext, tag])
}

export function decryptData(data: Buffer, password: string): Buffer {
  if (data.length < CRYPTO_OVERHEAD) throw new Error('Encrypted payload too short')
  const salt = data.subarray(0, SALT_LEN)
  const iv = data.subarray(SALT_LEN, SALT_LEN + IV_LEN)
  const ciphertext = data.subarray(SALT_LEN + IV_LEN, data.length - TAG_LEN)
  const tag = data.subarray(data.length - TAG_LEN)
  const key = deriveKey(password, salt)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()])
  } catch {
    throw new Error('Decryption failed — wrong key or corrupted data')
  }
}
