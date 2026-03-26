export interface Skill {
  name: string
  description: string
  source: 'user' | 'plugin'
  path: string
  content?: string
}

export interface Agent {
  id: string
  name: string
  type: string
  description: string
  status: 'idle' | 'running' | 'completed'
}

export interface TeamMember {
  name: string
  agentId: string
  agentType: string
}

export interface Team {
  name: string
  description: string
  members: TeamMember[]
  taskCount: { pending: number; in_progress: number; completed: number }
  lastActivity?: string
}

export interface Task {
  id: string
  subject: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  owner?: string
  blockedBy?: string[]
}

export interface Session {
  pid: number
  sessionId: string
  cwd: string
  startedAt: number
  kind: string
  entrypoint: string
}

export interface Settings {
  env?: Record<string, string>
  includeCoAuthoredBy?: boolean
  enabledPlugins?: Record<string, boolean>
}

export interface WSEvent {
  type: 'team:status' | 'task:progress' | 'agent:message'
  payload: {
    teamName?: string
    taskId?: string
    agentId?: string
    data: unknown
  }
  timestamp: number
}