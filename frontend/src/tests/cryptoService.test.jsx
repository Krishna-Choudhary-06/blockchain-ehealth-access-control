import { describe, test, expect } from 'vitest'
import { 
  encryptFile, 
  decryptFile, 
  generateUserKeyPair, 
  encryptKeyForUser, 
  decryptKeyForUser,
  shareKeyWithUsers,
  revokeUserAccess,
  generatePublicKeyFingerprint
} from '../services/cryptoService'

describe('CryptoService Client Operations', () => {
  test('AES-CBC encrypts and decrypts file data correctly', async () => {
    const originalText = 'Patient health record confidential information'
    const enc = new TextEncoder()
    const fileBuffer = enc.encode(originalText).buffer

    // Encrypt
    const { encryptedData, key, iv } = await encryptFile(fileBuffer)
    expect(encryptedData.constructor.name).toBe('ArrayBuffer')
    expect(key).toHaveLength(64) // Hex string for 256-bit AES key is 64 chars
    expect(iv).toHaveLength(32) // Hex string for 16-byte IV is 32 chars

    // Decrypt
    const decryptedBuffer = await decryptFile(encryptedData, key, iv)
    const dec = new TextDecoder()
    const decryptedText = dec.decode(decryptedBuffer)

    expect(decryptedText).toBe(originalText)
  })

  test('RSA-OAEP generates keys and handles encrypt/decrypt of symmetric keys', async () => {
    // Generate RSA key pair
    const keyPair = await generateUserKeyPair()
    expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----')
    expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----')

    const symmetricKey = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

    // Encrypt key for user
    const encryptedKeyBase64 = await encryptKeyForUser(symmetricKey, keyPair.publicKey)
    expect(typeof encryptedKeyBase64).toBe('string')
    expect(encryptedKeyBase64.length).toBeGreaterThan(0)

    // Decrypt key for user
    const decryptedKey = await decryptKeyForUser(encryptedKeyBase64, keyPair.privateKey)
    expect(decryptedKey).toBe(symmetricKey)
  }, 20000)

  test('Key sharing and revocation behavior', async () => {
    const keyPair1 = await generateUserKeyPair()
    const keyPair2 = await generateUserKeyPair()

    const symmetricKey = 'aes-key-hex-payload'
    const users = [
      { userId: 'user-1', publicKey: keyPair1.publicKey },
      { userId: 'user-2', publicKey: keyPair2.publicKey }
    ]

    // Share keys
    const sharedKeys = await shareKeyWithUsers(symmetricKey, users)
    expect(sharedKeys['user-1']).toBeDefined()
    expect(sharedKeys['user-2']).toBeDefined()

    // Decrypt shared key to prove validity
    const decryptedKey1 = await decryptKeyForUser(sharedKeys['user-1'], keyPair1.privateKey)
    expect(decryptedKey1).toBe(symmetricKey)

    // Revoke access for user-2
    const updatedKeys = revokeUserAccess(sharedKeys, 'user-2')
    expect(updatedKeys['user-1']).toBeDefined()
    expect(updatedKeys['user-2']).toBeUndefined()
  }, 20000)

  test('generatePublicKeyFingerprint derives a unique deterministic certificate ID from public key', async () => {
    const keyPair = await generateUserKeyPair()
    const fingerprint1 = await generatePublicKeyFingerprint(keyPair.publicKey)
    const fingerprint2 = await generatePublicKeyFingerprint(keyPair.publicKey)
    
    expect(fingerprint1).toBe(fingerprint2) // Should be deterministic
    expect(fingerprint1).toMatch(/^UID-[0-9A-F]{8}$/) // Should start with UID- and be followed by 8 hex characters
  }, 20000)
})
