---
name: claude-dashboard
description: Launch Claude Dashboard web UI to view and manage Claude Code configuration
---

# Claude Dashboard

Launch a web-based dashboard to view and manage:
- Installed skills
- Available agents
- Team configurations and tasks
- Active sessions
- Global settings

## Usage

Run `/claude-dashboard` to start the dashboard server and open it in your browser.

## Options

- `--port <port>`: Specify port (default: 3000)
- `--no-open`: Don't auto-open browser

## Features

### Skills
- View all installed skills (user + plugin provided)
- View skill details and content
- Filter by source

### Agents
- View available agent types
- See agent descriptions and capabilities

### Teams
- View team configurations
- See team members and their roles
- View task status and progress

### Sessions
- View active Claude Code sessions
- See session details (PID, working directory, etc.)

### Settings
- View global Claude Code settings
- Edit and save settings