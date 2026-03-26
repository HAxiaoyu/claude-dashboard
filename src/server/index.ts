import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import path from 'path'
import { fileURLToPath } from 'url'
import open from 'open'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    console.log('WebSocket client connected')
    ws.on('message', (data: string) => {
      console.log('Received:', data)
    })
  })

  server.listen(options.port, () => {
    console.log(`Claude Dashboard running at http://localhost:${options.port}`)
    if (!options.noOpen) {
      open(`http://localhost:${options.port}`)
    }
  })
}

// CLI entry point
const args = process.argv.slice(2)
const portIndex = args.indexOf('--port')
const port = portIndex > -1 ? parseInt(args[portIndex + 1]) : 3000
const noOpen = args.includes('--no-open')

startServer({ port, noOpen })