import { render, screen, fireEvent, act } from '@testing-library/react'
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

  test('renders all form fields and submit button', () => {
    render(<Register />)
    
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/System Role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Organization/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Register on Blockchain/i })).toBeInTheDocument()
  })

  test('shows warning toast on submit empty fields', () => {
    render(<Register />)
    const submitBtn = screen.getByRole('button', { name: /Register on Blockchain/i })
    
    fireEvent.click(submitBtn)
    // Should trigger toast.error
    expect(toast.error).toHaveBeenCalledWith('Please enter a valid name.')
  })

  test('simulates blockchain consensus write and outputs receipt details', async () => {
    render(<Register />)
    
    // Fill fields
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Dr. Sarah Miller' } })
    fireEvent.change(screen.getByLabelText(/System Role/i), { target: { value: 'Doctor' } })
    fireEvent.change(screen.getByLabelText(/Organization/i), { target: { value: 'Cardiology Department' } })
    
    const submitBtn = screen.getByRole('button', { name: /Register on Blockchain/i })
    fireEvent.click(submitBtn)
    
    // Check loading indicator
    expect(screen.getByText(/User Identity Registration/i)).toBeInTheDocument()
    
    // Wait for success text to appear in DOM (since delay is only 1ms in tests)
    const successEl = await screen.findByText(/SUCCESS/i, {}, { timeout: 15000 })
    expect(successEl).toBeInTheDocument()
    
    expect(screen.getByText(/Dr. Sarah Miller/i)).toBeInTheDocument()
    expect(screen.getByText(/Cardiology Department/i)).toBeInTheDocument()
    expect(screen.getByText(/Certificate ID/i)).toBeInTheDocument()
    expect(screen.getByText(/Transaction ID/i)).toBeInTheDocument()
  })
})
