import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock cryptoService to avoid slow RSA keypair generation and real timeouts in tests
vi.mock('../services/cryptoService', () => {
  return {
    generateUserKeyPair: vi.fn(() => {
      console.log('--- MOCK generateUserKeyPair called ---')
      return Promise.resolve({
        publicKey: '-----BEGIN PUBLIC KEY-----\nMOCK_PUBLIC_KEY\n-----END PUBLIC KEY-----',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----'
      })
    }),
    getDelay: vi.fn((ms) => {
      console.log(`--- MOCK getDelay called with ${ms} ---`)
      return 1
    })
  }
})

// Mock apiService to avoid HTTP/Axios network errors in tests
vi.mock('../services/apiService', () => ({
  registerUser: vi.fn(() => {
    console.log('--- MOCK registerUser called ---')
    return Promise.resolve({ success: true })
  }),
  assignLevel: vi.fn(() => {
    console.log('--- MOCK assignLevel called ---')
    return Promise.resolve({ success: true })
  })
}))

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/Register'
import toast from 'react-hot-toast'

describe('Register Component', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders step 1: choose your system role', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/Step 1: Choose Your System Role/i)).toBeInTheDocument()
    expect(screen.getByText(/Doctor/i)).toBeInTheDocument()
    expect(screen.getByText(/Nurse/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next Step/i })).toBeInTheDocument()
  })

  test('shows warning toast on next step without role selection', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )
    const nextBtn = screen.getByRole('button', { name: /Next Step/i })
    
    fireEvent.click(nextBtn)
    expect(toast.error).toHaveBeenCalledWith('Please select a system role to continue.')
  })

  test('simulates blockchain consensus write and outputs receipt details', async () => {
    console.log('--- START TEST: simulates blockchain consensus write ---')
    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )
    
    // Step 1: Select Doctor role and proceed
    await act(async () => {
      fireEvent.click(screen.getByText(/Doctor/i))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    })

    // Step 2: Fill Personal Information and proceed
    const nameInput = await screen.findByPlaceholderText(/Dr\. Sarah Miller/i)
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Dr. Sarah Miller' } })
      fireEvent.change(screen.getByPlaceholderText(/hospital\.com/i), { target: { value: 'doctor@hospital.org' } })
      fireEvent.change(screen.getByPlaceholderText(/\+14155552671/i), { target: { value: '+14155552671' } })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    })

    // Wait for Step 3 professional page to load
    await screen.findByText(/Step 3: Professional Information/i)

    // Step 3: Fill Professional Information and proceed
    const regNoInput = await screen.findByPlaceholderText(/MC-98472/i)
    await act(async () => {
      fireEvent.change(regNoInput, { target: { value: 'MC-98472' } })
      fireEvent.change(screen.getByPlaceholderText(/Cardiology Department/i), { target: { value: 'Cardiology Department' } })
      fireEvent.change(screen.getByPlaceholderText(/Metro General Hospital/i), { target: { value: 'Cardiology Department' } })
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. 8/i), { target: { value: '8' } })
      
      const selects = screen.getAllByRole('combobox')
      fireEvent.change(selects[0], { target: { value: 'Cardiology' } })
      fireEvent.change(container.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } })
    })
    
    // Wait and click Next Step
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))
    })

    // Wait for Step 4 review page to load
    await screen.findByText(/Blockchain Attribute Review/i)

    // Step 4: Review Details and proceed
    const nextStep4Btn = await screen.findByRole('button', { name: /Next Step/i })
    await act(async () => {
      fireEvent.click(nextStep4Btn)
    })

    // Wait for Step 5 enroll page to load
    await screen.findByText(/Enroll Cryptographic Identity Node/i)

    // Step 5: Click Enroll Identity
    const enrollBtn = await screen.findByRole('button', { name: /Enroll Identity/i })
    console.log('--- Clicking Enroll Identity ---')
    await act(async () => {
      fireEvent.click(enrollBtn)
    })
    
    // Check loading indicator
    expect(screen.getByText(/Enroll Cryptographic Identity Node/i)).toBeInTheDocument()
    
    // Wait for all async actions in handleEnrollIdentity to resolve and render
    console.log('--- Flushing async microtasks inside act ---')
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })
    
    console.log('--- DOM Text Content after flushing: ---')
    console.log(document.body.textContent)
    
    // Wait for success text to appear in DOM (since delay is only 1ms in tests)
    console.log('--- Waiting for SUCCESS text ---')
    const successEls = await screen.findAllByText(/SUCCESS/i, {}, { timeout: 5000 })
    expect(successEls.length).toBeGreaterThan(0)
    console.log('--- SUCCESS text found ---')
    
    expect(screen.getByText(/Dr. Sarah Miller/i)).toBeInTheDocument()
    expect(screen.getByText(/Cardiology Department/i)).toBeInTheDocument()
    expect(screen.getByText(/Consensus Block Hash/i)).toBeInTheDocument()
  }, 30000)
})
