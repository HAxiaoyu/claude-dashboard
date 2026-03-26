<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Session {
  id: string
  path: string
  createdAt?: string
  modifiedAt?: string
  files?: string[]
}

interface HistoryEntry {
  timestamp?: string
  sessionId?: string
  prompt?: string
  response?: string
  [key: string]: unknown
}

const sessions = ref<Session[]>([])
const history = ref<HistoryEntry[]>([])
const selectedSession = ref<Session | null>(null)
const loading = ref(true)
const error = ref('')
const activeTab = ref<'active' | 'history'>('active')

onMounted(async () => {
  try {
    const [sessionsRes, historyRes] = await Promise.all([
      fetch('/api/sessions'),
      fetch('/api/sessions/history')
    ])
    const sessionsData = await sessionsRes.json()
    const historyData = await historyRes.json()
    sessions.value = sessionsData.sessions
    history.value = historyData.history
  } catch (e) {
    error.value = 'Failed to load sessions'
  } finally {
    loading.value = false
  }
})

async function selectSession(session: Session) {
  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(session.id)}`)
    const data = await res.json()
    selectedSession.value = data.session
  } catch (e) {
    console.error('Failed to load session details')
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleString()
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-text-primary mb-6">Sessions</h2>

    <div v-if="loading" class="text-text-secondary">Loading...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <div v-else>
      <div class="flex gap-2 mb-4">
        <button
          v-for="tab in ['active', 'history'] as const"
          :key="tab"
          @click="activeTab = tab"
          class="px-4 py-2 rounded transition-colors"
          :class="activeTab === tab ? 'bg-accent text-bg-primary' : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-color'"
        >
          {{ tab === 'active' ? 'Active Sessions' : 'History' }}
        </button>
      </div>

      <div class="flex gap-6">
        <div class="flex-1">
          <div v-if="activeTab === 'active'">
            <div v-if="sessions.length === 0" class="text-text-secondary">
              No active sessions
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="session in sessions"
                :key="session.id"
                @click="selectSession(session)"
                class="bg-bg-secondary rounded-lg p-4 border border-border-color cursor-pointer hover:border-accent transition-colors"
                :class="{ 'border-accent': selectedSession?.id === session.id }"
              >
                <div class="text-text-primary font-medium font-mono text-sm mb-2">
                  {{ session.id.substring(0, 12) }}...
                </div>
                <div class="text-text-secondary text-xs">
                  <div>Created: {{ formatDate(session.createdAt) }}</div>
                  <div>Modified: {{ formatDate(session.modifiedAt) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'history'">
            <div v-if="history.length === 0" class="text-text-secondary">
              No history entries
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="(entry, index) in history"
                :key="index"
                class="bg-bg-secondary rounded-lg p-4 border border-border-color"
              >
                <div v-if="entry.timestamp" class="text-xs text-text-secondary mb-2">
                  {{ formatDate(entry.timestamp) }}
                </div>
                <div v-if="entry.prompt" class="text-text-primary text-sm mb-2">
                  <span class="text-accent">Prompt:</span> {{ entry.prompt }}
                </div>
                <div v-if="entry.sessionId" class="text-xs text-text-secondary">
                  Session: {{ entry.sessionId.substring(0, 12) }}...
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedSession && activeTab === 'active'" class="w-96 bg-bg-secondary rounded-lg p-4 border border-border-color">
          <h3 class="text-lg font-semibold text-accent mb-2">Session Details</h3>
          <div class="font-mono text-xs text-text-secondary mb-4 break-all">
            {{ selectedSession.id }}
          </div>

          <div class="text-sm text-text-secondary mb-2">
            <span class="text-text-primary">Path:</span>
            <div class="text-xs break-all">{{ selectedSession.path }}</div>
          </div>

          <div class="text-sm text-text-secondary mb-2">
            <span class="text-text-primary">Created:</span> {{ formatDate(selectedSession.createdAt) }}
          </div>

          <div class="text-sm text-text-secondary mb-4">
            <span class="text-text-primary">Modified:</span> {{ formatDate(selectedSession.modifiedAt) }}
          </div>

          <div v-if="selectedSession.files?.length">
            <h4 class="text-sm font-medium text-text-primary mb-2">Files</h4>
            <div class="space-y-1">
              <div
                v-for="file in selectedSession.files"
                :key="file"
                class="text-xs text-text-secondary bg-bg-primary rounded px-2 py-1"
              >
                {{ file }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>