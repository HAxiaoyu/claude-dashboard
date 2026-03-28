<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  autofocus?: boolean
}>(), {
  placeholder: 'Search...',
  autofocus: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const localValue = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  localValue.value = val
})

function handleInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  localValue.value = value
  emit('update:modelValue', value)
}

function clear() {
  localValue.value = ''
  emit('update:modelValue', '')
  inputRef.value?.focus()
}

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <input
      ref="inputRef"
      type="text"
      :value="localValue"
      :placeholder="placeholder"
      :autofocus="autofocus"
      @input="handleInput"
      class="w-full bg-bg-primary border border-border-color rounded-lg pl-10 pr-10 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors"
    />
    <button
      v-if="localValue"
      @click="clear"
      class="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary transition-colors"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>