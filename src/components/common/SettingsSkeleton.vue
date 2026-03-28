<script setup lang="ts">
</script>

<template>
  <div class="flex gap-6">
    <!-- Left Column Skeleton -->
    <div class="flex-1 min-w-0">
      <div class="bg-bg-secondary rounded-lg p-4 border border-border-color animate-pulse">
        <div class="h-6 bg-bg-primary/50 rounded w-32 mb-4"></div>
        <div class="space-y-2">
          <div v-for="i in 10" :key="i" class="h-4 bg-bg-primary/50 rounded" :style="{ width: `${80 + Math.random() * 20}%` }"></div>
        </div>
      </div>
    </div>

    <!-- Right Column Skeleton -->
    <div class="w-[420px] flex-shrink-0">
      <div class="bg-bg-secondary rounded-lg p-4 border border-border-color h-full animate-pulse">
        <div class="h-6 bg-bg-primary/50 rounded w-32 mb-4"></div>
        <div class="space-y-4">
          <div v-for="i in 8" :key="i" class="border-b border-border-color pb-3">
            <div class="h-4 bg-bg-primary/50 rounded w-24 mb-2"></div>
            <div class="h-3 bg-bg-primary/50 rounded w-full mb-1"></div>
            <div class="h-8 bg-bg-primary/50 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>