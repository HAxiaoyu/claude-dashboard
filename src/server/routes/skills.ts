import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createSkillSchema, isValidPath, sanitizePath } from '../validation.js'

const router = Router()

const CLAUDE_DIR = path.join(os.homedir(), '.claude')

interface SkillMeta {
  name: string
  description: string
}

function parseSkillContent(content: string): SkillMeta {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  const meta: SkillMeta = { name: '', description: '' }

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m)

    if (nameMatch) meta.name = nameMatch[1].trim()
    if (descMatch) meta.description = descMatch[1].trim()
  }

  return meta
}

function getSkillsFromDir(dir: string, source: 'user' | 'plugin'): Array<{ name: string; description: string; source: string; path: string }> {
  const skills: Array<{ name: string; description: string; source: string; path: string }> = []

  if (!fs.existsSync(dir)) return skills

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isSymbolicLink() || entry.isDirectory()) {
      const skillDir = path.join(dir, entry.name)
      const skillFile = path.join(skillDir, 'SKILL.md')

      if (fs.existsSync(skillFile)) {
        const content = fs.readFileSync(skillFile, 'utf-8')
        const meta = parseSkillContent(content)
        skills.push({
          name: meta.name || entry.name,
          description: meta.description || '',
          source,
          path: skillDir
        })
      }
    }
  }

  return skills
}

router.get('/', (_, res) => {
  try {
    const userSkillsDir = path.join(CLAUDE_DIR, 'skills')
    const pluginCacheDir = path.join(CLAUDE_DIR, 'plugins', 'cache')

    const userSkills = getSkillsFromDir(userSkillsDir, 'user')

    let pluginSkills: Array<{ name: string; description: string; source: string; path: string }> = []
    if (fs.existsSync(pluginCacheDir)) {
      const pluginDirs = fs.readdirSync(pluginCacheDir, { withFileTypes: true })
      for (const pluginDir of pluginDirs) {
        if (pluginDir.isDirectory()) {
          const skillsPath = path.join(pluginCacheDir, pluginDir.name, 'skills')
          pluginSkills = pluginSkills.concat(getSkillsFromDir(skillsPath, 'plugin'))
        }
      }
    }

    res.json({ skills: [...userSkills, ...pluginSkills] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read skills' })
  }
})

router.get('/:name', (req, res) => {
  try {
    const skillName = req.params.name
    const userSkillPath = path.join(CLAUDE_DIR, 'skills', skillName, 'SKILL.md')

    if (fs.existsSync(userSkillPath)) {
      const content = fs.readFileSync(userSkillPath, 'utf-8')
      const meta = parseSkillContent(content)
      return res.json({
        skill: {
          name: meta.name || skillName,
          description: meta.description,
          source: 'user',
          path: path.join(CLAUDE_DIR, 'skills', skillName),
          content
        }
      })
    }

    const pluginCacheDir = path.join(CLAUDE_DIR, 'plugins', 'cache')
    if (fs.existsSync(pluginCacheDir)) {
      const pluginDirs = fs.readdirSync(pluginCacheDir, { withFileTypes: true })
      for (const pluginDir of pluginDirs) {
        const skillPath = path.join(pluginCacheDir, pluginDir.name, 'skills', skillName, 'SKILL.md')
        if (fs.existsSync(skillPath)) {
          const content = fs.readFileSync(skillPath, 'utf-8')
          const meta = parseSkillContent(content)
          return res.json({
            skill: {
              name: meta.name || skillName,
              description: meta.description,
              source: 'plugin',
              path: path.join(pluginCacheDir, pluginDir.name, 'skills', skillName),
              content
            }
          })
        }
      }
    }

    res.status(404).json({ error: 'Skill not found' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read skill' })
  }
})

// Create a new skill
router.post('/', (req, res) => {
  try {
    // Validate input with Zod
    const parsed = createSkillSchema.safeParse(req.body)
    if (!parsed.success) {
      const error = parsed.error
      const message = error.issues?.[0]?.message || 'Invalid input'
      return res.status(400).json({ error: message })
    }

    const { name, description, content } = parsed.data

    // Additional path safety check
    if (!isValidPath(name)) {
      return res.status(400).json({ error: 'Invalid skill name' })
    }

    const safeName = sanitizePath(name)
    const skillDir = path.join(CLAUDE_DIR, 'skills', safeName)
    const skillFile = path.join(skillDir, 'SKILL.md')

    if (fs.existsSync(skillFile)) {
      return res.status(409).json({ error: 'Skill already exists' })
    }

    // Create directory
    fs.mkdirSync(skillDir, { recursive: true })

    // Generate skill content
    const skillContent = content || `---
name: ${name}
description: ${description || 'A custom skill'}
---

# ${name}

TODO: Add skill content here.
`

    fs.writeFileSync(skillFile, skillContent, 'utf-8')

    res.status(201).json({
      skill: {
        name: safeName,
        description: description || '',
        source: 'user',
        path: skillDir
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create skill' })
  }
})

// Delete a skill
router.delete('/:name', (req, res) => {
  try {
    const skillName = req.params.name
    const skillDir = path.join(CLAUDE_DIR, 'skills', skillName)

    if (!fs.existsSync(skillDir)) {
      return res.status(404).json({ error: 'Skill not found' })
    }

    // Only allow deleting user skills, not plugin skills
    const skillPath = path.join(skillDir, 'SKILL.md')
    if (!fs.existsSync(skillPath)) {
      return res.status(404).json({ error: 'Skill not found' })
    }

    // Recursively delete the skill directory
    fs.rmSync(skillDir, { recursive: true, force: true })

    res.json({ success: true, message: `Skill '${skillName}' deleted` })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete skill' })
  }
})

export { router }