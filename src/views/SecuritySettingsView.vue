<template>
  <div class="security-settings">
    <AppNavigation />
    <PageHeader
      title="Security Settings"
      description="Configure password requirements and security policies for your organization."
    />

    <div class="content">
      <div class="settings-container">
        <!-- Preset Templates -->
        <div class="section preset-section">
          <h3>Security Presets</h3>
          <p class="section-description">Quick configuration presets for common security levels</p>
          <div class="preset-buttons">
            <button @click="applyPreset('low')" class="preset-btn">Low Security</button>
            <button @click="applyPreset('standard')" class="preset-btn">Standard Security</button>
            <button @click="applyPreset('high')" class="preset-btn">High Security</button>
            <button @click="applyPreset('custom')" class="preset-btn active">Custom</button>
          </div>
        </div>

        <!-- Length & Complexity -->
        <div class="section">
          <h3>Length & Complexity</h3>
          <p class="section-description">Configure character requirements for passwords</p>

          <div class="form-group">
            <label class="form-label">
              Minimum Password Length: {{ settings.minLength }} characters
            </label>
            <input
              v-model.number="settings.minLength"
              type="range"
              min="8"
              max="32"
              class="slider"
            />
            <div class="slider-labels">
              <span>8</span>
              <span>32</span>
            </div>
          </div>

          <div class="form-group-row">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="settings.requireUppercase" type="checkbox" />
                Require uppercase letters
              </label>
            </div>
            <div v-if="settings.requireUppercase" class="count-input">
              <label>Minimum count:</label>
              <input
                v-model.number="settings.minUppercase"
                type="number"
                min="1"
                max="10"
                class="count-field"
              />
            </div>
          </div>

          <div class="form-group-row">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="settings.requireLowercase" type="checkbox" />
                Require lowercase letters
              </label>
            </div>
            <div v-if="settings.requireLowercase" class="count-input">
              <label>Minimum count:</label>
              <input
                v-model.number="settings.minLowercase"
                type="number"
                min="1"
                max="10"
                class="count-field"
              />
            </div>
          </div>

          <div class="form-group-row">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="settings.requireNumbers" type="checkbox" />
                Require numbers
              </label>
            </div>
            <div v-if="settings.requireNumbers" class="count-input">
              <label>Minimum count:</label>
              <input
                v-model.number="settings.minNumbers"
                type="number"
                min="1"
                max="10"
                class="count-field"
              />
            </div>
          </div>

          <div class="form-group-row">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="settings.requireSpecialChars" type="checkbox" />
                Require special characters
              </label>
            </div>
            <div v-if="settings.requireSpecialChars" class="count-input">
              <label>Minimum count:</label>
              <input
                v-model.number="settings.minSpecialChars"
                type="number"
                min="1"
                max="10"
                class="count-field"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Allowed Special Characters</label>
            <input
              v-model="settings.allowedSpecialChars"
              type="text"
              class="form-input"
              placeholder="!@#$%^&*()_+-=[]{}|;:,.<>?"
            />
            <p class="field-hint">Define which special characters are acceptable</p>
          </div>
        </div>

        <!-- Security Rules -->
        <div class="section">
          <h3>Security Rules</h3>
          <p class="section-description">Advanced password security validation rules</p>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input v-model="settings.blockCommonPasswords" type="checkbox" />
              Block common passwords
            </label>
            <p class="checkbox-hint">
              Prevents use of weak passwords like "password123"
            </p>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input v-model="settings.blockDictionaryWords" type="checkbox" />
              Block dictionary words
            </label>
            <p class="checkbox-hint">Prevents use of common dictionary words</p>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input v-model="settings.preventUsernameInPassword" type="checkbox" />
              Prevent username in password
            </label>
            <p class="checkbox-hint">Username cannot be part of the password</p>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input v-model="settings.preventPersonalInfo" type="checkbox" />
              Prevent personal information
            </label>
            <p class="checkbox-hint">Blocks user's name and email prefix in password</p>
          </div>

          <div class="form-group">
            <label class="form-label">Required Password Strength</label>
            <select v-model="settings.requiredStrength" class="form-select">
              <option value="weak">Weak</option>
              <option value="fair">Fair</option>
              <option value="good">Good</option>
              <option value="strong">Strong</option>
              <option value="very-strong">Very Strong</option>
            </select>
          </div>
        </div>

        <!-- Password History & Rotation -->
        <div class="section">
          <h3>Password History & Rotation</h3>
          <p class="section-description">Manage password expiration and reuse policies</p>

          <div class="form-group-row">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="settings.enablePasswordExpiration" type="checkbox" />
                Password expiration
              </label>
            </div>
            <div v-if="settings.enablePasswordExpiration" class="count-input">
              <label>Expires after (days):</label>
              <input
                v-model.number="settings.passwordExpirationDays"
                type="number"
                min="1"
                max="365"
                class="count-field"
              />
            </div>
          </div>

          <div class="form-group-row">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="settings.rememberPasswordHistory" type="checkbox" />
                Remember previous passwords
              </label>
            </div>
            <div v-if="settings.rememberPasswordHistory" class="count-input">
              <label>Remember last:</label>
              <input
                v-model.number="settings.passwordHistoryCount"
                type="number"
                min="1"
                max="24"
                class="count-field"
              />
              <span class="count-suffix">passwords</span>
            </div>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input v-model="settings.forceChangeOnFirstLogin" type="checkbox" />
              Force password change on first login
            </label>
            <p class="checkbox-hint">Users must change password when logging in for the first time</p>
          </div>

          <div class="form-group-row">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="settings.warnBeforeExpiration" type="checkbox" />
                Warn before expiration
              </label>
            </div>
            <div v-if="settings.warnBeforeExpiration" class="count-input">
              <label>Warn (days before):</label>
              <input
                v-model.number="settings.warnDaysBeforeExpiration"
                type="number"
                min="1"
                max="30"
                class="count-field"
              />
            </div>
          </div>
        </div>

        <!-- Account Security -->
        <div class="section">
          <h3>Account Security</h3>
          <p class="section-description">Configure login and session security settings</p>

          <div class="form-group">
            <label class="form-label">Maximum Login Attempts</label>
            <input
              v-model.number="settings.maxLoginAttempts"
              type="number"
              min="3"
              max="10"
              class="form-input small"
            />
            <p class="field-hint">Number of failed attempts before account lockout</p>
          </div>

          <div class="form-group">
            <label class="form-label">Lockout Duration (minutes)</label>
            <input
              v-model.number="settings.lockoutDuration"
              type="number"
              min="5"
              max="120"
              class="form-input small"
            />
            <p class="field-hint">How long account remains locked after max attempts</p>
          </div>

          <div class="form-group">
            <label class="form-label">Session Timeout (minutes)</label>
            <input
              v-model.number="settings.sessionTimeout"
              type="number"
              min="5"
              max="480"
              class="form-input small"
            />
            <p class="field-hint">Minutes of inactivity before automatic logout</p>
          </div>

          <div class="form-group">
            <label class="form-label">Require 2FA (Two-Factor Authentication)</label>
            <select v-model="settings.require2FA" class="form-select">
              <option value="optional">Optional</option>
              <option value="required">Required for all users</option>
              <option value="admin-only">Required for admins only</option>
            </select>
          </div>
        </div>

        <!-- User Experience -->
        <div class="section">
          <h3>User Experience</h3>
          <p class="section-description">Configure how password requirements are displayed to users</p>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input v-model="settings.showPasswordStrengthMeter" type="checkbox" />
              Show password strength meter
            </label>
            <p class="checkbox-hint">Visual indicator of password strength during entry</p>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input v-model="settings.showPasswordRequirements" type="checkbox" />
              Show password requirements on form
            </label>
            <p class="checkbox-hint">Display list of requirements below password field</p>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input v-model="settings.allowShowPassword" type="checkbox" />
              Allow "Show Password" toggle
            </label>
            <p class="checkbox-hint">Users can toggle password visibility</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="actions">
          <button @click="saveSettings" class="btn btn-primary">Save Settings</button>
          <button @click="resetToDefaults" class="btn btn-secondary">Reset to Defaults</button>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

interface PasswordSettings {
  // Length & Complexity
  minLength: number
  requireUppercase: boolean
  minUppercase: number
  requireLowercase: boolean
  minLowercase: number
  requireNumbers: boolean
  minNumbers: number
  requireSpecialChars: boolean
  minSpecialChars: number
  allowedSpecialChars: string

  // Security Rules
  blockCommonPasswords: boolean
  blockDictionaryWords: boolean
  preventUsernameInPassword: boolean
  preventPersonalInfo: boolean
  requiredStrength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'

  // Password History & Rotation
  enablePasswordExpiration: boolean
  passwordExpirationDays: number
  rememberPasswordHistory: boolean
  passwordHistoryCount: number
  forceChangeOnFirstLogin: boolean
  warnBeforeExpiration: boolean
  warnDaysBeforeExpiration: number

  // Account Security
  maxLoginAttempts: number
  lockoutDuration: number
  sessionTimeout: number
  require2FA: 'optional' | 'required' | 'admin-only'

  // User Experience
  showPasswordStrengthMeter: boolean
  showPasswordRequirements: boolean
  allowShowPassword: boolean
}

const successMessage = ref('')
const errorMessage = ref('')

// Default settings (Standard Security preset)
const getDefaultSettings = (): PasswordSettings => ({
  minLength: 12,
  requireUppercase: true,
  minUppercase: 1,
  requireLowercase: true,
  minLowercase: 1,
  requireNumbers: true,
  minNumbers: 1,
  requireSpecialChars: true,
  minSpecialChars: 1,
  allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  blockCommonPasswords: true,
  blockDictionaryWords: false,
  preventUsernameInPassword: true,
  preventPersonalInfo: false,
  requiredStrength: 'good',
  enablePasswordExpiration: false,
  passwordExpirationDays: 90,
  rememberPasswordHistory: false,
  passwordHistoryCount: 5,
  forceChangeOnFirstLogin: false,
  warnBeforeExpiration: false,
  warnDaysBeforeExpiration: 7,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
  sessionTimeout: 60,
  require2FA: 'optional',
  showPasswordStrengthMeter: true,
  showPasswordRequirements: true,
  allowShowPassword: true,
})

const settings = reactive<PasswordSettings>(getDefaultSettings())

// Preset configurations
const applyPreset = (preset: string) => {
  clearMessages()

  switch (preset) {
    case 'low':
      Object.assign(settings, {
        minLength: 8,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: false,
        requireSpecialChars: false,
        blockCommonPasswords: false,
        blockDictionaryWords: false,
        preventUsernameInPassword: false,
        preventPersonalInfo: false,
        requiredStrength: 'weak',
        enablePasswordExpiration: false,
        rememberPasswordHistory: false,
        forceChangeOnFirstLogin: false,
        warnBeforeExpiration: false,
        maxLoginAttempts: 10,
        lockoutDuration: 5,
        sessionTimeout: 120,
        require2FA: 'optional',
      })
      break

    case 'standard':
      Object.assign(settings, getDefaultSettings())
      break

    case 'high':
      Object.assign(settings, {
        minLength: 16,
        requireUppercase: true,
        minUppercase: 2,
        requireLowercase: true,
        minLowercase: 2,
        requireNumbers: true,
        minNumbers: 2,
        requireSpecialChars: true,
        minSpecialChars: 2,
        blockCommonPasswords: true,
        blockDictionaryWords: true,
        preventUsernameInPassword: true,
        preventPersonalInfo: true,
        requiredStrength: 'very-strong',
        enablePasswordExpiration: true,
        passwordExpirationDays: 90,
        rememberPasswordHistory: true,
        passwordHistoryCount: 10,
        forceChangeOnFirstLogin: true,
        warnBeforeExpiration: true,
        warnDaysBeforeExpiration: 14,
        maxLoginAttempts: 3,
        lockoutDuration: 30,
        sessionTimeout: 30,
        require2FA: 'admin-only',
      })
      break
  }
}

const saveSettings = async () => {
  clearMessages()

  try {
    // TODO: API call to save settings
    // await fetch(getApiUrl('/api/password-settings'), {
    //   method: 'POST',
    //   headers: getAuthHeaders(),
    //   body: JSON.stringify(settings)
    // })

    successMessage.value = 'Password settings saved successfully!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to save settings'
    console.error('Error saving password settings:', err)
  }
}

const resetToDefaults = () => {
  clearMessages()
  Object.assign(settings, getDefaultSettings())
  successMessage.value = 'Settings reset to defaults'
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

const clearMessages = () => {
  successMessage.value = ''
  errorMessage.value = ''
}

// TODO: Fetch settings from API on component mount
// onMounted(async () => {
//   try {
//     const response = await fetch(getApiUrl('/api/password-settings'), {
//       headers: getAuthHeaders()
//     })
//     const data = await response.json()
//     Object.assign(settings, data)
//   } catch (err) {
//     console.error('Error fetching password settings:', err)
//   }
// })
</script>

<style scoped>
.security-settings {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.content {
  margin-top: 100px;
  padding: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.settings-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.section:last-of-type {
  border-bottom: none;
}

.section h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.section-description {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.preset-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  border: none;
}

.preset-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: #3498db;
  background: #f0f8ff;
}

.preset-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group-row {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-input.small {
  width: 150px;
}

.form-select {
  width: 100%;
  max-width: 300px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: none;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}

.checkbox-group {
  flex: 1;
  min-width: 250px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #333;
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-hint {
  margin: 0.25rem 0 0 1.75rem;
  font-size: 0.85rem;
  color: #666;
}

.count-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count-input label {
  font-size: 0.9rem;
  color: #666;
}

.count-field {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.count-suffix {
  font-size: 0.9rem;
  color: #666;
}

.field-hint {
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #666;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.success-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .content {
    padding: 1rem;
    margin-top: 80px;
  }

  .settings-container {
    padding: 1rem;
  }

  .form-group-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .preset-buttons {
    flex-direction: column;
  }

  .preset-btn {
    width: 100%;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
