import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'

const router = Router()

const USER_CLAUDE_DIR = path.join(os.homedir(), '.claude')

interface AgentInfo {
  id: string
  name: string
  type: string
  description: string
  status: 'idle' | 'running' | 'completed'
  source: 'builtin' | 'user' | 'project'
  path?: string
  content?: string
  tools?: string[]
  model?: string
}

// Built-in agent types from Claude Code
const BUILTIN_AGENTS: AgentInfo[] = [
  {
    id: 'general-purpose',
    name: 'General Purpose',
    type: 'general-purpose',
    description: 'General-purpose agent for researching complex questions, searching for code, and executing multi-step tasks',
    status: 'idle',
    source: 'builtin'
  },
  {
    id: 'explore',
    name: 'Explore',
    type: 'Explore',
    description: 'Fast agent specialized for exploring codebases. Use for file pattern matching, code search, and codebase questions',
    status: 'idle',
    source: 'builtin'
  },
  {
    id: 'plan',
    name: 'Plan',
    type: 'Plan',
    description: 'Software architect agent for designing implementation plans. Returns step-by-step plans and identifies critical files',
    status: 'idle',
    source: 'builtin'
  },
  {
    id: 'claude-code-guide',
    name: 'Claude Code Guide',
    type: 'claude-code-guide',
    description: 'Use for questions about Claude Code CLI features, hooks, slash commands, MCP servers, and settings',
    status: 'idle',
    source: 'builtin'
  }
]

function parseAgentContent(content: string): Partial<AgentInfo> {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  const meta: Partial<AgentInfo> = {}

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m)
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m)
    const modelMatch = frontmatter.match(/^model:\s*(.+)$/m)
    const toolsMatch = frontmatter.match(/^tools:\s*\n((?:  - .+\n?)+)/m)

    if (nameMatch) meta.name = nameMatch[1].trim()
    if (descMatch) meta.description = descMatch[1].trim()
    if (modelMatch) meta.model = modelMatch[1].trim()
    if (toolsMatch) {
      meta.tools = toolsMatch[1]
        .split('\n')
        .map(line => line.replace(/^  - /, '').trim())
        .filter(Boolean)
    }
  }

  return meta
}

// Scan for .md files in agents directory
function scanAgentFiles(agentsDir: string, source: 'user' | 'project'): AgentInfo[] {
  const agents: AgentInfo[] = []

  if (!fs.existsSync(agentsDir)) return agents

  const entries = fs.readdirSync(agentsDir, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(agentsDir, entry.name)

    // Handle .md files directly (project-level style)
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = fs.readFileSync(entryPath, 'utf-8')
      const meta = parseAgentContent(content)
      const id = entry.name.replace(/\.md$/i, '')

      agents.push({
        id,
        name: meta.name || id,
        type: meta.model || 'custom',
        description: meta.description || '',
        status: 'idle',
        source,
        path: entryPath,
        content,
        tools: meta.tools,
        model: meta.model
      })
    }

    // Handle directories with AGENT.md inside (user-level style)
    if (entry.isDirectory() || entry.isSymbolicLink()) {
      const agentDir = entryPath
      let agentFilePath = path.join(agentDir, 'AGENT.md')

      if (!fs.existsSync(agentFilePath)) {
        agentFilePath = path.join(agentDir, 'agent.md')
      }

      if (fs.existsSync(agentFilePath)) {
        const content = fs.readFileSync(agentFilePath, 'utf-8')
        const meta = parseAgentContent(content)

        agents.push({
          id: entry.name,
          name: meta.name || entry.name,
          type: meta.model || 'custom',
          description: meta.description || '',
          status: 'idle',
          source,
          path: agentDir,
          content,
          tools: meta.tools,
          model: meta.model
        })
      }
    }
  }

  return agents
}

// Find project .claude directory by walking up from cwd
function findProjectClaudeDir(): string | null {
  let currentDir = process.cwd()

  // Walk up the directory tree
  for (let i = 0; i < 10; i++) {
    const claudeDir = path.join(currentDir, '.claude')
    if (fs.existsSync(claudeDir)) {
      return claudeDir
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) break
    currentDir = parentDir
  }

  return null
}

function getUserAgents(): AgentInfo[] {
  const agentsDir = path.join(USER_CLAUDE_DIR, 'agents')
  return scanAgentFiles(agentsDir, 'user')
}

function getProjectAgents(): AgentInfo[] {
  const projectClaudeDir = findProjectClaudeDir()
  if (!projectClaudeDir) return []

  const agentsDir = path.join(projectClaudeDir, 'agents')
  return scanAgentFiles(agentsDir, 'project')
}

router.get('/', (_, res) => {
  try {
    const userAgents = getUserAgents()
    const projectAgents = getProjectAgents()
    res.json({ agents: [...BUILTIN_AGENTS, ...projectAgents, ...userAgents] })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read agents' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const agentId = req.params.id

    // Check builtin agents first
    const builtinAgent = BUILTIN_AGENTS.find(a => a.id === agentId)
    if (builtinAgent) {
      return res.json({ agent: builtinAgent })
    }

    // Check project agents
    const projectClaudeDir = findProjectClaudeDir()
    if (projectClaudeDir) {
      const agentsDir = path.join(projectClaudeDir, 'agents')
      if (fs.existsSync(agentsDir)) {
        // Try .md file first
        const mdPath = path.join(agentsDir, `${agentId}.md`)
        if (fs.existsSync(mdPath)) {
          const content = fs.readFileSync(mdPath, 'utf-8')
          const meta = parseAgentContent(content)
          return res.json({
            agent: {
              id: agentId,
              name: meta.name || agentId,
              type: meta.model || 'custom',
              description: meta.description || '',
              status: 'idle',
              source: 'project',
              path: mdPath,
              content,
              tools: meta.tools,
              model: meta.model
            }
          })
        }

        // Try directory with AGENT.md
        const agentDir = path.join(agentsDir, agentId)
        let agentFilePath = path.join(agentDir, 'AGENT.md')
        if (!fs.existsSync(agentFilePath)) {
          agentFilePath = path.join(agentDir, 'agent.md')
        }
        if (fs.existsSync(agentFilePath)) {
          const content = fs.readFileSync(agentFilePath, 'utf-8')
          const meta = parseAgentContent(content)
          return res.json({
            agent: {
              id: agentId,
              name: meta.name || agentId,
              type: meta.model || 'custom',
              description: meta.description || '',
              status: 'idle',
              source: 'project',
              path: agentDir,
              content,
              tools: meta.tools,
              model: meta.model
            }
          })
        }
      }
    }

    // Check user agents
    const userAgentsDir = path.join(USER_CLAUDE_DIR, 'agents')
    if (fs.existsSync(userAgentsDir)) {
      const mdPath = path.join(userAgentsDir, `${agentId}.md`)
      if (fs.existsSync(mdPath)) {
        const content = fs.readFileSync(mdPath, 'utf-8')
        const meta = parseAgentContent(content)
        return res.json({
          agent: {
            id: agentId,
            name: meta.name || agentId,
            type: meta.model || 'custom',
            description: meta.description || '',
            status: 'idle',
            source: 'user',
            path: mdPath,
            content,
            tools: meta.tools,
            model: meta.model
          }
        })
      }

      const agentDir = path.join(userAgentsDir, agentId)
      let agentFilePath = path.join(agentDir, 'AGENT.md')
      if (!fs.existsSync(agentFilePath)) {
        agentFilePath = path.join(agentDir, 'agent.md')
      }
      if (fs.existsSync(agentFilePath)) {
        const content = fs.readFileSync(agentFilePath, 'utf-8')
        const meta = parseAgentContent(content)
        return res.json({
          agent: {
            id: agentId,
            name: meta.name || agentId,
            type: meta.model || 'custom',
            description: meta.description || '',
            status: 'idle',
            source: 'user',
            path: agentDir,
            content,
            tools: meta.tools,
            model: meta.model
          }
        })
      }
    }

    res.status(404).json({ error: 'Agent not found' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read agent' })
  }
})

export { router }