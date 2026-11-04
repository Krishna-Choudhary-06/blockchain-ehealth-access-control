import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import Login from '../pages/Login'
import { useAuth } from '../hooks/useAuth'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>
}))

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('Login Component', () => {
  test('renders email and password inputs, role dropdown, and submit button', () => {
    useAuth.mockReturnValue({
      login: vi.fn(),
      isAuthenticated: false
    })

    render(<Login />)
    
    expect(screen.getByPlaceholderText(/user@hospital.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Access Role \(Simulation\)/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Login to Dashboard/i })).toBeInTheDocument()
  })

  test('calls login and navigates upon submit with valid credentials', async () => {
    const mockLoginFn = vi.fn(() => Promise.resolve({ name: 'Dr. Sarah Miller' }))
    useAuth.mockReturnValue({
      login: mockLoginFn,
      isAuthenticated: false
    })

    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText(/user@hospital.com/i), { target: { value: 'doctor@hospital.org' } })
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Access Role \(Simulation\)/i), { target: { value: 'Doctor' } })

    const submitBtn = screen.getByRole('button', { name: /Login to Dashboard/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockLoginFn).toHaveBeenCalledWith('doctor@hospital.org', 'password123', 'Doctor')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })
})
