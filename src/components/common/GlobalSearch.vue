<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const isOpen = ref(false)
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const router = useRouter()

const pages = [
  { name: 'Skills', path: '/skills', description: 'Manage Claude Code skills' },
  { name: 'Agents', path: '/agents', description: 'View and manage agents' },
  { name: 'Teams', path: '/teams', description: 'Team configurations' },
  { name: 'Sessions', path: '/sessions', description: 'Conversation history' },
  { name: 'Settings', path: '/settings', description: 'Claude Code settings' },
]

const filteredPages = ref(pages)

function open() {
  isOpen.value = true
  query.value = ''
  filteredPages.value = pages
  setTimeout(() => inputRef.value?.focus(), 50)
}

function close() {
  isOpen.value = false
  query.value = ''
}

function handleInput() {
  const q = query.value.toLowerCase()
  if (!q) {
    filteredPages.value = pages
  } else {
    filteredPages.value = pages.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    )
  }
}

function navigate(path: string) {
  router.push(path)
  close()
}

function handleKeydown(e: KeyboardEvent) {
  // Open on Ctrl+K or Cmd+K
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  // Close on Escape
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

defineExpose({ open, close })
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div
          class="relative w-full max-w-lg bg-bg-secondary rounded-xl border border-border-color shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Search Input -->
          <div class="flex items-center border-b border-border-color">
            <svg class="w-5 h-5 ml-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              @input="handleInput"
              type="text"
              placeholder="Search pages... (Ctrl+K)"
              class="flex-1 bg-transparent border-none px-4 py-4 text-text-primary placeholder-text-secondary focus:outline-none"
            />
            <kbd class="mr-4 px-2 py-1 text-xs text-text-secondary bg-bg-primary rounded border border-border-color">ESC</kbd>
          </div>

          <!-- Results -->
          <div class="max-h-[40vh] overflow-auto">
            <button
              v-for="page in filteredPages"
              :key="page.path"
              @click="navigate(page.path)"
              class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-primary transition-colors"
            >
              <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <div class="text-text-primary font-medium">{{ page.name }}</div>
                <div class="text-text-secondary text-xs">{{ page.description }}</div>
              </div>
            </button>

            <div
              v-if="filteredPages.length === 0"
              class="px-4 py-8 text-center text-text-secondary"
            >
              No results found
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-4 py-2 border-t border-border-color text-xs text-text-secondary">
            <span>Navigate with arrow keys</span>
            <span>Press Enter to select</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.15s ease;
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