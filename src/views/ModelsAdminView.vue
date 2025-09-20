<template>
  <div class="models-admin">
    <AppNavigation />
    <PageHeader
      title="Model Administration"
      description="Manage and configure your application models and their fields."
    />

    <div class="content">

      <!-- Add Model Button -->
      <div class="actions-section">
        <button @click="viewLinkedModels" class="view-linked-models-btn">
          View Linked Models
        </button>
        <button @click="addModel" class="add-model-btn">
          Add New Model
        </button>
      </div>

      <!-- Add Model Form -->
      <div v-if="showAddModel" class="add-model-container">
        <div class="add-model-content">
          <div class="add-model-header">
            <h3>Add New Model</h3>
          </div>

          <div v-if="addModelError" class="error-message">
            <p>{{ addModelError }}</p>
          </div>

          <form @submit.prevent="createModel" class="add-model-form">
            <div class="form-group">
              <label for="modelName" class="form-label">
                Model Name <span class="required">*</span>
              </label>
              <input
                id="modelName"
                v-model="newModel.name"
                type="text"
                class="form-input"
                placeholder="Enter model name"
                :disabled="addingModel"
                required
              />
            </div>

            <div class="form-group">
              <label for="modelDescription" class="form-label">
                Model Description
              </label>
              <textarea
                id="modelDescription"
                v-model="newModel.description"
                class="form-textarea"
                placeholder="Enter model description (optional)"
                rows="3"
                :disabled="addingModel"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">
                Fields <span class="required">*</span>
              </label>
              <div class="fields-section">
                <div v-if="newModel.fields.length === 0" class="no-fields-message">
                  <p>No fields added yet. Add at least one field to create the model.</p>
                </div>

                <div v-else class="fields-list">
                  <div v-for="(field, index) in newModel.fields" :key="index" class="field-item">
                    <div class="field-info">
                      <strong>{{ field.name }}</strong>
                      <span class="field-type">({{ formatFieldType(field.type) }})</span>
                      <span v-if="field.description" class="field-desc">- {{ field.description }}</span>
                      <div class="field-properties">
                        <span v-if="field.isParentField" class="field-property">Parent Field</span>
                        <span v-if="field.isRequired" class="field-property">Required</span>
                      </div>
                    </div>
                    <button type="button" @click="removeField(index)" class="remove-field-btn" :disabled="addingModel">
                      Remove
                    </button>
                  </div>
                </div>

                <button v-if="!showAddFieldForm" type="button" @click="showAddFieldToModel" class="add-field-to-model-btn" :disabled="addingModel">
                  Add Field
                </button>

                <!-- Add Field Form -->
                <div v-if="showAddFieldForm" class="add-field-form-container">
                  <h4>Add Field</h4>

                  <div class="field-form">
                    <div class="form-row">
                      <div class="form-col">
                        <label class="field-form-label">
                          Field Name <span class="required">*</span>
                        </label>
                        <input
                          v-model="newField.name"
                          type="text"
                          class="field-form-input"
                          placeholder="Enter field name"
                          :disabled="addingModel"
                        />
                      </div>

                      <div class="form-col">
                        <label class="field-form-label">
                          Field Type <span class="required">*</span>
                        </label>
                        <select
                          v-model="newField.type"
                          class="field-form-select"
                          :disabled="addingModel"
                        >
                          <option value="">Select type</option>
                          <option v-for="type in fieldTypes" :key="type.value" :value="type.value">
                            {{ type.label }}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-col-full">
                        <label class="field-form-label">Description</label>
                        <input
                          v-model="newField.description"
                          type="text"
                          class="field-form-input"
                          placeholder="Enter description (optional)"
                          :disabled="addingModel"
                        />
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-col">
                        <div class="checkbox-group">
                          <input
                            id="fieldIsParent"
                            v-model="newField.isParentField"
                            type="checkbox"
                            class="form-checkbox"
                            :disabled="addingModel"
                          />
                          <label for="fieldIsParent" class="checkbox-label">
                            Parent Field
                          </label>
                        </div>
                      </div>

                      <div class="form-col">
                        <div class="checkbox-group">
                          <input
                            id="fieldIsRequired"
                            v-model="newField.isRequired"
                            type="checkbox"
                            class="form-checkbox"
                            :disabled="addingModel"
                          />
                          <label for="fieldIsRequired" class="checkbox-label">
                            Required Field
                          </label>
                        </div>
                      </div>
                    </div>

                    <div class="field-form-actions">
                      <button type="button" @click="cancelAddFieldToModel" class="cancel-field-btn" :disabled="addingModel">
                        Cancel
                      </button>
                      <button type="button" @click="addFieldToModel" class="confirm-field-btn" :disabled="!newField.name || !newField.type || addingModel">
                        Add Field
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="add-model-actions">
              <button
                type="button"
                @click="cancelAddModel"
                class="cancel-add-model-btn"
                :disabled="addingModel"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="confirm-add-model-btn"
                :disabled="!newModel.name || newModel.fields.length === 0 || addingModel"
              >
                {{ addingModel ? 'Creating...' : 'Create Model' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Models list section - hidden when adding a model -->
      <div v-if="!showAddModel">
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
          <div v-for="model in models" :key="model.id" class="model-card" @click="navigateToModelAdmin(model)">
            <h3>{{ model.name }}</h3>
            <p>{{ model.description }}</p>
          </div>
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
import type { Model, ModelsResponse, CreateModelRequest, FieldDto } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const authStore = useAuthStore()

const models = ref<Model[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showAddModel = ref(false)
const addingModel = ref(false)
const addModelError = ref<string | null>(null)
const newModel = ref({
  name: '',
  description: '',
  fields: [] as FieldDto[]
})
const showAddFieldForm = ref(false)
const newField = ref({
  name: '',
  type: '',
  description: '',
  isParentField: false,
  isRequired: false
})

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

const navigateToModelAdmin = (model: Model) => {
  router.push({ name: 'model-admin', params: { modelId: model.id } })
}

const viewLinkedModels = () => {
  router.push({ name: 'view-model-links' })
}

const fieldTypes = [
  { value: 'SINGLE_LINE_TEXT', label: 'Single Line Text' },
  { value: 'MULTI_LINE_TEXT', label: 'Multi Line Text' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'DECIMAL', label: 'Decimal' },
  { value: 'LONG', label: 'Long (Integer)' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'DATE', label: 'Date' },
  { value: 'DATETIME', label: 'DateTime' }
]

const formatFieldType = (type: string) => {
  return type.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const addModel = () => {
  newModel.value = {
    name: '',
    description: '',
    fields: []
  }
  addModelError.value = null
  showAddModel.value = true
}

const cancelAddModel = () => {
  showAddModel.value = false
  newModel.value = {
    name: '',
    description: '',
    fields: []
  }
  addModelError.value = null
}

const removeField = (index: number) => {
  newModel.value.fields.splice(index, 1)
}

const showAddFieldToModel = () => {
  newField.value = {
    name: '',
    type: '',
    description: '',
    isParentField: false,
    isRequired: false
  }
  showAddFieldForm.value = true
}

const cancelAddFieldToModel = () => {
  showAddFieldForm.value = false
  newField.value = {
    name: '',
    type: '',
    description: '',
    isParentField: false,
    isRequired: false
  }
}

const addFieldToModel = () => {
  if (!newField.value.name || !newField.value.type) {
    return
  }

  const fieldToAdd: FieldDto = {
    id: crypto.randomUUID(),
    name: newField.value.name,
    type: newField.value.type as any,
    description: newField.value.description,
    isParentField: newField.value.isParentField,
    isRequired: newField.value.isRequired
  }

  newModel.value.fields.push(fieldToAdd)

  // Reset and close form
  showAddFieldForm.value = false
  newField.value = {
    name: '',
    type: '',
    description: '',
    isParentField: false,
    isRequired: false
  }
}

const createModel = async () => {
  if (!newModel.value.name || newModel.value.fields.length === 0) {
    return
  }

  addingModel.value = true
  addModelError.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const modelData: CreateModelRequest = {
      name: newModel.value.name,
      description: newModel.value.description || undefined,
      fields: newModel.value.fields
    }

    console.log('Creating model with data:', modelData)

    const response = await fetch(getApiUrl('/v1/create-model'), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(modelData)
    })

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('Model created successfully')

    showAddModel.value = false
    newModel.value = {
      name: '',
      description: '',
      fields: []
    }

    await fetchModels()
  } catch (err) {
    addModelError.value = err instanceof Error ? err.message : 'Failed to create model'
    console.error('Error creating model:', err)
  } finally {
    addingModel.value = false
  }
}

onMounted(() => {
  fetchModels()
})
</script>

<style scoped>
.models-admin {
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

.actions-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2rem;
  gap: 1rem;
}

.view-linked-models-btn {
  background-color: #6f42c1;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.view-linked-models-btn:hover {
  background-color: #5a2d91;
  transform: translateY(-1px);
}

.view-linked-models-btn:active {
  transform: translateY(0);
}

.add-model-btn {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.add-model-btn:hover {
  background-color: #138496;
  transform: translateY(-1px);
}

.add-model-btn:active {
  transform: translateY(0);
}

.add-model-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
  border-left: 4px solid #17a2b8;
}

.add-model-content {
  padding: 2rem;
}

.add-model-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.add-model-header h3 {
  color: #17a2b8;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.add-model-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.required {
  color: #dc3545;
  font-weight: bold;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #17a2b8;
  box-shadow: 0 0 0 0.2rem rgba(23, 162, 184, 0.25);
}

.form-input:disabled,
.form-textarea:disabled {
  background-color: #f8f9fa;
  opacity: 0.6;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
  min-height: 80px;
}

.fields-section {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  background-color: #f8f9fa;
}

.no-fields-message {
  text-align: center;
  color: #6c757d;
  font-style: italic;
  margin: 1rem 0;
}

.fields-list {
  margin-bottom: 1rem;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.field-info {
  flex: 1;
}

.field-type {
  color: #495057;
  font-weight: 500;
  font-size: 0.9rem;
}

.field-desc {
  color: #6c757d;
  font-size: 0.9rem;
}

.field-properties {
  margin-top: 0.25rem;
}

.field-property {
  display: inline-block;
  padding: 0.2rem 0.4rem;
  background-color: #e9ecef;
  color: #495057;
  border-radius: 3px;
  font-size: 0.8rem;
  margin-right: 0.25rem;
}

.remove-field-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.remove-field-btn:hover:not(:disabled) {
  background-color: #c82333;
  transform: translateY(-1px);
}

.remove-field-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.remove-field-btn:active {
  transform: translateY(0);
}

.add-field-to-model-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.add-field-to-model-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
}

.add-field-to-model-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.add-field-to-model-btn:active {
  transform: translateY(0);
}

.add-model-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.cancel-add-model-btn,
.confirm-add-model-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s, opacity 0.2s;
  border: none;
  min-width: 120px;
}

.cancel-add-model-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-add-model-btn:hover:not(:disabled) {
  background-color: #545b62;
  transform: translateY(-1px);
}

.confirm-add-model-btn {
  background-color: #17a2b8;
  color: white;
}

.confirm-add-model-btn:hover:not(:disabled) {
  background-color: #138496;
  transform: translateY(-1px);
}

.cancel-add-model-btn:disabled,
.confirm-add-model-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-add-model-btn:active,
.confirm-add-model-btn:active {
  transform: translateY(0);
}

.add-field-form-container {
  background-color: #fff;
  border: 2px solid #17a2b8;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.add-field-form-container h4 {
  color: #17a2b8;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.field-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-col {
  flex: 1;
}

.form-col-full {
  flex: 1;
}

.field-form-label {
  display: block;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.field-form-input,
.field-form-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.field-form-input:focus,
.field-form-select:focus {
  outline: none;
  border-color: #17a2b8;
  box-shadow: 0 0 0 0.2rem rgba(23, 162, 184, 0.25);
}

.field-form-input:disabled,
.field-form-select:disabled {
  background-color: #f8f9fa;
  opacity: 0.6;
  cursor: not-allowed;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.checkbox-label {
  cursor: pointer;
  font-weight: normal;
  margin: 0;
  color: #495057;
  font-size: 0.9rem;
}

.field-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e9ecef;
}

.cancel-field-btn,
.confirm-field-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s, opacity 0.2s;
  border: none;
}

.cancel-field-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-field-btn:hover:not(:disabled) {
  background-color: #545b62;
  transform: translateY(-1px);
}

.confirm-field-btn {
  background-color: #28a745;
  color: white;
}

.confirm-field-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
}

.cancel-field-btn:disabled,
.confirm-field-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-field-btn:active,
.confirm-field-btn:active {
  transform: translateY(0);
}
</style>