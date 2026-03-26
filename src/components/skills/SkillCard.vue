<script setup lang="ts">
import type { Skill } from '@/types'

defineProps<{
  skill: Skill
  selected?: boolean
}>()

const emit = defineEmits<{
  click: [skill: Skill]
}>()
</script>

<template>
  <div
    class="bg-bg-secondary rounded-lg p-4 border border-border-color hover:border-accent transition-colors cursor-pointer"
    :class="{ 'border-accent': selected }"
    @click="emit('click', skill)"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="text-text-primary font-medium">{{ skill.name }}</h3>
        <p class="text-text-secondary text-sm mt-1 line-clamp-2">{{ skill.description }}</p>
      </div>
      <span
        class="text-xs px-2 py-1 rounded"
        :class="skill.source === 'user' ? 'bg-accent/20 text-accent' : 'bg-blue-500/20 text-blue-400'"
      >
        {{ skill.source }}
      </span>
    </div>
  </div>
</template>