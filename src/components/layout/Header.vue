<script setup lang="ts">
</script>

<template>
  <header class="border-b border-border-color px-6 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
          </svg>
        </div>
        <h1 class="text-xl font-semibold text-text-primary">Claude Dashboard</h1>
      </div>
      <div class="text-text-secondary text-sm">
        {{ new Date().toLocaleDateString() }}
      </div>
    </div>
  </header>
</template>