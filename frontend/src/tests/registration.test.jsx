import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import Register from '../pages/Register'
import toast from 'react-hot-toast'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn()
  }
}))

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
    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )
    
    // Step 1: Select Doctor role and proceed
    fireEvent.click(screen.getByText(/Doctor/i))
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))

    // Step 2: Fill Personal Information and proceed
    const nameInput = await screen.findByPlaceholderText(/Dr\. Sarah Miller/i)
    fireEvent.change(nameInput, { target: { value: 'Dr. Sarah Miller' } })
    fireEvent.change(screen.getByPlaceholderText(/hospital\.com/i), { target: { value: 'doctor@hospital.org' } })
    fireEvent.change(screen.getByPlaceholderText(/\+14155552671/i), { target: { value: '+14155552671' } })
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))

    // Step 3: Fill Professional Information and proceed
    const regNoInput = await screen.findByPlaceholderText(/MC-98472/i)
    fireEvent.change(regNoInput, { target: { value: 'MC-98472' } })
    fireEvent.change(screen.getByPlaceholderText(/Cardiology Department/i), { target: { value: 'Cardiology Department' } })
    fireEvent.change(screen.getByPlaceholderText(/Metro General Hospital/i), { target: { value: 'Cardiology Department' } })
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 8/i), { target: { value: '8' } })
    
    // Choose Specialization & license expiry
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'Cardiology' } })
    fireEvent.change(container.querySelector('input[type="date"]'), { target: { value: '2026-12-31' } })
    
    // Wait and click Next Step
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }))

    // Step 4: Review Details and proceed
    const nextStep4Btn = await screen.findByRole('button', { name: /Next Step/i })
    fireEvent.click(nextStep4Btn)

    // Step 5: Click Enroll Identity
    const enrollBtn = await screen.findByRole('button', { name: /Enroll Identity/i })
    fireEvent.click(enrollBtn)
    
    // Check loading indicator
    expect(screen.getByText(/Enroll Cryptographic Identity Node/i)).toBeInTheDocument()
    
    // Wait for success text to appear in DOM (since delay is only 1ms in tests)
    const successEl = await screen.findByText(/SUCCESS/i, {}, { timeout: 15000 })
    expect(successEl).toBeInTheDocument()
    
    expect(screen.getByText(/Dr. Sarah Miller/i)).toBeInTheDocument()
    expect(screen.getByText(/Cardiology Department/i)).toBeInTheDocument()
    expect(screen.getByText(/Consensus Block Hash/i)).toBeInTheDocument()
  })
})
