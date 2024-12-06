import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'

// Configure ed25519
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m))

export async function generateKeyPair() {
  const privateKey = ed.utils.randomPrivateKey()
  const publicKey = await ed.getPublicKey(privateKey)
  return { privateKey, publicKey }
}

export function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

export function base64ToBytes(str: string): Uint8Array {
  return new Uint8Array(atob(str).split('').map(char => char.charCodeAt(0)))
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function base64UrlToBytes(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return base64ToBytes(base64)
}

export async function getPeerId(publicKey: Uint8Array): Promise<string> {
  // Prefix for peer ID calculation: \x00$\x08\x01\x12 
  const prefix = new Uint8Array([0x00, 0x24, 0x08, 0x01, 0x12, 0x20])
  
  // Concatenate prefix with public key
  const combined = new Uint8Array(prefix.length + publicKey.length)
  combined.set(prefix)
  combined.set(publicKey, prefix.length)

  // Base58 alphabet
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

  // Convert to base58
  let num = BigInt(0)
  for (const byte of combined) {
    num = num * BigInt(256) + BigInt(byte)
  }

  let base58 = ''
  while (num > 0) {
    const mod = Number(num % BigInt(58))
    base58 = ALPHABET[mod] + base58
    num = num / BigInt(58)
  }

  // Add leading zeros
  for (let i = 0; i < combined.length && combined[i] === 0; i++) {
    base58 = '1' + base58
  }

  return base58

  const hash = await crypto.subtle.digest('SHA-256', publicKey)
  return bytesToBase64Url(new Uint8Array(hash))
}

export { ed }