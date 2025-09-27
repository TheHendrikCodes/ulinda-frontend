<template>
  <div class="user-admin">
    <AppNavigation />
    <PageHeader
      title="User Administration"
      description="Manage user accounts, permissions, and access rights."
    />

    <div class="content">
      <div v-if="loading" class="loading">
        <p>Loading users...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <p>Error loading users: {{ error }}</p>
        <button @click="fetchUsers" class="retry-btn">Retry</button>
      </div>

      <div v-else class="user-details">
        <div v-if="!showEditUser" class="actions-bar">
          <button @click="addUser" class="add-user-btn">Add New User</button>
        </div>

        <!-- Users Table Container -->
        <div
          v-if="!showAddUser && !showEditUser && !showPasswordDisplay && !showResetPasswordDisplay"
          class="users-container"
        >
          <div v-if="users.length === 0" class="no-users">
            <p>No users found.</p>
          </div>

          <div v-else class="users-table-container">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Surname</th>
                  <th>Username</th>
                  <th>Admin User</th>
                  <th>User Can Create Model</th>
                  <th class="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.userId">
                  <td class="user-name">{{ user.name }}</td>
                  <td class="user-surname">{{ user.surname }}</td>
                  <td class="user-username">{{ user.userName }}</td>
                  <td class="user-admin-cell">
                    <span
                      class="boolean-badge"
                      :class="{ 'boolean-true': user.adminUser, 'boolean-false': !user.adminUser }"
                    >
                      {{ user.adminUser ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td class="user-can-create">
                    <span
                      class="boolean-badge"
                      :class="{
                        'boolean-true': user.canCreateModels,
                        'boolean-false': !user.canCreateModels,
                      }"
                    >
                      {{ user.canCreateModels ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td class="action-cell">
                    <button @click="editUser(user)" class="action-btn edit-btn">Edit</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add User Container -->
        <div v-if="showAddUser" class="add-user-container">
          <div class="add-user-content">
            <div class="add-user-header">
              <h3>Add New User</h3>
            </div>

            <div v-if="addUserError" class="error-message">
              <p>{{ addUserError }}</p>
            </div>

            <form @submit.prevent="createUser" class="add-user-form">
              <div class="form-group">
                <label for="userName" class="form-label"> Name </label>
                <input
                  id="userName"
                  v-model="newUser.name"
                  type="text"
                  class="form-input"
                  placeholder="Enter first name"
                  :disabled="addingUser"
                />
              </div>

              <div class="form-group">
                <label for="userSurname" class="form-label"> Surname </label>
                <input
                  id="userSurname"
                  v-model="newUser.surname"
                  type="text"
                  class="form-input"
                  placeholder="Enter surname"
                  :disabled="addingUser"
                />
              </div>

              <div class="form-group">
                <label for="userUsername" class="form-label">
                  Username <span class="required">*</span>
                </label>
                <input
                  id="userUsername"
                  v-model="newUser.username"
                  type="text"
                  class="form-input"
                  placeholder="Enter username (letters and numbers only)"
                  :disabled="addingUser"
                  pattern="^[a-zA-Z0-9]+$"
                  title="Username must contain only letters and numbers, no spaces allowed"
                  required
                />
              </div>

              <div class="form-group">
                <div class="checkbox-group">
                  <input
                    id="canCreateModels"
                    v-model="newUser.canCreateModels"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="addingUser"
                  />
                  <label for="canCreateModels" class="checkbox-label">
                    User Can Create Models
                  </label>
                </div>
              </div>

              <div class="form-group">
                <div class="checkbox-group">
                  <input
                    id="adminUser"
                    v-model="newUser.adminUser"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="addingUser"
                  />
                  <label for="adminUser" class="checkbox-label"> Admin User </label>
                </div>
              </div>

              <div class="add-user-actions">
                <button
                  type="button"
                  @click="cancelAddUser"
                  class="cancel-add-btn"
                  :disabled="addingUser"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="confirm-add-btn"
                  :disabled="!newUser.username || addingUser"
                >
                  {{ addingUser ? 'Adding...' : 'Add User' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Password Display Container -->
        <div v-if="showPasswordDisplay" class="password-display-container">
          <div class="password-display-content">
            <div class="password-display-header">
              <h3>User Created Successfully!</h3>
            </div>

            <div class="password-display-body">
              <div class="password-info">
                <p class="password-message">
                  Please inform the new user of their login credentials:
                </p>

                <div class="credentials-box">
                  <div class="credential-row">
                    <label class="credential-label">Username:</label>
                    <span class="credential-value">{{ newUserPassword?.username }}</span>
                  </div>
                  <div class="credential-row">
                    <label class="credential-label">Password:</label>
                    <span class="credential-value password-value">{{
                      newUserPassword?.password
                    }}</span>
                  </div>
                </div>

                <div class="password-warning">
                  <strong>Important:</strong> This password will not be shown again. Please ensure
                  the user receives these credentials securely.
                </div>
              </div>
            </div>

            <div class="password-display-actions">
              <button type="button" @click="closePasswordDisplay" class="password-ok-btn">
                OK
              </button>
            </div>
          </div>
        </div>

        <!-- Reset Password Display Container -->
        <div v-if="showResetPasswordDisplay" class="password-display-container">
          <div class="password-display-content">
            <div class="password-display-header">
              <h3>Password Reset Successfully!</h3>
            </div>

            <div class="password-display-body">
              <div class="success-message">
                <p>
                  The password has been reset for the user. Please provide the new credentials
                  securely.
                </p>
              </div>

              <div class="credentials-section">
                <div class="credentials-box">
                  <div class="credential-row">
                    <label class="credential-label">Username:</label>
                    <span class="credential-value">{{ resetUserPassword?.username }}</span>
                  </div>
                  <div class="credential-row">
                    <label class="credential-label">New Password:</label>
                    <span class="credential-value password-value">{{
                      resetUserPassword?.newPassword
                    }}</span>
                  </div>
                </div>

                <div class="password-warning">
                  <strong>Important:</strong> This new password will not be shown again. Please
                  ensure the user receives these credentials securely.
                </div>
              </div>
            </div>

            <div class="password-display-actions">
              <button type="button" @click="closeResetPasswordDisplay" class="password-ok-btn">
                OK
              </button>
            </div>
          </div>
        </div>

        <!-- Edit User Container -->
        <div v-if="showEditUser && !showResetPasswordDisplay" class="edit-user-container">
          <div class="edit-user-content">
            <div class="edit-user-header">
              <h3>Edit User</h3>
              <button
                type="button"
                @click="resetPassword"
                class="reset-password-btn"
                :disabled="editingUser"
              >
                Reset Password
              </button>
            </div>

            <div v-if="editUserError" class="error-message">
              <p>{{ editUserError }}</p>
            </div>

            <form @submit.prevent="saveUser" class="edit-user-form">
              <div class="form-group">
                <label for="editUserName" class="form-label"> Name </label>
                <input
                  id="editUserName"
                  v-model="editUserData.name"
                  type="text"
                  class="form-input"
                  placeholder="Enter first name"
                  :disabled="editingUser || userToEdit?.userName === 'admin'"
                />
              </div>

              <div class="form-group">
                <label for="editUserSurname" class="form-label"> Surname </label>
                <input
                  id="editUserSurname"
                  v-model="editUserData.surname"
                  type="text"
                  class="form-input"
                  placeholder="Enter surname"
                  :disabled="editingUser || userToEdit?.userName === 'admin'"
                />
              </div>

              <div class="form-group">
                <label for="editUserUsername" class="form-label">
                  Username <span class="required">*</span>
                </label>
                <input
                  id="editUserUsername"
                  v-model="editUserData.username"
                  type="text"
                  class="form-input"
                  placeholder="Enter username (letters and numbers only)"
                  :disabled="editingUser || userToEdit?.userName === 'admin'"
                  pattern="^[a-zA-Z0-9]+$"
                  title="Username must contain only letters and numbers, no spaces allowed"
                  required
                />
              </div>

              <div class="form-group">
                <div class="checkbox-group">
                  <input
                    id="editCanCreateModels"
                    v-model="editUserData.canCreateModels"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="editingUser || userToEdit?.userName === 'admin'"
                  />
                  <label for="editCanCreateModels" class="checkbox-label">
                    User Can Create Models
                  </label>
                </div>
              </div>

              <div class="form-group">
                <div class="checkbox-group">
                  <input
                    id="editAdminUser"
                    v-model="editUserData.adminUser"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="editingUser || userToEdit?.userName === 'admin'"
                  />
                  <label for="editAdminUser" class="checkbox-label"> Admin User </label>
                </div>
              </div>

              <div class="form-group">
                <div class="checkbox-group">
                  <input
                    id="editMustChangePassword"
                    v-model="editUserData.mustChangePassword"
                    type="checkbox"
                    class="form-checkbox"
                    :disabled="editingUser || userToEdit?.userName === 'admin'"
                  />
                  <label for="editMustChangePassword" class="checkbox-label">
                    Must Change Password
                  </label>
                </div>
              </div>

              <!-- Model Permissions Section -->
              <div v-if="userToEdit?.userName !== 'admin'" class="permissions-section">
                <h4 class="permissions-title">Model Permissions</h4>

                <div v-if="loadingModels || loadingPermissions" class="loading-permissions">
                  <p>Loading models and permissions...</p>
                </div>

                <div v-else-if="modelsError || permissionsError" class="error-message">
                  <p>Error: {{ modelsError || permissionsError }}</p>
                </div>

                <div v-else-if="allModels.length === 0" class="no-permissions">
                  <p>No models found in the system.</p>
                </div>

                <div v-else class="permissions-table-wrapper">
                  <div class="permissions-table-container">
                    <table class="permissions-table">
                      <thead>
                        <tr>
                          <th class="model-header">Model</th>
                          <th
                            v-for="permission in getAllPermissions()"
                            :key="permission"
                            class="permission-header"
                          >
                            {{ permission.replace('_', ' ') }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="model in getUniqueModels()" :key="model.id">
                          <td class="model-cell">
                            <div class="model-info">
                              <strong>{{ model.name }}</strong>
                              <small v-if="model.description">{{ model.description }}</small>
                            </div>
                          </td>
                          <td
                            v-for="permission in getAllPermissions()"
                            :key="permission"
                            class="permission-cell"
                          >
                            <input
                              type="checkbox"
                              :checked="hasPermission(model.id, permission)"
                              @change="togglePermission(model.id, permission)"
                              class="permission-checkbox"
                              :disabled="editingUser"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div class="edit-user-actions">
                <button
                  type="button"
                  @click="cancelEditUser"
                  class="cancel-edit-btn"
                  :disabled="editingUser"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="save-edit-btn"
                  :disabled="
                    !editUserData.username || editingUser || userToEdit?.userName === 'admin'
                  "
                >
                  {{ editingUser ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
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
import { getApiUrl, getAuthHeaders } from '@/config/api'
import type {
  UserDto,
  GetUsersResponse,
  GetUserResponse,
  CreateUserRequest,
  CreateUserResponse,
  UserModelPermissionDto,
  GetUserModelPermissionsResponse,
  ModelPermission,
  ModelDto,
  ModelsResponse,
  UpdateUserRequest,
  UpdateUserModelPermissionDto,
  UserResetPasswordResponse,
} from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const authStore = useAuthStore()

const users = ref<UserDto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showAddUser = ref(false)
const addingUser = ref(false)
const addUserError = ref<string | null>(null)
const newUser = ref({
  name: '',
  surname: '',
  username: '',
  canCreateModels: false,
  adminUser: false,
})
const showEditUser = ref(false)
const editingUser = ref(false)
const editUserError = ref<string | null>(null)
const userToEdit = ref<UserDto | null>(null)
const editUserData = ref({
  name: '',
  surname: '',
  username: '',
  canCreateModels: false,
  adminUser: false,
  mustChangePassword: false,
})
const loadingPermissions = ref(false)
const permissionsError = ref<string | null>(null)
const userModelPermissions = ref<UserModelPermissionDto[]>([])
const permissionsByModel = ref<Record<string, ModelPermission[]>>({})
const allModels = ref<ModelDto[]>([])
const loadingModels = ref(false)
const modelsError = ref<string | null>(null)
const showPasswordDisplay = ref(false)
const newUserPassword = ref<CreateUserResponse | null>(null)
const showResetPasswordDisplay = ref(false)
const resetUserPassword = ref<{ username: string; newPassword: string } | null>(null)

const fetchUsers = async () => {
  loading.value = true
  error.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(getApiUrl('/admin/users'), {
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

    const data: GetUsersResponse = await response.json()
    users.value = data.users
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch users'
    console.error('Error fetching users:', err)
  } finally {
    loading.value = false
  }
}

const addUser = () => {
  // Reset form and show add user container
  newUser.value = {
    name: '',
    surname: '',
    username: '',
    canCreateModels: false,
    adminUser: false,
  }
  addUserError.value = null
  showAddUser.value = true
}

const cancelAddUser = () => {
  showAddUser.value = false
  newUser.value = {
    name: '',
    surname: '',
    username: '',
    canCreateModels: false,
    adminUser: false,
  }
  addUserError.value = null
}

const closePasswordDisplay = () => {
  showPasswordDisplay.value = false
  newUserPassword.value = null
}

const closeResetPasswordDisplay = () => {
  showResetPasswordDisplay.value = false
  resetUserPassword.value = null
}

const createUser = async () => {
  if (!newUser.value.username) {
    return
  }

  addingUser.value = true
  addUserError.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    // Prepare the user data according to CreateUserRequest structure
    const userData: CreateUserRequest = {
      name: newUser.value.name,
      surname: newUser.value.surname,
      username: newUser.value.username,
      canCreateModels: newUser.value.canCreateModels,
      adminUser: newUser.value.adminUser,
    }

    const response = await fetch(getApiUrl('/admin/users'), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(userData),
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
            throw new Error(errorData.message)
          }
        } catch (parseError) {
          // If JSON parsing failed, fall back to default error
          if (parseError instanceof SyntaxError) {
            console.error('Error parsing 500 response JSON:', parseError)
          } else {
            // This is our intended error message, re-throw it
            throw parseError
          }
        }
      }

      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const responseData: CreateUserResponse = await response.json()

    // Store the password response and show password display
    newUserPassword.value = responseData
    showPasswordDisplay.value = true

    // Reset add user form state
    showAddUser.value = false
    newUser.value = {
      name: '',
      surname: '',
      username: '',
      canCreateModels: false,
      adminUser: false,
    }

    // Reload users data to reflect changes
    await fetchUsers()
  } catch (err) {
    addUserError.value = err instanceof Error ? err.message : 'Failed to create user'
    console.error('Error creating user:', err)
  } finally {
    addingUser.value = false
  }
}

const fetchUserDetails = async (userId: string): Promise<GetUserResponse | null> => {
  try {
    const token = authStore.getAuthToken()
    if (!token) {
      authStore.logout()
      router.push('/')
      return null
    }

    const response = await fetch(getApiUrl(`/admin/user/${userId}`), {
      method: 'GET',
      headers: getAuthHeaders(token),
    })

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (err) {
    console.error('Failed to fetch user details:', err)
    editUserError.value = err instanceof Error ? err.message : 'Failed to fetch user details'
    return null
  }
}

const editUser = async (user: UserDto) => {
  console.log('Edit user clicked:', user)

  // Reset form state first
  userToEdit.value = user
  editUserError.value = null
  permissionsError.value = null
  modelsError.value = null
  showEditUser.value = true

  console.log('showEditUser set to:', showEditUser.value)

  // Fetch detailed user information from backend
  const userDetails = await fetchUserDetails(user.userId)

  if (userDetails) {
    // Populate form with detailed user data from backend
    editUserData.value = {
      name: userDetails.name,
      surname: userDetails.surname,
      username: userDetails.userName,
      canCreateModels: userDetails.canCreateModels,
      adminUser: userDetails.adminUser,
      mustChangePassword: userDetails.mustChangePassword,
    }

    // Fetch both models and user permissions simultaneously
    await Promise.all([fetchAllModels(), fetchUserModelPermissions(user.userId)])
  }
}

const cancelEditUser = () => {
  showEditUser.value = false
  userToEdit.value = null
  editUserData.value = {
    name: '',
    surname: '',
    username: '',
    canCreateModels: false,
    adminUser: false,
    mustChangePassword: false,
  }
  editUserError.value = null
  permissionsError.value = null
  modelsError.value = null
  userModelPermissions.value = []
  permissionsByModel.value = {}
  allModels.value = []
}

const resetPassword = async () => {
  if (!userToEdit.value) {
    return
  }

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(
      getApiUrl(`/admin/user/reset-password/${userToEdit.value.userId}`),
      {
        method: 'GET',
        headers: getAuthHeaders(token),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to reset password: ${errorText}`)
    }

    const responseData: UserResetPasswordResponse = await response.json()

    // Store the password reset response and show password display
    resetUserPassword.value = {
      username: userToEdit.value.userName,
      newPassword: responseData.newPassword,
    }
    showResetPasswordDisplay.value = true

    console.log('Password reset successful for user:', userToEdit.value.userName)
  } catch (err) {
    console.error('Error resetting password:', err)
    editUserError.value = err instanceof Error ? err.message : 'Failed to reset password'
  }
}

const fetchAllModels = async () => {
  loadingModels.value = true
  modelsError.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(getApiUrl('/v1/models'), {
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

    const data: ModelsResponse = await response.json()
    allModels.value = data.models

    console.log('All models loaded:', data.models)
  } catch (err) {
    modelsError.value = err instanceof Error ? err.message : 'Failed to fetch models'
    console.error('Error fetching models:', err)
  } finally {
    loadingModels.value = false
  }
}

const fetchUserModelPermissions = async (userId: string) => {
  loadingPermissions.value = true
  permissionsError.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const response = await fetch(getApiUrl(`/admin/user/model-permissions/${userId}`), {
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

    const data: GetUserModelPermissionsResponse = await response.json()
    userModelPermissions.value = data.userModelPermissions

    // Group permissions by model
    const grouped: Record<string, ModelPermission[]> = {}
    data.userModelPermissions.forEach((perm) => {
      if (!grouped[perm.modelId]) {
        grouped[perm.modelId] = []
      }
      grouped[perm.modelId].push(perm.permission)
    })
    permissionsByModel.value = grouped

    console.log('Permissions loaded:', data.userModelPermissions)
  } catch (err) {
    permissionsError.value = err instanceof Error ? err.message : 'Failed to fetch user permissions'
    console.error('Error fetching user permissions:', err)
  } finally {
    loadingPermissions.value = false
  }
}

const getUniqueModels = () => {
  // Return all models from the models API, not just those with permissions
  return allModels.value.map((model) => ({
    id: model.id,
    name: model.name,
    description: model.description,
  }))
}

const getAllPermissions = () => {
  return ['VIEW_RECORDS', 'ADD_RECORDS', 'EDIT_RECORDS', 'DELETE_RECORDS']
}

const hasPermission = (modelId: string, permission: string) => {
  return permissionsByModel.value[modelId]?.includes(permission as ModelPermission) || false
}

const togglePermission = (modelId: string, permission: string) => {
  if (!permissionsByModel.value[modelId]) {
    permissionsByModel.value[modelId] = []
  }

  const permissions = permissionsByModel.value[modelId]
  const permissionEnum = permission as ModelPermission
  const currentIndex = permissions.indexOf(permissionEnum)

  if (currentIndex > -1) {
    // Remove permission
    permissions.splice(currentIndex, 1)
    console.log(`Removed ${permission} for model ${modelId}`)
  } else {
    // Add permission
    permissions.push(permissionEnum)
    console.log(`Added ${permission} for model ${modelId}`)
  }

  console.log('Updated permissions:', permissionsByModel.value)
}

const saveUser = async () => {
  if (!editUserData.value.username || !userToEdit.value) {
    return
  }

  editingUser.value = true
  editUserError.value = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    // Transform permissions data for API request
    const permissions: UpdateUserModelPermissionDto[] = []

    Object.keys(permissionsByModel.value).forEach((modelId) => {
      const modelPermissions = permissionsByModel.value[modelId]
      modelPermissions.forEach((permission) => {
        permissions.push({
          modelId: modelId,
          permission: permission,
        })
      })
    })

    // Prepare the update user request
    const updateUserRequest: UpdateUserRequest = {
      userId: userToEdit.value.userId,
      name: editUserData.value.name || undefined,
      surname: editUserData.value.surname || undefined,
      username: editUserData.value.username,
      adminUser: editUserData.value.adminUser,
      canCreateModels: editUserData.value.canCreateModels,
      mustChangePassword: editUserData.value.mustChangePassword,
      permissions: permissions,
    }

    console.log('Saving user with data:', updateUserRequest)

    const response = await fetch(getApiUrl('/admin/user/model-permissions'), {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateUserRequest),
    })

    if (!response.ok) {
      if (response.status === 401) {
        authStore.logout()
        router.push('/')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('User saved successfully')

    // Reset form state and close edit container
    showEditUser.value = false
    userToEdit.value = null
    editUserData.value = {
      name: '',
      surname: '',
      username: '',
      canCreateModels: false,
      adminUser: false,
    }
    editUserError.value = null
    permissionsError.value = null
    modelsError.value = null
    userModelPermissions.value = []
    permissionsByModel.value = {}
    allModels.value = []

    // Reload users data to reflect changes
    await fetchUsers()
  } catch (err) {
    editUserError.value = err instanceof Error ? err.message : 'Failed to save user'
    console.error('Error saving user:', err)
  } finally {
    editingUser.value = false
  }
}

onMounted(() => {
  // Redirect if not authenticated
  const token = authStore.getAuthToken()
  if (!token) {
    router.push('/')
    return
  }

  fetchUsers()
})
</script>

<style scoped>
.user-admin {
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

.users-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
}

.no-users {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  font-style: italic;
}

.users-table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.users-table th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.users-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  color: #495057;
  vertical-align: middle;
}

.users-table tr:last-child td {
  border-bottom: none;
}

.users-table tr:hover {
  background-color: #f8f9fa;
}

.user-name,
.user-surname,
.user-username {
  font-weight: 500;
  color: #2c3e50;
}

.user-admin-cell,
.user-can-create {
  text-align: center;
  width: auto;
  background-color: inherit;
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
  transition:
    background-color 0.2s,
    transform 0.1s;
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

.action-btn:active {
  transform: translateY(0);
}

.actions-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2rem;
}

.add-user-btn {
  background-color: #28a745;
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

.add-user-btn:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.add-user-btn:active {
  transform: translateY(0);
}

.add-user-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
  border-left: 4px solid #28a745;
}

.add-user-content {
  padding: 2rem;
}

.add-user-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.add-user-header h3 {
  color: #28a745;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.add-user-form {
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

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #28a745;
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}

.form-input:disabled {
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

.add-user-actions {
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
  transition:
    background-color 0.2s,
    transform 0.1s,
    opacity 0.2s;
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

.password-display-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
  border-left: 4px solid #28a745;
}

.password-display-content {
  padding: 2rem;
}

.password-display-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.password-display-header h3 {
  color: #28a745;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.password-display-body {
  margin-bottom: 2rem;
}

.password-info {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.password-message {
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.credentials-box {
  background-color: #f8f9fa;
  border: 2px solid #28a745;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: left;
}

.credential-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
}

.credential-row:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.credential-label {
  font-weight: 600;
  color: #495057;
  font-size: 1rem;
}

.credential-value {
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  color: #2c3e50;
  background-color: #ffffff;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #ced4da;
}

.password-value {
  background-color: #fff3cd;
  color: #856404;
  font-weight: bold;
  border-color: #ffeaa7;
}

.password-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 1rem;
  color: #856404;
  font-size: 0.9rem;
  margin-top: 1.5rem;
  text-align: left;
}

.password-display-actions {
  display: flex;
  justify-content: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.password-ok-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition:
    background-color 0.2s,
    transform 0.1s;
  min-width: 100px;
}

.password-ok-btn:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.password-ok-btn:active {
  transform: translateY(0);
}

.edit-user-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
  margin-bottom: 2rem;
  border-left: 4px solid #007bff;
}

.edit-user-content {
  padding: 2rem;
}

.edit-user-header {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.edit-user-header h3 {
  color: #007bff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.reset-password-btn {
  background-color: #ffc107;
  color: #212529;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition:
    background-color 0.2s,
    transform 0.1s,
    opacity 0.2s;
  min-width: 120px;
  position: absolute;
  right: 0;
}

.reset-password-btn:hover:not(:disabled) {
  background-color: #e0a800;
  transform: translateY(-1px);
}

.reset-password-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.reset-password-btn:active {
  transform: translateY(0);
}

.edit-user-form {
  max-width: 800px;
  margin: 0 auto;
}

.permissions-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.permissions-title {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
}

.loading-permissions {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.no-permissions {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.permissions-table-wrapper {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: hidden;
  margin-top: 1rem;
}

.permissions-table-container {
  overflow: auto;
  position: relative;
  max-height: 400px;
}

.permissions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  background: white;
}

.permissions-table th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  padding: 0.75rem 0.5rem;
  text-align: center;
  border-bottom: 2px solid #dee2e6;
  border-right: 1px solid #dee2e6;
  white-space: nowrap;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 8;
}

.permissions-table th:last-child {
  border-right: none;
}

.model-header {
  background-color: #e3f2fd !important;
  color: #1976d2 !important;
  text-align: left !important;
  min-width: 200px;
  font-size: 0.85rem !important;
  text-transform: none !important;
  position: sticky;
  left: 0;
  top: 0;
  z-index: 12;
}

.permission-header {
  min-width: 80px;
}

.permissions-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #dee2e6;
  border-right: 1px solid #dee2e6;
  vertical-align: middle;
}

.permissions-table td:last-child {
  border-right: none;
}

.permissions-table tr:last-child td {
  border-bottom: none;
}

.permissions-table tr:hover {
  background-color: #f8f9fa;
}

.model-cell {
  background-color: #fafafa;
  border-right: 2px solid #dee2e6 !important;
  position: sticky;
  left: 0;
  z-index: 5;
}

.model-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.model-info strong {
  color: #2c3e50;
  font-size: 0.9rem;
}

.model-info small {
  color: #6c757d;
  font-size: 0.75rem;
  line-height: 1.2;
}

.permission-cell {
  text-align: center;
}

.permission-checkbox {
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
}

.permission-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.permission-checkbox:not(:disabled) {
  cursor: pointer;
}

.permission-checkbox:not(:disabled):hover {
  transform: scale(1.1);
  transition: transform 0.1s ease;
}

.edit-user-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.cancel-edit-btn,
.save-edit-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.1s,
    opacity 0.2s;
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

.save-edit-btn {
  background-color: #007bff;
  color: white;
}

.save-edit-btn:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.cancel-edit-btn:disabled,
.save-edit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-edit-btn:active,
.save-edit-btn:active {
  transform: translateY(0);
}
</style>
