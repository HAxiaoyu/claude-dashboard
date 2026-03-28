<script setup lang="ts">
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div v-for="i in 6" :key="i" class="bg-bg-secondary rounded-lg p-4 border border-border-color animate-pulse">
      <div class="h-5 bg-bg-primary/50 rounded w-3/4 mb-3"></div>
      <div class="h-4 bg-bg-primary/50 rounded w-full mb-2"></div>
      <div class="h-4 bg-bg-primary/50 rounded w-2/3"></div>
    </div>
  </div>
</template>