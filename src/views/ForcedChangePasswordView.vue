<template>
  <div class="forced-change-password-container">
    <div class="forced-change-password-form">
      <h1>You Must Change Your Password</h1>
      <p class="warning-message">
        Your password must be changed before you can continue using the system.
      </p>
      <form @submit.prevent="handleForcedChangePassword">
        <div class="form-group">
          <label for="oldPassword">Current Password:</label>
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
          <button type="submit" class="change-password-btn" :disabled="loading">
            {{ loading ? 'Changing Password...' : 'Change Password & Login' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders } from '@/config/api'
import type { LoginResponse, ForcedChangePasswordRequest } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()

const oldPassword = ref('')
const newPassword = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const username = ref('')

// Get username from sessionStorage when component mounts
onMounted(() => {
  const tempUsername = sessionStorage.getItem('temp_username')
  if (!tempUsername) {
    error.value = 'Session expired. Please login again.'
    setTimeout(() => {
      router.push('/')
    }, 2000)
    return
  }
  username.value = tempUsername

  // Pre-fill old password if available
  const tempPassword = sessionStorage.getItem('temp_password')
  if (tempPassword) {
    oldPassword.value = tempPassword
  }
})

const handleForcedChangePassword = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    if (!username.value) {
      error.value = 'Session expired. Please login again.'
      router.push('/')
      return
    }

    const response = await fetch(getApiUrl('/auth/forced-change-password'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        username: username.value,
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

    const data: LoginResponse = await response.json()
    console.log('Forced change password response:', data)

    // Store authentication data from successful forced password change
    const userObj = { id: username.value, username: username.value }
    const expiresIn = data.expiresIn || 86400000 // Default to 24 hours if 0
    const tokenExpiry = Date.now() + expiresIn

    console.log('Setting auth store with userObj:', userObj, 'token:', data.token, 'expiresIn:', expiresIn)
    console.log('Auth store before setting:', {
      user: authStore.user,
      token: authStore.token,
      isAuthenticated: authStore.isAuthenticated
    })

    // Set authentication data in the store
    if (authStore.user) {
      authStore.user.value = userObj
    }
    if (authStore.token) {
      authStore.token.value = data.token
    }
    if (authStore.tokenExpiry) {
      authStore.tokenExpiry.value = tokenExpiry
    }
    if (authStore.isAuthenticated) {
      authStore.isAuthenticated.value = true
    }

    // Save to localStorage
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_expiry', tokenExpiry.toString())
    localStorage.setItem('auth_user', JSON.stringify(userObj))

    // Clear temporary credentials
    sessionStorage.removeItem('temp_username')
    sessionStorage.removeItem('temp_password')

    success.value = 'Password changed successfully! Redirecting...'

    // Redirect to home after success
    setTimeout(() => {
      router.push('/home')
    }, 1500)

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to change password'
    console.error('Forced change password error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forced-change-password-container {
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

.forced-change-password-form {
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
  margin-bottom: 1rem;
  color: #dc3545;
  font-size: 1.8rem;
}

.warning-message {
  text-align: center;
  color: #dc3545;
  margin-bottom: 2rem;
  font-weight: 500;
  background-color: #fff5f5;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #dc3545;
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
  margin-top: 1.5rem;
}

.change-password-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

.change-password-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.change-password-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.change-password-btn:active:not(:disabled) {
  transform: translateY(1px);
}

@media (max-width: 768px) {
  .forced-change-password-form {
    width: 95%;
    padding: 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>