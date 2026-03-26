<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'Skills', path: '/skills' },
  { name: 'Agents', path: '/agents' },
  { name: 'Teams', path: '/teams' },
  { name: 'Sessions', path: '/sessions' },
  { name: 'Settings', path: '/settings' }
]
</script>

<template>
  <nav class="border-b border-border-color px-6">
    <div class="flex gap-1">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="px-4 py-3 text-sm font-medium transition-colors relative"
        :class="[
          route.path === tab.path
            ? 'text-accent'
            : 'text-text-secondary hover:text-text-primary'
        ]"
      >
        {{ tab.name }}
        <span
          v-if="route.path === tab.path"
          class="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
        />
      </router-link>
    </div>
  </nav>
</template>