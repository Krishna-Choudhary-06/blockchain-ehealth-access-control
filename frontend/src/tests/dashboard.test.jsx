import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, vi } from 'vitest'
import Dashboard from '../pages/Dashboard'
import { useAuth } from '../hooks/useAuth'

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

describe('Dashboard Component', () => {
  test('renders Patient dashboard summary cards and access logs', () => {
    useAuth.mockReturnValue({
      user: { name: 'Alice Carter', role: 'Patient' }
    })

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/Workspace Overview/i)).toBeInTheDocument()
    expect(screen.getByText(/My Enrolled Files/i)).toBeInTheDocument()
    expect(screen.getByText(/Authorized Doctors/i)).toBeInTheDocument()
    expect(screen.getByText(/Active Access Requests/i)).toBeInTheDocument()
    
    // Access Logs Table
    expect(screen.getByText(/Consensus Access Logs/i)).toBeInTheDocument()
    expect(screen.getByText(/User/i)).toBeInTheDocument()
    expect(screen.getByText(/System Role/i)).toBeInTheDocument()
  })

  test('renders Doctor dashboard summary cards', () => {
    useAuth.mockReturnValue({
      user: { name: 'Dr. Sarah Miller', role: 'Doctor' }
    })

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/Assigned Patients/i)).toBeInTheDocument()
    expect(screen.getByText(/Requests Pending/i)).toBeInTheDocument()
    expect(screen.getByText(/Successful File Reads/i)).toBeInTheDocument()
  })

  test('renders Admin dashboard summary cards', () => {
    useAuth.mockReturnValue({
      user: { name: 'Admin Root', role: 'Admin' }
    })

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/Peer Nodes Connected/i)).toBeInTheDocument()
    expect(screen.getByText(/Registered Network Users/i)).toBeInTheDocument()
    expect(screen.getByText(/Total Blocks Mined/i)).toBeInTheDocument()
  })

  test('renders Nurse dashboard summary cards', () => {
    useAuth.mockReturnValue({
      user: { name: 'Nurse Kelly Smith', role: 'Nurse' }
    })

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    
    expect(screen.getByText(/Lab Reports Accessible/i)).toBeInTheDocument()
    expect(screen.getByText(/Access Requests Granted/i)).toBeInTheDocument()
    expect(screen.getByText(/Pending Action Items/i)).toBeInTheDocument()
  })
})
