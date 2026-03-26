import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'

const router = Router()

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const SESSIONS_DIR = path.join(CLAUDE_DIR, 'sessions')
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects')
const HISTORY_FILE = path.join(CLAUDE_DIR, 'history.jsonl')

interface Session {
  id: string
  path: string
  createdAt?: string
  modifiedAt?: string
}

interface HistoryEntry {
  timestamp?: number
  sessionId?: string
  display?: string
  project?: string
  [key: string]: unknown
}

interface ConversationMessage {
  type: string
  role?: string
  content?: string | unknown[]
  timestamp?: string
  uuid?: string
}

router.get('/', (_, res) => {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      return res.json({ sessions: [] })
    }

    const entries = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true })
    const sessions: Session[] = []

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const filePath = path.join(SESSIONS_DIR, entry.name)
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
          const stats = fs.statSync(filePath)
          sessions.push({
            id: content.sessionId || entry.name.replace('.json', ''),
            path: content.cwd || filePath,
            createdAt: new Date(content.startedAt || stats.birthtime).toISOString(),
            modifiedAt: stats.mtime.toISOString()
          })
        } catch {
          // Skip invalid files
        }
      } else if (entry.isDirectory()) {
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

// Get conversation content for a session
router.get('/:id/conversation', (req, res) => {
  try {
    const sessionId = req.params.id

    // Find the project directory that contains this session
    if (!fs.existsSync(PROJECTS_DIR)) {
      return res.status(404).json({ error: 'No projects found' })
    }

    const projectDirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)

    let conversationFile = ''
    let foundProject = ''

    // Search for the session file in all projects
    for (const projectDir of projectDirs) {
      const possibleFile = path.join(PROJECTS_DIR, projectDir, `${sessionId}.jsonl`)
      if (fs.existsSync(possibleFile)) {
        conversationFile = possibleFile
        foundProject = projectDir
        break
      }
    }

    if (!conversationFile) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    const content = fs.readFileSync(conversationFile, 'utf-8')
    const lines = content.trim().split('\n').filter(line => line.trim())

    const messages: ConversationMessage[] = []
    let projectCwd = ''

    for (const line of lines) {
      try {
        const entry = JSON.parse(line)

        if (entry.type === 'user' && entry.message) {
          messages.push({
            type: 'user',
            role: 'user',
            content: typeof entry.message.content === 'string'
              ? entry.message.content
              : JSON.stringify(entry.message.content, null, 2),
            timestamp: entry.timestamp,
            uuid: entry.uuid
          })
          if (entry.cwd) projectCwd = entry.cwd
        } else if (entry.type === 'assistant' && entry.message) {
          // Handle assistant messages
          let textContent = ''
          if (entry.message.content && Array.isArray(entry.message.content)) {
            for (const block of entry.message.content) {
              if (block.type === 'text' && block.text) {
                textContent += block.text
              } else if (block.type === 'thinking' && block.thinking) {
                textContent += `[Thinking]\n${block.thinking}\n\n`
              } else if (block.type === 'tool_use') {
                textContent += `\n[Tool: ${block.name}]\n`
              }
            }
          } else if (typeof entry.message.content === 'string') {
            textContent = entry.message.content
          }

          messages.push({
            type: 'assistant',
            role: 'assistant',
            content: textContent,
            timestamp: entry.timestamp,
            uuid: entry.uuid
          })
        } else if (entry.type === 'tool_result') {
          // Tool results can be appended or shown separately
          messages.push({
            type: 'tool_result',
            role: 'tool',
            content: typeof entry.content === 'string'
              ? entry.content.substring(0, 5000) // Limit tool result size
              : JSON.stringify(entry.content, null, 2).substring(0, 5000),
            timestamp: entry.timestamp,
            uuid: entry.uuid
          })
        }
      } catch {
        // Skip invalid lines
      }
    }

    res.json({
      sessionId,
      project: foundProject,
      cwd: projectCwd,
      messageCount: messages.length,
      messages
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read conversation' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const sessionId = req.params.id

    // Check sessions directory for metadata
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`)
    if (fs.existsSync(sessionFile)) {
      const content = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'))
      const stats = fs.statSync(sessionFile)
      return res.json({
        session: {
          id: sessionId,
          pid: content.pid,
          cwd: content.cwd,
          startedAt: content.startedAt,
          kind: content.kind,
          entrypoint: content.entrypoint,
          path: sessionFile,
          createdAt: new Date(content.startedAt || stats.birthtime).toISOString(),
          modifiedAt: stats.mtime.toISOString()
        }
      })
    }

    // Check if it's a directory
    const sessionPath = path.join(SESSIONS_DIR, sessionId)
    if (fs.existsSync(sessionPath)) {
      const stats = fs.statSync(sessionPath)
      const entries = fs.readdirSync(sessionPath, { withFileTypes: true })

      return res.json({
        session: {
          id: sessionId,
          path: sessionPath,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          files: entries.filter(e => e.isFile()).map(e => e.name)
        }
      })
    }

    res.status(404).json({ error: 'Session not found' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read session' })
  }
})

export { router }