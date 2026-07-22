import { render, screen, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import Performance from '../pages/Performance'
import { getPerformanceStats } from '../services/apiService'

// Mock apiService
vi.mock('../services/apiService', () => ({
  getPerformanceStats: vi.fn()
}))

describe('Performance Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('shows loading indicator on mount and displays benchmark stats on success', async () => {
    getPerformanceStats.mockResolvedValueOnce({
      latency: 45,
      tps: 278,
      blockCommitTime: 500
    })

    render(<Performance />)

    expect(screen.getByText(/Loading benchmark stats/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Performance Experiments/i)).toBeInTheDocument()
      expect(screen.getByText(/45 ms/i)).toBeInTheDocument()
      expect(screen.getByText(/278 TPS/i)).toBeInTheDocument()
      expect(screen.getByText(/500 ms/i)).toBeInTheDocument()
    })
  })

  test('displays fallback empty state when API call fails', async () => {
    getPerformanceStats.mockRejectedValueOnce(new Error('Network Error'))

    render(<Performance />)

    await waitFor(() => {
      expect(screen.getByText(/No benchmark data available/i)).toBeInTheDocument()
    })
  })
})
