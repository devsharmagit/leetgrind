// Integration tests for username validation
import {
  validateUsernameFormat,
  normalizeUsername,
} from '../validation'

describe('Username Validation Integration', () => {
  describe('validateUsernameFormat', () => {
    it('should accept valid usernames', () => {
      const validUsernames = [
        'john_doe',
        'user123',
        'test-user',
        'valid_username-123',
        'abc',
        'a'.repeat(30), // max length
      ]

      validUsernames.forEach((username) => {
        const result = validateUsernameFormat(username)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it('should reject empty or null usernames', () => {
      const result1 = validateUsernameFormat('')
      expect(result1.valid).toBe(false)
      expect(result1.error).toContain('cannot be empty')
    })

    it('should reject usernames that are too short', () => {
      const result = validateUsernameFormat('ab')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too short')
    })

    it('should reject usernames that are too long', () => {
      const result = validateUsernameFormat('a'.repeat(31))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too long')
    })

    it('should reject usernames with invalid characters', () => {
      const invalidUsernames = [
        'user@123',
        'user name',
        'user.name',
        'user#123',
        'user!',
        'user$dollar',
      ]

      invalidUsernames.forEach((username) => {
        const result = validateUsernameFormat(username)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('invalid characters')
      })
    })

    it('should accept hyphens and underscores', () => {
      const result1 = validateUsernameFormat('user-name')
      const result2 = validateUsernameFormat('user_name')
      const result3 = validateUsernameFormat('user-name_123')

      expect(result1.valid).toBe(true)
      expect(result2.valid).toBe(true)
      expect(result3.valid).toBe(true)
    })
  })

  describe('normalizeUsername', () => {
    it('should trim whitespace', () => {
      expect(normalizeUsername('  username  ')).toBe('username')
      expect(normalizeUsername('username ')).toBe('username')
      expect(normalizeUsername(' username')).toBe('username')
    })

    it('should preserve case', () => {
      expect(normalizeUsername('UserName')).toBe('UserName')
      expect(normalizeUsername('USERNAME')).toBe('USERNAME')
      expect(normalizeUsername('username')).toBe('username')
    })

    it('should handle already normalized usernames', () => {
      expect(normalizeUsername('username')).toBe('username')
    })

    it('should handle empty strings', () => {
      expect(normalizeUsername('')).toBe('')
      expect(normalizeUsername('   ')).toBe('')
    })
  })

  describe('Validation Flow Integration', () => {
    it('should validate normalized usernames correctly', () => {
      // Test the typical flow: normalize then validate
      const inputs = [
        '  validuser  ',
        ' test_user ',
        '  user-123  ',
      ]

      inputs.forEach((input) => {
        const normalized = normalizeUsername(input)
        const validation = validateUsernameFormat(normalized)
        expect(validation.valid).toBe(true)
      })
    })

    it('should reject invalid usernames even after normalization', () => {
      const inputs = [
        '  ab  ', // too short
        ' a '.repeat(32), // too long after trim
        '  user@name  ', // invalid chars
      ]

      inputs.forEach((input) => {
        const normalized = normalizeUsername(input)
        const validation = validateUsernameFormat(normalized)
        expect(validation.valid).toBe(false)
      })
    })
  })
})
