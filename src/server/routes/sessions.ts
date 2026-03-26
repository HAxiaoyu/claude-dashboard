import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'

const router = Router()

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const SESSIONS_DIR = path.join(CLAUDE_DIR, 'sessions')
const HISTORY_FILE = path.join(CLAUDE_DIR, 'history.jsonl')

interface Session {
  id: string
  path: string
  createdAt?: string
  modifiedAt?: string
}

interface HistoryEntry {
  timestamp?: string
  sessionId?: string
  prompt?: string
  response?: string
  [key: string]: unknown
}

router.get('/', (_, res) => {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      return res.json({ sessions: [] })
    }

    const entries = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true })
    const sessions: Session[] = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sessionPath = path.join(SESSIONS_DIR, entry.name)
        const stats = fs.statSync(sessionPath)
        sessions.push({
          id: entry.name,
          path: sessionPath,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString()
        })
      }
    }

    res.json({ sessions })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read sessions' })
  }
})

router.get('/history', (_, res) => {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return res.json({ history: [] })
    }

    const content = fs.readFileSync(HISTORY_FILE, 'utf-8')
    const lines = content.trim().split('\n').filter(line => line.trim())
    const history: HistoryEntry[] = lines.map((line, index) => {
      try {
        return JSON.parse(line)
      } catch {
        return { id: index, raw: line }
      }
    })

    res.json({ history })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read history' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const sessionId = req.params.id
    const sessionPath = path.join(SESSIONS_DIR, sessionId)

    if (!fs.existsSync(sessionPath)) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const stats = fs.statSync(sessionPath)

    // Read session files
    const sessionData: Session & { files?: string[] } = {
      id: sessionId,
      path: sessionPath,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString()
    }

    const entries = fs.readdirSync(sessionPath, { withFileTypes: true })
    sessionData.files = entries
      .filter(e => e.isFile())
      .map(e => e.name)

    res.json({ session: sessionData })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read session' })
  }
})

export { router }