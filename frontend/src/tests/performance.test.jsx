import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import Performance from '../pages/Performance'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('Performance Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('renders all options, chart titles, and action controls', () => {
    render(<Performance />)
    
    expect(screen.getByText(/Performance Experiments/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Run/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument()
    
    // Check chart titles
    expect(screen.getByText(/Figure 2: Latency vs Transaction Count/i)).toBeInTheDocument()
    expect(screen.getByText(/Figure 3: Throughput vs Workload/i)).toBeInTheDocument()
    expect(screen.getByText(/Figure 4: Communication Network Overhead/i)).toBeInTheDocument()
    expect(screen.getByText(/Computation Overhead/i)).toBeInTheDocument()
  })

  test('triggers experiment running, advances progress, and completes simulation', () => {
    render(<Performance />)
    
    const runBtn = screen.getByRole('button', { name: /Run/i })
    fireEvent.click(runBtn)
    
    // Should show setting up cluster message
    expect(screen.getByText(/Setting up local Web3 benchmark/i)).toBeInTheDocument()
    
    // Fast-forward timers
    act(() => {
      vi.runAllTimers()
    })
    
    // Should show completed simulation message
    expect(screen.getByText(/Experiment complete/i)).toBeInTheDocument()
  })

  test('renders literature comparison grid', () => {
    render(<Performance />)
    
    expect(screen.getByText(/Literature Benchmarking Comparison Matrix/i)).toBeInTheDocument()
    expect(screen.getAllByText('MedRec').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MedShare').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MedChain').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Proposed Method').length).toBeGreaterThan(0)
  })
})
