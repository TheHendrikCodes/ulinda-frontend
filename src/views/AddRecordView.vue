<template>
  <div class="add-record">
    <AppNavigation />
    <PageHeader
      title="Add Record"
      :description="model ? `Add a new record to ${model.name}` : 'Add a new record'"
    />

    <div class="content">
      <div v-if="loadingModel" class="loading">
        <p>Loading model...</p>
      </div>

      <div v-else-if="modelError" class="error-message">
        <p>Error loading model: {{ modelError }}</p>
        <button @click="fetchModel" class="retry-btn">Retry</button>
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
        <div v-for="field in model?.fields" :key="field.id" class="field-group">
          <label :for="field.id" class="field-label">
            {{ field.name }}
            <span v-if="field.isRequired" class="required-asterisk">*</span>
            <span v-if="field.description" class="field-description">{{ field.description }}</span>
          </label>

          <!-- Validation error message -->
          <div v-if="getFieldError(field.id)" class="field-error">
            {{ getFieldError(field.id) }}
          </div>

          
          <!-- Single Line Text -->
          <input
            v-if="field.type === 'SINGLE_LINE_TEXT'"
            :id="field.id"
            v-model="fieldValues[field.id]"
            type="text"
            class="field-input"
            :class="{ 'field-error-border': hasFieldError(field.id) }"
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
            :class="{ 'field-error-border': hasFieldError(field.id) }"
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
            :class="{ 'field-error-border': hasFieldError(field.id) }"
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
            :class="{ 'field-error-border': hasFieldError(field.id) }"
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
            :class="{ 'field-error-border': hasFieldError(field.id) }"
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
                @change="handleBooleanChange(field.id, true, $event.target.checked)"
                class="field-checkbox"
              />
              <label :for="`${field.id}_yes`" class="checkbox-label">Yes</label>
            </div>
            <div class="checkbox-option">
              <input
                :id="`${field.id}_no`"
                type="checkbox"
                :checked="fieldValues[field.id] === false"
                @change="handleBooleanChange(field.id, false, $event.target.checked)"
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
            :class="{ 'field-error-border': hasFieldError(field.id) }"
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
            :class="{ 'field-error-border': hasFieldError(field.id) }"
            @blur="validateField(field)"
            @change="clearFieldError(field.id)"
          />
        </div>
        
        <div class="form-actions">
          <button type="button" @click="goBack" class="cancel-btn">
            Cancel
          </button>
          <button type="submit" class="save-btn" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, triggerRef, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders, API_CONFIG } from '@/config/api'
import type { ModelDto, GetModelResponse } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const model = ref<ModelDto | null>(null)
const fieldValues = ref<Record<string, any>>({})
const validationErrors = reactive<Record<string, string>>({})
const loadingModel = ref(false)
const saving = ref(false)
const modelError = ref<string | null>(null)
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
    
    // Initialize all field values as empty - no defaults
    if (data.model.fields) {
      const values: Record<string, any> = {}
      data.model.fields.forEach(field => {
        switch (field.type) {
          case 'BOOLEAN':
            values[field.id] = null  // Allow null for no selection
            break
          default:
            values[field.id] = ''
        }
      })
      fieldValues.value = values
    }
  } catch (err) {
    modelError.value = err instanceof Error ? err.message : 'Failed to fetch model'
    console.error('Error fetching model:', err)
  } finally {
    loadingModel.value = false
  }
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
      validationErrors[field.id] = `${field.name} is required`
      return false
    }
  } else {
    // For text, email, date fields - check if empty or just whitespace
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      validationErrors[field.id] = `${field.name} is required`
      return false
    }
  }

  // Clear error if validation passes
  delete validationErrors[field.id]
  return true
}

const clearFieldError = (fieldId: string) => {
  delete validationErrors[fieldId]
}

const handleBooleanChange = (fieldId: string, value: boolean, isChecked: boolean) => {
  if (isChecked) {
    // If checking this box, set the value and clear any validation errors
    fieldValues.value[fieldId] = value
    clearFieldError(fieldId)
  } else {
    // If unchecking this box, check if it was the current value
    if (fieldValues.value[fieldId] === value) {
      // If this was the selected value, set to null (no selection)
      fieldValues.value[fieldId] = null
    }
    // If it wasn't the current value, do nothing (other checkbox remains selected)
  }
}

const getFieldError = (fieldId: string) => {
  return validationErrors[fieldId] || null
}

const hasFieldError = (fieldId: string) => {
  return !!validationErrors[fieldId]
}

const validateAllFields = () => {
  if (!model.value?.fields) return true

  let isValid = true
  let errorCount = 0

  model.value.fields.forEach(field => {
    if (field.isRequired) {
      if (!validateField(field)) {
        isValid = false
        errorCount++
      }
    }
  })

  return isValid
}

const saveRecord = async () => {
  if (!model.value) return

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

    const recordData = {
      fieldValues: transformedFieldValues
    }

    const response = await fetch(getApiUrl(`/v1/models/${model.value.id}/records`), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(recordData)
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // Navigate back to records view
    router.push({ 
      name: 'records', 
      params: { modelId: model.value.id }
    })
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Failed to save record'
    console.error('Error saving record:', err)
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push({ 
    name: 'records', 
    params: { modelId: route.params.modelId }
  })
}

onMounted(() => {
  // Redirect if not authenticated
  const token = authStore.getAuthToken()
  if (!token) {
    router.push('/')
    return
  }
  
  fetchModel()
})
</script>

<style scoped>
.add-record {
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