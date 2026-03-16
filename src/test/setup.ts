import '@testing-library/jest-dom'
import { vi } from 'vitest'

// React.cache() is a server-side API not available in the Vitest/jsdom environment.
// Replace it with an identity wrapper so service modules that use cache() import cleanly.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return { ...actual, cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn }
})
