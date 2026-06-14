import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { webcrypto } from 'crypto'

// Mock missing browser APIs in JSDOM environment
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = vi.fn(() => 'mock-object-url')
  window.URL.revokeObjectURL = vi.fn()
  
  if (window) {
    Object.defineProperty(window, 'crypto', {
      value: webcrypto,
      writable: true,
      configurable: true
    })
  }
}

