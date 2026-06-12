import { describe, it, expect, vi, afterEach } from 'vitest'
import { downloadCertificate } from './certificate'

// Canvas 2D rendering is not meaningfully testable in jsdom, so we only pin
// the module surface and the no-context early-return guard.
describe('certificate module surface', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exports downloadCertificate as a function', () => {
    expect(typeof downloadCertificate).toBe('function')
  })

  it('bails out gracefully when no 2D context is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    expect(() =>
      downloadCertificate({
        id: 'cert1',
        courseId: 'c1',
        courseTitle: 'Test course',
        learnerName: 'Test Learner',
        issuedAt: '2026-06-12T00:00:00.000Z',
        score: 95
      } as Parameters<typeof downloadCertificate>[0])
    ).not.toThrow()
  })
})
