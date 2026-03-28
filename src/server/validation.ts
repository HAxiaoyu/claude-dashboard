import { z } from 'zod'

// Skill creation validation
export const createSkillSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(64, 'Name too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Name can only contain letters, numbers, dash, and underscore'),
  description: z.string().max(256, 'Description too long').optional(),
  content: z.string().optional()
})

// Settings update validation - simplified
export const settingsSchema = z.object({
  model: z.string().optional(),
  theme: z.string().optional(),
  includeCoAuthoredBy: z.boolean().optional(),
  env: z.record(z.string(), z.string()).optional(),
  permissions: z.any().optional(),
  mcpServers: z.any().optional(),
  hooks: z.any().optional(),
  enabledPlugins: z.any().optional()
}).passthrough()

// Path validation - prevent directory traversal
export function isValidPath(name: string): boolean {
  // Disallow path traversal patterns
  if (name.includes('..')) return false
  if (name.includes('/') || name.includes('\\')) return false
  if (name.startsWith('.')) return false
  return true
}

// Sanitize string for use in path
export function sanitizePath(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, '-')
}