# Claude Dashboard

A sleek web-based dashboard for viewing and managing Claude Code configuration.

![alt text](assets/image.png)

## Features

- **Skills Management** - View all available skills (user-defined and plugin-based)
- **Agents Overview** - Browse built-in and custom agents with detailed configurations
- **Teams Monitor** - Track team tasks and agent activities in real-time
- **Sessions History** - View conversation history with expandable message details
- **Settings View** - Inspect Claude Code settings and environment configuration

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + TailwindCSS
- **Backend**: Express.js
- **Build**: Vite

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm run server
```

The dashboard will be available at `http://localhost:3000`.

## Project Structure

```
claude-dashboard/
├── src/
│   ├── components/      # Vue components
│   ├── views/           # Page views
│   ├── server/          # Express backend
│   │   └── routes/      # API endpoints
│   ├── types/           # TypeScript definitions
│   └── style.css        # TailwindCSS styles
├── skill.md             # Skill registration file
└── package.json
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/skills` | List all skills |
| `GET /api/skills/:name` | Get skill details |
| `GET /api/agents` | List all agents (builtin + project + user) |
| `GET /api/agents/:id` | Get agent details |
| `GET /api/teams` | List all teams |
| `GET /api/teams/:name` | Get team details |
| `GET /api/sessions` | List active sessions |
| `GET /api/sessions/history` | Get command history |
| `GET /api/sessions/:id/conversation` | Get full conversation |
| `GET /api/settings` | Get Claude Code settings |

## Configuration

The dashboard reads configuration from:

- **User-level**: `~/.claude/` directory
- **Project-level**: `.claude/` directory in your project

### Custom Agents

Create custom agents in `~/.claude/agents/` or `.claude/agents/`:

```
.claude/agents/
├── my-agent.md          # Single file format
└── another-agent/
    └── AGENT.md         # Directory format
```

Agent file format:

```yaml
---
name: My Custom Agent
description: Agent description
model: sonnet
tools:
  - Read
  - Edit
  - Bash
---

Agent instructions here...
```

### Custom Skills

Skills are automatically discovered from:

- `~/.claude/skills/` (user-level)
- `.claude/skills/` (project-level)
- Plugin directories

## Development

```bash
# Development mode with hot reload
npm run dev

# Type check
npm run build

# Start server only
npm run server
```

## License

MIT