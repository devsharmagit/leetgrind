// Integration tests for LeetCode API
import { validateLeetCodeUsername } from '../leetcode'

// Mock fetch for integration tests
global.fetch = jest.fn()

describe('LeetCode API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should validate existing LeetCode username', async () => {
    const mockResponse = {
      data: {
        matchedUser: {
          username: 'testuser',
        },
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await validateLeetCodeUsername('testuser')

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should reject non-existent LeetCode username', async () => {
    const mockResponse = {
      data: {
        matchedUser: null,
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await validateLeetCodeUsername('nonexistentuser1234567890')

    expect(result.valid).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('should handle network errors with retry', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const result = await validateLeetCodeUsername('testuser')

    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
    // Should retry 2 times (3 attempts total)
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('should handle server errors with retry', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            matchedUser: {
              username: 'testuser',
            },
          },
        }),
      })

    const result = await validateLeetCodeUsername('testuser')

    expect(result.valid).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('should handle timeout errors', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    
    ;(global.fetch as jest.Mock).mockRejectedValue(abortError)

    const result = await validateLeetCodeUsername('testuser')

    expect(result.valid).toBe(false)
    expect(result.error).toContain('timed out')
  })

  it('should make correct GraphQL request', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          matchedUser: {
            username: 'testuser',
          },
        },
      }),
    })

    await validateLeetCodeUsername('testuser')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://leetcode.com/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('matchedUser'),
      })
    )
  })

  it('should handle malformed API responses', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const result = await validateLeetCodeUsername('testuser')

    expect(result.valid).toBe(false)
    expect(result.error).toContain('not found')
  })
})
