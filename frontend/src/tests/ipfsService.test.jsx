import { describe, test, expect } from 'vitest'
import { uploadFile, downloadFile } from '../services/ipfsService'

describe('IPFS Service Client Operations', () => {
  test('IPFS service uploads a buffer and returns a CID starting with Qm', async () => {
    const rawData = new TextEncoder().encode('confidential file data').buffer
    const cid = await uploadFile(rawData)
    
    expect(cid).toBeDefined()
    expect(typeof cid).toBe('string')
    expect(cid.substring(0, 2)).toBe('Qm')
  })

  test('IPFS service downloads data by its CID correctly', async () => {
    const originalText = 'some text payload stored in IPFS mock'
    const rawData = new TextEncoder().encode(originalText).buffer
    
    // Upload first to register in mock registry
    const cid = await uploadFile(rawData)
    
    // Download
    const downloadedBuffer = await downloadFile(cid)
    expect(downloadedBuffer).toBeInstanceOf(ArrayBuffer)
    
    const decryptedText = new TextDecoder().decode(downloadedBuffer)
    expect(decryptedText).toBe(originalText)
  })

  test('IPFS service download throws error for non-existent CID', async () => {
    await expect(downloadFile('QmNonExistentCid123456789012345678901234567890')).rejects.toThrow()
  })
})
