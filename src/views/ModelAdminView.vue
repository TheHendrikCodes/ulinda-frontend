<template>
  <div class="model-admin">
    <AppNavigation />
    <PageHeader
      :title="model ? `Model: ${model.name}` : 'Model Administration'"
      :description="model ? (model.description || 'Manage fields and configuration for this model.') : 'Loading model details...'"
    />

    
    <div class="content">
      <div v-if="loading" class="loading">
        <p>Loading model details...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>Error loading model: {{ error }}</p>
        <button @click="fetchModel" class="retry-btn">Retry</button>
      </div>

      <div v-else class="model-details">
        <div v-if="!showEditModel && !showEditField && !showAddField && !showDeleteConfirmation" class="actions-bar">
          <button @click="editModel" class="edit-model-btn">
            Edit Model
          </button>
          <button @click="addField" class="add-field-btn">
            Add Field
          </button>
        </div>
        
        <!-- Fields Table Container -->
        <div v-if="!showDeleteConfirmation && !showAddField && !showEditModel && !showEditField" class="fields-container">
          <div v-if="model?.fields.length === 0" class="no-fields">
            <p>No fields found for this model.</p>
          </div>
          
          <div v-else class="fields-table-container">
            <table class="fields-table">
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Parent Field</th>
                  <th>Required</th>
                  <th class="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in model?.fields" :key="field.id">
                  <td class="field-name">{{ field.name }}</td>
                  <td class="field-type">
                    <span class="type-badge" :class="`type-${field.type.toLowerCase()}`">
                      {{ formatFieldType(field.type) }}
                    </span>
                  </td>
                  <td class="field-description">{{ field.description || '-' }}</td>
                  <td class="field-parent">
                    <span class="boolean-badge" :class="{ 'boolean-true': field.isParentField, 'boolean-false': !field.isParentField }">
                      {{ field.isParentField ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td class="field-required">
                    <span class="boolean-badge" :class="{ 'boolean-true': field.isRequired, 'boolean-false': !field.isRequired }">
                      {{ field.isRequired ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td class="action-cell">
                    <button @click="editField(field)" class="action-btn edit-btn">
                      Edit
                    </button>
                    <button @click="showDeleteFieldConfirmation(field)" class="action-btn delete-btn">
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Delete Confirmation Container -->
        <div v-if="showDeleteConfirmation" class="delete-confirmation-container">
          <div class="delete-confirmation-content">
            <div class="confirmation-header">
              <h3>Delete Field</h3>
            </div>
            
            <div v-if="deleteError" class="error-message">
              <p>{{ deleteError }}</p>
            </div>
            
            <div class="confirmation-body">
              <p class="warning-text">
                Are you sure you want to delete the <strong>{{ fieldToDelete?.name }}</strong> field?
              </p>
              <p class="warning-subtext">
                This action cannot be undone. Please type <strong>'delete'</strong> in the box below to confirm.
              </p>
              
              <div class="confirmation-input-group">
                <label for="deleteConfirmation" class="confirmation-label">
                  Type 'delete' to confirm:
                </label>
                <input 
                  id="deleteConfirmation"
                  v-model="deleteConfirmationText"
                  type="text" 
                  class="confirmation-input"
                  placeholder="delete"
                  :disabled="deleting"
                />
              </div>
            </div>
            
            <div class="confirmation-actions">
              <button 
                @click="cancelDelete" 
                class="cancel-delete-btn"
                :disabled="deleting"
              >
                Cancel
              </button>
              <button 
                @click="confirmDelete" 
                class="confirm-delete-btn"
                :disabled="deleteConfirmationText.toLowerCase() !== 'delete' || deleting"
              >
                {{ deleting ? 'Deleting...' : 'Continue' }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Add Field Container -->
        <div v-if="showAddField" class="add-field-container">
          <div class="add-field-content">
            <div class="add-field-header">
              <h3>Add New Field</h3>
            </div>
            
            <div v-if="addFieldError" class="error-message">
              <p>{{ addFieldError }}</p>
            </div>
            
            <form @submit.prevent="createField" class="add-field-form">
              <div class="form-group">
                <label for="fieldName" class="form-label">
                  Field Name <span class="required">*</span>
                </label>
                <input 
                  id="fieldName"
                  v-model="newField.name"
                  type="text" 
                  class="form-input"
                  placeholder="Enter field name"
                  :disabled="addingField"
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="fieldType" class="form-label">
                  Field Type <span class="required">*</span>
                </label>
                <select 
                  id="fieldType"
                  v-model="newField.type"
                  class="form-select"
                  :disabled="addingField"
                  required
                >
                  <option value="">Select field type</option>
                  <option v-for="type in fieldTypes" :key="type.value" :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="fieldDescription" class="form-label">
                  Description
                </label>
                <textarea 
                  id="fieldDescription"
                  v-model="newField.description"
                  class="form-textarea"
                  placeholder="Enter field description (optional)"
                  rows="3"
                  :disabled="addingField"
                ></textarea>
              </div>
              
              <div class="form-group">
                <div class="checkbox-group">
                  <input
                    id="isParentField"
                    v-model="newField.isParentField"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="addingField"
                  />
                  <label for="isParentField" class="checkbox-label">
                    Is Parent Field
                  </label>
                </div>
              </div>

              <div class="form-group">
                <div class="checkbox-group">
                  <input
                    id="isRequired"
                    v-model="newField.isRequired"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="addingField"
                  />
                  <label for="isRequired" class="checkbox-label">
                    Required Field
                  </label>
                </div>
              </div>
              
              <div class="add-field-actions">
                <button 
                  type="button"
                  @click="cancelAddField" 
                  class="cancel-add-btn"
                  :disabled="addingField"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  class="confirm-add-btn"
                  :disabled="!newField.name || !newField.type || addingField"
                >
                  {{ addingField ? 'Adding...' : 'Add Field' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Edit Model Container -->
        <div v-if="showEditModel" class="edit-model-container">
          <div class="edit-model-content">
            <div class="edit-model-header">
              <h3>Edit Model</h3>
            </div>

            <div v-if="editModelError" class="error-message">
              <p>{{ editModelError }}</p>
            </div>

            <form @submit.prevent="saveModel" class="edit-model-form">
              <div class="form-group">
                <label for="modelName" class="form-label">
                  Model Name <span class="required">*</span>
                </label>
                <input
                  id="modelName"
                  v-model="editModelData.modelName"
                  type="text"
                  class="form-input"
                  placeholder="Enter model name"
                  :disabled="savingModel"
                  required
                />
              </div>

              <div class="form-group">
                <label for="modelDescription" class="form-label">
                  Model Description
                </label>
                <textarea
                  id="modelDescription"
                  v-model="editModelData.modelDescription"
                  class="form-textarea"
                  placeholder="Enter model description (optional)"
                  rows="3"
                  :disabled="savingModel"
                ></textarea>
              </div>

              <div class="edit-model-actions">
                <button
                  type="button"
                  @click="cancelEditModel"
                  class="cancel-edit-btn"
                  :disabled="savingModel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="confirm-edit-btn"
                  :disabled="!editModelData.modelName || savingModel"
                >
                  {{ savingModel ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>


        <!-- Edit Field Container -->
        <div v-if="showEditField" class="edit-field-container">
          <div class="edit-field-content">
            <div class="edit-field-header">
              <h3>Edit Field</h3>
            </div>

            <div v-if="editFieldError" class="error-message">
              <p>{{ editFieldError }}</p>
            </div>

            <form @submit.prevent="saveField" class="edit-field-form">
              <div class="form-group">
                <label for="editFieldName" class="form-label">
                  Field Name <span class="required">*</span>
                </label>
                <input
                  id="editFieldName"
                  v-model="editFieldData.name"
                  type="text"
                  class="form-input"
                  placeholder="Enter field name"
                  :disabled="editingField"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  Field Type
                </label>
                <div class="type-display">
                  <span class="type-badge" :class="`type-${fieldToEdit?.type.toLowerCase()}`">
                    {{ formatFieldType(fieldToEdit?.type || '') }}
                  </span>
                  <span class="type-note">(Type cannot be changed)</span>
                </div>
              </div>

              <div class="form-group">
                <label for="editFieldDescription" class="form-label">
                  Description
                </label>
                <textarea
                  id="editFieldDescription"
                  v-model="editFieldData.description"
                  class="form-textarea"
                  placeholder="Enter field description (optional)"
                  rows="3"
                  :disabled="editingField"
                ></textarea>
              </div>

              <div class="form-group">
                <div class="checkbox-group">
                  <input
                    id="editIsParentField"
                    v-model="editFieldData.isParentField"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="editingField"
                  />
                  <label for="editIsParentField" class="checkbox-label">
                    Is Parent Field
                  </label>
                </div>
              </div>

              <div class="form-group">
                <div class="checkbox-group">
                  <input
                    id="editIsRequired"
                    v-model="editFieldData.isRequired"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="editingField"
                  />
                  <label for="editIsRequired" class="checkbox-label">
                    Required Field
                  </label>
                </div>
              </div>

              <div class="edit-field-actions">
                <button
                  type="button"
                  @click="cancelEditField"
                  class="cancel-edit-field-btn"
                  :disabled="editingField"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="confirm-edit-field-btn"
                  :disabled="!editFieldData.name || editingField"
                >
                  {{ editingField ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div v-if="!showAddField && !showEditModel && !showEditField && !showDeleteConfirmation" class="back-section">
          <button @click="goBack" class="back-btn">
            Back to Models
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders } from '@/config/api'
import type { ModelDto, GetModelResponse, FieldDto } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const model = ref<ModelDto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const showDeleteConfirmation = ref(false)
const fieldToDelete = ref<FieldDto | null>(null)
const deleteConfirmationText = ref('')
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const showAddField = ref(false)
const addingField = ref(false)
const addFieldError = ref<string | null>(null)
const newField = ref({
  name: '',
  type: '',
  description: '',
  isParentField: false,
  isRequired: false
})
const showEditModel = ref(false)
const savingModel = ref(false)
const editModelError = ref<string | null>(null)
const editModelData = ref({
  modelName: '',
  modelDescription: ''
})
const showEditField = ref(false)
const editingField = ref(false)
const editFieldError = ref<string | null>(null)
const fieldToEdit = ref<FieldDto | null>(null)
const editFieldData = ref({
  name: '',
  description: '',
  isParentField: false,
  isRequired: false
})

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

const formatFieldType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const addField = () => {
  // Reset form and show add field container
  newField.value = {
    name: '',
    type: '',
    description: '',
    isParentField: false,
    isRequired: false
  }
  addFieldError.value = null
  showAddField.value = true
}

const cancelAddField = () => {
  showAddField.value = false
  newField.value = {
    name: '',
    type: '',
    description: '',
    isParentField: false,
    isRequired: false
  }
  addFieldError.value = null
}

const createField = async () => {
  if (!newField.value.name || !newField.value.type) {
    return
  }
  
  addingField.value = true
  addFieldError.value = null
  
  try {
    const token = authStore.getAuthToken()
    
    if (!token) {
      router.push('/')
      return
    }

    const modelId = route.params.modelId as string
    
    // Prepare the field data according to FieldDto structure
    const fieldData = {
      name: newField.value.name,
      type: newField.value.type,
      description: newField.value.description || undefined,
      isParentField: newField.value.isParentField,
      isRequired: newField.value.isRequired
    }

    const response = await fetch(getApiUrl(`/v1/fields/${modelId}`), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(fieldData)
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // Reset form state
    showAddField.value = false
    newField.value = {
      name: '',
      type: '',
      description: '',
      isParentField: false,
      isRequired: false
    }
    
    // Reload model data to reflect changes
    await fetchModel()
  } catch (err) {
    addFieldError.value = err instanceof Error ? err.message : 'Failed to create field'
    console.error('Error creating field:', err)
  } finally {
    addingField.value = false
  }
}

const showDeleteFieldConfirmation = (field: FieldDto) => {
  fieldToDelete.value = field
  deleteConfirmationText.value = ''
  deleteError.value = null
  showDeleteConfirmation.value = true
}

const cancelDelete = () => {
  showDeleteConfirmation.value = false
  fieldToDelete.value = null
  deleteConfirmationText.value = ''
  deleteError.value = null
}

const confirmDelete = async () => {
  if (!fieldToDelete.value || deleteConfirmationText.value.toLowerCase() !== 'delete') {
    return
  }
  
  deleting.value = true
  deleteError.value = null
  
  try {
    const token = authStore.getAuthToken()
    
    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(getApiUrl(`/v1/fields/${fieldToDelete.value.id}`), {
      method: 'DELETE',
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
    
    // Reset confirmation state
    showDeleteConfirmation.value = false
    fieldToDelete.value = null
    deleteConfirmationText.value = ''
    
    // Reload model data to reflect changes
    await fetchModel()
  } catch (err) {
    deleteError.value = err instanceof Error ? err.message : 'Failed to delete field'
    console.error('Error deleting field:', err)
  } finally {
    deleting.value = false
  }
}

const editModel = () => {
  // Reset form and populate with current model data
  editModelData.value = {
    modelName: model.value?.name || '',
    modelDescription: model.value?.description || ''
  }
  editModelError.value = null
  showEditModel.value = true
}

const cancelEditModel = () => {
  showEditModel.value = false
  editModelData.value = {
    modelName: '',
    modelDescription: ''
  }
  editModelError.value = null
}

const saveModel = async () => {
  if (!editModelData.value.modelName) {
    return
  }

  savingModel.value = true
  editModelError.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const modelId = route.params.modelId as string

    // Prepare the model data according to UpdateModelRequest structure
    const updateModelData = {
      modelName: editModelData.value.modelName,
      modelDescription: editModelData.value.modelDescription || undefined
    }

    const response = await fetch(getApiUrl(`/v1/models/${modelId}`), {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateModelData)
    })

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Reset form state
    showEditModel.value = false
    editModelData.value = {
      modelName: '',
      modelDescription: ''
    }

    // Reload model data to reflect changes
    await fetchModel()
  } catch (err) {
    editModelError.value = err instanceof Error ? err.message : 'Failed to update model'
    console.error('Error updating model:', err)
  } finally {
    savingModel.value = false
  }
}


const editField = (field: FieldDto) => {
  // Reset form and populate with current field data
  fieldToEdit.value = field
  editFieldData.value = {
    name: field.name,
    description: field.description || '',
    isParentField: field.isParentField,
    isRequired: field.isRequired
  }
  editFieldError.value = null
  showEditField.value = true
}

const cancelEditField = () => {
  showEditField.value = false
  fieldToEdit.value = null
  editFieldData.value = {
    name: '',
    description: '',
    isParentField: false,
    isRequired: false
  }
  editFieldError.value = null
}

const saveField = async () => {
  if (!editFieldData.value.name || !fieldToEdit.value) {
    return
  }

  editingField.value = true
  editFieldError.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    // Prepare the field data according to UpdateFieldRequest structure
    const updateFieldData = {
      name: editFieldData.value.name,
      description: editFieldData.value.description || undefined,
      isParent: editFieldData.value.isParentField,
      isRequired: editFieldData.value.isRequired
    }

    const response = await fetch(getApiUrl(`/v1/fields/${fieldToEdit.value.id}`), {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateFieldData)
    })

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Reset form state
    showEditField.value = false
    fieldToEdit.value = null
    editFieldData.value = {
      name: '',
      description: '',
      isParentField: false,
      isRequired: false
    }

    // Reload model data to reflect changes
    await fetchModel()
  } catch (err) {
    editFieldError.value = err instanceof Error ? err.message : 'Failed to update field'
    console.error('Error updating field:', err)
  } finally {
    editingField.value = false
  }
}

const goBack = () => {
  router.push({ name: 'models-admin' })
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
.model-admin {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background-color: #f5f5f5;
  margin: 0;
  padding: 0;
}

.model-actions-bar {
  position: fixed;
  top: 195px; /* Below PageHeader */
  left: 0;
  right: 0;
  z-index: 850;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  height: 50px;
  display: flex;
  align-items: center;
}

.model-actions-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: flex-end;
  box-sizing: border-box;
}

.edit-model-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.edit-model-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.edit-model-btn:active {
  transform: translateY(0);
}

.content {
  padding-top: calc(245px + 2rem); /* 60px nav + 85px title + 50px description + 50px actions + padding */
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
    padding-top: calc(245px + 1rem);
    padding-left: 1rem;
    padding-right: 1rem;
    padding-bottom: 1rem;
  }

  .model-actions-content {
    padding: 0 1rem;
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
  justify-content: flex-end;
  margin-bottom: 2rem;
  gap: 1rem;
}

.add-field-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.add-field-btn:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.add-field-btn:active {
  transform: translateY(0);
}

.fields-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
}

.no-fields {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  font-style: italic;
}

.fields-table-container {
  overflow-x: auto;
}

.fields-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.fields-table th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.fields-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  color: #495057;
  vertical-align: middle;
}

.fields-table tr:last-child td {
  border-bottom: none;
}

.fields-table tr:hover {
  background-color: #f8f9fa;
}

.field-name {
  font-weight: 500;
  color: #2c3e50;
}

.field-type {
  min-width: 120px;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-single_line_text {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-multi_line_text {
  background-color: #e8f5e8;
  color: #388e3c;
}

.type-email {
  background-color: #fff3e0;
  color: #f57c00;
}

.type-decimal {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.type-long {
  background-color: #e1f5fe;
  color: #0288d1;
}

.type-boolean {
  background-color: #fce4ec;
  color: #c2185b;
}

.type-date {
  background-color: #e8eaf6;
  color: #3f51b5;
}

.type-datetime {
  background-color: #f1f8e9;
  color: #689f38;
}

.field-description {
  max-width: 250px;
  word-wrap: break-word;
}

.boolean-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.boolean-true {
  background-color: #d4edda;
  color: #155724;
}

.boolean-false {
  background-color: #f8d7da;
  color: #721c24;
}

.actions-header {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  padding: 1rem;
  text-align: center;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
  width: 160px;
  min-width: 160px;
}

.action-cell {
  text-align: center;
  vertical-align: middle;
  width: 160px;
  min-width: 160px;
  padding: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
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

.edit-btn {
  background-color: #007bff;
  color: white;
}

.edit-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.delete-btn:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
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

.delete-confirmation-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
  border-left: 4px solid #dc3545;
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
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.confirmation-input-group {
  max-width: 300px;
  margin: 0 auto;
}

.confirmation-label {
  display: block;
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
  text-align: left;
}

.confirmation-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.confirmation-input:focus {
  outline: none;
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.confirmation-input:disabled {
  background-color: #f8f9fa;
  opacity: 0.6;
  cursor: not-allowed;
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
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s, opacity 0.2s;
  border: none;
  min-width: 100px;
}

.cancel-delete-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-delete-btn:hover:not(:disabled) {
  background-color: #545b62;
  transform: translateY(-1px);
}

.confirm-delete-btn {
  background-color: #dc3545;
  color: white;
}

.confirm-delete-btn:hover:not(:disabled) {
  background-color: #c82333;
  transform: translateY(-1px);
}

.cancel-delete-btn:disabled,
.confirm-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-delete-btn:active,
.confirm-delete-btn:active {
  transform: translateY(0);
}

.add-field-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
  border-left: 4px solid #28a745;
}

.add-field-content {
  padding: 2rem;
}

.add-field-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.add-field-header h3 {
  color: #28a745;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.add-field-form {
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
.form-select,
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
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #28a745;
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}

.form-input:disabled,
.form-select:disabled,
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

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-checkbox {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}

.checkbox-label {
  cursor: pointer;
  font-weight: normal;
  margin: 0;
  color: #495057;
  font-size: 0.95rem;
}

.add-field-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.cancel-add-btn,
.confirm-add-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s, opacity 0.2s;
  border: none;
  min-width: 120px;
}

.cancel-add-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-add-btn:hover:not(:disabled) {
  background-color: #545b62;
  transform: translateY(-1px);
}

.confirm-add-btn {
  background-color: #28a745;
  color: white;
}

.confirm-add-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
}

.cancel-add-btn:disabled,
.confirm-add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-add-btn:active,
.confirm-add-btn:active {
  transform: translateY(0);
}

.edit-model-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
  border-left: 4px solid #007bff;
}

.edit-model-content {
  padding: 2rem;
}

.edit-model-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.edit-model-header h3 {
  color: #007bff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.edit-model-form {
  max-width: 600px;
  margin: 0 auto;
}

.edit-model-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.cancel-edit-btn,
.confirm-edit-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s, opacity 0.2s;
  border: none;
  min-width: 120px;
}

.cancel-edit-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-edit-btn:hover:not(:disabled) {
  background-color: #545b62;
  transform: translateY(-1px);
}

.confirm-edit-btn {
  background-color: #007bff;
  color: white;
}

.confirm-edit-btn:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.cancel-edit-btn:disabled,
.confirm-edit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-edit-btn:active,
.confirm-edit-btn:active {
  transform: translateY(0);
}

.edit-field-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
  border-left: 4px solid #007bff;
}

.edit-field-content {
  padding: 2rem;
}

.edit-field-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.edit-field-header h3 {
  color: #007bff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.edit-field-form {
  max-width: 600px;
  margin: 0 auto;
}

.type-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.type-note {
  font-size: 0.85rem;
  color: #6c757d;
  font-style: italic;
}

.edit-field-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.cancel-edit-field-btn,
.confirm-edit-field-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s, opacity 0.2s;
  border: none;
  min-width: 120px;
}

.cancel-edit-field-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-edit-field-btn:hover:not(:disabled) {
  background-color: #545b62;
  transform: translateY(-1px);
}

.confirm-edit-field-btn {
  background-color: #007bff;
  color: white;
}

.confirm-edit-field-btn:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.cancel-edit-field-btn:disabled,
.confirm-edit-field-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-edit-field-btn:active,
.confirm-edit-field-btn:active {
  transform: translateY(0);
}

</style>