<script setup lang="ts">
import { ref, onMounted } from 'vue'

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

function startEdit() {
  editedSettings.value = JSON.stringify(settings.value, null, 2)
  editMode.value = true
  error.value = ''
  success.value = ''
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
    <h2 class="text-2xl font-bold text-text-primary mb-6">Settings</h2>

    <div v-if="loading" class="text-text-secondary">Loading...</div>

    <div v-else class="max-w-3xl">
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
          <pre class="bg-bg-primary p-4 rounded text-sm text-text-secondary overflow-auto max-h-96">{{ JSON.stringify(settings, null, 2) }}</pre>
        </div>

        <div v-else>
          <textarea
            v-model="editedSettings"
            class="w-full h-96 bg-bg-primary p-4 rounded text-sm text-text-secondary font-mono border border-border-color focus:border-accent focus:outline-none resize-none"
            spellcheck="false"
          ></textarea>

          <div class="flex gap-2 mt-4">
            <button
              @click="saveSettings"
              :disabled="saving"
              class="px-4 py-2 bg-accent text-bg-primary rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {{ saving ? 'Saving...' : 'Save' }}
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

      <div class="mt-6 bg-bg-secondary rounded-lg p-4 border border-border-color">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Settings Reference</h3>
        <div class="space-y-3 text-sm">
          <div>
            <code class="text-accent">env</code>
            <span class="text-text-secondary"> - Environment variables to pass to Claude Code</span>
          </div>
          <div>
            <code class="text-accent">includeCoAuthoredBy</code>
            <span class="text-text-secondary"> - Include co-authored-by in commits</span>
          </div>
          <div>
            <code class="text-accent">enabledPlugins</code>
            <span class="text-text-secondary"> - Enabled MCP plugins configuration</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>