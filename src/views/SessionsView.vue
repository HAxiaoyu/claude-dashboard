<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Session {
  id: string
  path: string
  createdAt?: string
  modifiedAt?: string
  files?: string[]
}

interface HistoryEntry {
  timestamp?: number
  sessionId?: string
  display?: string
  project?: string
  [key: string]: unknown
}

interface ConversationMessage {
  type: string
  role?: string
  content?: string
  timestamp?: string
  uuid?: string
}

interface Conversation {
  sessionId: string
  project: string
  cwd: string
  messageCount: number
  messages: ConversationMessage[]
}

const sessions = ref<Session[]>([])
const history = ref<HistoryEntry[]>([])
const selectedSession = ref<Session | null>(null)
const selectedConversation = ref<Conversation | null>(null)
const loading = ref(true)
const error = ref('')
const activeTab = ref<'active' | 'history'>('active')

async function fetchSessions() {
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
}

async function selectSession(session: Session) {
  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(session.id)}`)
    const data = await res.json()
    selectedSession.value = data.session
  } catch (e) {
    console.error('Failed to load session details')
  }
}

async function viewConversation(entry: HistoryEntry) {
  if (!entry.sessionId) return

  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(entry.sessionId)}/conversation`)
    if (res.ok) {
      const data = await res.json()
      selectedConversation.value = data
    }
  } catch (e) {
    console.error('Failed to load conversation')
  }
}

function closeModal() {
  selectedConversation.value = null
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeModal()
  }
}

function formatDate(dateStr?: string | number): string {
  if (!dateStr) return 'Unknown'
  const date = typeof dateStr === 'number' ? new Date(dateStr) : new Date(dateStr)
  return date.toLocaleString()
}

onMounted(() => {
  fetchSessions()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
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

      <div v-if="activeTab === 'active'">
        <div v-if="sessions.length === 0" class="text-text-secondary">
          No active sessions
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div>Path: {{ session.path }}</div>
              <div>Created: {{ formatDate(session.createdAt) }}</div>
            </div>
          </div>
        </div>

        <!-- Session Details Panel -->
        <div v-if="selectedSession" class="mt-6 bg-bg-secondary rounded-lg p-6 border border-border-color">
          <h3 class="text-lg font-semibold text-accent mb-4">Session Details</h3>
          <div class="font-mono text-xs text-text-secondary mb-4 break-all">
            ID: {{ selectedSession.id }}
          </div>
          <div class="text-sm text-text-secondary mb-2">
            <span class="text-text-primary">Path:</span>
            <div class="text-xs break-all">{{ selectedSession.path }}</div>
          </div>
          <div class="text-sm text-text-secondary mb-2">
            <span class="text-text-primary">Created:</span> {{ formatDate(selectedSession.createdAt) }}
          </div>
          <div v-if="selectedSession.files?.length" class="mt-4">
            <h4 class="text-sm font-medium text-text-primary mb-2">Files</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="file in selectedSession.files"
                :key="file"
                class="text-xs text-text-secondary bg-bg-primary rounded px-2 py-1"
              >
                {{ file }}
              </span>
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
            @click="viewConversation(entry)"
            class="bg-bg-secondary rounded-lg p-4 border border-border-color cursor-pointer hover:border-accent transition-colors"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div v-if="entry.timestamp" class="text-xs text-text-secondary mb-1">
                  {{ formatDate(entry.timestamp) }}
                </div>
                <div v-if="entry.display" class="text-text-primary text-sm truncate">
                  {{ entry.display }}
                </div>
                <div v-if="entry.project" class="text-xs text-text-secondary mt-1 truncate">
                  {{ entry.project }}
                </div>
              </div>
              <div class="text-xs text-accent">View →</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conversation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="selectedConversation"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="closeModal"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

          <!-- Modal Card -->
          <div
            class="relative w-[95%] h-[90%] max-w-6xl bg-bg-secondary rounded-xl border border-border-color shadow-2xl flex flex-col overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-start justify-between p-4 border-b border-border-color">
              <div class="flex-1 pr-4">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-xl font-bold text-accent">Conversation</h3>
                  <span class="text-xs px-2 py-1 rounded bg-bg-primary text-text-secondary">
                    {{ selectedConversation.messageCount }} messages
                  </span>
                </div>
                <div class="text-text-secondary text-xs">
                  Session: {{ selectedConversation.sessionId }}
                </div>
                <div v-if="selectedConversation.cwd" class="text-text-secondary text-xs mt-1">
                  Working Dir: {{ selectedConversation.cwd }}
                </div>
              </div>
              <button
                class="p-2 rounded-lg hover:bg-bg-primary transition-colors text-text-secondary hover:text-text-primary"
                @click="closeModal"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Messages -->
            <div class="flex-1 overflow-auto p-4 space-y-4">
              <div
                v-for="(msg, idx) in selectedConversation.messages"
                :key="msg.uuid || idx"
                class="rounded-lg p-4"
                :class="{
                  'bg-accent/10 border-l-4 border-accent': msg.type === 'user',
                  'bg-bg-primary border border-border-color': msg.type === 'assistant',
                  'bg-purple-500/10 border-l-4 border-purple-500': msg.type === 'tool_result'
                }"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="text-xs font-medium px-2 py-0.5 rounded"
                    :class="{
                      'bg-accent/20 text-accent': msg.type === 'user',
                      'bg-blue-500/20 text-blue-400': msg.type === 'assistant',
                      'bg-purple-500/20 text-purple-400': msg.type === 'tool_result'
                    }"
                  >
                    {{ msg.role || msg.type }}
                  </span>
                  <span v-if="msg.timestamp" class="text-xs text-text-secondary">
                    {{ formatDate(msg.timestamp) }}
                  </span>
                </div>
                <pre class="text-sm text-text-primary whitespace-pre-wrap break-words font-sans">{{ msg.content }}</pre>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>