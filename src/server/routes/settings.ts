import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import os from 'os'

const router = Router()

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json')
const SETTINGS_LOCAL_FILE = path.join(CLAUDE_DIR, 'settings.local.json')

interface Settings {
  [key: string]: unknown
}

function readSettings(): Settings {
  let settings: Settings = {}

  // Read main settings
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8')
      settings = JSON.parse(content)
    } catch {
      // Ignore parse errors
    }
  }

  // Merge local settings (overrides)
  if (fs.existsSync(SETTINGS_LOCAL_FILE)) {
    try {
      const content = fs.readFileSync(SETTINGS_LOCAL_FILE, 'utf-8')
      const localSettings = JSON.parse(content)
      settings = { ...settings, ...localSettings }
    } catch {
      // Ignore parse errors
    }
  }

  return settings
}

function writeSettings(settings: Settings): void {
  // Ensure directory exists
  if (!fs.existsSync(CLAUDE_DIR)) {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true })
  }

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

router.get('/', (_, res) => {
  try {
    const settings = readSettings()
    res.json({ settings })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read settings' })
  }
})

router.put('/', (req, res) => {
  try {
    const newSettings = req.body

    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' })
    }

    // Read existing settings and merge
    const existingSettings = readSettings()
    const mergedSettings = { ...existingSettings, ...newSettings }

    writeSettings(mergedSettings)

    res.json({ settings: mergedSettings })
  } catch (error) {
    res.status(500).json({ error: 'Failed to write settings' })
  }
})

router.patch('/', (req, res) => {
  try {
    const updates = req.body

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' })
    }

    const existingSettings = readSettings()
    const mergedSettings = { ...existingSettings, ...updates }

    writeSettings(mergedSettings)

    res.json({ settings: mergedSettings })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

export { router }