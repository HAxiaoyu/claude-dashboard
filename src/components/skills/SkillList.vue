<script setup lang="ts">
import type { Skill } from '@/types'
import SkillCard from './SkillCard.vue'

defineProps<{
  skills: Skill[]
  selectedSkill?: Skill | null
}>()

const emit = defineEmits<{
  select: [skill: Skill]
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <SkillCard
      v-for="skill in skills"
      :key="skill.name"
      :skill="skill"
      :selected="selectedSkill?.name === skill.name"
      @click="emit('select', skill)"
    />
  </div>
</template>