import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import Login from '../pages/Login'
import { useAuth } from '../hooks/useAuth'

// Mock react-router-dom partially using importOriginal
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/login', search: '', hash: '', state: null }),
  }
})

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
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders welcome screen and proceeds to lookup', async () => {
    useAuth.mockReturnValue({
      login: vi.fn(),
      isAuthenticated: false
    })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/Access Blockchain Healthcare Network/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authenticate Workspace Node/i })).toBeInTheDocument()

    // Navigate to step 2
    fireEvent.click(screen.getByRole('button', { name: /Authenticate Workspace Node/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/Step 2: Identity Verification/i)).toBeInTheDocument()
    })
  })

  test('calls login and navigates upon submit with valid credentials', async () => {
    // Seed mock registered users in localStorage
    const testUser = {
      userId: 'UID-123456',
      name: 'Dr. Sarah Miller',
      role: 'Doctor',
      organization: 'Cardiology Dept',
      publicKey: 'mock-pub-key'
    }
    localStorage.setItem('registered_users', JSON.stringify([testUser]))
    localStorage.setItem('user_keys_Dr. Sarah Miller', JSON.stringify({
      ...testUser,
      email: 'doctor@hospital.org',
      privateKey: 'mock-priv-key'
    }))

    const mockLoginFn = vi.fn(() => Promise.resolve({ name: 'Dr. Sarah Miller' }))
    useAuth.mockReturnValue({
      login: mockLoginFn,
      isAuthenticated: false
    })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    // Step 1: Click Welcome proceed button
    fireEvent.click(screen.getByRole('button', { name: /Authenticate Workspace Node/i }))

    // Step 2: Fill Lookup and submit
    const lookupInput = await screen.findByPlaceholderText(/e.g. UID-684718/i)
    fireEvent.change(lookupInput, { target: { value: 'UID-123456' } })
    fireEvent.click(screen.getByRole('button', { name: /Query Identity Node/i }))

    // Step 3: Role & Organization Verification (wait for it to appear - lookup takes 1.2s)
    const proceedBtn = await screen.findByRole('button', { name: /Proceed to Key Authentication/i }, { timeout: 5000 })
    fireEvent.click(proceedBtn)

    // Step 4: Credentials form (LoginForm)
    const passwordInput = await screen.findByPlaceholderText(/••••••••/i, {}, { timeout: 5000 })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /Authenticate Identity/i }))

    // Step 5: Progressive On-chain Verification checks (takes ~5 seconds)
    // Wait for the login function to be called and redirection to occur
    await waitFor(() => {
      expect(mockLoginFn).toHaveBeenCalledWith('doctor@hospital.org', 'password123', 'Doctor')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    }, { timeout: 10000 })
  }, 30000) // 30 seconds test timeout
})
