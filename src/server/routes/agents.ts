import { Router } from 'express'

const router = Router()

// Built-in agent types from Claude Code
const BUILTIN_AGENTS = [
  {
    id: 'general-purpose',
    name: 'General Purpose',
    type: 'general-purpose',
    description: 'General-purpose agent for researching complex questions, searching for code, and executing multi-step tasks',
    status: 'idle' as const
  },
  {
    id: 'explore',
    name: 'Explore',
    type: 'Explore',
    description: 'Fast agent specialized for exploring codebases. Use for file pattern matching, code search, and codebase questions',
    status: 'idle' as const
  },
  {
    id: 'plan',
    name: 'Plan',
    type: 'Plan',
    description: 'Software architect agent for designing implementation plans. Returns step-by-step plans and identifies critical files',
    status: 'idle' as const
  },
  {
    id: 'claude-code-guide',
    name: 'Claude Code Guide',
    type: 'claude-code-guide',
    description: 'Use for questions about Claude Code CLI features, hooks, slash commands, MCP servers, and settings',
    status: 'idle' as const
  }
]

router.get('/', (_, res) => {
  res.json({ agents: BUILTIN_AGENTS })
})

router.get('/:id', (req, res) => {
  const agent = BUILTIN_AGENTS.find(a => a.id === req.params.id)
  if (agent) {
    res.json({ agent })
  } else {
    res.status(404).json({ error: 'Agent not found' })
  }
})

export { router }