<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import type { Task, TeamMember } from '@/types'
import SearchInput from '@/components/common/SearchInput.vue'
import { useRealtimeReload } from '@/composables/useWebSocket'

interface TeamInfo {
  name: string
  path: string
  description?: string
  members?: TeamMember[]
  createdAt?: string
}

interface Message {
  id?: number
  from?: string
  to?: string
  message?: string
  timestamp?: string
  raw?: string
  [key: string]: unknown
}

const teams = ref<TeamInfo[]>([])
const selectedTeam = ref<TeamInfo | null>(null)
const tasks = ref<Task[]>([])
const messages = ref<Message[]>([])
const loading = ref(true)
const loadingDetails = ref(false)
const error = ref('')
const activeTab = ref<'members' | 'tasks' | 'messages'>('members')
const searchQuery = ref('')
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null)

// Real-time reload
const { connected } = useRealtimeReload('teams', fetchTeams)

// Filter teams by search query
const filteredTeams = computed(() => {
  if (!searchQuery.value.trim()) return teams.value

  const query = searchQuery.value.toLowerCase()
  return teams.value.filter(team => {
    const name = team.name?.toLowerCase() || ''
    const description = team.description?.toLowerCase() || ''
    const members = team.members?.map(m => m.name.toLowerCase()).join(' ') || ''
    return name.includes(query) || description.includes(query) || members.includes(query)
  })
})

onMounted(async () => {
  await fetchTeams()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

async function fetchTeams() {
  try {
    const res = await fetch('/api/teams')
    const data = await res.json()
    teams.value = data.teams
  } catch (e) {
    error.value = 'Failed to load teams'
  } finally {
    loading.value = false
  }
}

watch(selectedTeam, async (team) => {
  if (!team) {
    tasks.value = []
    messages.value = []
    return
  }

  loadingDetails.value = true
  try {
    const [tasksRes, messagesRes] = await Promise.all([
      fetch(`/api/teams/${encodeURIComponent(team.name)}/tasks`),
      fetch(`/api/teams/${encodeURIComponent(team.name)}/messages`)
    ])
    const tasksData = await tasksRes.json()
    const messagesData = await messagesRes.json()
    tasks.value = tasksData.tasks
    messages.value = messagesData.messages
  } catch (e) {
    console.error('Failed to load team details')
  } finally {
    loadingDetails.value = false
  }
})

function selectTeam(team: TeamInfo) {
  selectedTeam.value = team
  activeTab.value = 'members'
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-400'
    case 'in_progress':
      return 'text-yellow-400'
    default:
      return 'text-text-secondary'
  }
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}
</script>

<template>
  <div>
    <!-- Header with search -->
    <div class="flex items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-bold text-text-primary flex-shrink-0">
        Teams
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
          {{ filteredTeams.length }} of {{ teams.length }}
        </span>
        <div class="w-64">
          <SearchInput
            ref="searchInputRef"
            v-model="searchQuery"
            placeholder="Search teams... (Ctrl+K)"
          />
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="bg-bg-secondary rounded-lg p-4 border border-border-color animate-pulse">
        <div class="h-5 bg-bg-primary/50 rounded w-32 mb-3"></div>
        <div class="h-4 bg-bg-primary/50 rounded w-full mb-2"></div>
        <div class="h-3 bg-bg-primary/50 rounded w-16"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <!-- No teams -->
    <div v-else-if="teams.length === 0" class="text-text-secondary">
      No teams found. Create a team to get started.
    </div>

    <!-- No results -->
    <div
      v-else-if="filteredTeams.length === 0 && searchQuery"
      class="text-center py-12"
    >
      <svg class="w-12 h-12 mx-auto text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-text-secondary">No teams found matching "{{ searchQuery }}"</p>
      <button
        @click="searchQuery = ''"
        class="mt-2 text-accent hover:underline text-sm"
      >
        Clear search
      </button>
    </div>

    <div v-else class="flex gap-6">
      <div class="flex-1">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="team in filteredTeams"
            :key="team.name"
            @click="selectTeam(team)"
            class="bg-bg-secondary rounded-lg p-4 border border-border-color cursor-pointer hover:border-accent transition-colors"
            :class="{ 'border-accent': selectedTeam?.name === team.name }"
          >
            <h3 class="text-text-primary font-medium mb-1">{{ team.name }}</h3>
            <p v-if="team.description" class="text-text-secondary text-sm">{{ team.description }}</p>
            <div v-if="team.members" class="text-xs text-text-secondary mt-2">
              {{ team.members.length }} member(s)
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedTeam" class="w-96 bg-bg-secondary rounded-lg p-4 border border-border-color">
        <h3 class="text-lg font-semibold text-accent mb-4">{{ selectedTeam.name }}</h3>

        <div class="flex gap-2 mb-4">
          <button
            v-for="tab in ['members', 'tasks', 'messages'] as const"
            :key="tab"
            @click="activeTab = tab"
            class="px-3 py-1 text-sm rounded transition-colors"
            :class="activeTab === tab ? 'bg-accent text-bg-primary' : 'bg-bg-primary text-text-secondary hover:text-text-primary'"
          >
            {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
          </button>
        </div>

        <div v-if="loadingDetails" class="flex items-center justify-center py-8">
          <svg class="w-5 h-5 animate-spin text-text-secondary" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <div v-else>
          <div v-if="activeTab === 'members'" class="space-y-2">
            <div v-if="!selectedTeam.members?.length" class="text-text-secondary text-sm">
              No members
            </div>
            <div
              v-for="member in selectedTeam.members"
              :key="member.agentId"
              class="bg-bg-primary rounded p-2 text-sm"
            >
              <div class="text-text-primary font-medium">{{ member.name }}</div>
              <div class="text-text-secondary text-xs">{{ member.agentType }}</div>
            </div>
          </div>

          <div v-if="activeTab === 'tasks'" class="space-y-2">
            <div v-if="tasks.length === 0" class="text-text-secondary text-sm">
              No tasks
            </div>
            <div
              v-for="task in tasks"
              :key="task.id"
              class="bg-bg-primary rounded p-2 text-sm"
            >
              <div class="flex justify-between items-start">
                <span class="text-text-primary">{{ task.subject }}</span>
                <span class="text-xs" :class="getStatusColor(task.status)">{{ task.status }}</span>
              </div>
              <div v-if="task.owner" class="text-text-secondary text-xs mt-1">
                Owner: {{ task.owner }}
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'messages'" class="space-y-2 max-h-96 overflow-auto">
            <div v-if="messages.length === 0" class="text-text-secondary text-sm">
              No messages
            </div>
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="bg-bg-primary rounded p-2 text-xs"
            >
              <div v-if="msg.from && msg.to" class="text-text-secondary mb-1">
                {{ msg.from }} → {{ msg.to }}
              </div>
              <div v-if="msg.message" class="text-text-primary">
                {{ typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message) }}
              </div>
              <div v-else-if="msg.raw" class="text-text-secondary">
                {{ msg.raw }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>