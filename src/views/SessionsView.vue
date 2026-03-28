<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import SearchInput from '@/components/common/SearchInput.vue'
import SessionSkeleton from '@/components/common/SessionSkeleton.vue'
import { useWebSocket } from '@/composables/useWebSocket'

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

interface GroupedSession {
  sessionId: string
  project?: string
  lastTimestamp?: number
  displays: string[]
  entryCount: number
}

const history = ref<HistoryEntry[]>([])
const selectedSessionId = ref<string | null>(null)
const selectedConversation = ref<Conversation | null>(null)
const loading = ref(true)
const loadingConversation = ref(false)
const error = ref('')
const searchQuery = ref('')
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null)
const pageSize = 20
const currentPage = ref(1)

// WebSocket connection
const { connected } = useWebSocket()

// Watch for search changes to reset page
watch(searchQuery, () => {
  currentPage.value = 1
})

// Group history by session id
const groupedSessions = computed<GroupedSession[]>(() => {
  const groups = new Map<string, GroupedSession>()

  for (const entry of history.value) {
    const sid = entry.sessionId || 'unknown'
    if (!groups.has(sid)) {
      groups.set(sid, {
        sessionId: sid,
        project: entry.project,
        lastTimestamp: entry.timestamp,
        displays: [],
        entryCount: 0
      })
    }

    const group = groups.get(sid)!
    group.entryCount++
    if (entry.display && group.displays.length < 3) {
      group.displays.push(entry.display)
    }
    if (entry.timestamp && (!group.lastTimestamp || entry.timestamp > group.lastTimestamp)) {
      group.lastTimestamp = entry.timestamp
    }
  }

  // Sort by last timestamp descending
  return Array.from(groups.values()).sort((a, b) =>
    (b.lastTimestamp || 0) - (a.lastTimestamp || 0)
  )
})

// Filter sessions by search query
const filteredSessions = computed(() => {
  if (!searchQuery.value.trim()) return groupedSessions.value

  const query = searchQuery.value.toLowerCase()
  return groupedSessions.value.filter(session => {
    const sessionId = session.sessionId?.toLowerCase() || ''
    const project = session.project?.toLowerCase() || ''
    const displays = session.displays.join(' ').toLowerCase()
    return sessionId.includes(query) || project.includes(query) || displays.includes(query)
  })
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredSessions.value.length / pageSize))
const paginatedSessions = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredSessions.value.slice(start, start + pageSize)
})

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

async function fetchHistory() {
  try {
    const res = await fetch('/api/sessions/history')
    const data = await res.json()
    history.value = data.history || []
  } catch (e) {
    error.value = 'Failed to load sessions'
  } finally {
    loading.value = false
  }
}

async function selectSession(sessionId: string) {
  selectedSessionId.value = sessionId
  selectedConversation.value = null
  loadingConversation.value = true

  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/conversation`)
    if (res.ok) {
      const data = await res.json()
      selectedConversation.value = data
    }
  } catch (e) {
    console.error('Failed to load conversation')
  } finally {
    loadingConversation.value = false
  }
}

function formatDate(dateStr?: string | number): string {
  if (!dateStr) return 'Unknown'
  const date = typeof dateStr === 'number' ? new Date(dateStr) : new Date(dateStr)
  return date.toLocaleString()
}

function truncateId(id: string, len: number = 8): string {
  return id.length > len ? id.substring(0, len) + '...' : id
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  fetchHistory()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div>
    <!-- Header with search -->
    <div class="flex items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-bold text-text-primary flex-shrink-0">
        Sessions
        <span
          :class="connected ? 'text-green-400' : 'text-text-secondary'"
          class="text-xs ml-2"
          :title="connected ? 'Real-time updates active' : 'Disconnected'"
        >
          {{ connected ? '●' : '○' }}
        </span>
      </h2>
      <div class="flex items-center gap-3">
        <span class="text-sm text-text-secondary">
          {{ filteredSessions.length }} of {{ groupedSessions.length }}
        </span>
        <div class="w-64">
          <SearchInput
            ref="searchInputRef"
            v-model="searchQuery"
            placeholder="Search sessions... (Ctrl+K)"
          />
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <SessionSkeleton v-if="loading" />

    <!-- Error state -->
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <div v-else class="flex gap-6 h-[calc(100vh-180px)]">
      <!-- Left: Session List -->
      <div class="w-80 flex-shrink-0 bg-bg-secondary rounded-lg border border-border-color flex flex-col">
        <div class="p-3 border-b border-border-color flex justify-between items-center">
          <span class="text-sm text-text-secondary">{{ filteredSessions.length }} sessions</span>
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="text-xs text-accent hover:underline"
          >
            Clear
          </button>
        </div>
        <div class="flex-1 overflow-auto">
          <!-- No results -->
          <div
            v-if="filteredSessions.length === 0 && searchQuery"
            class="p-4 text-center text-text-secondary text-sm"
          >
            No sessions found
          </div>

          <div
            v-for="session in paginatedSessions"
            :key="session.sessionId"
            @click="selectSession(session.sessionId)"
            class="p-3 border-b border-border-color cursor-pointer transition-colors"
            :class="selectedSessionId === session.sessionId ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-bg-primary'"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-mono text-accent">{{ truncateId(session.sessionId, 12) }}</span>
              <span class="text-xs text-text-secondary">{{ session.entryCount }} msgs</span>
            </div>
            <div v-if="session.lastTimestamp" class="text-xs text-text-secondary mb-1">
              {{ formatDate(session.lastTimestamp) }}
            </div>
            <div v-if="session.project" class="text-xs text-text-secondary truncate mb-1">
              {{ session.project }}
            </div>
            <div v-if="session.displays.length" class="text-xs text-text-primary truncate">
              {{ session.displays[0] }}
            </div>
          </div>
        </div>
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="p-2 border-t border-border-color flex items-center justify-between">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-xs rounded bg-bg-primary text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:text-text-primary"
          >
            ← Prev
          </button>
          <span class="text-xs text-text-secondary">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-xs rounded bg-bg-primary text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:text-text-primary"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Right: Conversation View -->
      <div class="flex-1 bg-bg-secondary rounded-lg border border-border-color flex flex-col min-w-0">
        <div v-if="!selectedSessionId" class="flex-1 flex items-center justify-center text-text-secondary">
          Select a session to view conversation
        </div>

        <div v-else-if="loadingConversation" class="flex-1 flex items-center justify-center text-text-secondary">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading conversation...
          </div>
        </div>

        <template v-else-if="selectedConversation">
          <!-- Header -->
          <div class="p-4 border-b border-border-color flex-shrink-0">
            <div class="flex items-center gap-3 mb-1">
              <span class="font-mono text-sm text-accent">{{ selectedConversation.sessionId }}</span>
              <span class="text-xs px-2 py-0.5 rounded bg-bg-primary text-text-secondary">
                {{ selectedConversation.messageCount }} messages
              </span>
            </div>
            <div v-if="selectedConversation.cwd" class="text-xs text-text-secondary truncate">
              {{ selectedConversation.cwd }}
            </div>
          </div>

          <!-- Messages -->
          <div class="flex-1 overflow-auto p-4 space-y-3">
            <div
              v-for="(msg, idx) in selectedConversation.messages"
              :key="msg.uuid || idx"
              class="rounded-lg p-3"
              :class="{
                'bg-accent/10 border-l-2 border-accent': msg.type === 'user',
                'bg-bg-primary border border-border-color': msg.type === 'assistant',
                'bg-purple-500/10 border-l-2 border-purple-500': msg.type === 'tool_result'
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
              <pre class="text-sm text-text-primary whitespace-pre-wrap break-words font-sans max-h-64 overflow-auto">{{ msg.content }}</pre>
            </div>
          </div>
        </template>

        <div v-else class="flex-1 flex items-center justify-center text-text-secondary">
          No conversation data available
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for messages */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>