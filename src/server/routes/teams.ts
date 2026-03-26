import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'

const router = Router()

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const TEAMS_DIR = path.join(CLAUDE_DIR, 'teams')
const TASKS_DIR = path.join(CLAUDE_DIR, 'tasks')

interface TeamMember {
  name: string
  agentId: string
  agentType: string
}

interface TeamConfig {
  name: string
  description?: string
  members?: TeamMember[]
  createdAt?: string
}

interface Task {
  id: string
  subject: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  owner?: string
  blockedBy?: string[]
  blocks?: string[]
  createdAt?: string
}

router.get('/', (_, res) => {
  try {
    if (!fs.existsSync(TEAMS_DIR)) {
      return res.json({ teams: [] })
    }

    const entries = fs.readdirSync(TEAMS_DIR, { withFileTypes: true })
    const teams: Array<{ name: string; path: string }> = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const configPath = path.join(TEAMS_DIR, entry.name, 'config.json')
        if (fs.existsSync(configPath)) {
          teams.push({
            name: entry.name,
            path: path.join(TEAMS_DIR, entry.name)
          })
        }
      }
    }

    res.json({ teams })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read teams' })
  }
})

router.get('/:name', (req, res) => {
  try {
    const teamName = req.params.name
    const configPath = path.join(TEAMS_DIR, teamName, 'config.json')

    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: 'Team not found' })
    }

    const content = fs.readFileSync(configPath, 'utf-8')
    const config: TeamConfig = JSON.parse(content)

    res.json({
      team: {
        path: path.join(TEAMS_DIR, teamName),
        ...config
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read team' })
  }
})

router.get('/:name/tasks', (req, res) => {
  try {
    const teamName = req.params.name
    const tasksPath = path.join(TASKS_DIR, teamName)

    if (!fs.existsSync(tasksPath)) {
      return res.json({ tasks: [] })
    }

    const entries = fs.readdirSync(tasksPath, { withFileTypes: true })
    const tasks: Task[] = []

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const taskPath = path.join(tasksPath, entry.name)
        const content = fs.readFileSync(taskPath, 'utf-8')
        const task: Task = JSON.parse(content)
        task.id = entry.name.replace('.json', '')
        tasks.push(task)
      }
    }

    res.json({ tasks })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read tasks' })
  }
})

router.get('/:name/messages', (req, res) => {
  try {
    const teamName = req.params.name
    const messagesPath = path.join(TEAMS_DIR, teamName, 'messages.jsonl')

    if (!fs.existsSync(messagesPath)) {
      return res.json({ messages: [] })
    }

    const content = fs.readFileSync(messagesPath, 'utf-8')
    const lines = content.trim().split('\n')
    const messages = lines.map((line, index) => {
      try {
        return JSON.parse(line)
      } catch {
        return { id: index, raw: line }
      }
    })

    res.json({ messages })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read messages' })
  }
})

export { router }