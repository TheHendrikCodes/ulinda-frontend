<template>
  <div class="error-logs">
    <AppNavigation />
    <PageHeader
      title="Error Logs"
      description="View system error logs with pagination."
    />

    <div class="content">
      <div v-if="loading" class="loading">
        <p>Loading error logs...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>Error loading error logs: {{ error }}</p>
        <button @click="fetchErrorLogs" class="retry-btn">Retry</button>
      </div>

      <div v-else-if="errorLogs.length === 0" class="no-logs">
        <p>No error logs found.</p>
      </div>

      <div v-else class="logs-table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Error ID</th>
              <th>Timestamp</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="errorLog in errorLogs" :key="errorLog.errorIdentifier">
              <td class="error-id">{{ errorLog.errorIdentifier }}</td>
              <td class="timestamp">{{ formatTimestamp(errorLog.timestamp) }}</td>
              <td class="message">{{ errorLog.message }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagingInfo" class="pagination-container">
          <div class="pagination-info">
            <p>
              Showing {{ (pagingInfo.currentPage * pagingInfo.pageSize) + 1 }} -
              {{ Math.min((pagingInfo.currentPage + 1) * pagingInfo.pageSize, pagingInfo.totalElements) }}
              of {{ pagingInfo.totalElements }} error logs
            </p>
          </div>

          <div class="pagination-controls">
            <button
              @click="goToFirstPage"
              :disabled="pagingInfo.first || loading"
              class="pagination-btn"
            >
              First
            </button>
            <button
              @click="goToPreviousPage"
              :disabled="!pagingInfo.hasPrevious || loading"
              class="pagination-btn"
            >
              Previous
            </button>
            <span class="page-info">
              Page {{ pagingInfo.currentPage + 1 }} of {{ pagingInfo.totalPages }}
            </span>
            <button
              @click="goToNextPage"
              :disabled="!pagingInfo.hasNext || loading"
              class="pagination-btn"
            >
              Next
            </button>
            <button
              @click="goToLastPage"
              :disabled="pagingInfo.last || loading"
              class="pagination-btn"
            >
              Last
            </button>
          </div>

          <div class="page-size-selector">
            <label for="pageSize">Items per page:</label>
            <select
              id="pageSize"
              v-model="pageSize"
              @change="changePageSize"
              class="page-size-select"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      <div class="back-section">
        <button @click="goBack" class="back-btn">
          Back to Home
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders } from '@/config/api'
import type { ErrorDto, ErrorPagingInfo, GetErrorsResponse } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const authStore = useAuthStore()

const errorLogs = ref<ErrorDto[]>([])
const pagingInfo = ref<ErrorPagingInfo | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(0)
const pageSize = ref(5)

const fetchErrorLogs = async (page = 0, size = pageSize.value) => {
  loading.value = true
  error.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(getApiUrl(`/admin/errors?size=${size}&pageNumber=${page}`), {
      method: 'GET',
      headers: getAuthHeaders(token)
    })

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: GetErrorsResponse = await response.json()
    errorLogs.value = data.errors
    pagingInfo.value = data.pagingInfo
    currentPage.value = page
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch error logs'
    console.error('Error fetching error logs:', err)
  } finally {
    loading.value = false
  }
}

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const time = date.toLocaleTimeString()
    return `${year}/${month}/${day}, ${time}`
  } catch {
    return timestamp
  }
}

const goToFirstPage = () => {
  if (pagingInfo.value && !pagingInfo.value.first) {
    fetchErrorLogs(0, pageSize.value)
  }
}

const goToPreviousPage = () => {
  if (pagingInfo.value && pagingInfo.value.hasPrevious) {
    fetchErrorLogs(currentPage.value - 1, pageSize.value)
  }
}

const goToNextPage = () => {
  if (pagingInfo.value && pagingInfo.value.hasNext) {
    fetchErrorLogs(currentPage.value + 1, pageSize.value)
  }
}

const goToLastPage = () => {
  if (pagingInfo.value && !pagingInfo.value.last) {
    fetchErrorLogs(pagingInfo.value.totalPages - 1, pageSize.value)
  }
}

const changePageSize = () => {
  fetchErrorLogs(0, pageSize.value)
}

const goBack = () => {
  router.push('/home')
}

onMounted(() => {
  const token = authStore.getAuthToken()
  if (!token) {
    router.push('/')
    return
  }

  fetchErrorLogs()
})
</script>

<style scoped>
.error-logs {
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

.no-logs {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  font-style: italic;
}

.logs-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.logs-table thead {
  background: linear-gradient(135deg, #6f42c1, #5a2d91);
  color: white;
}

.logs-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.logs-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  vertical-align: top;
}

.logs-table tr:last-child td {
  border-bottom: none;
}

.logs-table tbody tr:hover {
  background-color: #f8f9fa;
}

.error-id {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #6c757d;
  max-width: 200px;
  word-break: break-all;
}

.timestamp {
  color: #495057;
  font-weight: 500;
  white-space: nowrap;
  min-width: 180px;
}

.message {
  color: #2c3e50;
  font-weight: 500;
  max-width: 400px;
  word-wrap: break-word;
}

.pagination-container {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info p {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.pagination-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.page-info {
  color: #495057;
  font-weight: 500;
  margin: 0 1rem;
  font-size: 0.9rem;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-size-selector label {
  color: #495057;
  font-size: 0.9rem;
  font-weight: 500;
}

.page-size-select {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: white;
  cursor: pointer;
}

.page-size-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

@media (max-width: 768px) {
  .logs-table-container {
    overflow-x: auto;
  }

  .logs-table {
    min-width: 600px;
  }

  .pagination-container {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .pagination-controls {
    justify-content: center;
  }

  .page-size-selector {
    justify-content: center;
  }

  .error-id {
    max-width: 150px;
  }

  .message {
    max-width: 250px;
  }
}

.back-section {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.back-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.back-btn:hover {
  background-color: #545b62;
  transform: translateY(-1px);
}

.back-btn:active {
  transform: translateY(0);
}
</style>