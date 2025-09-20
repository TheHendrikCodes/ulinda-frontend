<template>
  <div class="select-records-to-link">
    <AppNavigation />
    <PageHeader
      :title="model ? `Link ${sourceModelName} to ${model.name}` : 'Select Records to Link'"
      :description="linkingConstraintDescription"
    />

    <div class="content">
      <div v-if="loading" class="loading">
        <p>Loading model...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>Error loading model: {{ error }}</p>
        <button @click="fetchModel" class="retry-btn">Retry</button>
      </div>

      <div v-else>
        <div class="actions-bar">
          <button @click="goBackToRecord" class="back-to-record-btn">← Back to Record</button>
          <button @click="toggleSearch" class="search-toggle-btn" :class="{ active: showSearch }">
            <span class="search-icon">🔍</span>
            {{ showSearch ? 'Clear Search' : 'Search' }}
          </button>
        </div>

        <div v-if="recordsLoading" class="loading">
          <p>Loading records...</p>
        </div>

        <div v-else-if="recordsError" class="error-message">
          <p>Error loading records: {{ recordsError }}</p>
          <button @click="fetchRecords" class="retry-btn">Retry</button>
        </div>

        <div v-else class="records-container">
          <div class="records-table-container">
            <table class="records-table">
              <thead>
                <tr>
                  <th
                    v-for="field in recordsData?.fields"
                    :key="field.id"
                    @click="handleSort(field.id)"
                    class="sortable-header"
                  >
                    <div class="header-content">
                      <span>{{ field.name }}</span>
                      <span class="sort-indicator">
                        <span
                          v-if="sortField === field.id && sortOrder === 'asc'"
                          class="sort-arrow"
                          >↑</span
                        >
                        <span
                          v-else-if="sortField === field.id && sortOrder === 'desc'"
                          class="sort-arrow"
                          >↓</span
                        >
                        <span v-else class="sort-arrow-placeholder">↕</span>
                      </span>
                    </div>
                  </th>
                  <th @click="handleSort('created_at')" class="sortable-header">
                    <div class="header-content">
                      <span>Created</span>
                      <span class="sort-indicator">
                        <span
                          v-if="sortField === 'created_at' && sortOrder === 'asc'"
                          class="sort-arrow"
                          >↑</span
                        >
                        <span
                          v-else-if="sortField === 'created_at' && sortOrder === 'desc'"
                          class="sort-arrow"
                          >↓</span
                        >
                        <span v-else class="sort-arrow-placeholder">↕</span>
                      </span>
                    </div>
                  </th>
                  <th @click="handleSort('updated_at')" class="sortable-header">
                    <div class="header-content">
                      <span>Updated</span>
                      <span class="sort-indicator">
                        <span
                          v-if="sortField === 'updated_at' && sortOrder === 'asc'"
                          class="sort-arrow"
                          >↑</span
                        >
                        <span
                          v-else-if="sortField === 'updated_at' && sortOrder === 'desc'"
                          class="sort-arrow"
                          >↓</span
                        >
                        <span v-else class="sort-arrow-placeholder">↕</span>
                      </span>
                    </div>
                  </th>
                  <th class="actions-header">Actions</th>
                </tr>

                <!-- Search filter row (dropdowns only) -->
                <tr v-if="showSearch" class="search-row">
                  <td
                    v-for="field in recordsData?.fields"
                    :key="`search-${field.id}`"
                    class="search-cell"
                  >
                    <div class="search-filter">
                      <!-- Text fields -->
                      <select
                        v-if="['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL'].includes(field.type)"
                        :value="searchFilters[field.id]?.operator || 'all'"
                        @change="
                          updateSearchFilter(
                            field.id,
                            'operator',
                            ($event.target as HTMLSelectElement).value,
                          )
                        "
                        class="filter-select"
                      >
                        <option
                          v-for="option in textFilterOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>

                      <!-- Number fields -->
                      <select
                        v-else-if="['DECIMAL', 'LONG'].includes(field.type)"
                        :value="searchFilters[field.id]?.operator || 'all'"
                        @change="
                          updateSearchFilter(
                            field.id,
                            'operator',
                            ($event.target as HTMLSelectElement).value,
                          )
                        "
                        class="filter-select"
                      >
                        <option
                          v-for="option in numberFilterOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>

                      <!-- Boolean fields -->
                      <select
                        v-else-if="field.type === 'BOOLEAN'"
                        :value="searchFilters[field.id]?.operator || 'all'"
                        @change="
                          updateSearchFilter(
                            field.id,
                            'operator',
                            ($event.target as HTMLSelectElement).value,
                          )
                        "
                        class="filter-select"
                      >
                        <option
                          v-for="option in booleanFilterOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>

                      <!-- Date fields -->
                      <select
                        v-else-if="field.type === 'DATE'"
                        :value="searchFilters[field.id]?.operator || 'all'"
                        @change="
                          updateSearchFilter(
                            field.id,
                            'operator',
                            ($event.target as HTMLSelectElement).value,
                          )
                        "
                        class="filter-select"
                      >
                        <option
                          v-for="option in dateFilterOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>

                      <!-- DateTime fields -->
                      <select
                        v-else-if="field.type === 'DATETIME'"
                        :value="searchFilters[field.id]?.operator || 'all'"
                        @change="
                          updateSearchFilter(
                            field.id,
                            'operator',
                            ($event.target as HTMLSelectElement).value,
                          )
                        "
                        class="filter-select"
                      >
                        <option
                          v-for="option in dateTimeFilterOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                    </div>
                  </td>

                  <!-- Search cells for Created and Updated columns -->
                  <td class="search-cell">
                    <div class="search-filter">
                      <select
                        :value="searchFilters['created_at']?.operator || 'all'"
                        @change="
                          updateSearchFilter(
                            'created_at',
                            'operator',
                            ($event.target as HTMLSelectElement).value,
                          )
                        "
                        class="filter-select"
                      >
                        <option
                          v-for="option in dateTimeFilterOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                    </div>
                  </td>

                  <td class="search-cell">
                    <div class="search-filter">
                      <select
                        :value="searchFilters['updated_at']?.operator || 'all'"
                        @change="
                          updateSearchFilter(
                            'updated_at',
                            'operator',
                            ($event.target as HTMLSelectElement).value,
                          )
                        "
                        class="filter-select"
                      >
                        <option
                          v-for="option in dateTimeFilterOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                    </div>
                  </td>

                  <!-- Empty Actions cell for filter row -->
                  <td class="search-cell"></td>
                </tr>

                <!-- Search input row (appears below dropdowns when filters are selected) -->
                <tr v-if="showSearch && hasActiveFilters" class="search-input-row">
                  <td
                    v-for="field in recordsData?.fields"
                    :key="`input-${field.id}`"
                    class="search-input-cell"
                  >
                    <div class="search-input-container">
                      <!-- Text field inputs -->
                      <input
                        v-if="
                          ['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL'].includes(field.type) &&
                          searchFilters[field.id]?.operator &&
                          searchFilters[field.id].operator !== 'all'
                        "
                        :value="searchFilters[field.id]?.value || ''"
                        @input="
                          updateSearchFilter(
                            field.id,
                            'value',
                            ($event.target as HTMLInputElement).value,
                          )
                        "
                        type="text"
                        :placeholder="`Enter ${field.name.toLowerCase()}`"
                        class="filter-input"
                      />

                      <!-- Number field inputs -->
                      <input
                        v-else-if="
                          ['DECIMAL', 'LONG'].includes(field.type) &&
                          searchFilters[field.id]?.operator &&
                          searchFilters[field.id].operator !== 'all'
                        "
                        :value="searchFilters[field.id]?.value || ''"
                        @input="
                          updateSearchFilter(
                            field.id,
                            'value',
                            ($event.target as HTMLInputElement).value,
                          )
                        "
                        type="number"
                        :step="field.type === 'DECIMAL' ? '0.01' : '1'"
                        :placeholder="`Enter ${field.name.toLowerCase()}`"
                        class="filter-input"
                      />

                      <!-- Date field inputs -->
                      <input
                        v-else-if="
                          field.type === 'DATE' &&
                          searchFilters[field.id]?.operator &&
                          ['on', 'before', 'after'].includes(searchFilters[field.id].operator)
                        "
                        :value="searchFilters[field.id]?.value || ''"
                        @input="
                          updateSearchFilter(
                            field.id,
                            'value',
                            ($event.target as HTMLInputElement).value,
                          )
                        "
                        type="date"
                        class="filter-input"
                      />

                      <!-- Date between inputs -->
                      <div
                        v-else-if="
                          field.type === 'DATE' && searchFilters[field.id]?.operator === 'between'
                        "
                        class="between-inputs"
                      >
                        <input
                          :value="searchFilters[field.id]?.value || ''"
                          @input="
                            updateSearchFilter(
                              field.id,
                              'value',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          type="date"
                          placeholder="From"
                          class="filter-input filter-input-small"
                        />
                        <span class="between-separator">to</span>
                        <input
                          :value="searchFilters[field.id]?.value2 || ''"
                          @input="
                            updateSearchFilter(
                              field.id,
                              'value2',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          type="date"
                          placeholder="To"
                          class="filter-input filter-input-small"
                        />
                      </div>

                      <!-- DateTime field inputs -->
                      <input
                        v-else-if="
                          field.type === 'DATETIME' &&
                          searchFilters[field.id]?.operator &&
                          ['before', 'after'].includes(searchFilters[field.id].operator)
                        "
                        :value="searchFilters[field.id]?.value || ''"
                        @input="
                          updateSearchFilter(
                            field.id,
                            'value',
                            ($event.target as HTMLInputElement).value,
                          )
                        "
                        type="datetime-local"
                        class="filter-input"
                      />

                      <!-- DateTime between inputs -->
                      <div
                        v-else-if="
                          field.type === 'DATETIME' &&
                          searchFilters[field.id]?.operator === 'between'
                        "
                        class="between-inputs"
                      >
                        <input
                          :value="searchFilters[field.id]?.value || ''"
                          @input="
                            updateSearchFilter(
                              field.id,
                              'value',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          type="datetime-local"
                          placeholder="From"
                          class="filter-input filter-input-small"
                        />
                        <span class="between-separator">to</span>
                        <input
                          :value="searchFilters[field.id]?.value2 || ''"
                          @input="
                            updateSearchFilter(
                              field.id,
                              'value2',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          type="datetime-local"
                          placeholder="To"
                          class="filter-input filter-input-small"
                        />
                      </div>
                    </div>
                  </td>

                  <!-- Input cells for Created and Updated columns -->
                  <td class="search-input-cell">
                    <div class="search-input-container">
                      <input
                        v-if="
                          searchFilters['created_at']?.operator &&
                          ['before', 'after'].includes(searchFilters['created_at'].operator)
                        "
                        :value="searchFilters['created_at']?.value || ''"
                        @input="
                          updateSearchFilter(
                            'created_at',
                            'value',
                            ($event.target as HTMLInputElement).value,
                          )
                        "
                        type="datetime-local"
                        class="filter-input"
                      />
                      <div
                        v-else-if="searchFilters['created_at']?.operator === 'between'"
                        class="between-inputs"
                      >
                        <input
                          :value="searchFilters['created_at']?.value || ''"
                          @input="
                            updateSearchFilter(
                              'created_at',
                              'value',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          type="datetime-local"
                          placeholder="From"
                          class="filter-input filter-input-small"
                        />
                        <span class="between-separator">to</span>
                        <input
                          :value="searchFilters['created_at']?.value2 || ''"
                          @input="
                            updateSearchFilter(
                              'created_at',
                              'value2',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          type="datetime-local"
                          placeholder="To"
                          class="filter-input filter-input-small"
                        />
                      </div>
                    </div>
                  </td>

                  <td class="search-input-cell">
                    <div class="search-input-container">
                      <input
                        v-if="
                          searchFilters['updated_at']?.operator &&
                          ['before', 'after'].includes(searchFilters['updated_at'].operator)
                        "
                        :value="searchFilters['updated_at']?.value || ''"
                        @input="
                          updateSearchFilter(
                            'updated_at',
                            'value',
                            ($event.target as HTMLInputElement).value,
                          )
                        "
                        type="datetime-local"
                        class="filter-input"
                      />
                      <div
                        v-else-if="searchFilters['updated_at']?.operator === 'between'"
                        class="between-inputs"
                      >
                        <input
                          :value="searchFilters['updated_at']?.value || ''"
                          @input="
                            updateSearchFilter(
                              'updated_at',
                              'value',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          type="datetime-local"
                          placeholder="From"
                          class="filter-input filter-input-small"
                        />
                        <span class="between-separator">to</span>
                        <input
                          :value="searchFilters['updated_at']?.value2 || ''"
                          @input="
                            updateSearchFilter(
                              'updated_at',
                              'value2',
                              ($event.target as HTMLInputElement).value,
                            )
                          "
                          type="datetime-local"
                          placeholder="To"
                          class="filter-input filter-input-small"
                        />
                      </div>
                    </div>
                  </td>

                  <!-- Search button cell for input row -->
                  <td class="search-input-cell action-cell">
                    <button
                      @click="applySearch"
                      :disabled="!isSearchValid || !hasActiveFilters"
                      class="action-btn search-btn"
                    >
                      Search
                    </button>
                  </td>
                </tr>
              </thead>

              <tbody>
                <tr v-if="records.length === 0">
                  <td :colspan="(recordsData?.fields.length || 0) + 3" class="no-records">
                    No records found.
                  </td>
                </tr>

                <tr v-for="record in records" :key="record.id">
                  <td v-for="field in recordsData?.fields" :key="field.id" class="record-cell">
                    {{ getFieldDisplayValue(record, field) }}
                  </td>
                  <td class="record-cell">{{ formatDate(record.createdAt) }}</td>
                  <td class="record-cell">{{ formatDate(record.updatedAt) }}</td>
                  <td class="action-cell">
                    <button
                      @click="linkRecord(record.id)"
                      class="action-btn link-btn"
                      :disabled="linking"
                    >
                      {{ linking ? 'Linking...' : 'Link' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="recordsData?.pagination" class="pagination">
            <button
              v-if="recordsData.pagination.hasPrevious"
              @click="goToPreviousPage"
              class="pagination-btn"
              :disabled="recordsLoading"
            >
              Previous
            </button>

            <span class="pagination-info">
              Showing {{ records.length }} of {{ (recordsData.pagination.totalEstimate || 0).toLocaleString() }} records
              <span v-if="recordsData.pagination.actualRecordCount">
                (Total Records: {{ recordsData.pagination.actualRecordCount.toLocaleString() }})
              </span>
            </span>

            <button
              v-if="recordsData.pagination.hasNext"
              @click="goToNextPage"
              class="pagination-btn"
              :disabled="recordsLoading"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Dialog -->
    <div v-if="showErrorDialog" class="error-overlay" @click="closeErrorDialog">
      <div class="error-dialog" @click.stop>
        <div class="error-dialog-header">
          <h3>Error</h3>
          <button @click="closeErrorDialog" class="close-btn">&times;</button>
        </div>
        <div class="error-dialog-body">
          <p>{{ errorDialogMessage }}</p>
        </div>
        <div class="error-dialog-footer">
          <button @click="closeErrorDialog" class="ok-btn">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders, API_CONFIG } from '@/config/api'
import type {
  ModelDto,
  GetModelResponse,
  GetRecordsResponse,
  GetRecordsRequest,
  Record,
  LinkRecordsRequest,
  SearchParameter,
} from '@/types/models'
import { SearchFieldIdentifier, SearchType, QueryType } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Route parameters
const sourceRecordId = route.params.sourceRecordId as string
const sourceModelId = route.params.sourceModelId as string
const targetModelId = route.params.targetModelId as string
const modelLinkId = route.params.modelLinkId as string
const sourceModelName = route.params.sourceModelName as string

// State
const model = ref<ModelDto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const recordsData = ref<GetRecordsResponse | null>(null)
const records = ref<Record[]>([])
const recordsLoading = ref(false)
const recordsError = ref<string | null>(null)
const linking = ref(false)
const showErrorDialog = ref(false)
const errorDialogMessage = ref('')

// Search and pagination
const showSearch = ref(false)
const searchFilters = ref<Record<string, { operator: string; value: string; value2?: string }>>({})
const sortField = ref('created_at')
const sortOrder = ref('desc')
const currentCursor = ref<string>('')

// Computed
const linkingConstraintDescription = computed(() => {
  if (!model.value) return 'Loading...'

  // This would need to be passed from the linking context
  // For now, showing generic message
  return `Select ${model.value.name} records to link. Click "Link" to create the connection.`
})

// Filter options for different field types
const textFilterOptions = [
  { value: 'all', label: 'All text' },
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'not_contains', label: 'Not contains' },
  { value: 'not_equals', label: 'Not equals' },
]

const numberFilterOptions = [
  { value: 'all', label: 'All values' },
  { value: 'equals', label: 'Equals' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
]

const booleanFilterOptions = [
  { value: 'all', label: 'All values' },
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
]

const dateFilterOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'on', label: 'On' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
]

const dateTimeFilterOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
]

// Check if any filters are active (not 'all')
const hasActiveFilters = computed(() => {
  return Object.values(searchFilters.value).some(
    (filter) => filter.operator && filter.operator !== 'all',
  )
})

// Check if search criteria are valid and complete
const isSearchValid = computed(() => {
  return Object.entries(searchFilters.value).every(([fieldId, filter]) => {
    if (!filter.operator || filter.operator === 'all') {
      return true // No validation needed for 'all' filters
    }

    // Get field info to determine validation rules
    const getFieldInfo = (fieldId: string) => {
      if (fieldId === 'created_at' || fieldId === 'updated_at') return { type: 'DATETIME' }
      if (fieldId === 'id') return { type: 'ID' }

      const field = recordsData.value?.fields.find((f) => f.id === fieldId)
      return field ? { type: field.type } : null
    }

    const fieldInfo = getFieldInfo(fieldId)
    if (!fieldInfo) return true

    // Text fields (SINGLE_LINE_TEXT, MULTI_LINE_TEXT, EMAIL, ID) - need value
    if (['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL', 'ID'].includes(fieldInfo.type)) {
      return filter.value && filter.value.trim().length > 0
    }

    // Number fields (DECIMAL, LONG) - need valid number
    if (['DECIMAL', 'LONG'].includes(fieldInfo.type)) {
      if (!filter.value) return false
      const num = fieldInfo.type === 'DECIMAL' ? parseFloat(filter.value) : parseInt(filter.value)
      return !isNaN(num)
    }

    // Boolean fields - always valid (dropdown selection)
    if (fieldInfo.type === 'BOOLEAN') {
      return true
    }

    // Date fields
    if (fieldInfo.type === 'DATE') {
      if (filter.operator === 'between') {
        return filter.value && filter.value2 && filter.value.length > 0 && filter.value2.length > 0
      }
      if (['on', 'before', 'after'].includes(filter.operator)) {
        return filter.value && filter.value.length > 0
      }
    }

    // DateTime fields
    if (fieldInfo.type === 'DATETIME') {
      if (filter.operator === 'between') {
        return filter.value && filter.value2 && filter.value.length > 0 && filter.value2.length > 0
      }
      if (['before', 'after'].includes(filter.operator)) {
        return filter.value && filter.value.length > 0
      }
    }

    return true
  })
})

// Methods
const fetchModel = async () => {
  loading.value = true
  error.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(getApiUrl(`/v1/models/${targetModelId}`), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: GetModelResponse = await response.json()
    model.value = data.model
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch model'
    console.error('Error fetching model:', err)
  } finally {
    loading.value = false
  }
}

const fetchRecords = async (cursor?: string, previous = false, useSearch = false) => {
  recordsLoading.value = true
  recordsError.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const searchParams = useSearch ? buildSearchParameters() : []

    const requestData: GetRecordsRequest = {
      limit: 50,
      cursor: cursor || undefined,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      previous,
      searchParameters: searchParams,
      modelLinkId: modelLinkId,
      sourceRecordId: sourceRecordId,
      queryType: QueryType.RECORDS_NOT_LINKED,
    }

    const response = await fetch(getApiUrl(`/v1/models/${sourceModelId}/records/search`), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: GetRecordsResponse = await response.json()
    recordsData.value = data
    records.value = data.records

    // Update cursor for pagination
    if (data.pagination.hasNext && !previous) {
      currentCursor.value = data.pagination.nextCursor || ''
    } else if (data.pagination.hasPrevious && previous) {
      currentCursor.value = data.pagination.previousCursor || ''
    }
  } catch (err) {
    recordsError.value = err instanceof Error ? err.message : 'Failed to fetch records'
    console.error('Error fetching records:', err)
  } finally {
    recordsLoading.value = false
  }
}

const linkRecord = async (targetRecordId: string) => {
  linking.value = true

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const linkRequest: LinkRecordsRequest = {
      modelLinkId,
      sourceModelId,
      sourceRecordId,
      targetRecordId,
    }

    const response = await fetch(getApiUrl('/v1/records/link-records'), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(linkRequest),
    })

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }

      // Handle 500 errors with showMessageToUser
      if (response.status === 500) {
        try {
          const errorData = await response.json()
          if (errorData.showMessageToUser && errorData.message) {
            errorDialogMessage.value = errorData.message
            showErrorDialog.value = true
            return
          }
        } catch (parseError) {
          if (parseError instanceof SyntaxError) {
            console.error('Error parsing 500 response JSON:', parseError)
          } else {
            throw parseError
          }
        }
      }

      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Success! Navigate back to the record view
    router.push({
      name: 'view-record',
      params: {
        modelId: sourceModelId,
        recordId: sourceRecordId,
      },
    })
  } catch (err) {
    console.error('Error linking records:', err)
    alert('Failed to link records. Please try again.')
  } finally {
    linking.value = false
  }
}

const closeErrorDialog = () => {
  showErrorDialog.value = false
  errorDialogMessage.value = ''
}

const goBackToRecord = () => {
  router.push({
    name: 'view-record',
    params: {
      modelId: sourceModelId,
      recordId: sourceRecordId,
    },
  })
}

const buildSearchParameters = (): SearchParameter[] => {
  const searchParameters: SearchParameter[] = []

  // Helper function to get field info
  const getFieldInfo = (fieldId: string) => {
    if (fieldId === 'created_at')
      return { type: 'DATETIME', searchFieldIdentifier: SearchFieldIdentifier.CREATED_AT }
    if (fieldId === 'updated_at')
      return { type: 'DATETIME', searchFieldIdentifier: SearchFieldIdentifier.UPDATED_AT }
    if (fieldId === 'id') return { type: 'ID', searchFieldIdentifier: SearchFieldIdentifier.ID }

    const field = recordsData.value?.fields.find((f) => f.id === fieldId)
    return field
      ? {
          type: field.type,
          searchFieldIdentifier: SearchFieldIdentifier.CUSTOM_FIELD,
          fieldId: fieldId,
        }
      : null
  }

  Object.entries(searchFilters.value).forEach(([fieldId, filter]) => {
    if (!filter.operator || filter.operator === 'all') return

    const fieldInfo = getFieldInfo(fieldId)
    if (!fieldInfo) return

    const searchParam: SearchParameter = {
      searchFieldIdentifier: fieldInfo.searchFieldIdentifier,
      searchType: SearchType.TEXT_CONTAINS, // Default, will be set below
    }

    // Set fieldID only for custom fields
    if (fieldInfo.searchFieldIdentifier === SearchFieldIdentifier.CUSTOM_FIELD) {
      searchParam.fieldID = fieldId
    }

    // Text fields
    if (['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL'].includes(fieldInfo.type)) {
      switch (filter.operator) {
        case 'contains':
          searchParam.searchType = SearchType.TEXT_CONTAINS
          searchParam.textSearchValue = filter.value
          break
        case 'equals':
          searchParam.searchType = SearchType.TEXT_EQUALS
          searchParam.textSearchValue = filter.value
          break
        case 'starts_with':
          searchParam.searchType = SearchType.TEXT_STARTS_WITH
          searchParam.textSearchValue = filter.value
          break
        case 'ends_with':
          searchParam.searchType = SearchType.TEXT_ENDS_WITH
          searchParam.textSearchValue = filter.value
          break
        case 'not_contains':
          searchParam.searchType = SearchType.TEXT_NOT_CONTAINS
          searchParam.textSearchValue = filter.value
          break
        case 'not_equals':
          searchParam.searchType = SearchType.TEXT_NOT_EQUALS
          searchParam.textSearchValue = filter.value
          break
      }
    }
    // Number fields - DECIMAL
    else if (fieldInfo.type === 'DECIMAL') {
      switch (filter.operator) {
        case 'equals':
          searchParam.searchType = SearchType.DECIMAL_EQUALS
          searchParam.doubleSearchValue = parseFloat(filter.value)
          break
        case 'greater_than':
          searchParam.searchType = SearchType.DECIMAL_GREATER_THAN
          searchParam.doubleSearchValue = parseFloat(filter.value)
          break
        case 'less_than':
          searchParam.searchType = SearchType.DECIMAL_LESS_THAN
          searchParam.doubleSearchValue = parseFloat(filter.value)
          break
      }
    }
    // Number fields - LONG
    else if (fieldInfo.type === 'LONG') {
      switch (filter.operator) {
        case 'equals':
          searchParam.searchType = SearchType.LONG_EQUALS
          searchParam.longSearchValue = parseInt(filter.value)
          break
        case 'greater_than':
          searchParam.searchType = SearchType.LONG_GREATER_THAN
          searchParam.longSearchValue = parseInt(filter.value)
          break
        case 'less_than':
          searchParam.searchType = SearchType.LONG_LESS_THAN
          searchParam.longSearchValue = parseInt(filter.value)
          break
      }
    }
    // Boolean fields
    else if (fieldInfo.type === 'BOOLEAN') {
      if (filter.operator === 'true') {
        searchParam.searchType = SearchType.BOOLEAN_TRUE
        searchParam.yesNo = true
      } else if (filter.operator === 'false') {
        searchParam.searchType = SearchType.BOOLEAN_FALSE
        searchParam.yesNo = false
      }
    }
    // Date fields
    else if (fieldInfo.type === 'DATE') {
      switch (filter.operator) {
        case 'on':
          searchParam.searchType = SearchType.DATE_ON
          searchParam.dateOn = filter.value
          break
        case 'before':
          searchParam.searchType = SearchType.DATE_BEFORE
          searchParam.dateBefore = filter.value
          break
        case 'after':
          searchParam.searchType = SearchType.DATE_AFTER
          searchParam.dateAfter = filter.value
          break
        case 'between':
          searchParam.searchType = SearchType.DATE_BETWEEN
          searchParam.dateStart = filter.value
          searchParam.dateEnd = filter.value2
          break
      }
    }
    // DateTime fields
    else if (
      fieldInfo.type === 'DATETIME' ||
      fieldId === 'created_at' ||
      fieldId === 'updated_at'
    ) {
      switch (filter.operator) {
        case 'before':
          searchParam.searchType = SearchType.DATE_TIME_BEFORE
          searchParam.dateTimeBefore = filter.value
          break
        case 'after':
          searchParam.searchType = SearchType.DATE_TIME_AFTER
          searchParam.dateTimeAfter = filter.value
          break
        case 'between':
          searchParam.searchType = SearchType.DATE_TIME_BETWEEN
          searchParam.dateTimeStart = filter.value
          searchParam.dateTimeEnd = filter.value2
          break
      }
    }

    searchParameters.push(searchParam)
  })

  return searchParameters
}

const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
  fetchRecords()
}

const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    // Clear search when toggling off
    searchFilters.value = {}
    createdAtSearch.value = ''
    updatedAtSearch.value = ''
    fetchRecords()
  }
}

const updateSearchFilter = (fieldId: string, property: string, value: string) => {
  if (!searchFilters.value[fieldId]) {
    searchFilters.value[fieldId] = { operator: 'all', value: '' }
  }
  searchFilters.value[fieldId][property] = value
}

const applySearch = () => {
  currentCursor.value = ''
  fetchRecords('', false, true)
}

const goToNextPage = () => {
  if (recordsData.value?.pagination?.hasNext) {
    fetchRecords(recordsData.value.pagination.nextCursor || '', false, showSearch.value)
  }
}

const goToPreviousPage = () => {
  if (recordsData.value?.pagination?.hasPrevious) {
    fetchRecords(recordsData.value.pagination.previousCursor || '', true, showSearch.value)
  }
}

const getFieldDisplayValue = (record: Record, field: any): string => {
  const value = record.fieldValues[field.id]

  if (value === null || value === undefined) {
    return ''
  }

  if (field.type === 'BOOLEAN') {
    return value ? 'Yes' : 'No'
  }

  if (field.type === 'DATE') {
    return formatDate(value)
  }

  if (field.type === 'DATETIME') {
    return formatDateTime(value)
  }

  return String(value)
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const formatDateTime = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}

onMounted(() => {
  const token = authStore.getAuthToken()
  if (!token) {
    router.push('/')
    return
  }

  fetchModel()
  fetchRecords()
})
</script>

<style scoped>
/* Reuse most styles from RecordsView */
.select-records-to-link {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  margin: 0;
  padding: 0;
}

.content {
  padding-top: calc(195px + 2rem);
  padding-left: 2rem;
  padding-right: 2rem;
  padding-bottom: 2rem;
  width: 100%;
  max-width: 1400px;
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

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-to-record-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition:
    background-color 0.2s,
    transform 0.1s;
}

.back-to-record-btn:hover {
  background-color: #545b62;
  transform: translateY(-1px);
}

.search-toggle-btn {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition:
    background-color 0.2s,
    transform 0.1s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-toggle-btn:hover {
  background-color: #138496;
  transform: translateY(-1px);
}

.search-toggle-btn.active {
  background-color: #dc3545;
}

.search-toggle-btn.active:hover {
  background-color: #c82333;
}

.records-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.records-table-container {
  overflow-x: auto;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.records-table th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 10;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
}

.sortable-header:hover {
  background-color: #e9ecef;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sort-indicator {
  margin-left: 0.5rem;
  font-size: 0.8rem;
}

.sort-arrow {
  color: #007bff;
  font-weight: bold;
}

.sort-arrow-placeholder {
  color: #ccc;
}

.actions-header {
  text-align: center;
  width: 120px;
  min-width: 120px;
}

.search-row {
  background-color: #fff3cd;
  border-bottom: 2px solid #ffeaa7;
}

.search-row:hover {
  background-color: #fff3cd !important;
}

.search-input-row {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.search-input-row:hover {
  background-color: #f8f9fa !important;
}

.search-cell {
  padding: 0.75rem;
  vertical-align: top;
}

.search-input-cell {
  padding: 0.5rem 0.75rem;
  vertical-align: top;
}

.search-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
}

.search-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.filter-input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: border-color 0.2s;
}

.filter-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.between-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-input-small {
  flex: 1;
  min-width: 120px;
}

.between-separator {
  color: #6c757d;
  font-size: 0.85rem;
  white-space: nowrap;
}

.records-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.record-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-cell {
  text-align: center;
  width: 120px;
  min-width: 120px;
}

.no-records {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.records-table tbody tr:hover {
  background-color: #f8f9fa;
}

.action-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition:
    background-color 0.2s,
    transform 0.1s;
  min-width: 60px;
}

.link-btn {
  background-color: #28a745;
  color: white;
}

.link-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
}

.link-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.search-btn {
  background-color: #007bff;
  color: white;
  width: 100%;
}

.search-btn:hover {
  background-color: #0056b3;
}

.search-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
}

.search-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
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
}

.pagination-info {
  color: #6c757d;
  font-size: 0.9rem;
}

/* Error Dialog Styles */
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.error-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
}

.error-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #dc3545;
  color: white;
}

.error-dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.error-dialog-body {
  padding: 1.5rem;
  color: #333;
}

.error-dialog-body p {
  margin: 0;
  line-height: 1.5;
}

.error-dialog-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
}

.ok-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.ok-btn:hover {
  background-color: #0056b3;
}

@media (max-width: 768px) {
  .actions-bar {
    flex-direction: column;
    gap: 1rem;
  }

  .records-table {
    font-size: 0.8rem;
  }

  .records-table th,
  .records-table td {
    padding: 0.5rem;
  }

  .record-cell {
    max-width: 150px;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
