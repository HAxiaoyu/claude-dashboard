<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SettingsSkeleton from '@/components/common/SettingsSkeleton.vue'
import { useRealtimeReload } from '@/composables/useWebSocket'

interface Settings {
  [key: string]: unknown
}

const settings = ref<Settings>({})
const editedSettings = ref<string>('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const editMode = ref(false)
const jsonValid = ref(true)

// Real-time reload
const { connected } = useRealtimeReload('settings', fetchSettings)

onMounted(async () => {
  await fetchSettings()
})

async function fetchSettings() {
  try {
    const res = await fetch('/api/settings')
    const data = await res.json()
    settings.value = data.settings
    editedSettings.value = JSON.stringify(data.settings, null, 2)
  } catch (e) {
    error.value = 'Failed to load settings'
  } finally {
    loading.value = false
  }
}

function validateJson(value: string) {
  try {
    JSON.parse(value)
    jsonValid.value = true
    return true
  } catch {
    jsonValid.value = false
    return false
  }
}

function formatJson() {
  try {
    const parsed = JSON.parse(editedSettings.value)
    editedSettings.value = JSON.stringify(parsed, null, 2)
    jsonValid.value = true
    error.value = ''
  } catch {
    error.value = 'Cannot format invalid JSON'
  }
}

function startEdit() {
  editedSettings.value = JSON.stringify(settings.value, null, 2)
  editMode.value = true
  error.value = ''
  success.value = ''
  jsonValid.value = true
}

function cancelEdit() {
  editedSettings.value = JSON.stringify(settings.value, null, 2)
  editMode.value = false
  error.value = ''
  success.value = ''
}

async function saveSettings() {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    const parsed = JSON.parse(editedSettings.value)

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parsed)
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to save settings')
    }

    const data = await res.json()
    settings.value = data.settings
    editedSettings.value = JSON.stringify(data.settings, null, 2)
    editMode.value = false
    success.value = 'Settings saved successfully'
  } catch (e) {
    if (e instanceof SyntaxError) {
      error.value = 'Invalid JSON format'
    } else {
      error.value = e instanceof Error ? e.message : 'Failed to save settings'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-text-primary mb-6">
    Settings
    <span
      :class="connected ? 'text-green-400' : 'text-text-secondary'"
      class="text-xs ml-2"
      :title="connected ? 'Real-time updates active' : 'Disconnected'"
    >
      {{ connected ? '●' : '○' }}
    </span>
  </h2>

    <!-- Loading skeleton -->
    <SettingsSkeleton v-if="loading" />

    <div v-else class="flex gap-6">
      <!-- Left Column: Configuration -->
      <div class="flex-1 min-w-0">
        <div class="bg-bg-secondary rounded-lg p-4 border border-border-color">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-text-primary">Configuration</h3>
            <button
              v-if="!editMode"
              @click="startEdit"
              class="px-4 py-2 bg-accent text-bg-primary rounded hover:opacity-90 transition-opacity"
            >
              Edit
            </button>
          </div>

          <div v-if="error" class="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
            {{ error }}
          </div>

          <div v-if="success" class="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded text-green-400 text-sm">
            {{ success }}
          </div>

          <div v-if="!editMode">
            <pre class="bg-bg-primary p-4 rounded text-sm text-text-secondary overflow-auto max-h-[calc(100vh-280px)]">{{ JSON.stringify(settings, null, 2) }}</pre>
          </div>

          <div v-else>
            <div class="flex items-center justify-between mb-2">
              <span
                class="text-xs"
                :class="jsonValid ? 'text-green-400' : 'text-red-400'"
              >
                {{ jsonValid ? '✓ Valid JSON' : '✗ Invalid JSON' }}
              </span>
              <button
                @click="formatJson"
                class="text-xs text-accent hover:underline"
              >
                Format
              </button>
            </div>
            <textarea
              v-model="editedSettings"
              @input="validateJson(editedSettings)"
              class="w-full bg-bg-primary p-4 rounded text-sm text-text-secondary font-mono border focus:outline-none resize-none"
              :class="jsonValid ? 'border-border-color focus:border-accent' : 'border-red-500'"
              style="height: calc(100vh - 400px)"
              spellcheck="false"
            ></textarea>

            <div class="flex gap-2 mt-4">
              <button
                @click="saveSettings"
                :disabled="saving || !jsonValid"
                class="px-4 py-2 bg-accent text-bg-primary rounded hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button
                @click="formatJson"
                :disabled="!jsonValid"
                class="px-4 py-2 bg-bg-primary text-text-secondary rounded border border-border-color hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Format
              </button>
              <button
                @click="cancelEdit"
                :disabled="saving"
                class="px-4 py-2 bg-bg-primary text-text-secondary rounded border border-border-color hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Settings Reference -->
      <div class="w-[420px] flex-shrink-0">
        <div class="bg-bg-secondary rounded-lg p-4 border border-border-color h-full overflow-auto max-h-[calc(100vh-200px)]">
          <h3 class="text-lg font-semibold text-text-primary mb-4 sticky top-0 bg-bg-secondary pb-2">Settings Reference</h3>

          <div class="space-y-4 text-sm">
            <!-- env -->
            <div class="border-b border-border-color pb-3">
              <div class="flex items-center gap-2 mb-1">
                <code class="text-accent bg-bg-primary px-2 py-0.5 rounded text-xs">env</code>
                <span class="text-text-secondary text-xs">object</span>
              </div>
              <p class="text-text-secondary text-xs mb-2">Environment variables to pass to Claude Code and spawned processes.</p>
              <pre class="bg-bg-primary p-2 rounded text-xs text-text-secondary overflow-x-auto">{ "env": { "DEBUG": "true" } }</pre>
            </div>

            <!-- includeCoAuthoredBy -->
            <div class="border-b border-border-color pb-3">
              <div class="flex items-center gap-2 mb-1">
                <code class="text-accent bg-bg-primary px-2 py-0.5 rounded text-xs">includeCoAuthoredBy</code>
                <span class="text-text-secondary text-xs">boolean</span>
              </div>
              <p class="text-text-secondary text-xs mb-2">Include "Co-authored-by: Claude" in git commits.</p>
              <pre class="bg-bg-primary p-2 rounded text-xs text-text-secondary overflow-x-auto">{ "includeCoAuthoredBy": true }</pre>
            </div>

            <!-- enabledPlugins -->
            <div class="border-b border-border-color pb-3">
              <div class="flex items-center gap-2 mb-1">
                <code class="text-accent bg-bg-primary px-2 py-0.5 rounded text-xs">enabledPlugins</code>
                <span class="text-text-secondary text-xs">object</span>
              </div>
              <p class="text-text-secondary text-xs mb-2">Enable or disable MCP plugins.</p>
              <pre class="bg-bg-primary p-2 rounded text-xs text-text-secondary overflow-x-auto">{ "enabledPlugins": { "plugin": true } }</pre>
            </div>

            <!-- hooks -->
            <div class="border-b border-border-color pb-3">
              <div class="flex items-center gap-2 mb-1">
                <code class="text-accent bg-bg-primary px-2 py-0.5 rounded text-xs">hooks</code>
                <span class="text-text-secondary text-xs">object</span>
              </div>
              <p class="text-text-secondary text-xs mb-2">Shell commands on events (PreToolUse, PostToolUse, Stop, etc.).</p>
              <pre class="bg-bg-primary p-2 rounded text-xs text-text-secondary overflow-x-auto">{ "hooks": { "PreToolUse": [...] } }</pre>
            </div>

            <!-- permissions -->
            <div class="border-b border-border-color pb-3">
              <div class="flex items-center gap-2 mb-1">
                <code class="text-accent bg-bg-primary px-2 py-0.5 rounded text-xs">permissions</code>
                <span class="text-text-secondary text-xs">object</span>
              </div>
              <p class="text-text-secondary text-xs mb-2">Tool permissions (allow/deny) for Bash, Edit, Write, etc.</p>
              <pre class="bg-bg-primary p-2 rounded text-xs text-text-secondary overflow-x-auto">{ "permissions": { "allow": [...] } }</pre>
            </div>

            <!-- model -->
            <div class="border-b border-border-color pb-3">
              <div class="flex items-center gap-2 mb-1">
                <code class="text-accent bg-bg-primary px-2 py-0.5 rounded text-xs">model</code>
                <span class="text-text-secondary text-xs">string</span>
              </div>
              <p class="text-text-secondary text-xs mb-2">Default model: claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5.</p>
              <pre class="bg-bg-primary p-2 rounded text-xs text-text-secondary overflow-x-auto">{ "model": "claude-sonnet-4-6" }</pre>
            </div>

            <!-- mcpServers -->
            <div class="border-b border-border-color pb-3">
              <div class="flex items-center gap-2 mb-1">
                <code class="text-accent bg-bg-primary px-2 py-0.5 rounded text-xs">mcpServers</code>
                <span class="text-text-secondary text-xs">object</span>
              </div>
              <p class="text-text-secondary text-xs mb-2">MCP servers for extended capabilities.</p>
              <pre class="bg-bg-primary p-2 rounded text-xs text-text-secondary overflow-x-auto">{ "mcpServers": { "my-server": {...} } }</pre>
            </div>

            <!-- theme -->
            <div>
              <div class="flex items-center gap-2 mb-1">
                <code class="text-accent bg-bg-primary px-2 py-0.5 rounded text-xs">theme</code>
                <span class="text-text-secondary text-xs">string</span>
              </div>
              <p class="text-text-secondary text-xs mb-2">UI theme: light, dark, system.</p>
              <pre class="bg-bg-primary p-2 rounded text-xs text-text-secondary overflow-x-auto">{ "theme": "dark" }</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>