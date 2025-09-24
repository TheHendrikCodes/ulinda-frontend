<template>
  <nav class="navbar">
    <div class="nav-left">
      <div class="nav-item dropdown">
        <button
          class="nav-button"
          :class="{ active: currentPage === 'models' }"
          @click="navigateToModels"
        >
          Models
        </button>
      </div>

      <div class="nav-item dropdown" @mouseenter="showAccount" @mouseleave="hideAccount">
        <button
          class="nav-button"
          :class="{ active: isAccountPage }"
        >
          Account
        </button>
        <div v-if="showAccountMenu" class="dropdown-menu" @mouseenter="showAccount" @mouseleave="hideAccount">
          <router-link
            to="/account/change-password"
            class="dropdown-item"
            :class="{ active: currentPage === 'account/change-password' }"
          >
            Change Password
          </router-link>
        </div>
      </div>

      <div class="nav-item dropdown" @mouseenter="showAdmin" @mouseleave="hideAdmin">
        <button
          class="nav-button"
          :class="{ active: isAdminPage }"
        >
          Admin
        </button>
        <div v-if="showAdminMenu" class="dropdown-menu" @mouseenter="showAdmin" @mouseleave="hideAdmin">
          <router-link
            to="/admin/users"
            class="dropdown-item"
            :class="{ active: currentPage === 'admin/users' }"
          >
            User Administration
          </router-link>
          <router-link
            to="/admin/models"
            class="dropdown-item"
            :class="{ active: currentPage === 'admin/models' }"
          >
            Model Administration
          </router-link>
          <router-link
            to="/admin/logs"
            class="dropdown-item"
            :class="{ active: currentPage === 'admin/logs' }"
          >
            System Logs
          </router-link>
          <router-link
            to="/admin/performance"
            class="dropdown-item"
            :class="{ active: currentPage === 'admin/performance' }"
          >
            Performance
          </router-link>
        </div>
      </div>
    </div>
    
    <div class="nav-right">
      <button class="nav-button logout" @click="handleLogout">
        Logout
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showAdminMenu = ref(false)
const showAccountMenu = ref(false)

const currentPage = computed(() => {
  const path = route.path
  if (path === '/models') return 'models'
  if (path === '/account/change-password') return 'account/change-password'
  if (path === '/admin/users') return 'admin/users'
  if (path === '/admin/models' || path.startsWith('/admin/models/')) return 'admin/models'
  if (path === '/admin/logs') return 'admin/logs'
  if (path === '/admin/performance') return 'admin/performance'
  return 'home'
})

const isAdminPage = computed(() => {
  return currentPage.value.startsWith('admin')
})

const isAccountPage = computed(() => {
  return currentPage.value.startsWith('account')
})

const navigateToModels = () => {
  router.push('/models')
}

const showAdmin = () => {
  showAdminMenu.value = true
  showAccountMenu.value = false // Close account menu
}

const hideAdmin = () => {
  showAdminMenu.value = false
}

const showAccount = () => {
  showAccountMenu.value = true
  showAdminMenu.value = false // Close admin menu
}

const hideAccount = () => {
  showAccountMenu.value = false
}

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2c3e50;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  box-sizing: border-box;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-right {
  display: flex;
  align-items: center;
}

.nav-item {
  position: relative;
}

.nav-button {
  background: none;
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-button:hover,
.dropdown:hover .nav-button {
  background-color: rgba(255, 255, 255, 0.15);
}

.nav-button.active {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-button.logout {
  background-color: #e74c3c;
}

.nav-button.logout:hover {
  background-color: #c0392b;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  min-width: 200px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  overflow: hidden;
  z-index: 2000;
  margin-top: 0.5rem;
  border: 1px solid #e0e0e0;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: block;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item.active {
  background-color: #e3f2fd;
  font-weight: 500;
}

@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
    position: fixed;
    width: 100vw;
  }
  
  .nav-left {
    gap: 1rem !important;
  }
}
</style>