<template>
  <div class="records">
    <AppNavigation />
    <PageHeader
      :title="model ? `${model.name} Records` : 'Model Records'"
      :description="model ? (model.description || 'View and manage records for this model.') : 'Loading model details...'"
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
          <button @click="navigateToAddRecord" class="add-record-btn">
            Add Record
          </button>
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
                    <th v-for="field in recordsData?.fields" :key="field.id" 
                        @click="handleSort(field.id)" 
                        class="sortable-header">
                      <div class="header-content">
                        <span>{{ field.name }}</span>
                        <span class="sort-indicator">
                          <span v-if="sortField === field.id && sortOrder === 'asc'" class="sort-arrow">↑</span>
                          <span v-else-if="sortField === field.id && sortOrder === 'desc'" class="sort-arrow">↓</span>
                          <span v-else class="sort-arrow-placeholder">↕</span>
                        </span>
                      </div>
                    </th>
                    <th @click="handleSort('created_at')" class="sortable-header">
                      <div class="header-content">
                        <span>Created</span>
                        <span class="sort-indicator">
                          <span v-if="sortField === 'created_at' && sortOrder === 'asc'" class="sort-arrow">↑</span>
                          <span v-else-if="sortField === 'created_at' && sortOrder === 'desc'" class="sort-arrow">↓</span>
                          <span v-else class="sort-arrow-placeholder">↕</span>
                        </span>
                      </div>
                    </th>
                    <th @click="handleSort('updated_at')" class="sortable-header">
                      <div class="header-content">
                        <span>Updated</span>
                        <span class="sort-indicator">
                          <span v-if="sortField === 'updated_at' && sortOrder === 'asc'" class="sort-arrow">↑</span>
                          <span v-else-if="sortField === 'updated_at' && sortOrder === 'desc'" class="sort-arrow">↓</span>
                          <span v-else class="sort-arrow-placeholder">↕</span>
                        </span>
                      </div>
                    </th>
                    <th class="actions-header">
                      Actions
                    </th>
                  </tr>
                  
                  <!-- Search filter row (dropdowns only) -->
                  <tr v-if="showSearch" class="search-row">
                    <td v-for="field in recordsData?.fields" :key="`search-${field.id}`" class="search-cell">
                      <div class="search-filter">
                        <!-- Text fields (SINGLE_LINE_TEXT, MULTI_LINE_TEXT, EMAIL) -->
                        <select 
                          v-if="['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL'].includes(field.type)"
                          :value="searchFilters[field.id]?.operator || 'all'"
                          @change="updateSearchFilter(field.id, 'operator', $event.target.value)"
                          class="filter-select"
                        >
                          <option v-for="option in textFilterOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                        
                        <!-- Number fields (DECIMAL, LONG) -->
                        <select 
                          v-else-if="['DECIMAL', 'LONG'].includes(field.type)"
                          :value="searchFilters[field.id]?.operator || 'all'"
                          @change="updateSearchFilter(field.id, 'operator', $event.target.value)"
                          class="filter-select"
                        >
                          <option v-for="option in numberFilterOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                        
                        <!-- Boolean fields -->
                        <select 
                          v-else-if="field.type === 'BOOLEAN'"
                          :value="searchFilters[field.id]?.operator || 'all'"
                          @change="updateSearchFilter(field.id, 'operator', $event.target.value)"
                          class="filter-select"
                        >
                          <option value="all">All values</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                        
                        <!-- Date fields -->
                        <select 
                          v-else-if="field.type === 'DATE'"
                          :value="searchFilters[field.id]?.operator || 'all'"
                          @change="updateSearchFilter(field.id, 'operator', $event.target.value)"
                          class="filter-select"
                        >
                          <option v-for="option in dateFilterOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                        
                        <!-- DateTime fields -->
                        <select 
                          v-else-if="field.type === 'DATETIME'"
                          :value="searchFilters[field.id]?.operator || 'all'"
                          @change="updateSearchFilter(field.id, 'operator', $event.target.value)"
                          class="filter-select"
                        >
                          <option v-for="option in dateTimeFilterOptions" :key="option.value" :value="option.value">
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
                          @change="updateSearchFilter('created_at', 'operator', $event.target.value)"
                          class="filter-select"
                        >
                          <option v-for="option in dateTimeFilterOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </option>
                        </select>
                      </div>
                    </td>
                    
                    <td class="search-cell">
                      <div class="search-filter">
                        <select 
                          :value="searchFilters['updated_at']?.operator || 'all'"
                          @change="updateSearchFilter('updated_at', 'operator', $event.target.value)"
                          class="filter-select"
                        >
                          <option v-for="option in dateTimeFilterOptions" :key="option.value" :value="option.value">
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
                    <td v-for="field in recordsData?.fields" :key="`input-${field.id}`" class="search-input-cell">
                      <div class="search-input-container">
                        <!-- Text field inputs -->
                        <input 
                          v-if="['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL'].includes(field.type) && searchFilters[field.id]?.operator && searchFilters[field.id].operator !== 'all'"
                          :value="searchFilters[field.id]?.value || ''"
                          @input="updateSearchFilter(field.id, 'value', $event.target.value)"
                          type="text" 
                          :placeholder="`Enter ${field.name.toLowerCase()}`"
                          class="filter-input"
                        />
                        
                        <!-- Number field inputs -->
                        <input 
                          v-else-if="['DECIMAL', 'LONG'].includes(field.type) && searchFilters[field.id]?.operator && searchFilters[field.id].operator !== 'all'"
                          :value="searchFilters[field.id]?.value || ''"
                          @input="updateSearchFilter(field.id, 'value', $event.target.value)"
                          type="number" 
                          :step="field.type === 'DECIMAL' ? '0.01' : '1'"
                          :placeholder="`Enter ${field.name.toLowerCase()}`"
                          class="filter-input"
                        />
                        
                        <!-- Date field inputs -->
                        <input 
                          v-else-if="field.type === 'DATE' && searchFilters[field.id]?.operator && ['on', 'before', 'after'].includes(searchFilters[field.id].operator)"
                          :value="searchFilters[field.id]?.value || ''"
                          @input="updateSearchFilter(field.id, 'value', $event.target.value)"
                          type="date"
                          class="filter-input"
                        />
                        
                        <!-- Date between inputs -->
                        <div v-else-if="field.type === 'DATE' && searchFilters[field.id]?.operator === 'between'" class="between-inputs">
                          <input 
                            :value="searchFilters[field.id]?.value || ''"
                            @input="updateSearchFilter(field.id, 'value', $event.target.value)"
                            type="date"
                            placeholder="From"
                            class="filter-input filter-input-small"
                          />
                          <span class="between-separator">to</span>
                          <input 
                            :value="searchFilters[field.id]?.value2 || ''"
                            @input="updateSearchFilter(field.id, 'value2', $event.target.value)"
                            type="date"
                            placeholder="To"
                            class="filter-input filter-input-small"
                          />
                        </div>
                        
                        <!-- DateTime field inputs -->
                        <input 
                          v-else-if="field.type === 'DATETIME' && searchFilters[field.id]?.operator && ['before', 'after'].includes(searchFilters[field.id].operator)"
                          :value="searchFilters[field.id]?.value || ''"
                          @input="updateSearchFilter(field.id, 'value', $event.target.value)"
                          type="datetime-local"
                          class="filter-input"
                        />
                        
                        <!-- DateTime between inputs -->
                        <div v-else-if="field.type === 'DATETIME' && searchFilters[field.id]?.operator === 'between'" class="between-inputs">
                          <input 
                            :value="searchFilters[field.id]?.value || ''"
                            @input="updateSearchFilter(field.id, 'value', $event.target.value)"
                            type="datetime-local"
                            placeholder="From"
                            class="filter-input filter-input-small"
                          />
                          <span class="between-separator">to</span>
                          <input 
                            :value="searchFilters[field.id]?.value2 || ''"
                            @input="updateSearchFilter(field.id, 'value2', $event.target.value)"
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
                          v-if="searchFilters['created_at']?.operator && ['before', 'after'].includes(searchFilters['created_at'].operator)"
                          :value="searchFilters['created_at']?.value || ''"
                          @input="updateSearchFilter('created_at', 'value', $event.target.value)"
                          type="datetime-local"
                          class="filter-input"
                        />
                        <div v-else-if="searchFilters['created_at']?.operator === 'between'" class="between-inputs">
                          <input 
                            :value="searchFilters['created_at']?.value || ''"
                            @input="updateSearchFilter('created_at', 'value', $event.target.value)"
                            type="datetime-local"
                            placeholder="From"
                            class="filter-input filter-input-small"
                          />
                          <span class="between-separator">to</span>
                          <input 
                            :value="searchFilters['created_at']?.value2 || ''"
                            @input="updateSearchFilter('created_at', 'value2', $event.target.value)"
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
                          v-if="searchFilters['updated_at']?.operator && ['before', 'after'].includes(searchFilters['updated_at'].operator)"
                          :value="searchFilters['updated_at']?.value || ''"
                          @input="updateSearchFilter('updated_at', 'value', $event.target.value)"
                          type="datetime-local"
                          class="filter-input"
                        />
                        <div v-else-if="searchFilters['updated_at']?.operator === 'between'" class="between-inputs">
                          <input 
                            :value="searchFilters['updated_at']?.value || ''"
                            @input="updateSearchFilter('updated_at', 'value', $event.target.value)"
                            type="datetime-local"
                            placeholder="From"
                            class="filter-input filter-input-small"
                          />
                          <span class="between-separator">to</span>
                          <input 
                            :value="searchFilters['updated_at']?.value2 || ''"
                            @input="updateSearchFilter('updated_at', 'value2', $event.target.value)"
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
                        @click="handleSearch" 
                        :disabled="!isSearchValid || !hasActiveFilters"
                        class="action-btn search-btn"
                      >
                        Search
                      </button>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <!-- Empty state row when no records -->
                  <tr v-if="records.length === 0" class="empty-state-row">
                    <td :colspan="(recordsData?.fields?.length || 0) + 3" class="empty-state-cell">
                      <div class="empty-state-content">
                        <span v-if="isSearchResult">No Records Found In Search</span>
                        <span v-else>No Records Found</span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Data rows -->
                  <tr v-for="record in records" :key="record.id">
                    <td v-for="field in recordsData?.fields" :key="field.id">
                      <span v-if="field.type === 'BOOLEAN'">
                        {{ record.fieldValues[field.id] === null || record.fieldValues[field.id] === undefined ? '' : (record.fieldValues[field.id] ? 'Yes' : 'No') }}
                      </span>
                      <span v-else-if="field.type === 'DECIMAL'">
                        {{ record.fieldValues[field.id] !== null && record.fieldValues[field.id] !== undefined ? Number(record.fieldValues[field.id]).toLocaleString() : '' }}
                      </span>
                      <span v-else-if="field.type === 'LONG'">
                        {{ record.fieldValues[field.id] !== null && record.fieldValues[field.id] !== undefined ? Number(record.fieldValues[field.id]).toLocaleString() : '' }}
                      </span>
                      <span v-else-if="field.type === 'DATE'">
                        {{ record.fieldValues[field.id] ? formatDate(record.fieldValues[field.id], 'date') : '' }}
                      </span>
                      <span v-else-if="field.type === 'DATETIME'">
                        {{ record.fieldValues[field.id] ? formatDate(record.fieldValues[field.id]) : '' }}
                      </span>
                      <span v-else>
                        {{ record.fieldValues[field.id] || '' }}
                      </span>
                    </td>
                    <td>{{ formatDate(record.createdAt) }}</td>
                    <td>{{ formatDate(record.updatedAt) }}</td>
                    <td class="action-cell">
                      <button @click="navigateToViewRecord(record.id)" class="action-btn view-btn">
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="pagination-controls">
              <button 
                @click="goToPreviousPage" 
                :disabled="!pagination?.hasPrevious"
                class="pagination-btn"
              >
                Previous
              </button>
              
              <span class="pagination-info">
                Showing {{ records.length }} of {{ (pagination?.totalEstimate || 0).toLocaleString() }} records
                <span v-if="pagination?.actualRecordCount">
                  (Total Records: {{ pagination.actualRecordCount.toLocaleString() }})
                </span>
              </span>
              
              <button 
                @click="goToNextPage" 
                :disabled="!pagination?.hasNext"
                class="pagination-btn"
              >
                Next
              </button>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders, API_CONFIG } from '@/config/api'
import type { Model, ModelsResponse, Record, GetRecordsResponse, Pagination, GetRecordsRequest, SearchParameter, ModelDto, GetModelResponse } from '@/types/models'
import { SearchType, SearchFieldIdentifier, QueryType } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const model = ref<ModelDto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const records = ref<Record[]>([])
const recordsData = ref<GetRecordsResponse | null>(null)
const pagination = ref<Pagination | null>(null)
const recordsLoading = ref(false)
const recordsError = ref<string | null>(null)
const currentCursor = ref<string | null>(null)
const sortField = ref<string>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const isSearchResult = ref(false)

// Search state
const showSearch = ref(false)
const searchFilters = ref<Record<string, { operator: string; value: string; value2?: string }>>({})

// Filter options for different field types
const textFilterOptions = [
  { value: 'all', label: 'All text' },
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'not_contains', label: 'Not contains' },
  { value: 'not_equals', label: 'Not equals' }
]

const numberFilterOptions = [
  { value: 'all', label: 'All values' },
  { value: 'equals', label: 'Equals' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' }
]

const dateFilterOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'on', label: 'On' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' }
]

const dateTimeFilterOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' }
]

// Check if any filters are active (not 'all')
const hasActiveFilters = computed(() => {
  return Object.values(searchFilters.value).some(filter => 
    filter.operator && filter.operator !== 'all'
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
      
      const field = recordsData.value?.fields.find(f => f.id === fieldId)
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

const fetchModel = async () => {
  loading.value = true
  error.value = null
  
  try {
    const token = authStore.getAuthToken()
    
    if (!token) {
      router.push('/')
      return
    }

    const modelId = route.params.modelId as string
    const response = await fetch(getApiUrl(`/v1/models/${modelId}`), {
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
    
    const data: GetModelResponse = await response.json()
    model.value = data.model
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch model'
    console.error('Error fetching model:', err)
  } finally {
    loading.value = false
  }
}

const fetchRecords = async (cursor: string | null = null, previous: boolean = false, useSearch: boolean = false) => {
  recordsLoading.value = true
  recordsError.value = null
  
  try {
    const token = authStore.getAuthToken()
    
    if (!token) {
      router.push('/')
      return
    }

    const modelId = route.params.modelId as string
    
    const requestBody: GetRecordsRequest = {
      limit: 5,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      previous: previous,
      searchParameters: useSearch ? convertFiltersToSearchParameters() : [],
      queryType: QueryType.ALL_RECORDS
    }
    
    if (cursor) {
      requestBody.cursor = cursor
    }

    const response = await fetch(getApiUrl(`/v1/models/${modelId}/records/search`), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(requestBody)
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
    records.value = data.records
    recordsData.value = data
    pagination.value = data.pagination
    currentCursor.value = cursor
    isSearchResult.value = useSearch
  } catch (err) {
    recordsError.value = err instanceof Error ? err.message : 'Failed to fetch records'
    console.error('Error fetching records:', err)
  } finally {
    recordsLoading.value = false
  }
}

const goToNextPage = () => {
  if (pagination.value?.hasNext && pagination.value.nextCursor) {
    fetchRecords(pagination.value.nextCursor, false, hasActiveFilters.value)
  }
}

const goToPreviousPage = () => {
  if (pagination.value?.hasPrevious && pagination.value.previousCursor) {
    fetchRecords(pagination.value.previousCursor, true, hasActiveFilters.value)
  }
}

const updateSearchFilter = (fieldId: string, property: string, value: string) => {
  if (!searchFilters.value[fieldId]) {
    searchFilters.value[fieldId] = { operator: 'all', value: '' }
  }
  searchFilters.value[fieldId][property] = value
}

const convertFiltersToSearchParameters = (): SearchParameter[] => {
  const searchParameters: SearchParameter[] = []
  
  // Helper function to get field info
  const getFieldInfo = (fieldId: string) => {
    if (fieldId === 'created_at') return { type: 'DATETIME', searchFieldIdentifier: SearchFieldIdentifier.CREATED_AT }
    if (fieldId === 'updated_at') return { type: 'DATETIME', searchFieldIdentifier: SearchFieldIdentifier.UPDATED_AT }
    if (fieldId === 'id') return { type: 'ID', searchFieldIdentifier: SearchFieldIdentifier.ID }
    
    const field = recordsData.value?.fields.find(f => f.id === fieldId)
    return field ? { type: field.type, searchFieldIdentifier: SearchFieldIdentifier.CUSTOM_FIELD, fieldId: fieldId } : null
  }

  Object.entries(searchFilters.value).forEach(([fieldId, filter]) => {
    if (!filter.operator || filter.operator === 'all') return
    
    const fieldInfo = getFieldInfo(fieldId)
    if (!fieldInfo) return

    const searchParam: SearchParameter = {
      searchFieldIdentifier: fieldInfo.searchFieldIdentifier,
      searchType: SearchType.TEXT_CONTAINS // Default, will be set below
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
    else if (fieldInfo.type === 'DATETIME' || fieldId === 'created_at' || fieldId === 'updated_at') {
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

const handleSort = (fieldId: string) => {
  if (sortField.value === fieldId) {
    // Toggle sort order if clicking the same field
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new field and default to ascending
    sortField.value = fieldId
    sortOrder.value = 'asc'
  }
  
  // Reset cursor and fetch new data with current search state
  currentCursor.value = null
  fetchRecords(null, false, hasActiveFilters.value)
}

const handleSearch = () => {
  // Reset cursor and fetch data with search parameters
  currentCursor.value = null
  fetchRecords(null, false, true)
}

const toggleSearch = () => {
  if (showSearch.value) {
    // Closing search - clear filters and refresh data
    searchFilters.value = {}
    showSearch.value = false
    currentCursor.value = null
    isSearchResult.value = false
    fetchRecords(null, false, false)
  } else {
    // Opening search
    showSearch.value = true
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}/${month}/${day} ${hours}:${minutes}`
}

const navigateToAddRecord = () => {
  router.push({ 
    name: 'add-record', 
    params: { modelId: route.params.modelId }
  })
}

const navigateToViewRecord = (recordId: string) => {
  router.push({ 
    name: 'view-record', 
    params: { 
      modelId: route.params.modelId,
      recordId: recordId 
    }
  })
}

onMounted(async () => {
  // Redirect if not authenticated
  const token = authStore.getAuthToken()
  if (!token) {
    router.push('/')
    return
  }
  
  await fetchModel()
  await fetchRecords()
})
</script>

<style scoped>
.records {
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

.actions-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.add-record-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.add-record-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.add-record-btn:active {
  transform: translateY(0);
}

.search-toggle-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-toggle-btn:hover {
  background-color: #545b62;
  transform: translateY(-1px);
}

.search-toggle-btn.active {
  background-color: #007bff;
}

.search-toggle-btn.active:hover {
  background-color: #0056b3;
}

.search-toggle-btn:active {
  transform: translateY(0);
}

.search-icon {
  font-size: 14px;
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

.records-placeholder {
  background: white;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.records-placeholder p {
  color: #6c757d;
  font-style: italic;
  margin-bottom: 0.5rem;
}

.records-placeholder p:last-child {
  margin-bottom: 0;
}

.no-records {
  background: white;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.no-records p {
  color: #6c757d;
  font-style: italic;
  margin: 0;
}

.records-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
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
  white-space: nowrap;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.sortable-header:hover {
  background-color: #e9ecef;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sort-indicator {
  display: flex;
  align-items: center;
  min-width: 16px;
  justify-content: center;
}

.sort-arrow {
  color: #007bff;
  font-weight: bold;
  font-size: 14px;
}

.sort-arrow-placeholder {
  color: #ced4da;
  font-size: 14px;
  opacity: 0.6;
}

.sortable-header:hover .sort-arrow-placeholder {
  opacity: 1;
  color: #6c757d;
}

.records-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  color: #495057;
  max-width: 200px;
  word-wrap: break-word;
}

.records-table tr:last-child td {
  border-bottom: none;
}

.records-table tr:hover {
  background-color: #f8f9fa;
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

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
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

.actions-header {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  padding: 1rem;
  text-align: center;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  width: 120px;
  min-width: 120px;
}

.action-cell {
  text-align: center;
  vertical-align: middle;
  width: 120px;
  min-width: 120px;
  padding: 0.75rem;
}

.action-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
  min-width: 60px;
}

.search-btn {
  background-color: #28a745;
  color: white;
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

.view-btn {
  background-color: #007bff;
  color: white;
}

.view-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
}

.empty-state-row {
  background-color: #f8f9fa;
}

.empty-state-cell {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
  font-style: italic;
  border-bottom: none;
}

.empty-state-content {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.1rem;
}
</style>