<template>
  <div class="change-password-container">
    <div class="change-password-form">
      <h1>Change Password</h1>
      <form @submit.prevent="handleChangePassword">
        <div class="form-group">
          <label for="oldPassword">Old Password:</label>
          <input
            id="oldPassword"
            v-model="oldPassword"
            type="password"
            required
            autocomplete="current-password"
          />
        </div>
        <div class="form-group">
          <label for="newPassword">New Password:</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            required
            autocomplete="new-password"
          />
        </div>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="success" class="success">{{ success }}</div>
        <div class="button-group">
          <button type="button" class="cancel-btn" @click="handleCancel">Cancel</button>
          <button type="submit" class="save-btn" :disabled="loading">
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders } from '@/config/api'

const router = useRouter()
const authStore = useAuthStore()

const oldPassword = ref('')
const newPassword = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const handleChangePassword = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    const token = authStore.getAuthToken()
    if (!token) {
      error.value = 'Authentication required'
      return
    }

    const response = await fetch(getApiUrl('/auth/change-password'), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({
        oldPassword: oldPassword.value,
        newPassword: newPassword.value
      })
    })

    if (!response.ok) {
      if (response.status === 500) {
        const errorData = await response.json()
        error.value = errorData.message || 'Server error occurred'
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    success.value = 'Password changed successfully! Please login again.'
    oldPassword.value = ''
    newPassword.value = ''

    // Clear authentication and redirect to login
    setTimeout(() => {
      authStore.logout()
      router.push('/')
    }, 2000)

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to change password'
    console.error('Change password error:', err)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/home')
}
</script>

<style scoped>
.change-password-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  overflow: hidden;
}

.change-password-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 400px;
  min-width: 300px;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 1.8rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
}

.success {
  color: #28a745;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-btn,
.save-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.save-btn {
  background-color: #007bff;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.save-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.cancel-btn:active,
.save-btn:active:not(:disabled) {
  transform: translateY(1px);
}

@media (max-width: 768px) {
  .change-password-form {
    width: 95%;
    padding: 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  .button-group {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>