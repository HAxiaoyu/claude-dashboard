<script setup lang="ts">
import Header from '@/components/layout/Header.vue'
import TabNav from '@/components/layout/TabNav.vue'
import GlobalSearch from '@/components/common/GlobalSearch.vue'
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <Header />
    <TabNav />
    <main class="p-6">
      <router-view />
    </main>
    <GlobalSearch />
  </div>
</template>