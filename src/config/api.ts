export const API_CONFIG = {
  BASE_URL: '',
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    MODELS: '/api/v1/models',
    MODEL_BY_ID: (modelId: string) => `/api/v1/models/${modelId}`,
    // Add other endpoints here as needed
  },
}

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

export const getAuthHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}
