import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/models',
      name: 'models',
      component: () => import('../views/ModelsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/users',
      name: 'user-admin',
      component: () => import('../views/UserAdminView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/logs',
      name: 'system-logs',
      component: () => import('../views/SystemLogsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/performance',
      name: 'performance',
      component: () => import('../views/PerformanceView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/models',
      name: 'models-admin',
      component: () => import('../views/ModelsAdminView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/models/:modelId',
      name: 'model-admin',
      component: () => import('../views/ModelAdminView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/models/links/view',
      name: 'view-model-links',
      component: () => import('../views/ViewModelLinksView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/models/:modelId/records',
      name: 'records',
      component: () => import('../views/RecordsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/models/:modelId/records/add',
      name: 'add-record',
      component: () => import('../views/AddRecordView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/models/:modelId/records/:recordId/view',
      name: 'view-record',
      component: () => import('../views/ViewRecordView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/models/:modelId/records/:recordId/edit',
      name: 'edit-record',
      component: () => import('../views/EditRecordView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/records/:sourceRecordId/link/:sourceModelId/:targetModelId/:modelLinkId/:sourceModelName',
      name: 'select-records-to-link',
      component: () => import('../views/SelectRecordsToLinkView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/records/:sourceRecordId/linked/:sourceModelId/:modelLinkId/:targetModelId/:targetModelName/:sourceModelName/:sourceRecordDisplayName',
      name: 'linked-records',
      component: () => import('../views/LinkedRecordsView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/'
  }
  
  if (to.name === 'login' && authStore.isAuthenticated) {
    return '/home'
  }
})

export default router
