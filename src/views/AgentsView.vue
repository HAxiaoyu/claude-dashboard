<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Agent } from '@/types'

const agents = ref<Agent[]>([])
const selectedAgent = ref<Agent | null>(null)
const loading = ref(true)
const error = ref('')

async function fetchAgents() {
  try {
    const res = await fetch('/api/agents')
    const data = await res.json()
    agents.value = data.agents
  } catch (e) {
    error.value = 'Failed to load agents'
  } finally {
    loading.value = false
  }
}

async function selectAgent(agent: Agent) {
  try {
    const res = await fetch(`/api/agents/${encodeURIComponent(agent.id)}`)
    const data = await res.json()
    selectedAgent.value = data.agent
  } catch (e) {
    console.error('Failed to load agent detail')
  }
}

function closeModal() {
  selectedAgent.value = null
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeModal()
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'bg-green-500'
    case 'completed':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}

function getSourceColor(source: string): string {
  switch (source) {
    case 'user':
      return 'bg-accent/20 text-accent'
    case 'project':
      return 'bg-green-500/20 text-green-400'
    default:
      return 'bg-purple-500/20 text-purple-400'
  }
}

function getSourceLabel(source: string): string {
  switch (source) {
    case 'user':
      return 'user'
    case 'project':
      return 'project'
    default:
      return 'builtin'
  }
}

onMounted(() => {
  fetchAgents()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-text-primary mb-6">Agents</h2>

    <div v-if="loading" class="text-text-secondary">Loading...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="bg-bg-secondary rounded-lg p-4 border border-border-color hover:border-accent transition-colors cursor-pointer"
        @click="selectAgent(agent)"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-text-primary font-medium">{{ agent.name }}</h3>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" :class="getStatusColor(agent.status)"></span>
            <span
              class="text-xs px-2 py-1 rounded"
              :class="getSourceColor(agent.source || 'builtin')"
            >
              {{ getSourceLabel(agent.source || 'builtin') }}
            </span>
          </div>
        </div>
        <p class="text-text-secondary text-sm line-clamp-2">{{ agent.description }}</p>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="selectedAgent"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="closeModal"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

          <!-- Modal Card -->
          <div
            class="relative w-[90%] h-[85%] max-w-5xl bg-bg-secondary rounded-xl border border-border-color shadow-2xl flex flex-col overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-start justify-between p-6 border-b border-border-color">
              <div class="flex-1 pr-4">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-2xl font-bold text-accent">{{ selectedAgent.name }}</h3>
                  <span
                    class="text-xs px-2 py-1 rounded"
                    :class="getSourceColor(selectedAgent.source || 'builtin')"
                  >
                    {{ getSourceLabel(selectedAgent.source || 'builtin') }}
                  </span>
                </div>
                <p class="text-text-secondary">{{ selectedAgent.description }}</p>
              </div>
              <button
                class="p-2 rounded-lg hover:bg-bg-primary transition-colors text-text-secondary hover:text-text-primary"
                @click="closeModal"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Meta Info -->
            <div class="px-6 py-4 border-b border-border-color flex flex-wrap gap-4">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span class="text-text-secondary text-sm">ID:</span>
                <span class="text-text-primary text-xs font-mono">{{ selectedAgent.id }}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span class="text-text-secondary text-sm">Type:</span>
                <span class="text-text-primary text-xs">{{ selectedAgent.type }}</span>
              </div>
              <div v-if="selectedAgent.model" class="flex items-center gap-2">
                <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span class="text-text-secondary text-sm">Model:</span>
                <span class="text-text-primary text-xs">{{ selectedAgent.model }}</span>
              </div>
              <div v-if="selectedAgent.path" class="flex items-center gap-2">
                <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span class="text-text-secondary text-sm">Path:</span>
                <span class="text-text-primary text-xs font-mono truncate max-w-xs">{{ selectedAgent.path }}</span>
              </div>
            </div>

            <!-- Tools -->
            <div v-if="selectedAgent.tools && selectedAgent.tools.length > 0" class="px-6 py-4 border-b border-border-color">
              <h4 class="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Available Tools
              </h4>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tool in selectedAgent.tools"
                  :key="tool"
                  class="text-xs px-2 py-1 rounded bg-bg-primary text-text-secondary border border-border-color"
                >
                  {{ tool }}
                </span>
              </div>
            </div>

            <!-- Content -->
            <div v-if="selectedAgent.content" class="flex-1 overflow-auto p-6">
              <h4 class="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Agent Definition
              </h4>
              <pre class="bg-bg-primary p-4 rounded-lg text-sm text-text-secondary overflow-auto whitespace-pre-wrap border border-border-color">{{ selectedAgent.content }}</pre>
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