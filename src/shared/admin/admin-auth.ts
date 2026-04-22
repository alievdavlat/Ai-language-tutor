/**
 * Shared admin-auth utilities — used by both main (to verify stored hash)
 * and renderer (to prompt + hash before sending to main).
 *
 * We use SubtleCrypto (PBKDF2-SHA256) everywhere; it's present in both
 * Node 20+ and the renderer (via `globalThis.crypto`). This keeps the file
 * dependency-free and safe to import from any process.
 *
 * This file is **scaffolding** for Phase 3 (Admin Core). It is NOT wired
 * into any UI yet — no password prompt, no admin routes. The helpers below
 * just exist so Phase 3 can pick them up without restructuring.
 */

const PBKDF2_ITERATIONS = 120_000
const SALT_BYTES = 16
const KEY_BYTES = 32

export interface AdminHash {
  algorithm: 'pbkdf2-sha256'
  iterations: number
  saltBase64: string
  hashBase64: string
}

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64')
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'))
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

function randomSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_BYTES)
  crypto.getRandomValues(salt)
  return salt
}

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const saltBuffer = new ArrayBuffer(salt.byteLength)
  new Uint8Array(saltBuffer).set(salt)
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBuffer, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    KEY_BYTES * 8
  )
  return new Uint8Array(bits)
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function hashAdminPassword(password: string): Promise<AdminHash> {
  const salt = randomSalt()
  const key = await deriveKey(password, salt)
  return {
    algorithm: 'pbkdf2-sha256',
    iterations: PBKDF2_ITERATIONS,
    saltBase64: toBase64(salt),
    hashBase64: toBase64(key)
  }
}

export async function verifyAdminPassword(
  password: string,
  stored: AdminHash
): Promise<boolean> {
  if (stored.algorithm !== 'pbkdf2-sha256') return false
  const salt = fromBase64(stored.saltBase64)
  const expected = fromBase64(stored.hashBase64)
  const actual = await deriveKey(password, salt)
  return constantTimeEqual(actual, expected)
}
