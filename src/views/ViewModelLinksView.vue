<template>
  <div class="view-model-links">
    <AppNavigation />
    <PageHeader
      title="Linked Models"
      description="View relationships between models and their linking configurations."
    />

    <div class="content">
      <!-- Add Model Link Button -->
      <div class="actions-section">
        <button @click="addModelLink" class="add-model-link-btn">
          New Model Link
        </button>
      </div>

      <!-- Add Model Link Form -->
      <div v-if="showAddModelLink" class="add-model-link-container">
        <div class="add-model-link-content">
          <div class="add-model-link-header">
            <h3>Create New Model Link</h3>
          </div>

          <div v-if="addLinkError" class="error-message">
            <p>{{ addLinkError }}</p>
          </div>

          <form @submit.prevent="createModelLink" class="add-model-link-form">
            <div class="form-row">
              <div class="form-group">
                <label for="model1Select" class="form-label">
                  First Model <span class="required">*</span>
                </label>
                <select
                  id="model1Select"
                  v-model="newLink.model1Id"
                  class="form-select"
                  :disabled="addingLink"
                  required
                  @change="updateModel1Name"
                >
                  <option value="">Select first model</option>
                  <option v-for="model in availableModels" :key="model.id" :value="model.id">
                    {{ model.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="model2Select" class="form-label">
                  Second Model <span class="required">*</span>
                </label>
                <select
                  id="model2Select"
                  v-model="newLink.model2Id"
                  class="form-select"
                  :disabled="addingLink"
                  required
                  @change="updateModel2Name"
                >
                  <option value="">Select second model</option>
                  <option v-for="model in availableModels" :key="model.id" :value="model.id">
                    {{ model.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="relationship-config">
              <h4>Relationship Configuration</h4>

              <div class="model-config-section">
                <h5>{{ newLink.model1Name || 'First Model' }} can have:</h5>
                <div class="config-option">
                  <input
                    id="model1Unlimited"
                    v-model="newLink.model1_can_have_unlimited_model2s"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="addingLink"
                    @change="onModel1UnlimitedChange"
                  />
                  <label for="model1Unlimited" class="checkbox-label">
                    Unlimited {{ newLink.model2Name || 'second model' }} records
                  </label>
                </div>

                <div v-if="!newLink.model1_can_have_unlimited_model2s" class="form-group">
                  <label for="model1Count" class="form-label">
                    Maximum {{ newLink.model2Name || 'second model' }} records
                  </label>
                  <input
                    id="model1Count"
                    v-model.number="newLink.model1_can_have_so_many_model2s_count"
                    type="number"
                    min="0"
                    class="form-input"
                    placeholder="Enter maximum count"
                    :disabled="addingLink"
                  />
                </div>
              </div>

              <div class="model-config-section">
                <h5>{{ newLink.model2Name || 'Second Model' }} can have:</h5>
                <div class="config-option">
                  <input
                    id="model2Unlimited"
                    v-model="newLink.model2_can_have_unlimited_model1s"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="addingLink"
                    @change="onModel2UnlimitedChange"
                  />
                  <label for="model2Unlimited" class="checkbox-label">
                    Unlimited {{ newLink.model1Name || 'first model' }} records
                  </label>
                </div>

                <div v-if="!newLink.model2_can_have_unlimited_model1s" class="form-group">
                  <label for="model2Count" class="form-label">
                    Maximum {{ newLink.model1Name || 'first model' }} records
                  </label>
                  <input
                    id="model2Count"
                    v-model.number="newLink.model2_can_have_so_many_model1s_count"
                    type="number"
                    min="0"
                    class="form-input"
                    placeholder="Enter maximum count"
                    :disabled="addingLink"
                  />
                </div>
              </div>
            </div>

            <div class="add-model-link-actions">
              <button
                type="button"
                @click="cancelAddModelLink"
                class="cancel-add-link-btn"
                :disabled="addingLink"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="confirm-add-link-btn"
                :disabled="!newLink.model1Id || !newLink.model2Id || addingLink"
              >
                {{ addingLink ? 'Creating...' : 'Create Link' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Model links list section - hidden when adding a link -->
      <div v-if="!showAddModelLink">
        <div v-if="loading" class="loading">
          <p>Loading model links...</p>
        </div>

        <div v-else-if="error" class="error-message">
          <p>Error loading model links: {{ error }}</p>
          <button @click="fetchModelLinks" class="retry-btn">Retry</button>
        </div>

        <div v-else-if="modelLinks.length === 0" class="no-links">
          <p>No model links found.</p>
        </div>

        <div v-else class="links-grid">
          <div
            v-for="link in modelLinks"
            :key="`${link.model1Id}-${link.model2Id}`"
            v-show="!editingLinkId || editingLinkId === `${link.model1Id}-${link.model2Id}`"
            class="link-card"
          >
            <div class="card-header">
              <h3 class="model-relationship">
                {{ link.model1Name }} ↔ {{ link.model2Name }}
              </h3>
              <button
                @click="editModelLink(link)"
                class="edit-link-btn"
                :disabled="editingLinkId === `${link.model1Id}-${link.model2Id}`"
              >
                Edit
              </button>
            </div>

            <div class="card-body">
              <div class="relationship-details">
                <div class="model-section">
                  <h4>{{ link.model1Name }}</h4>
                  <div class="relationship-info">
                    <span v-if="link.model1_can_have_unlimited_model2s" class="unlimited-badge">
                      Can have unlimited {{ link.model2Name }}s
                    </span>
                    <span v-else class="limited-badge">
                      Can have max {{ link.model1_can_have_so_many_model2s_count || 0 }} {{ link.model2Name }}s
                    </span>
                  </div>
                </div>

                <div class="arrow-divider">⟷</div>

                <div class="model-section">
                  <h4>{{ link.model2Name }}</h4>
                  <div class="relationship-info">
                    <span v-if="link.model2_can_have_unlimited_model1s" class="unlimited-badge">
                      Can have unlimited {{ link.model1Name }}s
                    </span>
                    <span v-else class="limited-badge">
                      Can have max {{ link.model2_can_have_so_many_model1s_count || 0 }} {{ link.model1Name }}s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Edit Container -->
            <div
              v-if="editingLinkId === `${link.model1Id}-${link.model2Id}`"
              class="edit-link-container"
            >
              <div class="edit-link-content">
                <div class="edit-link-header">
                  <h3>Edit Model Link</h3>
                </div>

                <div class="edit-form">
                  <div class="relationship-config">
                    <div class="model-config-section">
                      <h5>{{ editingLink.model1Name }} can have:</h5>
                      <div class="config-option">
                        <input
                          id="editModel1Unlimited"
                          v-model="editingLink.model1_can_have_unlimited_model2s"
                          type="checkbox"
                          class="form-checkbox"
                          @change="onEditModel1UnlimitedChange"
                        />
                        <label for="editModel1Unlimited" class="checkbox-label">
                          Unlimited {{ editingLink.model2Name }} records
                        </label>
                      </div>

                      <div v-if="!editingLink.model1_can_have_unlimited_model2s" class="form-group">
                        <label for="editModel1Count" class="form-label">
                          Maximum {{ editingLink.model2Name }} records
                        </label>
                        <input
                          id="editModel1Count"
                          v-model.number="editingLink.model1_can_have_so_many_model2s_count"
                          type="number"
                          min="0"
                          class="form-input"
                          placeholder="Enter maximum count"
                        />
                      </div>
                    </div>

                    <div class="model-config-section">
                      <h5>{{ editingLink.model2Name }} can have:</h5>
                      <div class="config-option">
                        <input
                          id="editModel2Unlimited"
                          v-model="editingLink.model2_can_have_unlimited_model1s"
                          type="checkbox"
                          class="form-checkbox"
                          @change="onEditModel2UnlimitedChange"
                        />
                        <label for="editModel2Unlimited" class="checkbox-label">
                          Unlimited {{ editingLink.model1Name }} records
                        </label>
                      </div>

                      <div v-if="!editingLink.model2_can_have_unlimited_model1s" class="form-group">
                        <label for="editModel2Count" class="form-label">
                          Maximum {{ editingLink.model1Name }} records
                        </label>
                        <input
                          id="editModel2Count"
                          v-model.number="editingLink.model2_can_have_so_many_model1s_count"
                          type="number"
                          min="0"
                          class="form-input"
                          placeholder="Enter maximum count"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="edit-link-actions">
                    <button
                      type="button"
                      @click="cancelEditModelLink"
                      class="cancel-edit-link-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      @click="saveEditModelLink"
                      class="save-edit-link-btn"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="back-section">
        <button @click="goBack" class="back-btn">
          Back to Model Administration
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders, API_CONFIG } from '@/config/api'
import type { ModelLinkDto, GetModelLinksResponse, LinkModelsRequest, Model, ModelsResponse } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const authStore = useAuthStore()

const modelLinks = ref<ModelLinkDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Add Model Link Form State
const showAddModelLink = ref(false)
const addingLink = ref(false)
const addLinkError = ref<string | null>(null)
const availableModels = ref<Model[]>([])
const newLink = ref<LinkModelsRequest>({
  model1Id: '',
  model2Id: '',
  model1_can_have_unlimited_model2s: false,
  model2_can_have_unlimited_model1s: false,
  model1_can_have_so_many_model2s_count: null,
  model2_can_have_so_many_model1s_count: null,
  model1Name: '',
  model2Name: ''
})

// Edit Model Link State
const editingLinkId = ref<string | null>(null)
const editingLink = ref<ModelLinkDto>({
  model1Id: '',
  model2Id: '',
  model1Name: '',
  model2Name: '',
  model1_can_have_unlimited_model2s: false,
  model2_can_have_unlimited_model1s: false,
  model1_can_have_so_many_model2s_count: null,
  model2_can_have_so_many_model1s_count: null
})

const fetchModelLinks = async () => {
  loading.value = true
  error.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(getApiUrl('/v1/models/link-models'), {
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

    const data: GetModelLinksResponse = await response.json()
    modelLinks.value = data.modelLinks
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch model links'
    console.error('Error fetching model links:', err)
  } finally {
    loading.value = false
  }
}

const fetchModels = async () => {
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
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ModelsResponse = await response.json()
    availableModels.value = data.models
  } catch (err) {
    console.error('Error fetching models:', err)
  }
}

const addModelLink = () => {
  // Reset form fields individually to maintain reactivity
  newLink.value.model1Id = ''
  newLink.value.model2Id = ''
  newLink.value.model1_can_have_unlimited_model2s = false
  newLink.value.model2_can_have_unlimited_model1s = false
  newLink.value.model1_can_have_so_many_model2s_count = null
  newLink.value.model2_can_have_so_many_model1s_count = null
  newLink.value.model1Name = ''
  newLink.value.model2Name = ''

  addLinkError.value = null
  showAddModelLink.value = true
}

const cancelAddModelLink = () => {
  showAddModelLink.value = false

  // Reset form fields individually to maintain reactivity
  newLink.value.model1Id = ''
  newLink.value.model2Id = ''
  newLink.value.model1_can_have_unlimited_model2s = false
  newLink.value.model2_can_have_unlimited_model1s = false
  newLink.value.model1_can_have_so_many_model2s_count = null
  newLink.value.model2_can_have_so_many_model1s_count = null
  newLink.value.model1Name = ''
  newLink.value.model2Name = ''

  addLinkError.value = null
}

const updateModel1Name = () => {
  const model = availableModels.value.find(m => m.id === newLink.value.model1Id)
  newLink.value.model1Name = model ? model.name : ''
}

const updateModel2Name = () => {
  const model = availableModels.value.find(m => m.id === newLink.value.model2Id)
  newLink.value.model2Name = model ? model.name : ''
}

const onModel1UnlimitedChange = () => {
  if (newLink.value.model1_can_have_unlimited_model2s) {
    newLink.value.model1_can_have_so_many_model2s_count = null
  }
}

const onModel2UnlimitedChange = () => {
  if (newLink.value.model2_can_have_unlimited_model1s) {
    newLink.value.model2_can_have_so_many_model1s_count = null
  }
}

const createModelLink = async () => {
  if (!newLink.value.model1Id || !newLink.value.model2Id) {
    return
  }

  addingLink.value = true
  addLinkError.value = null

  try {
    const token = authStore.getAuthToken()
    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(getApiUrl('/v1/models/link-models'), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(newLink.value)
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
    showAddModelLink.value = false

    // Reset form fields individually to maintain reactivity
    newLink.value.model1Id = ''
    newLink.value.model2Id = ''
    newLink.value.model1_can_have_unlimited_model2s = false
    newLink.value.model2_can_have_unlimited_model1s = false
    newLink.value.model1_can_have_so_many_model2s_count = null
    newLink.value.model2_can_have_so_many_model1s_count = null
    newLink.value.model1Name = ''
    newLink.value.model2Name = ''

    // Reload model links to show the new link
    await fetchModelLinks()
  } catch (err) {
    addLinkError.value = err instanceof Error ? err.message : 'Failed to create model link'
    console.error('Error creating model link:', err)
  } finally {
    addingLink.value = false
  }
}

const goBack = () => {
  router.push({ name: 'models-admin' })
}

// Edit Model Link Functions
const editModelLink = (link: ModelLinkDto) => {
  editingLinkId.value = `${link.model1Id}-${link.model2Id}`
  editingLink.value = {
    model1Id: link.model1Id,
    model2Id: link.model2Id,
    model1Name: link.model1Name,
    model2Name: link.model2Name,
    model1_can_have_unlimited_model2s: link.model1_can_have_unlimited_model2s,
    model2_can_have_unlimited_model1s: link.model2_can_have_unlimited_model1s,
    model1_can_have_so_many_model2s_count: link.model1_can_have_so_many_model2s_count,
    model2_can_have_so_many_model1s_count: link.model2_can_have_so_many_model1s_count
  }
}

const cancelEditModelLink = () => {
  editingLinkId.value = null
  editingLink.value = {
    model1Id: '',
    model2Id: '',
    model1Name: '',
    model2Name: '',
    model1_can_have_unlimited_model2s: false,
    model2_can_have_unlimited_model1s: false,
    model1_can_have_so_many_model2s_count: null,
    model2_can_have_so_many_model1s_count: null
  }
}

const onEditModel1UnlimitedChange = () => {
  if (editingLink.value.model1_can_have_unlimited_model2s) {
    editingLink.value.model1_can_have_so_many_model2s_count = null
  }
}

const onEditModel2UnlimitedChange = () => {
  if (editingLink.value.model2_can_have_unlimited_model1s) {
    editingLink.value.model2_can_have_so_many_model1s_count = null
  }
}

const saveEditModelLink = () => {
  // For now, just close the edit container since server calls will be implemented later
  // Update the model link in the local array
  const linkIndex = modelLinks.value.findIndex(
    link => `${link.model1Id}-${link.model2Id}` === editingLinkId.value
  )

  if (linkIndex !== -1) {
    modelLinks.value[linkIndex] = {
      ...modelLinks.value[linkIndex],
      model1_can_have_unlimited_model2s: editingLink.value.model1_can_have_unlimited_model2s,
      model2_can_have_unlimited_model1s: editingLink.value.model2_can_have_unlimited_model1s,
      model1_can_have_so_many_model2s_count: editingLink.value.model1_can_have_so_many_model2s_count,
      model2_can_have_so_many_model1s_count: editingLink.value.model2_can_have_so_many_model1s_count
    }
  }

  // Close the edit container
  cancelEditModelLink()
}

onMounted(() => {
  const token = authStore.getAuthToken()
  if (!token) {
    router.push('/')
    return
  }

  fetchModelLinks()
  fetchModels()
})
</script>

<style scoped>
.view-model-links {
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

.no-links {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  font-style: italic;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

/* Ensure max 3 per row */
@media (min-width: 1400px) {
  .links-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .links-grid {
    grid-template-columns: 1fr;
    max-width: none;
    padding: 0 1rem;
  }
}

.link-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  background: linear-gradient(135deg, #6f42c1, #5a2d91);
  color: white;
  padding: 1rem;
  text-align: center;
}

.model-relationship {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

.relationship-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.model-section {
  flex: 1;
  text-align: center;
}

.model-section h4 {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.relationship-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.unlimited-badge {
  background-color: #d4edda;
  color: #155724;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  border: 1px solid #c3e6cb;
}

.limited-badge {
  background-color: #fff3cd;
  color: #856404;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
  border: 1px solid #ffeaa7;
}

.arrow-divider {
  font-size: 1.5rem;
  color: #6c757d;
  font-weight: bold;
}

/* Mobile layout adjustments */
@media (max-width: 600px) {
  .relationship-details {
    flex-direction: column;
    gap: 1rem;
  }

  .arrow-divider {
    transform: rotate(90deg);
    font-size: 1.2rem;
  }

  .model-relationship {
    font-size: 1rem;
    line-height: 1.3;
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

.actions-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2rem;
}

.add-model-link-btn {
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

.add-model-link-btn:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.add-model-link-btn:active {
  transform: translateY(0);
}

.add-model-link-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
  border-left: 4px solid #28a745;
}

.add-model-link-content {
  padding: 2rem;
}

.add-model-link-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.add-model-link-header h3 {
  color: #28a745;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.add-model-link-form {
  max-width: 700px;
  margin: 0 auto;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
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

.form-select,
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #28a745;
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}

.form-select:disabled,
.form-input:disabled {
  background-color: #f8f9fa;
  opacity: 0.6;
  cursor: not-allowed;
}

.relationship-config {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.relationship-config h4 {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.model-config-section {
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.model-config-section:last-child {
  margin-bottom: 0;
}

.model-config-section h5 {
  color: #495057;
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.config-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
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

.add-model-link-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.cancel-add-link-btn,
.confirm-add-link-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s, opacity 0.2s;
  border: none;
  min-width: 120px;
}

.cancel-add-link-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-add-link-btn:hover:not(:disabled) {
  background-color: #545b62;
  transform: translateY(-1px);
}

.confirm-add-link-btn {
  background-color: #28a745;
  color: white;
}

.confirm-add-link-btn:hover:not(:disabled) {
  background-color: #218838;
  transform: translateY(-1px);
}

.cancel-add-link-btn:disabled,
.confirm-add-link-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-add-link-btn:active,
.confirm-add-link-btn:active {
  transform: translateY(0);
}

/* Edit Link Styles */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-link-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}

.edit-link-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.edit-link-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.edit-link-container {
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  border-radius: 0 0 12px 12px;
}

.edit-link-content {
  padding: 1.5rem;
}

.edit-link-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.edit-link-header h3 {
  color: #495057;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.edit-form {
  max-width: 600px;
  margin: 0 auto;
}

.edit-link-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.cancel-edit-link-btn,
.save-edit-link-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  border: none;
  min-width: 120px;
}

.cancel-edit-link-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-edit-link-btn:hover {
  background-color: #545b62;
  transform: translateY(-1px);
}

.save-edit-link-btn {
  background-color: #007bff;
  color: white;
}

.save-edit-link-btn:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.cancel-edit-link-btn:active,
.save-edit-link-btn:active {
  transform: translateY(0);
}
</style>