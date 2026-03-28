<script setup lang="ts">
withDefaults(defineProps<{
  lines?: number
  height?: string
  containerClass?: string
}>(), {
  lines: 3,
  height: 'auto',
  containerClass: ''
})
</script>

<template>
  <div class="animate-pulse space-y-3" :class="containerClass">
    <div
      v-for="i in lines"
      :key="i"
      class="bg-bg-primary/50 rounded"
      :style="{ height: height === 'auto' ? (i === 1 ? '1.5rem' : i === lines ? '0.75rem' : '1rem') : height }"
    ></div>
  </div>
</template>