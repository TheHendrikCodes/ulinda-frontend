<template>
  <div class="linked-records">
    <AppNavigation />
    <PageHeader :title="pageTitle" :description="pageDescription" />

    <div class="content">
      <div v-if="loading" class="loading">
        <p>Loading linked records...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>Error loading linked records: {{ error }}</p>
        <button @click="fetchLinkedRecords" class="retry-btn">Retry</button>
      </div>

      <div v-else>
        <div v-if="!showUnlinkModal" class="actions-bar">
          <button @click="goBackToRecord" class="back-to-record-btn">
            ← Back to {{ sourceRecordDisplayName }}
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
          <button @click="fetchLinkedRecords" class="retry-btn">Retry</button>
        </div>

        <div v-else-if="!showUnlinkModal" class="records-container">
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
                      <!-- Text fields (SINGLE_LINE_TEXT, MULTI_LINE_TEXT, EMAIL) -->
                      <select
                        v-if="['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL'].includes(field.type)"
                        :value="searchFilters[field.id]?.operator || 'all'"
                        @change="updateSearchFilter(field.id, 'operator', $event.target.value)"
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

                      <!-- Number fields (DECIMAL, LONG) -->
                      <select
                        v-else-if="['DECIMAL', 'LONG'].includes(field.type)"
                        :value="searchFilters[field.id]?.operator || 'all'"
                        @change="updateSearchFilter(field.id, 'operator', $event.target.value)"
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
                        @change="updateSearchFilter(field.id, 'operator', $event.target.value)"
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
                        @change="updateSearchFilter('created_at', 'operator', $event.target.value)"
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
                        @change="updateSearchFilter('updated_at', 'operator', $event.target.value)"
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
                        @input="updateSearchFilter(field.id, 'value', $event.target.value)"
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
                        @input="updateSearchFilter(field.id, 'value', $event.target.value)"
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
                        @input="updateSearchFilter(field.id, 'value', $event.target.value)"
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
                        v-else-if="
                          field.type === 'DATETIME' &&
                          searchFilters[field.id]?.operator &&
                          ['before', 'after'].includes(searchFilters[field.id].operator)
                        "
                        :value="searchFilters[field.id]?.value || ''"
                        @input="updateSearchFilter(field.id, 'value', $event.target.value)"
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
                        v-if="
                          searchFilters['created_at']?.operator &&
                          ['before', 'after'].includes(searchFilters['created_at'].operator)
                        "
                        :value="searchFilters['created_at']?.value || ''"
                        @input="updateSearchFilter('created_at', 'value', $event.target.value)"
                        type="datetime-local"
                        class="filter-input"
                      />
                      <div
                        v-else-if="searchFilters['created_at']?.operator === 'between'"
                        class="between-inputs"
                      >
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
                        v-if="
                          searchFilters['updated_at']?.operator &&
                          ['before', 'after'].includes(searchFilters['updated_at'].operator)
                        "
                        :value="searchFilters['updated_at']?.value || ''"
                        @input="updateSearchFilter('updated_at', 'value', $event.target.value)"
                        type="datetime-local"
                        class="filter-input"
                      />
                      <div
                        v-else-if="searchFilters['updated_at']?.operator === 'between'"
                        class="between-inputs"
                      >
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
                      <span v-if="isSearchResult">No Linked Records Found In Search</span>
                      <span v-else>No Linked Records Found</span>
                    </div>
                  </td>
                </tr>

                <tr v-for="record in records" :key="record.id">
                  <td v-for="field in recordsData?.fields" :key="field.id" class="record-cell">
                    {{ getFieldDisplayValue(record, field) }}
                  </td>
                  <td class="record-cell">{{ formatDate(record.createdAt) }}</td>
                  <td class="record-cell">{{ formatDate(record.updatedAt) }}</td>
                  <td class="action-cell">
                    <div class="action-buttons">
                      <button @click="viewRecord(record.id)" class="action-btn view-btn">
                        View
                      </button>
                      <button
                        @click="openUnlinkDialog(record)"
                        class="action-btn unlink-btn"
                        :disabled="unlinking"
                        v-if="!unlinking"
                      >
                        Unlink
                      </button>
                      <button v-else class="action-btn unlink-btn" disabled>Unlinking...</button>
                    </div>
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
              Showing {{ records.length }} of {{ (pagination?.totalEstimate || 0).toLocaleString() }} linked records
              <span v-if="pagination?.actualRecordCount">
                (Total Records: {{ pagination.actualRecordCount.toLocaleString() }})
              </span>
            </span>

            <button @click="goToNextPage" :disabled="!pagination?.hasNext" class="pagination-btn">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Unlink Confirmation Modal -->
    <div v-if="showUnlinkModal" class="delete-confirmation-container">
      <div class="delete-confirmation-content">
        <div class="confirmation-header">
          <h3>Unlink Record</h3>
        </div>

        <div v-if="unlinkError" class="error-message">
          <p>{{ unlinkError }}</p>
        </div>

        <div class="confirmation-body">
          <p class="warning-text">
            Are you sure you want to unlink <strong>{{ linkToDelete?.recordName }}</strong
            >?
          </p>
          <p class="warning-subtext">
            This will remove the link between the records but will not delete the records
            themselves.
          </p>
        </div>

        <div class="confirmation-actions">
          <button @click="cancelUnlink" class="cancel-delete-btn" :disabled="unlinking">
            Cancel
          </button>
          <button @click="confirmUnlink" class="confirm-delete-btn" :disabled="unlinking">
            {{ unlinking ? 'Unlinking...' : 'Unlink' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders } from '@/config/api'
import type {
  GetRecordsResponse,
  GetRecordsRequest,
  Record,
  SearchParameter,
  Pagination,
} from '@/types/models'
import { SearchFieldIdentifier, SearchType, QueryType } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Route parameters
const sourceModelId = route.params.sourceModelId as string
const modelLinkId = route.params.modelLinkId as string
const sourceRecordId = route.params.sourceRecordId as string
const targetModelId = route.params.targetModelId as string
const targetModelName = route.params.targetModelName as string
const sourceModelName = route.params.sourceModelName as string
const sourceRecordDisplayName = route.params.sourceRecordDisplayName as string

// State
const records = ref<Record[]>([])
const recordsData = ref<GetRecordsResponse | null>(null)
const pagination = ref<Pagination | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const recordsLoading = ref(false)
const recordsError = ref<string | null>(null)
const unlinking = ref(false)

// Unlink confirmation state
const showUnlinkModal = ref(false)
const linkToDelete = ref<{ linkId: string; recordName: string } | null>(null)
const unlinkError = ref<string | null>(null)

// Search state
const showSearch = ref(false)
const searchFilters = ref<Record<string, { operator: string; value: string; value2?: string }>>({})
const sortField = ref<string>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')
const currentCursor = ref<string | null>(null)
const isSearchResult = ref(false)

// Computed
const pageTitle = computed(() => {
  return `${sourceRecordDisplayName}'s Linked ${targetModelName}`
})

const pageDescription = computed(() => {
  return `Manage linked ${targetModelName.toLowerCase()} records for this ${sourceModelName.toLowerCase()}.`
})

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

// Methods
const fetchLinkedRecords = async (
  cursor: string | null = null,
  previous: boolean = false,
  useSearch: boolean = false,
) => {
  recordsLoading.value = true
  recordsError.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const searchParams = useSearch ? convertFiltersToSearchParameters() : []

    const requestData: GetRecordsRequest = {
      limit: 5,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      previous: previous,
      searchParameters: searchParams,
      queryType: QueryType.LINKED_RECORDS,
      modelLinkId: modelLinkId,
      sourceRecordId: sourceRecordId,
    }

    if (cursor) {
      requestData.cursor = cursor
    }

    const response = await fetch(
      getApiUrl(`/v1/models/${sourceModelId}/records/search`),
      {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(requestData),
      },
    )

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
    recordsError.value = err instanceof Error ? err.message : 'Failed to fetch linked records'
    console.error('Error fetching linked records:', err)
  } finally {
    recordsLoading.value = false
  }
}

const openUnlinkDialog = (record: Record) => {
  if (!record.linkId) return

  linkToDelete.value = {
    linkId: record.linkId,
    recordName: getRecordDisplayName(record),
  }
  unlinkError.value = null
  showUnlinkModal.value = true
}

const cancelUnlink = () => {
  showUnlinkModal.value = false
  linkToDelete.value = null
  unlinkError.value = null
}

const confirmUnlink = async () => {
  if (!linkToDelete.value) return

  unlinking.value = true
  unlinkError.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(
      getApiUrl(`/v1/model/linked-records/${modelLinkId}/${linkToDelete.value.linkId}`),
      {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      },
    )

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Close modal and refresh the linked records list
    showUnlinkModal.value = false
    linkToDelete.value = null
    await fetchLinkedRecords()
  } catch (err) {
    unlinkError.value = err instanceof Error ? err.message : 'Failed to unlink record'
    console.error('Error unlinking record:', err)
  } finally {
    unlinking.value = false
  }
}

const viewRecord = (recordId: string) => {
  // Navigate to view the linked record
  router.push({
    name: 'view-record',
    params: {
      modelId: targetModelId,
      recordId: recordId,
    },
  })
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

// Search and sort methods (copied from RecordsView)
const convertFiltersToSearchParameters = (): SearchParameter[] => {
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
  fetchLinkedRecords(null, false, hasActiveFilters.value)
}

const toggleSearch = () => {
  if (showSearch.value) {
    // Closing search - clear filters and refresh data
    searchFilters.value = {}
    showSearch.value = false
    currentCursor.value = null
    isSearchResult.value = false
    fetchLinkedRecords(null, false, false)
  } else {
    // Opening search
    showSearch.value = true
  }
}

const updateSearchFilter = (fieldId: string, property: string, value: string) => {
  if (!searchFilters.value[fieldId]) {
    searchFilters.value[fieldId] = { operator: 'all', value: '' }
  }
  searchFilters.value[fieldId][property] = value
}

const handleSearch = () => {
  // Reset cursor and fetch data with search parameters
  currentCursor.value = null
  fetchLinkedRecords(null, false, true)
}

const goToNextPage = () => {
  if (pagination.value?.hasNext && pagination.value.nextCursor) {
    fetchLinkedRecords(pagination.value.nextCursor, false, hasActiveFilters.value)
  }
}

const goToPreviousPage = () => {
  if (pagination.value?.hasPrevious && pagination.value.previousCursor) {
    fetchLinkedRecords(pagination.value.previousCursor, true, hasActiveFilters.value)
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

const getRecordDisplayName = (record: Record): string => {
  // Always use the first 8 characters of the record ID with ellipsis
  return `${record.id.slice(0, 8)}...`
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

  fetchLinkedRecords()
})
</script>

<style scoped>
/* Reuse most styles from RecordsView */
.linked-records {
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
  width: 150px;
  min-width: 150px;
}

.search-row {
  background-color: #fff3cd;
  border-bottom: 2px solid #ffeaa7;
}

.search-row:hover {
  background-color: #fff3cd !important;
}

.search-cell {
  padding: 0.75rem;
  vertical-align: top;
}

.search-filter {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
  width: 150px;
  min-width: 150px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
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

.view-btn {
  background-color: #007bff;
  color: white;
}

.view-btn:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.unlink-btn {
  background-color: #dc3545;
  color: white;
}

.unlink-btn:hover:not(:disabled) {
  background-color: #c82333;
  transform: translateY(-1px);
}

.unlink-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.search-btn {
  background-color: #007bff;
  color: white;
  width: 100%;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
}

.search-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

.search-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
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

  .search-cell {
    padding: 0.5rem 0.25rem;
    min-width: 100px;
  }

  .search-filter {
    gap: 0.25rem;
    min-height: 50px;
  }

  .filter-select,
  .filter-input {
    padding: 0.4rem;
    font-size: 0.8rem;
  }

  .search-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .record-cell {
    max-width: 150px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}

.delete-confirmation-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin: 2rem auto;
  border-left: 4px solid #dc3545;
  max-width: 600px;
  width: 100%;
}

.delete-confirmation-content {
  padding: 2rem;
}

.confirmation-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.confirmation-header h3 {
  color: #dc3545;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.confirmation-body {
  margin-bottom: 2rem;
  text-align: center;
}

.warning-text {
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.warning-subtext {
  color: #6c757d;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 0;
}

.confirmation-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.cancel-delete-btn,
.confirm-delete-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.cancel-delete-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-delete-btn:hover:not(:disabled) {
  background-color: #545b62;
  transform: translateY(-1px);
}

.cancel-delete-btn:disabled {
  background-color: #adb5bd;
  cursor: not-allowed;
  transform: none;
}

.confirm-delete-btn {
  background-color: #dc3545;
  color: white;
}

.confirm-delete-btn:hover:not(:disabled) {
  background-color: #c82333;
  transform: translateY(-1px);
}

.confirm-delete-btn:disabled {
  background-color: #f8d7da;
  color: #721c24;
  cursor: not-allowed;
  transform: none;
}

.confirm-delete-btn:active,
.cancel-delete-btn:active {
  transform: translateY(0);
}

.error-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
}

.error-message p {
  margin: 0;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .confirmation-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .cancel-delete-btn,
  .confirm-delete-btn {
    width: 100%;
  }
}
</style>
