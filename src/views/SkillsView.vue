<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Skill } from '@/types'
import SkillList from '@/components/skills/SkillList.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import SkillGridSkeleton from '@/components/common/SkillGridSkeleton.vue'
import { useRealtimeReload } from '@/composables/useWebSocket'

const skills = ref<Skill[]>([])
const selectedSkill = ref<Skill | null>(null)
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null)

// Real-time reload
const { connected } = useRealtimeReload('skills', fetchSkills)

// Filter skills by search query
const filteredSkills = computed(() => {
  if (!searchQuery.value.trim()) return skills.value

  const query = searchQuery.value.toLowerCase()
  return skills.value.filter(skill => {
    const name = skill.name?.toLowerCase() || ''
    const description = skill.description?.toLowerCase() || ''
    return name.includes(query) || description.includes(query)
  })
})

// Group skills by source for display
const skillGroups = computed(() => {
  const user = filteredSkills.value.filter(s => s.source === 'user')
  const plugin = filteredSkills.value.filter(s => s.source === 'plugin')
  return { user, plugin }
})

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

// Create skill
const showCreateModal = ref(false)
const newSkillName = ref('')
const newSkillDescription = ref('')
const creating = ref(false)

async function createSkill() {
  if (!newSkillName.value.trim()) return

  creating.value = true
  try {
    const res = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newSkillName.value.trim(),
        description: newSkillDescription.value.trim()
      })
    })

    if (res.ok) {
      showCreateModal.value = false
      newSkillName.value = ''
      newSkillDescription.value = ''
      await fetchSkills()
    } else {
      const data = await res.json()
      error.value = data.error || 'Failed to create skill'
    }
  } catch (e) {
    error.value = 'Failed to create skill'
  } finally {
    creating.value = false
  }
}

// Delete skill
const deleting = ref(false)

async function deleteSkill(skill: Skill) {
  if (skill.source !== 'user') {
    error.value = 'Can only delete user skills'
    return
  }

  if (!confirm(`Delete skill "${skill.name}"? This cannot be undone.`)) {
    return
  }

  deleting.value = true
  try {
    const res = await fetch(`/api/skills/${encodeURIComponent(skill.name)}`, {
      method: 'DELETE'
    })

    if (res.ok) {
      selectedSkill.value = null
      await fetchSkills()
    } else {
      const data = await res.json()
      error.value = data.error || 'Failed to delete skill'
    }
  } catch (e) {
    error.value = 'Failed to delete skill'
  } finally {
    deleting.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  // Close modal on Escape
  if (e.key === 'Escape' && selectedSkill.value) {
    closeModal()
    return
  }

  // Focus search on Ctrl+K or Cmd+K
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
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
    <!-- Header with search -->
    <div class="flex items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-bold text-text-primary flex-shrink-0">
        Skills
        <span
          :class="connected ? 'text-green-400' : 'text-text-secondary'"
          class="text-xs ml-2"
          :title="connected ? 'Real-time updates active' : 'Disconnected'"
        >
          {{ connected ? '●' : '○' }}
        </span>
      </h2>
      <div class="flex items-center gap-3">
        <button
          @click="showCreateModal = true"
          class="px-3 py-1.5 bg-accent text-bg-primary text-sm rounded hover:opacity-90 transition-opacity flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>
        <span class="text-sm text-text-secondary">
          {{ filteredSkills.length }} of {{ skills.length }}
        </span>
        <div class="w-64">
          <SearchInput
            ref="searchInputRef"
            v-model="searchQuery"
            placeholder="Search skills... (Ctrl+K)"
          />
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <SkillGridSkeleton v-if="loading" />

    <!-- Error state -->
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <!-- No results -->
    <div
      v-else-if="filteredSkills.length === 0 && searchQuery"
      class="text-center py-12"
    >
      <svg class="w-12 h-12 mx-auto text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-text-secondary">No skills found matching "{{ searchQuery }}"</p>
      <button
        @click="searchQuery = ''"
        class="mt-2 text-accent hover:underline text-sm"
      >
        Clear search
      </button>
    </div>

    <!-- Skills grouped by source -->
    <template v-else>
      <!-- User Skills -->
      <div v-if="skillGroups.user.length > 0" class="mb-8">
        <h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
          User Skills ({{ skillGroups.user.length }})
        </h3>
        <SkillList
          :skills="skillGroups.user"
          :selected-skill="selectedSkill"
          @select="selectSkill"
        />
      </div>

      <!-- Plugin Skills -->
      <div v-if="skillGroups.plugin.length > 0">
        <h3 class="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">
          Plugin Skills ({{ skillGroups.plugin.length }})
        </h3>
        <SkillList
          :skills="skillGroups.plugin"
          :selected-skill="selectedSkill"
          @select="selectSkill"
        />
      </div>
    </template>

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
              <div class="flex items-center gap-2">
                <button
                  v-if="selectedSkill.source === 'user'"
                  @click="deleteSkill(selectedSkill)"
                  :disabled="deleting"
                  class="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 disabled:opacity-50"
                  title="Delete skill"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  class="p-2 rounded-lg hover:bg-bg-primary transition-colors text-text-secondary hover:text-text-primary"
                  @click="closeModal"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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

    <!-- Create Skill Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showCreateModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="showCreateModal = false"
        >
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
          <div
            class="relative w-full max-w-md bg-bg-secondary rounded-xl border border-border-color shadow-2xl"
            @click.stop
          >
            <div class="flex items-center justify-between p-4 border-b border-border-color">
              <h3 class="text-lg font-semibold text-text-primary">Create New Skill</h3>
              <button
                @click="showCreateModal = false"
                class="p-1 rounded hover:bg-bg-primary text-text-secondary hover:text-text-primary"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-4 space-y-4">
              <div>
                <label class="block text-sm text-text-secondary mb-1">Name</label>
                <input
                  v-model="newSkillName"
                  type="text"
                  placeholder="my-skill-name"
                  class="w-full bg-bg-primary border border-border-color rounded px-3 py-2 text-text-primary placeholder-text-secondary focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-sm text-text-secondary mb-1">Description</label>
                <input
                  v-model="newSkillDescription"
                  type="text"
                  placeholder="What does this skill do?"
                  class="w-full bg-bg-primary border border-border-color rounded px-3 py-2 text-text-primary placeholder-text-secondary focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <div class="flex justify-end gap-2 p-4 border-t border-border-color">
              <button
                @click="showCreateModal = false"
                class="px-4 py-2 rounded border border-border-color text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                @click="createSkill"
                :disabled="!newSkillName.trim() || creating"
                class="px-4 py-2 bg-accent text-bg-primary rounded hover:opacity-90 disabled:opacity-50"
              >
                {{ creating ? 'Creating...' : 'Create' }}
              </button>
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