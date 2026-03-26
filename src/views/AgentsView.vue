<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Agent } from '@/types'

const agents = ref<Agent[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await fetch('/api/agents')
    const data = await res.json()
    agents.value = data.agents
  } catch (e) {
    error.value = 'Failed to load agents'
  } finally {
    loading.value = false
  }
})

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
        class="bg-bg-secondary rounded-lg p-4 border border-border-color hover:border-accent transition-colors"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-text-primary font-medium">{{ agent.name }}</h3>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" :class="getStatusColor(agent.status)"></span>
            <span class="text-xs px-2 py-1 rounded bg-bg-primary text-text-secondary">
              {{ agent.type }}
            </span>
          </div>
        </div>
        <p class="text-text-secondary text-sm">{{ agent.description }}</p>
      </div>
    </div>
  </div>
</template>