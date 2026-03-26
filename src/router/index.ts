import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/skills'
  },
  {
    path: '/skills',
    name: 'Skills',
    component: () => import('@/views/SkillsView.vue')
  },
  {
    path: '/agents',
    name: 'Agents',
    component: () => import('@/views/AgentsView.vue')
  },
  {
    path: '/teams',
    name: 'Teams',
    component: () => import('@/views/TeamsView.vue')
  },
  {
    path: '/sessions',
    name: 'Sessions',
    component: () => import('@/views/SessionsView.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router