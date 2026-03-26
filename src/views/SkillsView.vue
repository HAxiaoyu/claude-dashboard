<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Skill } from '@/types'
import SkillList from '@/components/skills/SkillList.vue'

const skills = ref<Skill[]>([])
const selectedSkill = ref<Skill | null>(null)
const loading = ref(true)
const error = ref('')

async function fetchSkills() {
  try {
    const res = await fetch('/api/skills')
    const data = await res.json()
    skills.value = data.skills
  } catch (e) {
    error.value = 'Failed to load skills'
  } finally {
    loading.value = false
  }
}

async function fetchSkillDetail(name: string) {
  try {
    const res = await fetch(`/api/skills/${encodeURIComponent(name)}`)
    const data = await res.json()
    selectedSkill.value = data.skill
  } catch (e) {
    console.error('Failed to load skill detail')
  }
}

function selectSkill(skill: Skill) {
  fetchSkillDetail(skill.name)
}

function closeModal() {
  selectedSkill.value = null
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeModal()
  }
}

onMounted(() => {
  fetchSkills()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-text-primary mb-6">Skills</h2>

    <div v-if="loading" class="text-text-secondary">Loading...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <SkillList
      v-else
      :skills="skills"
      :selected-skill="selectedSkill"
      @select="selectSkill"
    />

    <!-- Modal Backdrop -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="selectedSkill"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="closeModal"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

          <!-- Modal Card -->
          <div
            class="relative w-[80%] h-[80%] max-w-5xl bg-bg-secondary rounded-xl border border-border-color shadow-2xl flex flex-col overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-start justify-between p-6 border-b border-border-color">
              <div class="flex-1 pr-4">
                <h3 class="text-2xl font-bold text-accent mb-2">{{ selectedSkill.name }}</h3>
                <p class="text-text-secondary">{{ selectedSkill.description }}</p>
              </div>
              <button
                class="p-2 rounded-lg hover:bg-bg-primary transition-colors text-text-secondary hover:text-text-primary"
                @click="closeModal"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Meta Info -->
            <div class="px-6 py-4 border-b border-border-color flex gap-6">
              <div class="flex items-center gap-2">
                <span class="text-text-secondary text-sm">Source:</span>
                <span
                  class="text-xs px-2 py-1 rounded"
                  :class="selectedSkill.source === 'user' ? 'bg-accent/20 text-accent' : 'bg-blue-500/20 text-blue-400'"
                >
                  {{ selectedSkill.source }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-text-secondary text-sm">Path:</span>
                <span class="text-text-primary text-xs font-mono">{{ selectedSkill.path }}</span>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-auto p-6">
              <div v-if="selectedSkill.content">
                <h4 class="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Skill Content
                </h4>
                <pre class="bg-bg-primary p-4 rounded-lg text-sm text-text-secondary overflow-auto whitespace-pre-wrap border border-border-color">{{ selectedSkill.content }}</pre>
              </div>
              <div v-else class="text-text-secondary text-center py-12">
                No content available
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
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