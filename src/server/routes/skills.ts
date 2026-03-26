import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'

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

export { router }