# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Dashboard is a web-based UI for viewing and managing Claude Code configuration. It reads from `~/.claude/` (user-level) and `.claude/` (project-level) directories to display skills, agents, teams, sessions, and settings.

## Commands

```bash
npm run dev          # Start Vite dev server (port 5173) with API proxy to backend
npm run build        # Type-check with vue-tsc and build to dist/
npm run server       # Start Express server (port 3000, serves built frontend)
npm run start        # Build + server (production)
```

## Architecture

**Frontend**: Vue 3 SPA with Vue Router. Views in `src/views/`, reusable components in `src/components/`. Uses `@/` alias pointing to `src/`.

**Backend**: Single Express server (`src/server/index.ts`) that serves both the API and the built frontend. API routes are in `src/server/routes/`.

**Dev workflow**: Run `npm run dev` for frontend hot-reload. The Vite server proxies `/api` and `/ws` requests to `localhost:3000`. Run `npm run server` in a separate terminal for the backend.

## Configuration Paths

The dashboard reads Claude Code configuration from:

| Resource | User-level path | Project-level path |
|----------|----------------|-------------------|
| Skills | `~/.claude/skills/{name}/SKILL.md` | Not supported |
| Agents | `~/.claude/agents/{name}/AGENT.md` or `{name}.md` | `.claude/agents/{name}.md` |
| Teams | `~/.claude/teams/{name}/config.json` | Not supported |
| Tasks | `~/.claude/tasks/{team}/{id}.json` | Not supported |
| Sessions | `~/.claude/sessions/` and `~/.claude/projects/` | Not supported |
| Settings | `~/.claude/settings.json` + `settings.local.json` | Not supported |

## File Formats

**Skill/Agent frontmatter** (YAML):
```yaml
---
name: Skill/Agent Name
description: What it does
model: sonnet           # Agents only
tools:                  # Agents only
  - Read
  - Edit
  - Bash
---
```

## Skill Registration

The project itself is a skill. To register: copy `skill.md` to `~/.claude/skills/claude-dashboard/SKILL.md` or symlink the directory.