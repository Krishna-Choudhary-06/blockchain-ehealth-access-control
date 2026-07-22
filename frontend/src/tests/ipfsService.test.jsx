import { describe, test, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { uploadFile, downloadFile } from '../services/ipfsService'

// Mock axios with deterministic URL-based routing
vi.mock('axios', () => {
  return {
    default: {
      post: vi.fn((url) => {
        if (url.includes('/add')) {
          return Promise.resolve({ data: { Hash: 'QmDummyIPFSHash1234567890' } })
        }
        return Promise.reject(new Error('Local daemon error'))
      }),
      get: vi.fn((url) => {
        if (url.includes('/QmNonExistent')) {
          return Promise.reject(new Error('Backend error'))
        }
        const originalText = 'some text payload stored in IPFS mock'
        const rawData = new TextEncoder().encode(originalText).buffer
        return Promise.resolve({ data: rawData })
      })
    }
  }
})

describe('IPFS Service Client Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('IPFS service uploads a buffer and returns a CID starting with Qm', async () => {
    const rawData = new TextEncoder().encode('confidential file data').buffer
    const cid = await uploadFile(rawData)
    
    expect(cid).toBe('QmDummyIPFSHash1234567890')
    expect(axios.post).toHaveBeenCalledWith(
      'http://127.0.0.1:5001/api/v0/add',
      expect.any(FormData),
      expect.any(Object)
    )
  })

  test('IPFS service downloads data by its CID correctly', async () => {
    const originalText = 'some text payload stored in IPFS mock'
    const downloadedBuffer = await downloadFile('QmDummyIPFSHash1234567890')
    expect(downloadedBuffer).toBeDefined()
    expect(downloadedBuffer.byteLength).toBeGreaterThan(0)
    
    const decryptedText = new TextDecoder().decode(downloadedBuffer)
    expect(decryptedText).toBe(originalText)
  })

  test('IPFS service download throws error for non-existent CID', async () => {
    await expect(downloadFile('QmNonExistentCid1234567890')).rejects.toThrow()
  })
})
