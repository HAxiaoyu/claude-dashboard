import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import chokidar from 'chokidar'
import path from 'path'
import { fileURLToPath } from 'url'
import open from 'open'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLAUDE_DIR = path.join(os.homedir(), '.claude')

// WebSocket clients set
const clients = new Set<WebSocket>()

// Broadcast to all connected clients
function broadcast(type: string, data?: unknown) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() })
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

// Watch for file changes in .claude directory
function setupFileWatcher() {
  const watcher = chokidar.watch(CLAUDE_DIR, {
    ignored: [
      /(^|[\/\\])\../, // dotfiles
      /node_modules/,
      /\.git/,
      /messages\.jsonl$/, // Too frequent updates
      /history\.jsonl$/, // Too frequent updates
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  })

  // Skills changes
  watcher.on('addDir', (filePath) => {
    if (filePath.includes('skills')) {
      broadcast('skills:added', { path: filePath })
    }
    if (filePath.includes('agents')) {
      broadcast('agents:added', { path: filePath })
    }
    if (filePath.includes('teams')) {
      broadcast('teams:added', { path: filePath })
    }
  })

  watcher.on('unlinkDir', (filePath) => {
    if (filePath.includes('skills')) {
      broadcast('skills:removed', { path: filePath })
    }
    if (filePath.includes('agents')) {
      broadcast('agents:removed', { path: filePath })
    }
    if (filePath.includes('teams')) {
      broadcast('teams:removed', { path: filePath })
    }
  })

  watcher.on('add', (filePath) => {
    if (filePath.includes('skills') && filePath.endsWith('SKILL.md')) {
      broadcast('skills:added', { path: filePath })
    }
    if (filePath.includes('agents') && filePath.endsWith('.md')) {
      broadcast('agents:added', { path: filePath })
    }
    if (filePath.includes('teams') && filePath.endsWith('config.json')) {
      broadcast('teams:added', { path: filePath })
    }
    if (filePath.includes('tasks') && filePath.endsWith('.json')) {
      broadcast('tasks:added', { path: filePath })
    }
  })

  watcher.on('unlink', (filePath) => {
    if (filePath.includes('skills') && filePath.endsWith('SKILL.md')) {
      broadcast('skills:removed', { path: filePath })
    }
    if (filePath.includes('agents') && filePath.endsWith('.md')) {
      broadcast('agents:removed', { path: filePath })
    }
    if (filePath.includes('teams') && filePath.endsWith('config.json')) {
      broadcast('teams:removed', { path: filePath })
    }
    if (filePath.includes('tasks') && filePath.endsWith('.json')) {
      broadcast('tasks:removed', { path: filePath })
    }
  })

  watcher.on('change', (filePath) => {
    if (filePath.includes('skills') && filePath.endsWith('SKILL.md')) {
      broadcast('skills:changed', { path: filePath })
    }
    if (filePath.includes('agents') && filePath.endsWith('.md')) {
      broadcast('agents:changed', { path: filePath })
    }
    if (filePath.includes('teams') && filePath.endsWith('config.json')) {
      broadcast('teams:changed', { path: filePath })
    }
    if (filePath.includes('tasks') && filePath.endsWith('.json')) {
      broadcast('tasks:changed', { path: filePath })
    }
    if (filePath.endsWith('settings.json') || filePath.endsWith('settings.local.json')) {
      broadcast('settings:changed', { path: filePath })
    }
  })

  return watcher
}

export async function startServer(options: { port: number; noOpen: boolean }) {
  const app = express()
  const server = createServer(app)
  const wss = new WebSocketServer({ server, path: '/ws' })

  app.use(cors())
  app.use(express.json())

  // API routes
  const { router: skillsRouter } = await import('./routes/skills.js')
  const { router: agentsRouter } = await import('./routes/agents.js')
  const { router: teamsRouter } = await import('./routes/teams.js')
  const { router: sessionsRouter } = await import('./routes/sessions.js')
  const { router: settingsRouter } = await import('./routes/settings.js')

  app.use('/api/skills', skillsRouter)
  app.use('/api/agents', agentsRouter)
  app.use('/api/teams', teamsRouter)
  app.use('/api/sessions', sessionsRouter)
  app.use('/api/settings', settingsRouter)

  // Serve static files in production
  const distPath = path.join(__dirname, '../../dist')
  app.use(express.static(distPath))
  app.get('*', (_, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })

  // WebSocket handling
  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws)
    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }))

    ws.on('close', () => {
      clients.delete(ws)
    })

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString())
        // Handle ping/pong for keepalive
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
        }
      } catch {
        // Ignore invalid messages
      }
    })
  })

  // Setup file watcher for real-time updates
  const watcher = setupFileWatcher()

  server.listen(options.port, () => {
    console.log(`Claude Dashboard running at http://localhost:${options.port}`)
    if (!options.noOpen) {
      open(`http://localhost:${options.port}`)
    }
  })

  // Cleanup on process exit
  process.on('SIGINT', () => {
    watcher.close()
    server.close()
    process.exit(0)
  })
}

// CLI entry point
const args = process.argv.slice(2)
const portIndex = args.indexOf('--port')
const port = portIndex > -1 ? parseInt(args[portIndex + 1]) : 3000
const noOpen = args.includes('--no-open')

startServer({ port, noOpen })