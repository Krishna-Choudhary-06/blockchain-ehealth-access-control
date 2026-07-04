import { render, screen, fireEvent } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import Upload from '../pages/Upload'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock cryptoService to avoid slow RSA key generations in jsdom
vi.mock('../services/cryptoService', () => ({
  encryptFile: vi.fn(async () => ({
    encryptedData: new ArrayBuffer(8),
    key: 'mock-aes-key-hex',
    iv: 'mock-iv-hex'
  })),
  shareKeyWithUsers: vi.fn(async () => ({
    'mock-doctor-uid': 'mock-encrypted-key-base64'
  })),
  addOnChainTx: vi.fn()
}))

// Mock apiService to prevent real network requests during tests
vi.mock('../services/apiService', () => ({
  uploadRecord: vi.fn(() => Promise.resolve({
    success: true,
    data: {
      ipfsHash: 'QmDummyIPFSHash'
    }
  }))
}))

describe('Upload Component', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders form fields (Patient Name, Sensitivity, File Drag Zone)', () => {
    render(<Upload />)
    
    expect(screen.getByLabelText(/Patient Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Sensitivity Level/i)).toBeInTheDocument()
    expect(screen.getByText(/Drag & Drop or Click to browse/i)).toBeInTheDocument()
  })

  test('blocks prohibited file extensions like EXE or APK', () => {
    const { container } = render(<Upload />)
    const fileInput = container.querySelector('input[type="file"]')
    
    const badFile = new File(['bad payload'], 'malicious.apk', { type: 'application/vnd.android.package-archive' })
    
    fireEvent.change(fileInput, { target: { files: [badFile] } })
    
    expect(screen.getByText(/Security Block: File extension .APK is strictly prohibited./i)).toBeInTheDocument()
  })

  test('blocks files that exceed 10MB in size', () => {
    const { container } = render(<Upload />)
    const fileInput = container.querySelector('input[type="file"]')
    
    // Create large mock file (11MB)
    const largeSize = 11 * 1024 * 1024
    const largeFile = new File([new ArrayBuffer(largeSize)], 'large_record.pdf', { type: 'application/pdf' })
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } })
    
    expect(screen.getByText(/File size exceeds 10MB limit/i)).toBeInTheDocument()
  })

  test('accepts valid PDF or PNG files', () => {
    const { container } = render(<Upload />)
    const fileInput = container.querySelector('input[type="file"]')
    
    const goodFile = new File(['hello'], 'scan.png', { type: 'image/png' })
    
    fireEvent.change(fileInput, { target: { files: [goodFile] } })
    
    // Should NOT show any validation errors, should display file details
    expect(screen.queryByText(/Security Block/i)).not.toBeInTheDocument()
    expect(screen.getAllByText('scan.png').length).toBeGreaterThan(0)
  })


  test('simulates hybrid encryption upload and renders secure receipt card', async () => {
    const { container } = render(<Upload />)
    
    // Fill Patient Name
    fireEvent.change(screen.getByLabelText(/Patient Name/i), { target: { value: 'Alice Johnson' } })
    
    // Attach valid file
    const fileInput = container.querySelector('input[type="file"]')
    const file = new File(['pdf data'], 'diagnosis.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Encrypt & Upload to Ledger/i })
    fireEvent.click(submitBtn)
    
    // Should enter uploading state
    expect(screen.getByText(/Securing Medical Payload/i)).toBeInTheDocument()
    
    // Wait for success receipt element to appear in DOM (since delay is only 1ms in tests)
    const successEl = await screen.findByText(/Secure Ledger Entry Created/i, {}, { timeout: 15000 })
    expect(successEl).toBeInTheDocument()
    expect(screen.getAllByText('diagnosis.pdf').length).toBeGreaterThan(0)
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText(/IPFS Content Identifier/i)).toBeInTheDocument()
    expect(screen.getByText(/Encrypted \(AES-256-CBC\)/i)).toBeInTheDocument()
  })
})
