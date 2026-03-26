<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

onMounted(fetchSkills)
</script>

<template>
  <div class="flex gap-6">
    <div class="flex-1">
      <h2 class="text-2xl font-bold text-text-primary mb-6">Skills</h2>

      <div v-if="loading" class="text-text-secondary">Loading...</div>
      <div v-else-if="error" class="text-red-500">{{ error }}</div>
      <SkillList
        v-else
        :skills="skills"
        :selected-skill="selectedSkill"
        @select="selectSkill"
      />
    </div>

    <div v-if="selectedSkill" class="w-96 bg-bg-secondary rounded-lg p-4 border border-border-color">
      <h3 class="text-lg font-semibold text-accent mb-2">{{ selectedSkill.name }}</h3>
      <p class="text-text-secondary text-sm mb-4">{{ selectedSkill.description }}</p>

      <div class="text-xs text-text-secondary mb-2">
        Source: <span class="text-text-primary">{{ selectedSkill.source }}</span>
      </div>
      <div class="text-xs text-text-secondary mb-4">
        Path: <span class="text-text-primary text-xs break-all">{{ selectedSkill.path }}</span>
      </div>

      <div v-if="selectedSkill.content" class="mt-4">
        <h4 class="text-sm font-medium text-text-primary mb-2">Content</h4>
        <pre class="bg-bg-primary p-3 rounded text-xs text-text-secondary overflow-auto max-h-96 whitespace-pre-wrap">{{ selectedSkill.content }}</pre>
      </div>
    </div>
  </div>
</template>