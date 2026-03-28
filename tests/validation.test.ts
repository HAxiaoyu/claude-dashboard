import { describe, it, expect } from 'vitest'
import { createSkillSchema, settingsSchema, isValidPath, sanitizePath } from '../src/server/validation'

describe('Validation', () => {
  describe('createSkillSchema', () => {
    it('validates a valid skill name', () => {
      const result = createSkillSchema.safeParse({ name: 'my-skill' })
      expect(result.success).toBe(true)
    })

    it('rejects empty name', () => {
      const result = createSkillSchema.safeParse({ name: '' })
      expect(result.success).toBe(false)
    })

    it('rejects name with special characters', () => {
      const result = createSkillSchema.safeParse({ name: 'my skill!' })
      expect(result.success).toBe(false)
    })

    it('accepts optional description', () => {
      const result = createSkillSchema.safeParse({ name: 'my-skill', description: 'A test skill' })
      expect(result.success).toBe(true)
    })
  })

  describe('settingsSchema', () => {
    it('validates valid model', () => {
      const result = settingsSchema.safeParse({ model: 'sonnet' })
      expect(result.success).toBe(true)
    })

    it('validates valid theme', () => {
      const result = settingsSchema.safeParse({ theme: 'dark' })
      expect(result.success).toBe(true)
    })

    it('validates env variables', () => {
      const result = settingsSchema.safeParse({ env: { DEBUG: 'true' } })
      expect(result.success).toBe(true)
    })
  })

  describe('isValidPath', () => {
    it('accepts valid names', () => {
      expect(isValidPath('my-skill')).toBe(true)
      expect(isValidPath('my_skill')).toBe(true)
      expect(isValidPath('myskill123')).toBe(true)
    })

    it('rejects path traversal', () => {
      expect(isValidPath('../etc/passwd')).toBe(false)
      expect(isValidPath('..\\windows\\system32')).toBe(false)
    })

    it('rejects paths with slashes', () => {
      expect(isValidPath('path/to/file')).toBe(false)
    })

    it('rejects hidden files', () => {
      expect(isValidPath('.env')).toBe(false)
    })
  })

  describe('sanitizePath', () => {
    it('replaces special characters with dash', () => {
      expect(sanitizePath('my skill')).toBe('my-skill')
      expect(sanitizePath('my@skill!')).toBe('my-skill-')
    })

    it('keeps valid characters', () => {
      expect(sanitizePath('my-skill_123')).toBe('my-skill_123')
    })
  })
})