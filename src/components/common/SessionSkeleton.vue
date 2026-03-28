<script setup lang="ts">
</script>

<template>
  <div class="flex gap-6 h-[calc(100vh-180px)]">
    <!-- Left: Session List Skeleton -->
    <div class="w-80 flex-shrink-0 bg-bg-secondary rounded-lg border border-border-color flex flex-col">
      <div class="p-3 border-b border-border-color">
        <div class="h-4 bg-bg-primary/50 rounded w-20 animate-pulse"></div>
      </div>
      <div class="flex-1 overflow-auto">
        <div v-for="i in 8" :key="i" class="p-3 border-b border-border-color animate-pulse">
          <div class="flex justify-between mb-2">
            <div class="h-3 bg-bg-primary/50 rounded w-24"></div>
            <div class="h-3 bg-bg-primary/50 rounded w-10"></div>
          </div>
          <div class="h-3 bg-bg-primary/50 rounded w-32 mb-1"></div>
          <div class="h-3 bg-bg-primary/50 rounded w-full"></div>
        </div>
      </div>
    </div>

    <!-- Right: Conversation Skeleton -->
    <div class="flex-1 bg-bg-secondary rounded-lg border border-border-color flex flex-col min-w-0">
      <div class="flex-1 flex items-center justify-center text-text-secondary">
        <div class="text-center animate-pulse">
          <div class="h-4 bg-bg-primary/50 rounded w-40 mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
</template>