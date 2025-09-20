<template>
  <div class="models">
    <AppNavigation />
    <PageHeader
      title="Models"
      description="Manage and configure your application models here."
    />

    <div class="content">
      
      <div v-if="loading" class="loading">
        <p>Loading models...</p>
      </div>
      
      <div v-else-if="error" class="error-message">
        <p>Error loading models: {{ error }}</p>
        <button @click="fetchModels" class="retry-btn">Retry</button>
      </div>
      
      <div v-else-if="models.length === 0" class="no-models">
        <p>No models found.</p>
      </div>
      
      <div v-else class="models-grid">
        <div v-for="model in models" :key="model.id" class="model-card" @click="navigateToRecords(model)">
          <h3>{{ model.name }}</h3>
          <p>{{ model.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders, API_CONFIG } from '@/config/api'
import type { Model, ModelsResponse } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const authStore = useAuthStore()

const models = ref<Model[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const fetchModels = async () => {
  loading.value = true
  error.value = null
  
  try {
    const token = authStore.getAuthToken()
    
    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.MODELS), {
      method: 'GET',
      headers: getAuthHeaders(token)
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data: ModelsResponse = await response.json()
    models.value = data.models
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch models'
    console.error('Error fetching models:', err)
  } finally {
    loading.value = false
  }
}

const navigateToRecords = (model: Model) => {
  router.push({ name: 'records', params: { modelId: model.id } })
}

onMounted(() => {
  fetchModels()
})
</script>

<style scoped>
.models {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  margin: 0;
  padding: 0;
}

.content {
  padding-top: calc(195px + 2rem); /* 60px nav + 85px title + 50px description + padding */
  padding-left: 2rem;
  padding-right: 2rem;
  padding-bottom: 2rem;
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .content {
    padding-top: calc(195px + 1rem);
    padding-left: 1rem;
    padding-right: 1rem;
    padding-bottom: 1rem;
  }
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  text-align: center;
  padding: 2rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  margin: 2rem 0;
}

.error-message p {
  color: #721c24;
  margin-bottom: 1rem;
}

.retry-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #c82333;
}

.no-models {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  font-style: italic;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
  justify-items: center;
}

/* Use CSS subgrid approach for centering incomplete rows */
.models-grid {
  grid-auto-flow: row;
}

/* For the last row, if it has fewer than 3 items, center them */
.model-card:nth-child(3n-2):nth-last-child(1) {
  /* Last row has 1 item - center it */
  grid-column: 2;
}

.model-card:nth-child(3n-2):nth-last-child(2) {
  /* Last row has 2 items - position them in columns 1 and 3 */
  grid-column: 1;
}

.model-card:nth-child(3n-2):nth-last-child(2) ~ .model-card {
  grid-column: 3;
}

.model-card {
  width: 100%;
  max-width: 320px;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .models-grid {
    grid-template-columns: 1fr;
    max-width: none;
    padding: 0 1rem;
  }

  .model-card:nth-child(3n-2):nth-last-child(1),
  .model-card:nth-child(3n-2):nth-last-child(2),
  .model-card:nth-child(3n-2):nth-last-child(2) ~ .model-card {
    grid-column: auto;
  }

  .model-card {
    max-width: 400px;
  }
}

.model-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.model-card h3 {
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  text-align: left;
}

.model-card p {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
  text-align: left;
}
</style>