<template>
  <div class="edit-record">
    <AppNavigation />
    <PageHeader
      title="Edit Record"
      :description="model ? `Edit record in ${model.name}` : 'Edit record'"
    />

    <div class="content">
      <div v-if="loadingModel || loadingRecord" class="loading">
        <p>Loading...</p>
      </div>

      <div v-else-if="modelError || recordError" class="error-message">
        <p>Error: {{ modelError || recordError }}</p>
        <button @click="loadData" class="retry-btn">Retry</button>
      </div>

      <div v-else-if="saving" class="loading">
        <p>Saving record...</p>
      </div>

      <div v-else>
        <!-- Show save error above the form -->
        <div v-if="saveError" class="error-message">
          <p>Error saving record: {{ saveError }}</p>
        </div>

        <form @submit.prevent="saveRecord" class="record-form">
        <!-- Record ID and timestamps -->
        <div class="record-info">
          <div class="info-row">
            <label class="info-label">Record ID:</label>
            <span class="info-value">{{ record?.id }}</span>
          </div>
          <div class="info-row">
            <label class="info-label">Created:</label>
            <span class="info-value">{{ formatDate(record?.createdAt) }}</span>
          </div>
          <div class="info-row">
            <label class="info-label">Updated:</label>
            <span class="info-value">{{ formatDate(record?.updatedAt) }}</span>
          </div>
        </div>

        <div v-for="field in model?.fields" :key="field.id" class="field-group">
          <label :for="field.id" class="field-label">
            {{ field.name }}
            <span v-if="field.isRequired" class="required-asterisk">*</span>
            <span v-if="field.description" class="field-description">{{ field.description }}</span>
          </label>

          <!-- Validation error message -->
          <div v-if="validationErrors[field.id]" class="field-error">
            {{ validationErrors[field.id] }}
          </div>
          
          <!-- Single Line Text -->
          <input
            v-if="field.type === 'SINGLE_LINE_TEXT'"
            :id="field.id"
            v-model="fieldValues[field.id]"
            type="text"
            class="field-input"
            :class="{ 'field-error-border': validationErrors[field.id] }"
            :placeholder="`Enter ${field.name}`"
            @blur="validateField(field)"
            @input="clearFieldError(field.id)"
          />
          
          <!-- Multi Line Text -->
          <textarea
            v-else-if="field.type === 'MULTI_LINE_TEXT'"
            :id="field.id"
            v-model="fieldValues[field.id]"
            class="field-textarea"
            :class="{ 'field-error-border': validationErrors[field.id] }"
            :placeholder="`Enter ${field.name}`"
            rows="4"
            @blur="validateField(field)"
            @input="clearFieldError(field.id)"
          ></textarea>
          
          <!-- Email -->
          <input
            v-else-if="field.type === 'EMAIL'"
            :id="field.id"
            v-model="fieldValues[field.id]"
            type="email"
            class="field-input"
            :class="{ 'field-error-border': validationErrors[field.id] }"
            :placeholder="`Enter ${field.name}`"
            @blur="validateField(field)"
            @input="clearFieldError(field.id)"
          />
          
          <!-- Decimal -->
          <input
            v-else-if="field.type === 'DECIMAL'"
            :id="field.id"
            v-model.number="fieldValues[field.id]"
            type="number"
            step="0.01"
            class="field-input"
            :class="{ 'field-error-border': validationErrors[field.id] }"
            :placeholder="`Enter ${field.name}`"
            @blur="validateField(field)"
            @input="clearFieldError(field.id)"
          />
          
          <!-- Long (Integer) -->
          <input
            v-else-if="field.type === 'LONG'"
            :id="field.id"
            v-model.number="fieldValues[field.id]"
            type="number"
            step="1"
            class="field-input"
            :class="{ 'field-error-border': validationErrors[field.id] }"
            :placeholder="`Enter ${field.name}`"
            @blur="validateField(field)"
            @input="clearFieldError(field.id)"
          />
          
          <!-- Boolean -->
          <div v-else-if="field.type === 'BOOLEAN'" class="checkbox-group">
            <div class="checkbox-option">
              <input
                :id="`${field.id}_yes`"
                type="checkbox"
                :checked="fieldValues[field.id] === true"
                @change="handleBooleanChange(field.id, true)"
                class="field-checkbox"
              />
              <label :for="`${field.id}_yes`" class="checkbox-label">Yes</label>
            </div>
            <div class="checkbox-option">
              <input
                :id="`${field.id}_no`"
                type="checkbox"
                :checked="fieldValues[field.id] === false"
                @change="handleBooleanChange(field.id, false)"
                class="field-checkbox"
              />
              <label :for="`${field.id}_no`" class="checkbox-label">No</label>
            </div>
          </div>
          
          <!-- Date -->
          <input
            v-else-if="field.type === 'DATE'"
            :id="field.id"
            v-model="fieldValues[field.id]"
            type="date"
            class="field-input"
            :class="{ 'field-error-border': validationErrors[field.id] }"
            @blur="validateField(field)"
            @change="clearFieldError(field.id)"
          />
          
          <!-- DateTime -->
          <input
            v-else-if="field.type === 'DATETIME'"
            :id="field.id"
            v-model="fieldValues[field.id]"
            type="datetime-local"
            class="field-input"
            :class="{ 'field-error-border': validationErrors[field.id] }"
            @blur="validateField(field)"
            @change="clearFieldError(field.id)"
          />
        </div>
        
        <div class="form-actions">
          <button type="button" @click="goBack" class="cancel-btn">
            Cancel
          </button>
          <button type="submit" class="save-btn" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders, API_CONFIG } from '@/config/api'
import type { Model, ModelsResponse, RecordDto, UpdateRecordRequest } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const model = ref<Model | null>(null)
const record = ref<RecordDto | null>(null)
const fieldValues = ref<Record<string, any>>({})
const validationErrors = ref<Record<string, string>>({})
const loadingModel = ref(false)
const loadingRecord = ref(false)
const saving = ref(false)
const modelError = ref<string | null>(null)
const recordError = ref<string | null>(null)
const saveError = ref<string | null>(null)

const fetchModel = async () => {
  loadingModel.value = true
  modelError.value = null
  
  try {
    const token = authStore.getAuthToken()
    
    if (!token) {
      router.push('/')
      return
    }

    const modelId = route.params.modelId as string
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.MODELS), {
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
    
    const data: ModelsResponse = await response.json()
    const foundModel = data.models.find(m => m.id === modelId)
    
    if (!foundModel) {
      throw new Error('Model not found')
    }
    
    model.value = foundModel
  } catch (err) {
    modelError.value = err instanceof Error ? err.message : 'Failed to fetch model'
    console.error('Error fetching model:', err)
  } finally {
    loadingModel.value = false
  }
}

const fetchRecord = async () => {
  loadingRecord.value = true
  recordError.value = null
  
  try {
    const token = authStore.getAuthToken()
    
    if (!token) {
      router.push('/')
      return
    }

    const modelId = route.params.modelId as string
    const recordId = route.params.recordId as string
    const response = await fetch(getApiUrl(`/v1/records/${modelId}/${recordId}`), {
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
    
    const data: RecordDto = await response.json()
    record.value = data
    
    // Initialize field values with the record's current values
    fieldValues.value = { ...data.fieldValues }
  } catch (err) {
    recordError.value = err instanceof Error ? err.message : 'Failed to fetch record'
    console.error('Error fetching record:', err)
  } finally {
    loadingRecord.value = false
  }
}

const processFieldValues = () => {
  if (!model.value?.fields || !record.value?.fieldValues) return

  const processedValues: Record<string, any> = {}

  model.value.fields.forEach(field => {
    const value = record.value!.fieldValues[field.id]

    if (field.type === 'DATETIME' && value) {
      // Convert server datetime to local datetime for datetime-local input
      // Create Date object to handle timezone conversion, then format for input
      const date = new Date(value)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const datetimeValue = `${year}-${month}-${day}T${hours}:${minutes}`
      processedValues[field.id] = datetimeValue
    } else {
      processedValues[field.id] = value
    }
  })

  fieldValues.value = processedValues
}

const loadData = async () => {
  await Promise.all([fetchModel(), fetchRecord()])
  // Process field values after both model and record are loaded
  processFieldValues()
}

const validateField = (field: any) => {
  if (!field.isRequired) {
    return true
  }

  const value = fieldValues.value[field.id]

  // Check if required field is empty
  if (field.type === 'BOOLEAN') {
    // For boolean fields, check if user made a selection (true or false)
    if (value === null || value === undefined) {
      validationErrors[field.id] = `${field.name} is required`
      return false
    }
    return true
  } else if (field.type === 'DECIMAL' || field.type === 'LONG') {
    // For numbers, check if value is undefined, null, empty string, or NaN
    if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value))) {
      validationErrors.value[field.id] = `${field.name} is required`
      return false
    }
  } else {
    // For text, email, date fields - check if empty or just whitespace
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      validationErrors.value[field.id] = `${field.name} is required`
      return false
    }
  }

  // Clear error if validation passes
  delete validationErrors.value[field.id]
  return true
}

const clearFieldError = (fieldId: string) => {
  delete validationErrors.value[fieldId]
}

const handleBooleanChange = (fieldId: string, value: boolean) => {
  const currentValue = fieldValues.value[fieldId]

  if (currentValue === value) {
    // If clicking the already selected checkbox, uncheck it (set to null)
    fieldValues.value[fieldId] = null
  } else {
    // Set to the new value
    fieldValues.value[fieldId] = value
  }

  // Clear any validation errors for this field
  clearFieldError(fieldId)
}

const validateAllFields = () => {
  if (!model.value?.fields) return true

  let isValid = true
  model.value.fields.forEach(field => {
    if (!validateField(field)) {
      isValid = false
    }
  })

  return isValid
}

const saveRecord = async () => {
  if (!record.value) return

  // Clear any previous save errors
  saveError.value = null

  // Validate all fields before saving
  if (!validateAllFields()) {
    // Wait for DOM update to show individual field errors
    await nextTick()
    saveError.value = 'Please fix the validation errors above before saving'
    return
  }

  saving.value = true
  
  try {
    const token = authStore.getAuthToken()
    
    if (!token) {
      router.push('/')
      return
    }

    // Transform field values before sending to backend
    const transformedFieldValues: Record<string, any> = {}

    if (model.value?.fields) {
      model.value.fields.forEach(field => {
        const value = fieldValues.value[field.id]

        if (field.type === 'DECIMAL' || field.type === 'LONG') {
          // Send null for empty numbers, otherwise send the number value
          transformedFieldValues[field.id] = (value === '' || value === undefined || value === null) ? null : value
        } else if (field.type === 'DATE') {
          // Send null for empty dates, otherwise send the date string
          transformedFieldValues[field.id] = (value === '' || value === undefined || value === null) ? null : value
        } else if (field.type === 'DATETIME') {
          // Convert datetime-local format to UTC format
          if (value === '' || value === undefined || value === null) {
            transformedFieldValues[field.id] = null
          } else {
            // Convert from local datetime-local "2025-09-18T15:41" to UTC "2025-09-18T13:41:00Z"
            const localDate = new Date(value)
            const utcISOString = localDate.toISOString()
            transformedFieldValues[field.id] = utcISOString
          }
        } else if (field.type === 'BOOLEAN') {
          // Send null for no selection, true/false for actual selections
          transformedFieldValues[field.id] = value === null || value === undefined ? null : value
        } else {
          // For text fields, send empty string or the actual value
          transformedFieldValues[field.id] = value || ''
        }
      })
    }

    const updateRequest: UpdateRecordRequest = {
      recordId: record.value.id,
      fieldValues: transformedFieldValues
    }

    const modelId = route.params.modelId as string
    const response = await fetch(getApiUrl(`/v1/records/${modelId}/${record.value.id}`), {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateRequest)
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // Navigate back to view record
    router.push({ 
      name: 'view-record', 
      params: { 
        modelId: route.params.modelId,
        recordId: route.params.recordId 
      }
    })
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Failed to save record'
    console.error('Error saving record:', err)
  } finally {
    saving.value = false
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}/${month}/${day} ${hours}:${minutes}`
}

const goBack = () => {
  router.push({ 
    name: 'view-record', 
    params: { 
      modelId: route.params.modelId,
      recordId: route.params.recordId 
    }
  })
}

onMounted(() => {
  // Redirect if not authenticated
  const token = authStore.getAuthToken()
  if (!token) {
    router.push('/')
    return
  }
  
  loadData()
})
</script>

<style scoped>
.edit-record {
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
  max-width: 800px;
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

.record-form {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.record-info {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e9ecef;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: #495057;
  min-width: 120px;
  margin-right: 1rem;
}

.info-value {
  color: #6c757d;
  font-family: monospace;
  font-size: 0.9rem;
}

.field-group {
  margin-bottom: 1.5rem;
}

.field-label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.field-description {
  display: block;
  font-weight: normal;
  color: #6c757d;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  font-style: italic;
}

.required-asterisk {
  color: #dc3545;
  font-weight: bold;
  margin-left: 0.25rem;
}

.field-error {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.field-error-border {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
}

.field-input,
.field-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.field-input:focus,
.field-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.field-textarea {
  resize: vertical;
  font-family: inherit;
}

.checkbox-group {
  display: flex;
  gap: 1.5rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-checkbox {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}

.checkbox-label {
  cursor: pointer;
  font-weight: normal;
  margin: 0;
  color: #495057;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  border: none;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #545b62;
  transform: translateY(-1px);
}

.save-btn {
  background-color: #28a745;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
}

.save-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.cancel-btn:active,
.save-btn:active {
  transform: translateY(0);
}
</style>