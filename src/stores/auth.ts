import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getApiUrl, getAuthHeaders, API_CONFIG } from '@/config/api'
import type { LoginRequest, LoginResponse, User } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const tokenExpiry = ref<number | null>(null)

  // Initialize from localStorage if available
  const savedToken = localStorage.getItem('auth_token')
  const savedExpiry = localStorage.getItem('auth_expiry')
  const savedUser = localStorage.getItem('auth_user')
  
  if (savedToken && savedExpiry && savedUser) {
    const expiry = parseInt(savedExpiry)
    if (Date.now() < expiry) {
      token.value = savedToken
      tokenExpiry.value = expiry
      user.value = JSON.parse(savedUser)
      isAuthenticated.value = true
    } else {
      // Token expired, clear localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_expiry')
      localStorage.removeItem('auth_user')
    }
  }

  async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const loginData: LoginRequest = { username, password }
      
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(loginData)
      })

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Invalid credentials' }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: LoginResponse = await response.json()
      
      // Store authentication data
      token.value = data.token
      tokenExpiry.value = Date.now() + data.expiresIn
      user.value = { id: data.userId, username }
      isAuthenticated.value = true

      // Save to localStorage
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_expiry', tokenExpiry.value.toString())
      localStorage.setItem('auth_user', JSON.stringify(user.value))

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    }
  }

  function logout() {
    isAuthenticated.value = false
    user.value = null
    token.value = null
    tokenExpiry.value = null

    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_expiry')
    localStorage.removeItem('auth_user')
  }

  function getAuthToken(): string | null {
    // Check if token is still valid
    if (token.value && tokenExpiry.value && Date.now() < tokenExpiry.value) {
      return token.value
    }
    
    // Token expired, logout
    if (token.value) {
      logout()
    }
    
    return null
  }

  return {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    getAuthToken
  }
})