<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Task, TeamMember } from '@/types'

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

onMounted(async () => {
  try {
    const res = await fetch('/api/teams')
    const data = await res.json()
    teams.value = data.teams
  } catch (e) {
    error.value = 'Failed to load teams'
  } finally {
    loading.value = false
  }
})

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
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-text-primary mb-6">Teams</h2>

    <div v-if="loading" class="text-text-secondary">Loading...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <div v-else class="flex gap-6">
      <div class="flex-1">
        <div v-if="teams.length === 0" class="text-text-secondary">
          No teams found. Create a team to get started.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="team in teams"
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

        <div v-if="loadingDetails" class="text-text-secondary text-sm">Loading...</div>

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