<template>
  <div class="view-record">
    <AppNavigation />
    
    <PageHeader
      title="View Record"
      :description="model ? model.name : 'View record details'"
    />
    
    <div class="content">
      <div v-if="loadingModel || loadingRecord" class="loading">
        <p>Loading record...</p>
      </div>
      
      <div v-else-if="modelError || recordError" class="error-message">
        <p>Error: {{ modelError || recordError }}</p>
        <button @click="loadData" class="retry-btn">Retry</button>
      </div>
      
      <div v-else class="record-form">
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

        <!-- Field values -->
        <div v-for="field in model?.fields" :key="field.id" class="field-group">
          <label class="field-label">
            {{ field.name }}
            <span v-if="field.description" class="field-description">{{ field.description }}</span>
          </label>
          
          <!-- Single Line Text -->
          <div
            v-if="field.type === 'SINGLE_LINE_TEXT'"
            class="field-value"
          >
            {{ record?.fieldValues[field.id] || '-' }}
          </div>
          
          <!-- Multi Line Text -->
          <div
            v-else-if="field.type === 'MULTI_LINE_TEXT'"
            class="field-value field-value-multiline"
          >
            {{ record?.fieldValues[field.id] || '-' }}
          </div>
          
          <!-- Email -->
          <div
            v-else-if="field.type === 'EMAIL'"
            class="field-value"
          >
            <a v-if="record?.fieldValues[field.id]" :href="`mailto:${record.fieldValues[field.id]}`" class="email-link">
              {{ record.fieldValues[field.id] }}
            </a>
            <span v-else>-</span>
          </div>
          
          <!-- Decimal -->
          <div
            v-else-if="field.type === 'DECIMAL'"
            class="field-value"
          >
            {{ record?.fieldValues[field.id] != null ? Number(record.fieldValues[field.id]).toLocaleString() : '-' }}
          </div>
          
          <!-- Long (Integer) -->
          <div
            v-else-if="field.type === 'LONG'"
            class="field-value"
          >
            {{ record?.fieldValues[field.id] != null ? Number(record.fieldValues[field.id]).toLocaleString() : '-' }}
          </div>
          
          <!-- Boolean -->
          <div
            v-else-if="field.type === 'BOOLEAN'"
            class="field-value"
          >
            <span
              v-if="record?.fieldValues[field.id] !== null && record?.fieldValues[field.id] !== undefined"
              class="boolean-value"
              :class="{ 'boolean-true': record?.fieldValues[field.id], 'boolean-false': !record?.fieldValues[field.id] }"
            >
              {{ record?.fieldValues[field.id] ? 'Yes' : 'No' }}
            </span>
            <span v-else class="boolean-null">-</span>
          </div>
          
          <!-- Date -->
          <div
            v-else-if="field.type === 'DATE'"
            class="field-value"
          >
            {{ record?.fieldValues[field.id] ? formatDate(record.fieldValues[field.id], 'date') : '-' }}
          </div>
          
          <!-- DateTime -->
          <div
            v-else-if="field.type === 'DATETIME'"
            class="field-value"
          >
            {{ record?.fieldValues[field.id] ? formatDate(record.fieldValues[field.id]) : '-' }}
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="goBack" class="back-btn">
            Back to Records
          </button>
          <button type="button" @click="navigateToEdit" class="edit-btn">
            Edit Record
          </button>
          <button type="button" @click="showDeleteRecordConfirmation" class="delete-btn">
            Delete Record
          </button>
        </div>
      </div>

      <!-- Link to Other Records Section -->
      <div v-if="modelLinkTargets && modelLinkTargets.length > 0" class="linking-section-fullwidth">
          <h4>Linked Records</h4>

          <div v-for="linkTarget in modelLinkTargets" :key="linkTarget.modelLinkId" class="link-target">
            <div class="link-target-header">
              <h5>{{ linkTarget.targetModelName }}</h5>
              <div class="header-actions">
                <button
                  v-if="getLinkedCount(linkTarget.targetModelId) > 0"
                  @click="toggleLinkedSearch(linkTarget.modelLinkId)"
                  class="search-toggle-btn linked-search-btn"
                  :class="{ active: showLinkedSearch[linkTarget.modelLinkId] }"
                >
                  <span class="search-icon">🔍</span>
                  {{ showLinkedSearch[linkTarget.modelLinkId] ? 'Clear Search' : 'Search' }}
                </button>
                <div class="target-info">
                  <span class="linked-count-badge" v-if="getLinkedCount(linkTarget.targetModelId) > 0">
                    {{ getLinkedCount(linkTarget.targetModelId) }} linked
                  </span>
                  <span class="link-constraints">
                    <span v-if="linkTarget.can_have_unlimited_targets">Unlimited links allowed</span>
                    <span v-else>Maximum {{ linkTarget.can_have_targets_count }} links allowed</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Linked Records Table -->
            <div v-if="getLinkedCount(linkTarget.targetModelId) > 0" class="linked-records-container">
              <div v-if="loadingLinkedRecords[linkTarget.modelLinkId]" class="loading">
                <p>Loading linked records...</p>
              </div>

              <div v-else-if="linkedRecordsError[linkTarget.modelLinkId]" class="error-message">
                <p>Error loading linked records: {{ linkedRecordsError[linkTarget.modelLinkId] }}</p>
                <button @click="fetchLinkedRecords(linkTarget)" class="retry-btn">Retry</button>
              </div>

              <div v-else-if="linkedRecords[linkTarget.modelLinkId] && (linkedRecords[linkTarget.modelLinkId].length > 0 || showLinkedSearch[linkTarget.modelLinkId])" class="records-container">
                <div class="records-table-container">
                  <table class="records-table">
                    <thead>
                      <tr>
                        <th
                          v-for="field in linkedRecordsData[linkTarget.modelLinkId]?.fields"
                          :key="field.id"
                          @click="handleLinkedSort(linkTarget.modelLinkId, field.id)"
                          class="sortable-header"
                        >
                          <div class="header-content">
                            <span>{{ field.name }}</span>
                            <span class="sort-indicator">
                              <span
                                v-if="linkedSortField[linkTarget.modelLinkId] === field.id && linkedSortOrder[linkTarget.modelLinkId] === 'asc'"
                                class="sort-arrow"
                                >↑</span
                              >
                              <span
                                v-else-if="linkedSortField[linkTarget.modelLinkId] === field.id && linkedSortOrder[linkTarget.modelLinkId] === 'desc'"
                                class="sort-arrow"
                                >↓</span
                              >
                              <span v-else class="sort-arrow-placeholder">↕</span>
                            </span>
                          </div>
                        </th>
                        <th @click="handleLinkedSort(linkTarget.modelLinkId, 'created_at')" class="sortable-header">
                          <div class="header-content">
                            <span>Created</span>
                            <span class="sort-indicator">
                              <span
                                v-if="linkedSortField[linkTarget.modelLinkId] === 'created_at' && linkedSortOrder[linkTarget.modelLinkId] === 'asc'"
                                class="sort-arrow"
                                >↑</span
                              >
                              <span
                                v-else-if="linkedSortField[linkTarget.modelLinkId] === 'created_at' && linkedSortOrder[linkTarget.modelLinkId] === 'desc'"
                                class="sort-arrow"
                                >↓</span
                              >
                              <span v-else class="sort-arrow-placeholder">↕</span>
                            </span>
                          </div>
                        </th>
                        <th @click="handleLinkedSort(linkTarget.modelLinkId, 'updated_at')" class="sortable-header">
                          <div class="header-content">
                            <span>Updated</span>
                            <span class="sort-indicator">
                              <span
                                v-if="linkedSortField[linkTarget.modelLinkId] === 'updated_at' && linkedSortOrder[linkTarget.modelLinkId] === 'asc'"
                                class="sort-arrow"
                                >↑</span
                              >
                              <span
                                v-else-if="linkedSortField[linkTarget.modelLinkId] === 'updated_at' && linkedSortOrder[linkTarget.modelLinkId] === 'desc'"
                                class="sort-arrow"
                                >↓</span
                              >
                              <span v-else class="sort-arrow-placeholder">↕</span>
                            </span>
                          </div>
                        </th>
                        <th class="actions-header">Actions</th>
                      </tr>

                      <!-- Search filter row -->
                      <tr v-if="showLinkedSearch[linkTarget.modelLinkId]" class="search-row">
                        <td
                          v-for="field in linkedRecordsData[linkTarget.modelLinkId]?.fields"
                          :key="`search-${field.id}`"
                          class="search-cell"
                        >
                          <div class="search-filter">
                            <!-- Filter dropdowns for different field types -->
                            <select
                              v-if="['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL'].includes(field.type)"
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator || 'all'"
                              @change="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'operator', $event.target.value)"
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

                            <select
                              v-else-if="['DECIMAL', 'LONG'].includes(field.type)"
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator || 'all'"
                              @change="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'operator', $event.target.value)"
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

                            <select
                              v-else-if="field.type === 'BOOLEAN'"
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator || 'all'"
                              @change="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'operator', $event.target.value)"
                              class="filter-select"
                            >
                              <option value="all">All values</option>
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>

                            <select
                              v-else-if="field.type === 'DATE'"
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator || 'all'"
                              @change="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'operator', $event.target.value)"
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

                            <select
                              v-else-if="field.type === 'DATETIME'"
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator || 'all'"
                              @change="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'operator', $event.target.value)"
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
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.operator || 'all'"
                              @change="updateLinkedSearchFilter(linkTarget.modelLinkId, 'created_at', 'operator', $event.target.value)"
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
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.operator || 'all'"
                              @change="updateLinkedSearchFilter(linkTarget.modelLinkId, 'updated_at', 'operator', $event.target.value)"
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

                      <!-- Search input row -->
                      <tr v-if="showLinkedSearch[linkTarget.modelLinkId] && hasActiveLinkedFilters(linkTarget.modelLinkId)" class="search-input-row">
                        <td
                          v-for="field in linkedRecordsData[linkTarget.modelLinkId]?.fields"
                          :key="`input-${field.id}`"
                          class="search-input-cell"
                        >
                          <div class="search-input-container">
                            <!-- Text field inputs -->
                            <input
                              v-if="
                                ['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL'].includes(field.type) &&
                                linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator &&
                                linkedSearchFilters[linkTarget.modelLinkId][field.id].operator !== 'all'
                              "
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                              @input="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                              type="text"
                              :placeholder="`Enter ${field.name.toLowerCase()}`"
                              class="filter-input"
                            />

                            <!-- Number field inputs -->
                            <input
                              v-else-if="
                                ['DECIMAL', 'LONG'].includes(field.type) &&
                                linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator &&
                                linkedSearchFilters[linkTarget.modelLinkId][field.id].operator !== 'all'
                              "
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                              @input="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                              type="number"
                              :step="field.type === 'DECIMAL' ? '0.01' : '1'"
                              :placeholder="`Enter ${field.name.toLowerCase()}`"
                              class="filter-input"
                            />

                            <!-- Date field inputs -->
                            <input
                              v-else-if="
                                field.type === 'DATE' &&
                                linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator &&
                                ['on', 'before', 'after'].includes(linkedSearchFilters[linkTarget.modelLinkId][field.id].operator)
                              "
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                              @input="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                              type="date"
                              class="filter-input"
                            />

                            <!-- Date between inputs -->
                            <div
                              v-else-if="
                                field.type === 'DATE' && linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator === 'between'
                              "
                              class="between-inputs"
                            >
                              <input
                                :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                                @input="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                                type="date"
                                placeholder="From"
                                class="filter-input filter-input-small"
                              />
                              <span class="between-separator">to</span>
                              <input
                                :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value2 || ''"
                                @input="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value2', $event.target.value)"
                                type="date"
                                placeholder="To"
                                class="filter-input filter-input-small"
                              />
                            </div>

                            <!-- DateTime field inputs -->
                            <input
                              v-else-if="
                                field.type === 'DATETIME' &&
                                linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator &&
                                ['before', 'after'].includes(linkedSearchFilters[linkTarget.modelLinkId][field.id].operator)
                              "
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                              @input="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                              type="datetime-local"
                              class="filter-input"
                            />

                            <!-- DateTime between inputs -->
                            <div
                              v-else-if="
                                field.type === 'DATETIME' &&
                                linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator === 'between'
                              "
                              class="between-inputs"
                            >
                              <input
                                :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                                @input="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                                type="datetime-local"
                                placeholder="From"
                                class="filter-input filter-input-small"
                              />
                              <span class="between-separator">to</span>
                              <input
                                :value="linkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value2 || ''"
                                @input="updateLinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value2', $event.target.value)"
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
                                linkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.operator &&
                                ['before', 'after'].includes(linkedSearchFilters[linkTarget.modelLinkId]['created_at'].operator)
                              "
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.value || ''"
                              @input="updateLinkedSearchFilter(linkTarget.modelLinkId, 'created_at', 'value', $event.target.value)"
                              type="datetime-local"
                              class="filter-input"
                            />
                            <div
                              v-else-if="linkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.operator === 'between'"
                              class="between-inputs"
                            >
                              <input
                                :value="linkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.value || ''"
                                @input="updateLinkedSearchFilter(linkTarget.modelLinkId, 'created_at', 'value', $event.target.value)"
                                type="datetime-local"
                                placeholder="From"
                                class="filter-input filter-input-small"
                              />
                              <span class="between-separator">to</span>
                              <input
                                :value="linkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.value2 || ''"
                                @input="updateLinkedSearchFilter(linkTarget.modelLinkId, 'created_at', 'value2', $event.target.value)"
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
                                linkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.operator &&
                                ['before', 'after'].includes(linkedSearchFilters[linkTarget.modelLinkId]['updated_at'].operator)
                              "
                              :value="linkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.value || ''"
                              @input="updateLinkedSearchFilter(linkTarget.modelLinkId, 'updated_at', 'value', $event.target.value)"
                              type="datetime-local"
                              class="filter-input"
                            />
                            <div
                              v-else-if="linkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.operator === 'between'"
                              class="between-inputs"
                            >
                              <input
                                :value="linkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.value || ''"
                                @input="updateLinkedSearchFilter(linkTarget.modelLinkId, 'updated_at', 'value', $event.target.value)"
                                type="datetime-local"
                                placeholder="From"
                                class="filter-input filter-input-small"
                              />
                              <span class="between-separator">to</span>
                              <input
                                :value="linkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.value2 || ''"
                                @input="updateLinkedSearchFilter(linkTarget.modelLinkId, 'updated_at', 'value2', $event.target.value)"
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
                            @click="handleLinkedSearch(linkTarget)"
                            :disabled="!isLinkedSearchValid(linkTarget.modelLinkId) || !hasActiveLinkedFilters(linkTarget.modelLinkId)"
                            class="action-btn search-btn"
                          >
                            Search
                          </button>
                        </td>
                      </tr>
                    </thead>

                    <tbody>
                      <!-- Empty state row when no records -->
                      <tr v-if="linkedRecords[linkTarget.modelLinkId].length === 0" class="empty-state-row">
                        <td :colspan="(linkedRecordsData[linkTarget.modelLinkId]?.fields?.length || 0) + 3" class="empty-state-cell">
                          <div class="empty-state-content">
                            <span v-if="isLinkedSearchResult[linkTarget.modelLinkId]">No Linked Records Found In Search</span>
                            <span v-else>No Linked Records Found</span>
                          </div>
                        </td>
                      </tr>

                      <tr v-for="record in linkedRecords[linkTarget.modelLinkId]" :key="record.id">
                        <td v-for="field in linkedRecordsData[linkTarget.modelLinkId]?.fields" :key="field.id" class="record-cell">
                          {{ getFieldDisplayValue(record, field) }}
                        </td>
                        <td class="record-cell">{{ formatDateTime(record.createdAt) }}</td>
                        <td class="record-cell">{{ formatDateTime(record.updatedAt) }}</td>
                        <td class="action-cell">
                          <div class="action-buttons">
                            <button @click="viewLinkedRecord(record.id, linkTarget.targetModelId)" class="action-btn view-btn">
                              View
                            </button>
                            <button
                              @click="openUnlinkDialog(record, linkTarget)"
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
                    @click="goToPreviousLinkedPage(linkTarget)"
                    :disabled="!linkedPagination[linkTarget.modelLinkId]?.hasPrevious"
                    class="pagination-btn"
                  >
                    Previous
                  </button>

                  <span class="pagination-info">
                    Showing {{ linkedRecords[linkTarget.modelLinkId].length }} of {{ (linkedPagination[linkTarget.modelLinkId]?.totalEstimate || 0).toLocaleString() }} linked records
                    <span v-if="linkedPagination[linkTarget.modelLinkId]?.actualRecordCount">
                      (Total Records: {{ linkedPagination[linkTarget.modelLinkId].actualRecordCount.toLocaleString() }})
                    </span>
                  </span>

                  <button @click="goToNextLinkedPage(linkTarget)" :disabled="!linkedPagination[linkTarget.modelLinkId]?.hasNext" class="pagination-btn">
                    Next
                  </button>
                </div>
              </div>

              <div v-else class="no-linked-records">
                <p>No linked records found</p>
              </div>
            </div>

            <div class="link-actions">
              <button @click="toggleUnlinkedRecords(linkTarget)" class="link-records-btn">
                {{ showUnlinkedRecords[linkTarget.modelLinkId] ? 'Hide Unlinked Records' : `Link ${linkTarget.targetModelName} Records` }}
              </button>
            </div>

            <!-- Unlinked Records Table -->
            <div v-if="showUnlinkedRecords[linkTarget.modelLinkId]" class="unlinked-records-container">
              <div v-if="loadingUnlinkedRecords[linkTarget.modelLinkId]" class="loading">
                <p>Loading unlinked records...</p>
              </div>

              <div v-else-if="unlinkedRecordsError[linkTarget.modelLinkId]" class="error-message">
                <p>Error loading unlinked records: {{ unlinkedRecordsError[linkTarget.modelLinkId] }}</p>
                <button @click="fetchUnlinkedRecords(linkTarget)" class="retry-btn">Retry</button>
              </div>

              <div v-else-if="unlinkedRecords[linkTarget.modelLinkId] && (unlinkedRecords[linkTarget.modelLinkId].length > 0 || showUnlinkedSearch[linkTarget.modelLinkId])" class="records-container">
                <div class="unlinked-section-header">
                  <h6 class="unlinked-title">Available {{ linkTarget.targetModelName }} Records to Link</h6>
                  <button
                    @click="toggleUnlinkedSearch(linkTarget.modelLinkId)"
                    class="search-toggle-btn unlinked-search-btn"
                    :class="{ active: showUnlinkedSearch[linkTarget.modelLinkId] }"
                  >
                    <span class="search-icon">🔍</span>
                    {{ showUnlinkedSearch[linkTarget.modelLinkId] ? 'Clear Search' : 'Search' }}
                  </button>
                </div>

                <div class="records-table-container">
                  <table class="records-table">
                    <thead>
                      <tr>
                        <th
                          v-for="field in unlinkedRecordsData[linkTarget.modelLinkId]?.fields"
                          :key="field.id"
                          @click="handleUnlinkedSort(linkTarget.modelLinkId, field.id)"
                          class="sortable-header"
                        >
                          <div class="header-content">
                            <span>{{ field.name }}</span>
                            <span class="sort-indicator">
                              <span
                                v-if="unlinkedSortField[linkTarget.modelLinkId] === field.id && unlinkedSortOrder[linkTarget.modelLinkId] === 'asc'"
                                class="sort-arrow"
                                >↑</span
                              >
                              <span
                                v-else-if="unlinkedSortField[linkTarget.modelLinkId] === field.id && unlinkedSortOrder[linkTarget.modelLinkId] === 'desc'"
                                class="sort-arrow"
                                >↓</span
                              >
                              <span v-else class="sort-arrow-placeholder">↕</span>
                            </span>
                          </div>
                        </th>
                        <th @click="handleUnlinkedSort(linkTarget.modelLinkId, 'created_at')" class="sortable-header">
                          <div class="header-content">
                            <span>Created</span>
                            <span class="sort-indicator">
                              <span
                                v-if="unlinkedSortField[linkTarget.modelLinkId] === 'created_at' && unlinkedSortOrder[linkTarget.modelLinkId] === 'asc'"
                                class="sort-arrow"
                                >↑</span
                              >
                              <span
                                v-else-if="unlinkedSortField[linkTarget.modelLinkId] === 'created_at' && unlinkedSortOrder[linkTarget.modelLinkId] === 'desc'"
                                class="sort-arrow"
                                >↓</span
                              >
                              <span v-else class="sort-arrow-placeholder">↕</span>
                            </span>
                          </div>
                        </th>
                        <th @click="handleUnlinkedSort(linkTarget.modelLinkId, 'updated_at')" class="sortable-header">
                          <div class="header-content">
                            <span>Updated</span>
                            <span class="sort-indicator">
                              <span
                                v-if="unlinkedSortField[linkTarget.modelLinkId] === 'updated_at' && unlinkedSortOrder[linkTarget.modelLinkId] === 'asc'"
                                class="sort-arrow"
                                >↑</span
                              >
                              <span
                                v-else-if="unlinkedSortField[linkTarget.modelLinkId] === 'updated_at' && unlinkedSortOrder[linkTarget.modelLinkId] === 'desc'"
                                class="sort-arrow"
                                >↓</span
                              >
                              <span v-else class="sort-arrow-placeholder">↕</span>
                            </span>
                          </div>
                        </th>
                        <th class="actions-header">Actions</th>
                      </tr>

                      <!-- Search filter row -->
                      <tr v-if="showUnlinkedSearch[linkTarget.modelLinkId]" class="search-row">
                        <td
                          v-for="field in unlinkedRecordsData[linkTarget.modelLinkId]?.fields"
                          :key="`search-${field.id}`"
                          class="search-cell"
                        >
                          <div class="search-filter">
                            <!-- Filter dropdowns for different field types -->
                            <select
                              v-if="['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL'].includes(field.type)"
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator || 'all'"
                              @change="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'operator', $event.target.value)"
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

                            <select
                              v-else-if="['DECIMAL', 'LONG'].includes(field.type)"
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator || 'all'"
                              @change="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'operator', $event.target.value)"
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

                            <select
                              v-else-if="field.type === 'BOOLEAN'"
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator || 'all'"
                              @change="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'operator', $event.target.value)"
                              class="filter-select"
                            >
                              <option value="all">All values</option>
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>

                            <select
                              v-else-if="field.type === 'DATE'"
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator || 'all'"
                              @change="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'operator', $event.target.value)"
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

                            <select
                              v-else-if="field.type === 'DATETIME'"
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator || 'all'"
                              @change="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'operator', $event.target.value)"
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
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.operator || 'all'"
                              @change="updateUnlinkedSearchFilter(linkTarget.modelLinkId, 'created_at', 'operator', $event.target.value)"
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
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.operator || 'all'"
                              @change="updateUnlinkedSearchFilter(linkTarget.modelLinkId, 'updated_at', 'operator', $event.target.value)"
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

                      <!-- Search input row -->
                      <tr v-if="showUnlinkedSearch[linkTarget.modelLinkId] && hasActiveUnlinkedFilters(linkTarget.modelLinkId)" class="search-input-row">
                        <td
                          v-for="field in unlinkedRecordsData[linkTarget.modelLinkId]?.fields"
                          :key="`input-${field.id}`"
                          class="search-input-cell"
                        >
                          <div class="search-input-container">
                            <!-- Text field inputs -->
                            <input
                              v-if="
                                ['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL'].includes(field.type) &&
                                unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator &&
                                unlinkedSearchFilters[linkTarget.modelLinkId][field.id].operator !== 'all'
                              "
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                              @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                              type="text"
                              :placeholder="`Enter ${field.name.toLowerCase()}`"
                              class="filter-input"
                            />

                            <!-- Number field inputs -->
                            <input
                              v-else-if="
                                ['DECIMAL', 'LONG'].includes(field.type) &&
                                unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator &&
                                unlinkedSearchFilters[linkTarget.modelLinkId][field.id].operator !== 'all'
                              "
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                              @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                              type="number"
                              :step="field.type === 'DECIMAL' ? '0.01' : '1'"
                              :placeholder="`Enter ${field.name.toLowerCase()}`"
                              class="filter-input"
                            />

                            <!-- Date field inputs -->
                            <input
                              v-else-if="
                                field.type === 'DATE' &&
                                unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator &&
                                ['on', 'before', 'after'].includes(unlinkedSearchFilters[linkTarget.modelLinkId][field.id].operator)
                              "
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                              @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                              type="date"
                              class="filter-input"
                            />

                            <!-- Date between inputs -->
                            <div
                              v-else-if="
                                field.type === 'DATE' && unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator === 'between'
                              "
                              class="between-inputs"
                            >
                              <input
                                :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                                @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                                type="date"
                                placeholder="From"
                                class="filter-input filter-input-small"
                              />
                              <span class="between-separator">to</span>
                              <input
                                :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value2 || ''"
                                @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value2', $event.target.value)"
                                type="date"
                                placeholder="To"
                                class="filter-input filter-input-small"
                              />
                            </div>

                            <!-- DateTime field inputs -->
                            <input
                              v-else-if="
                                field.type === 'DATETIME' &&
                                unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator &&
                                ['before', 'after'].includes(unlinkedSearchFilters[linkTarget.modelLinkId][field.id].operator)
                              "
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                              @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                              type="datetime-local"
                              class="filter-input"
                            />

                            <!-- DateTime between inputs -->
                            <div
                              v-else-if="
                                field.type === 'DATETIME' &&
                                unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.operator === 'between'
                              "
                              class="between-inputs"
                            >
                              <input
                                :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value || ''"
                                @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value', $event.target.value)"
                                type="datetime-local"
                                placeholder="From"
                                class="filter-input filter-input-small"
                              />
                              <span class="between-separator">to</span>
                              <input
                                :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.[field.id]?.value2 || ''"
                                @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, field.id, 'value2', $event.target.value)"
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
                                unlinkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.operator &&
                                ['before', 'after'].includes(unlinkedSearchFilters[linkTarget.modelLinkId]['created_at'].operator)
                              "
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.value || ''"
                              @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, 'created_at', 'value', $event.target.value)"
                              type="datetime-local"
                              class="filter-input"
                            />
                            <div
                              v-else-if="unlinkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.operator === 'between'"
                              class="between-inputs"
                            >
                              <input
                                :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.value || ''"
                                @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, 'created_at', 'value', $event.target.value)"
                                type="datetime-local"
                                placeholder="From"
                                class="filter-input filter-input-small"
                              />
                              <span class="between-separator">to</span>
                              <input
                                :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.['created_at']?.value2 || ''"
                                @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, 'created_at', 'value2', $event.target.value)"
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
                                unlinkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.operator &&
                                ['before', 'after'].includes(unlinkedSearchFilters[linkTarget.modelLinkId]['updated_at'].operator)
                              "
                              :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.value || ''"
                              @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, 'updated_at', 'value', $event.target.value)"
                              type="datetime-local"
                              class="filter-input"
                            />
                            <div
                              v-else-if="unlinkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.operator === 'between'"
                              class="between-inputs"
                            >
                              <input
                                :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.value || ''"
                                @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, 'updated_at', 'value', $event.target.value)"
                                type="datetime-local"
                                placeholder="From"
                                class="filter-input filter-input-small"
                              />
                              <span class="between-separator">to</span>
                              <input
                                :value="unlinkedSearchFilters[linkTarget.modelLinkId]?.['updated_at']?.value2 || ''"
                                @input="updateUnlinkedSearchFilter(linkTarget.modelLinkId, 'updated_at', 'value2', $event.target.value)"
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
                            @click="handleUnlinkedSearch(linkTarget)"
                            :disabled="!isUnlinkedSearchValid(linkTarget.modelLinkId) || !hasActiveUnlinkedFilters(linkTarget.modelLinkId)"
                            class="action-btn search-btn"
                          >
                            Search
                          </button>
                        </td>
                      </tr>
                    </thead>

                    <tbody>
                      <!-- Empty state row when no records -->
                      <tr v-if="unlinkedRecords[linkTarget.modelLinkId].length === 0" class="empty-state-row">
                        <td :colspan="(unlinkedRecordsData[linkTarget.modelLinkId]?.fields?.length || 0) + 3" class="empty-state-cell">
                          <div class="empty-state-content">
                            <span v-if="isUnlinkedSearchResult[linkTarget.modelLinkId]">No Unlinked Records Found In Search</span>
                            <span v-else>No Unlinked Records Found</span>
                          </div>
                        </td>
                      </tr>

                      <tr v-for="record in unlinkedRecords[linkTarget.modelLinkId]" :key="record.id">
                        <td v-for="field in unlinkedRecordsData[linkTarget.modelLinkId]?.fields" :key="field.id" class="record-cell">
                          {{ getFieldDisplayValue(record, field) }}
                        </td>
                        <td class="record-cell">{{ formatDateTime(record.createdAt) }}</td>
                        <td class="record-cell">{{ formatDateTime(record.updatedAt) }}</td>
                        <td class="action-cell">
                          <div class="action-buttons">
                            <button @click="viewLinkedRecord(record.id, linkTarget.targetModelId)" class="action-btn view-btn">
                              View
                            </button>
                            <button
                              @click="linkRecord(record, linkTarget)"
                              class="action-btn link-btn"
                              :disabled="linking"
                              v-if="!linking"
                            >
                              Link
                            </button>
                            <button v-else class="action-btn link-btn" disabled>Linking...</button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="pagination-controls">
                  <button
                    @click="goToPreviousUnlinkedPage(linkTarget)"
                    :disabled="!unlinkedPagination[linkTarget.modelLinkId]?.hasPrevious"
                    class="pagination-btn"
                  >
                    Previous
                  </button>

                  <span class="pagination-info">
                    Showing {{ unlinkedRecords[linkTarget.modelLinkId].length }} of {{ (unlinkedPagination[linkTarget.modelLinkId]?.totalEstimate || 0).toLocaleString() }} unlinked records
                    <span v-if="unlinkedPagination[linkTarget.modelLinkId]?.actualRecordCount">
                      (Total Records: {{ unlinkedPagination[linkTarget.modelLinkId].actualRecordCount.toLocaleString() }})
                    </span>
                  </span>

                  <button @click="goToNextUnlinkedPage(linkTarget)" :disabled="!unlinkedPagination[linkTarget.modelLinkId]?.hasNext" class="pagination-btn">
                    Next
                  </button>
                </div>
              </div>

              <div v-else class="no-linked-records">
                <p>No unlinked records available for linking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- View Record Modal -->
      <div v-if="showViewRecordModal" class="view-record-modal-container">
        <div class="view-record-modal-content">
          <div class="modal-header">
            <h3>{{ viewModalModel?.model?.name }} Record</h3>
            <button @click="closeViewRecordModal" class="close-modal-btn">✕</button>
          </div>

          <div v-if="loadingViewRecord" class="loading">
            <p>Loading record...</p>
          </div>

          <div v-else-if="viewRecordError" class="error-message">
            <p>Error: {{ viewRecordError }}</p>
            <button @click="closeViewRecordModal" class="retry-btn">Close</button>
          </div>

          <div v-else-if="viewModalRecord && viewModalModel" class="modal-record-content">
            <!-- Record ID and timestamps -->
            <div class="record-info">
              <div class="info-row">
                <label class="info-label">Record ID:</label>
                <span class="info-value">{{ viewModalRecord.id }}</span>
              </div>
              <div class="info-row">
                <label class="info-label">Created:</label>
                <span class="info-value">{{ formatDate(viewModalRecord.createdAt) }}</span>
              </div>
              <div class="info-row">
                <label class="info-label">Updated:</label>
                <span class="info-value">{{ formatDate(viewModalRecord.updatedAt) }}</span>
              </div>
            </div>

            <!-- Field values -->
            <div v-for="field in viewModalModel.model.fields" :key="field.id" class="field-group">
              <label class="field-label">
                {{ field.name }}
                <span v-if="field.description" class="field-description">{{ field.description }}</span>
              </label>

              <!-- Single Line Text -->
              <div
                v-if="field.type === 'SINGLE_LINE_TEXT'"
                class="field-value"
              >
                {{ viewModalRecord.fieldValues[field.id] || '-' }}
              </div>

              <!-- Multi Line Text -->
              <div
                v-else-if="field.type === 'MULTI_LINE_TEXT'"
                class="field-value field-value-multiline"
              >
                {{ viewModalRecord.fieldValues[field.id] || '-' }}
              </div>

              <!-- Email -->
              <div
                v-else-if="field.type === 'EMAIL'"
                class="field-value"
              >
                <a v-if="viewModalRecord.fieldValues[field.id]" :href="`mailto:${viewModalRecord.fieldValues[field.id]}`" class="email-link">
                  {{ viewModalRecord.fieldValues[field.id] }}
                </a>
                <span v-else>-</span>
              </div>

              <!-- Number -->
              <div
                v-else-if="field.type === 'DECIMAL' || field.type === 'LONG'"
                class="field-value"
              >
                {{ viewModalRecord.fieldValues[field.id] || '-' }}
              </div>

              <!-- Boolean -->
              <div
                v-else-if="field.type === 'BOOLEAN'"
                class="field-value"
              >
                {{ viewModalRecord.fieldValues[field.id] === true ? 'Yes' : viewModalRecord.fieldValues[field.id] === false ? 'No' : '-' }}
              </div>

              <!-- Date -->
              <div
                v-else-if="field.type === 'DATE'"
                class="field-value"
              >
                {{ formatDate(viewModalRecord.fieldValues[field.id]) || '-' }}
              </div>

              <!-- DateTime -->
              <div
                v-else-if="field.type === 'DATETIME'"
                class="field-value"
              >
                {{ formatDateTime(viewModalRecord.fieldValues[field.id]) || '-' }}
              </div>

              <!-- Default/Other types -->
              <div
                v-else
                class="field-value"
              >
                {{ viewModalRecord.fieldValues[field.id] || '-' }}
              </div>
            </div>

            <div class="modal-actions">
              <button @click="closeViewRecordModal" class="close-btn">Close</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Unlink Confirmation Container -->
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
              Are you sure you want to unlink <strong>{{ linkToDelete?.recordName }}</strong>?
            </p>
            <p class="warning-subtext">
              This will remove the link between the records but will not delete the records themselves.
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

      <!-- Delete Confirmation Container -->
      <div v-if="showDeleteConfirmation" class="delete-confirmation-container">
        <div class="delete-confirmation-content">
          <div class="confirmation-header">
            <h3>Delete Record</h3>
          </div>

          <div v-if="deleteError" class="error-message">
            <p>{{ deleteError }}</p>
          </div>

          <div class="confirmation-body">
            <p class="warning-text">
              <span v-if="!hasLinkedModelsError">Are you sure you want to delete this record?</span>
              <span v-else>Are you sure you want to force delete this record and all its linked relationships?</span>
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
              {{ deleting ? 'Deleting...' : (hasLinkedModelsError ? 'Force Delete Record' : 'Delete Record') }}
            </button>
          </div>
        </div>
      </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getApiUrl, getAuthHeaders, API_CONFIG } from '@/config/api'
import type {
  ModelDto,
  GetModelResponse,
  RecordDto,
  ModelLinkTarget,
  LinkedRecordCount,
  GetRecordsResponse,
  GetRecordsRequest,
  Record as RecordType,
  SearchParameter,
  Pagination
} from '@/types/models'
import { SearchFieldIdentifier, SearchType, QueryType } from '@/types/models'
import AppNavigation from '@/components/AppNavigation.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const model = ref<ModelDto | null>(null)
const record = ref<RecordDto | null>(null)
const modelLinkTargets = ref<ModelLinkTarget[]>([])
const loadingModel = ref(false)
const loadingRecord = ref(false)
const modelError = ref<string | null>(null)
const recordError = ref<string | null>(null)

// Delete record state
const showDeleteConfirmation = ref(false)
const deleteConfirmationText = ref('')
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const hasLinkedModelsError = ref(false)

// Linked records state
const linkedRecords = ref<Record<string, RecordType[]>>({})
const linkedRecordsData = ref<Record<string, GetRecordsResponse>>({})
const linkedPagination = ref<Record<string, Pagination>>({})
const loadingLinkedRecords = ref<Record<string, boolean>>({})
const linkedRecordsError = ref<Record<string, string | null>>({})

// Linked records search state
const showLinkedSearch = ref<Record<string, boolean>>({})
const linkedSearchFilters = ref<Record<string, Record<string, { operator: string; value: string; value2?: string }>>>({})
const linkedSortField = ref<Record<string, string>>({})
const linkedSortOrder = ref<Record<string, 'asc' | 'desc'>>({})
const linkedCurrentCursor = ref<Record<string, string | null>>({})
const isLinkedSearchResult = ref<Record<string, boolean>>({})

// Unlink confirmation state
const showUnlinkModal = ref(false)
const linkToDelete = ref<{ linkId: string; recordName: string; modelLinkId: string } | null>(null)
const unlinkError = ref<string | null>(null)
const unlinking = ref(false)

// View record modal state
const showViewRecordModal = ref(false)
const viewModalRecord = ref<RecordType | null>(null)
const viewModalModel = ref<GetModelResponse | null>(null)
const loadingViewRecord = ref(false)
const viewRecordError = ref<string | null>(null)

// Unlinked records state
const showUnlinkedRecords = ref<Record<string, boolean>>({})
const unlinkedRecords = ref<Record<string, RecordType[]>>({})
const unlinkedRecordsData = ref<Record<string, GetRecordsResponse>>({})
const unlinkedPagination = ref<Record<string, Pagination>>({})
const loadingUnlinkedRecords = ref<Record<string, boolean>>({})
const unlinkedRecordsError = ref<Record<string, string | null>>({})

// Unlinked records search state
const showUnlinkedSearch = ref<Record<string, boolean>>({})
const unlinkedSearchFilters = ref<Record<string, Record<string, { operator: string; value: string; value2?: string }>>>({})
const unlinkedSortField = ref<Record<string, string>>({})
const unlinkedSortOrder = ref<Record<string, 'asc' | 'desc'>>({})
const unlinkedCurrentCursor = ref<Record<string, string | null>>({})
const isUnlinkedSearchResult = ref<Record<string, boolean>>({})

// Link record state
const linking = ref(false)

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
    console.log('Received GetModelResponse:', data)

    model.value = data.model
    modelLinkTargets.value = data.modelLinkTargets || []

    console.log('Model link targets set to:', modelLinkTargets.value)
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
  } catch (err) {
    recordError.value = err instanceof Error ? err.message : 'Failed to fetch record'
    console.error('Error fetching record:', err)
  } finally {
    loadingRecord.value = false
  }
}

const loadData = async () => {
  await Promise.all([fetchModel(), fetchRecord()])
}

const formatDate = (dateString?: string, type: 'datetime' | 'date' = 'datetime') => {
  if (!dateString) return '-'
  const date = new Date(dateString)

  if (type === 'date') {
    // For date fields, return just YYYY/MM/DD
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  } else {
    // For datetime fields, return YYYY/MM/DD HH:MM
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}/${month}/${day} ${hours}:${minutes}`
  }
}

const goBack = () => {
  router.push({ 
    name: 'records', 
    params: { modelId: route.params.modelId }
  })
}

const navigateToEdit = () => {
  router.push({
    name: 'edit-record',
    params: {
      modelId: route.params.modelId,
      recordId: route.params.recordId
    }
  })
}

const navigateToLinkRecords = (linkTarget: ModelLinkTarget) => {
  console.log('Navigating to link records with linkTarget:', linkTarget)

  // Check if all required params are present
  if (!linkTarget.modelLinkId) {
    console.error('Missing modelLinkId in linkTarget:', linkTarget)
    alert('Error: Missing model link ID. Please refresh the page and try again.')
    return
  }

  if (!linkTarget.targetModelId) {
    console.error('Missing targetModelId in linkTarget:', linkTarget)
    alert('Error: Missing target model ID. Please refresh the page and try again.')
    return
  }

  router.push({
    name: 'select-records-to-link',
    params: {
      sourceRecordId: route.params.recordId as string,
      sourceModelId: route.params.modelId as string,
      targetModelId: linkTarget.targetModelId,
      modelLinkId: linkTarget.modelLinkId,
      sourceModelName: model.value?.name || 'Record'
    }
  })
}

// viewLinkedRecords function removed - showing linked records inline now

const getLinkedCount = (targetModelId: string): number => {
  if (!record.value?.linkedRecordCounts) return 0

  const linkCount = record.value.linkedRecordCounts.find(
    count => count.targetModelId === targetModelId
  )

  return linkCount ? linkCount.recordCount : 0
}

// Delete record functions
const showDeleteRecordConfirmation = () => {
  deleteConfirmationText.value = ''
  deleteError.value = null
  showDeleteConfirmation.value = true
}

const cancelDelete = () => {
  showDeleteConfirmation.value = false
  deleteConfirmationText.value = ''
  deleteError.value = null
  hasLinkedModelsError.value = false
}

const confirmDelete = async () => {
  if (deleteConfirmationText.value.toLowerCase() !== 'delete') {
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

    const modelId = route.params.modelId as string
    const recordId = route.params.recordId as string

    // Add override parameter if this is a retry after linked models error
    const overrideParam = hasLinkedModelsError.value ? '?overrideLinkedModelsError=true' : ''
    const url = getApiUrl(`/v1/records/${modelId}/${recordId}${overrideParam}`)

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
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
            // Check if this is a RECORD_LINKED_TO_MODELS error
            if (errorData.errorCode === 'RECORD_LINKED_TO_MODELS') {
              hasLinkedModelsError.value = true
            }
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

    // Success! Navigate back to records list
    router.push({
      name: 'records',
      params: {
        modelId: route.params.modelId as string
      }
    })
  } catch (err) {
    deleteError.value = err instanceof Error ? err.message : 'Failed to delete record'
    console.error('Error deleting record:', err)
  } finally {
    deleting.value = false
  }
}

// Linked records function implementations
const fetchLinkedRecords = async (
  linkTarget: ModelLinkTarget,
  cursor: string | null = null,
  previous: boolean = false,
  useSearch: boolean = false,
) => {
  const modelLinkId = linkTarget.modelLinkId
  loadingLinkedRecords.value[modelLinkId] = true
  linkedRecordsError.value[modelLinkId] = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const searchParams = useSearch ? convertLinkedFiltersToSearchParameters(modelLinkId) : []

    const requestData: GetRecordsRequest = {
      limit: 5,
      sortField: linkedSortField.value[modelLinkId] || 'created_at',
      sortOrder: linkedSortOrder.value[modelLinkId] || 'desc',
      previous: previous,
      searchParameters: searchParams,
      queryType: QueryType.LINKED_RECORDS,
      modelLinkId: modelLinkId,
      sourceRecordId: route.params.recordId as string,
    }

    if (cursor) {
      requestData.cursor = cursor
    }

    const response = await fetch(
      getApiUrl(`/v1/models/${route.params.modelId}/records/search`),
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
    linkedRecords.value[modelLinkId] = data.records
    linkedRecordsData.value[modelLinkId] = data
    linkedPagination.value[modelLinkId] = data.pagination
    linkedCurrentCursor.value[modelLinkId] = cursor
    isLinkedSearchResult.value[modelLinkId] = useSearch
  } catch (err) {
    linkedRecordsError.value[modelLinkId] = err instanceof Error ? err.message : 'Failed to fetch linked records'
    console.error('Error fetching linked records:', err)
  } finally {
    loadingLinkedRecords.value[modelLinkId] = false
  }
}

const hasActiveLinkedFilters = (modelLinkId: string): boolean => {
  const filters = linkedSearchFilters.value[modelLinkId]
  if (!filters) return false
  return Object.values(filters).some(
    (filter) => filter.operator && filter.operator !== 'all',
  )
}

const isLinkedSearchValid = (modelLinkId: string): boolean => {
  const filters = linkedSearchFilters.value[modelLinkId]
  if (!filters) return true

  return Object.entries(filters).every(([fieldId, filter]) => {
    if (!filter.operator || filter.operator === 'all') {
      return true // No validation needed for 'all' filters
    }

    // Get field info to determine validation rules
    const getFieldInfo = (fieldId: string) => {
      if (fieldId === 'created_at' || fieldId === 'updated_at') return { type: 'DATETIME' }
      if (fieldId === 'id') return { type: 'ID' }

      const field = linkedRecordsData.value[modelLinkId]?.fields.find((f) => f.id === fieldId)
      return field ? { type: field.type } : null
    }

    const fieldInfo = getFieldInfo(fieldId)
    if (!fieldInfo) return true

    // Text fields - need value
    if (['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL', 'ID'].includes(fieldInfo.type)) {
      return filter.value && filter.value.trim().length > 0
    }

    // Number fields - need valid number
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
}

const convertLinkedFiltersToSearchParameters = (modelLinkId: string): SearchParameter[] => {
  const filters = linkedSearchFilters.value[modelLinkId]
  if (!filters) return []

  const searchParameters: SearchParameter[] = []

  // Helper function to get field info
  const getFieldInfo = (fieldId: string) => {
    if (fieldId === 'created_at')
      return { type: 'DATETIME', searchFieldIdentifier: SearchFieldIdentifier.CREATED_AT }
    if (fieldId === 'updated_at')
      return { type: 'DATETIME', searchFieldIdentifier: SearchFieldIdentifier.UPDATED_AT }
    if (fieldId === 'id') return { type: 'ID', searchFieldIdentifier: SearchFieldIdentifier.ID }

    const field = linkedRecordsData.value[modelLinkId]?.fields.find((f) => f.id === fieldId)
    return field
      ? {
          type: field.type,
          searchFieldIdentifier: SearchFieldIdentifier.CUSTOM_FIELD,
          fieldId: fieldId,
        }
      : null
  }

  Object.entries(filters).forEach(([fieldId, filter]) => {
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

const handleLinkedSort = (modelLinkId: string, fieldId: string) => {
  if (linkedSortField.value[modelLinkId] === fieldId) {
    linkedSortOrder.value[modelLinkId] = linkedSortOrder.value[modelLinkId] === 'asc' ? 'desc' : 'asc'
  } else {
    linkedSortField.value[modelLinkId] = fieldId
    linkedSortOrder.value[modelLinkId] = 'asc'
  }

  linkedCurrentCursor.value[modelLinkId] = null
  const linkTarget = modelLinkTargets.value.find(lt => lt.modelLinkId === modelLinkId)
  if (linkTarget) {
    fetchLinkedRecords(linkTarget, null, false, hasActiveLinkedFilters(modelLinkId))
  }
}

const toggleLinkedSearch = (modelLinkId: string) => {
  if (showLinkedSearch.value[modelLinkId]) {
    linkedSearchFilters.value[modelLinkId] = {}
    showLinkedSearch.value[modelLinkId] = false
    linkedCurrentCursor.value[modelLinkId] = null
    isLinkedSearchResult.value[modelLinkId] = false
    const linkTarget = modelLinkTargets.value.find(lt => lt.modelLinkId === modelLinkId)
    if (linkTarget) {
      fetchLinkedRecords(linkTarget, null, false, false)
    }
  } else {
    showLinkedSearch.value[modelLinkId] = true
  }
}

const updateLinkedSearchFilter = (modelLinkId: string, fieldId: string, property: string, value: string) => {
  if (!linkedSearchFilters.value[modelLinkId]) {
    linkedSearchFilters.value[modelLinkId] = {}
  }
  if (!linkedSearchFilters.value[modelLinkId][fieldId]) {
    linkedSearchFilters.value[modelLinkId][fieldId] = { operator: 'all', value: '' }
  }
  linkedSearchFilters.value[modelLinkId][fieldId][property] = value
}

const handleLinkedSearch = (linkTarget: ModelLinkTarget) => {
  linkedCurrentCursor.value[linkTarget.modelLinkId] = null
  fetchLinkedRecords(linkTarget, null, false, true)
}

const goToNextLinkedPage = (linkTarget: ModelLinkTarget) => {
  const pagination = linkedPagination.value[linkTarget.modelLinkId]
  if (pagination?.hasNext && pagination.nextCursor) {
    fetchLinkedRecords(linkTarget, pagination.nextCursor, false, hasActiveLinkedFilters(linkTarget.modelLinkId))
  }
}

const goToPreviousLinkedPage = (linkTarget: ModelLinkTarget) => {
  const pagination = linkedPagination.value[linkTarget.modelLinkId]
  if (pagination?.hasPrevious && pagination.previousCursor) {
    fetchLinkedRecords(linkTarget, pagination.previousCursor, true, hasActiveLinkedFilters(linkTarget.modelLinkId))
  }
}

const viewLinkedRecord = async (recordId: string, targetModelId: string) => {
  loadingViewRecord.value = true
  viewRecordError.value = null
  showViewRecordModal.value = true

  try {
    const token = authStore.getAuthToken()
    if (!token) {
      router.push('/')
      return
    }

    // Fetch both model and record data
    const [modelResponse, recordResponse] = await Promise.all([
      fetch(getApiUrl(`/v1/models/${targetModelId}`), {
        headers: getAuthHeaders(token),
      }),
      fetch(getApiUrl(`/v1/records/${targetModelId}/${recordId}`), {
        headers: getAuthHeaders(token),
      })
    ])

    if (!modelResponse.ok) {
      throw new Error(`Failed to fetch model: ${modelResponse.status}`)
    }
    if (!recordResponse.ok) {
      throw new Error(`Failed to fetch record: ${recordResponse.status}`)
    }

    const modelData = await modelResponse.json()
    const recordData = await recordResponse.json()


    viewModalModel.value = modelData
    viewModalRecord.value = recordData
  } catch (err) {
    viewRecordError.value = err instanceof Error ? err.message : 'Failed to load record'
    console.error('Error loading record for modal:', err)
  } finally {
    loadingViewRecord.value = false
  }
}

const closeViewRecordModal = () => {
  showViewRecordModal.value = false
  viewModalRecord.value = null
  viewModalModel.value = null
  viewRecordError.value = null
}

const openUnlinkDialog = (record: RecordType, linkTarget: ModelLinkTarget) => {
  if (!record.linkId) return

  linkToDelete.value = {
    linkId: record.linkId,
    recordName: `${record.id.slice(0, 8)}...`,
    modelLinkId: linkTarget.modelLinkId
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
      getApiUrl(`/v1/model/linked-records/${linkToDelete.value.modelLinkId}/${linkToDelete.value.linkId}`),
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
    const modelLinkId = linkToDelete.value.modelLinkId
    linkToDelete.value = null

    // Refresh the linked records for this link target
    const linkTarget = modelLinkTargets.value.find(lt => lt.modelLinkId === modelLinkId)
    if (linkTarget) {
      await fetchLinkedRecords(linkTarget, null, false, hasActiveLinkedFilters(modelLinkId))
      // Also refresh the main record to update link counts
      await fetchRecord()
    }
  } catch (err) {
    unlinkError.value = err instanceof Error ? err.message : 'Failed to unlink record'
    console.error('Error unlinking record:', err)
  } finally {
    unlinking.value = false
  }
}

// Missing function implementations for unlinked records
const toggleUnlinkedRecords = (linkTarget: ModelLinkTarget) => {
  const modelLinkId = linkTarget.modelLinkId
  showUnlinkedRecords.value[modelLinkId] = !showUnlinkedRecords.value[modelLinkId]

  if (showUnlinkedRecords.value[modelLinkId]) {
    // Initialize and fetch unlinked records
    unlinkedSortField.value[modelLinkId] = 'created_at'
    unlinkedSortOrder.value[modelLinkId] = 'desc'
    showUnlinkedSearch.value[modelLinkId] = false
    unlinkedSearchFilters.value[modelLinkId] = {}
    unlinkedCurrentCursor.value[modelLinkId] = null
    isUnlinkedSearchResult.value[modelLinkId] = false
    fetchUnlinkedRecords(linkTarget)
  }
}

const fetchUnlinkedRecords = async (
  linkTarget: ModelLinkTarget,
  cursor: string | null = null,
  previous: boolean = false,
  useSearch: boolean = false,
) => {
  const modelLinkId = linkTarget.modelLinkId
  loadingUnlinkedRecords.value[modelLinkId] = true
  unlinkedRecordsError.value[modelLinkId] = null

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const searchParams = useSearch ? convertUnlinkedFiltersToSearchParameters(modelLinkId) : []

    const requestData: GetRecordsRequest = {
      limit: 5,
      sortField: unlinkedSortField.value[modelLinkId] || 'created_at',
      sortOrder: unlinkedSortOrder.value[modelLinkId] || 'desc',
      previous: previous,
      searchParameters: searchParams,
      queryType: QueryType.RECORDS_NOT_LINKED,
      modelLinkId: modelLinkId,
      sourceRecordId: route.params.recordId as string,
    }

    if (cursor) {
      requestData.cursor = cursor
    }

    const response = await fetch(
      getApiUrl(`/v1/models/${route.params.modelId}/records/search`),
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
    unlinkedRecords.value[modelLinkId] = data.records
    unlinkedRecordsData.value[modelLinkId] = data
    unlinkedPagination.value[modelLinkId] = data.pagination
    unlinkedCurrentCursor.value[modelLinkId] = cursor
    isUnlinkedSearchResult.value[modelLinkId] = useSearch
  } catch (err) {
    unlinkedRecordsError.value[modelLinkId] = err instanceof Error ? err.message : 'Failed to fetch unlinked records'
    console.error('Error fetching unlinked records:', err)
  } finally {
    loadingUnlinkedRecords.value[modelLinkId] = false
  }
}

const hasActiveUnlinkedFilters = (modelLinkId: string): boolean => {
  const filters = unlinkedSearchFilters.value[modelLinkId]
  if (!filters) return false
  return Object.values(filters).some(
    (filter) => filter.operator && filter.operator !== 'all',
  )
}

const isUnlinkedSearchValid = (modelLinkId: string): boolean => {
  const filters = unlinkedSearchFilters.value[modelLinkId]
  if (!filters) return true

  return Object.entries(filters).every(([fieldId, filter]) => {
    if (!filter.operator || filter.operator === 'all') {
      return true // No validation needed for 'all' filters
    }

    // Get field info to determine validation rules
    const getFieldInfo = (fieldId: string) => {
      if (fieldId === 'created_at' || fieldId === 'updated_at') return { type: 'DATETIME' }
      if (fieldId === 'id') return { type: 'ID' }

      const field = unlinkedRecordsData.value[modelLinkId]?.fields.find((f) => f.id === fieldId)
      return field ? { type: field.type } : null
    }

    const fieldInfo = getFieldInfo(fieldId)
    if (!fieldInfo) return true

    // Text fields - need value
    if (['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'EMAIL', 'ID'].includes(fieldInfo.type)) {
      return filter.value && filter.value.trim().length > 0
    }

    // Number fields - need valid number
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
}

const convertUnlinkedFiltersToSearchParameters = (modelLinkId: string): SearchParameter[] => {
  const filters = unlinkedSearchFilters.value[modelLinkId]
  if (!filters) return []

  const searchParameters: SearchParameter[] = []

  // Helper function to get field info
  const getFieldInfo = (fieldId: string) => {
    if (fieldId === 'created_at')
      return { type: 'DATETIME', searchFieldIdentifier: SearchFieldIdentifier.CREATED_AT }
    if (fieldId === 'updated_at')
      return { type: 'DATETIME', searchFieldIdentifier: SearchFieldIdentifier.UPDATED_AT }
    if (fieldId === 'id') return { type: 'ID', searchFieldIdentifier: SearchFieldIdentifier.ID }

    const field = unlinkedRecordsData.value[modelLinkId]?.fields.find((f) => f.id === fieldId)
    return field
      ? {
          type: field.type,
          searchFieldIdentifier: SearchFieldIdentifier.CUSTOM_FIELD,
          fieldId: fieldId,
        }
      : null
  }

  Object.entries(filters).forEach(([fieldId, filter]) => {
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

const handleUnlinkedSort = (modelLinkId: string, fieldId: string) => {
  if (unlinkedSortField.value[modelLinkId] === fieldId) {
    unlinkedSortOrder.value[modelLinkId] = unlinkedSortOrder.value[modelLinkId] === 'asc' ? 'desc' : 'asc'
  } else {
    unlinkedSortField.value[modelLinkId] = fieldId
    unlinkedSortOrder.value[modelLinkId] = 'asc'
  }

  unlinkedCurrentCursor.value[modelLinkId] = null
  const linkTarget = modelLinkTargets.value.find(lt => lt.modelLinkId === modelLinkId)
  if (linkTarget) {
    fetchUnlinkedRecords(linkTarget, null, false, hasActiveUnlinkedFilters(modelLinkId))
  }
}

const toggleUnlinkedSearch = (modelLinkId: string) => {
  if (showUnlinkedSearch.value[modelLinkId]) {
    unlinkedSearchFilters.value[modelLinkId] = {}
    showUnlinkedSearch.value[modelLinkId] = false
    unlinkedCurrentCursor.value[modelLinkId] = null
    isUnlinkedSearchResult.value[modelLinkId] = false
    const linkTarget = modelLinkTargets.value.find(lt => lt.modelLinkId === modelLinkId)
    if (linkTarget) {
      fetchUnlinkedRecords(linkTarget, null, false, false)
    }
  } else {
    showUnlinkedSearch.value[modelLinkId] = true
  }
}

const updateUnlinkedSearchFilter = (modelLinkId: string, fieldId: string, property: string, value: string) => {
  if (!unlinkedSearchFilters.value[modelLinkId]) {
    unlinkedSearchFilters.value[modelLinkId] = {}
  }
  if (!unlinkedSearchFilters.value[modelLinkId][fieldId]) {
    unlinkedSearchFilters.value[modelLinkId][fieldId] = { operator: 'all', value: '' }
  }
  unlinkedSearchFilters.value[modelLinkId][fieldId][property] = value
}

const handleUnlinkedSearch = (linkTarget: ModelLinkTarget) => {
  unlinkedCurrentCursor.value[linkTarget.modelLinkId] = null
  fetchUnlinkedRecords(linkTarget, null, false, true)
}

const goToNextUnlinkedPage = (linkTarget: ModelLinkTarget) => {
  const pagination = unlinkedPagination.value[linkTarget.modelLinkId]
  if (pagination?.hasNext && pagination.nextCursor) {
    fetchUnlinkedRecords(linkTarget, pagination.nextCursor, false, hasActiveUnlinkedFilters(linkTarget.modelLinkId))
  }
}

const goToPreviousUnlinkedPage = (linkTarget: ModelLinkTarget) => {
  const pagination = unlinkedPagination.value[linkTarget.modelLinkId]
  if (pagination?.hasPrevious && pagination.previousCursor) {
    fetchUnlinkedRecords(linkTarget, pagination.previousCursor, true, hasActiveUnlinkedFilters(linkTarget.modelLinkId))
  }
}

const linkRecord = async (record: RecordType, linkTarget: ModelLinkTarget) => {
  linking.value = true

  try {
    const token = authStore.getAuthToken()

    if (!token) {
      router.push('/')
      return
    }

    const linkData = {
      modelLinkId: linkTarget.modelLinkId,
      sourceModelId: route.params.modelId as string,
      sourceRecordId: route.params.recordId as string,
      targetRecordId: record.id
    }

    const response = await fetch(
      getApiUrl('/v1/records/link-records'),
      {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(linkData),
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

    // Refresh both linked and unlinked records
    await fetchLinkedRecords(linkTarget, null, false, hasActiveLinkedFilters(linkTarget.modelLinkId))
    await fetchUnlinkedRecords(linkTarget, null, false, hasActiveUnlinkedFilters(linkTarget.modelLinkId))
    // Also refresh the main record to update link counts
    await fetchRecord()
  } catch (err) {
    console.error('Error linking record:', err)
    alert('Failed to link record: ' + (err instanceof Error ? err.message : 'Unknown error'))
  } finally {
    linking.value = false
  }
}

const getFieldDisplayValue = (record: RecordType, field: any): string => {
  const value = record.fieldValues[field.id]

  if (value === null || value === undefined) {
    return ''
  }

  if (field.type === 'BOOLEAN') {
    return value ? 'Yes' : 'No'
  }

  if (field.type === 'DATE') {
    return formatDate(value, 'date')
  }

  if (field.type === 'DATETIME') {
    return formatDateTime(value)
  }

  if (field.type === 'DECIMAL' || field.type === 'LONG') {
    return Number(value).toLocaleString()
  }

  return String(value)
}

const formatDateTime = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

// Initialize linked records when model link targets are available
const initializeLinkedRecords = async () => {
  if (modelLinkTargets.value && modelLinkTargets.value.length > 0) {
    for (const linkTarget of modelLinkTargets.value) {
      // Initialize state for each link target
      linkedSortField.value[linkTarget.modelLinkId] = 'created_at'
      linkedSortOrder.value[linkTarget.modelLinkId] = 'desc'
      showLinkedSearch.value[linkTarget.modelLinkId] = false
      linkedSearchFilters.value[linkTarget.modelLinkId] = {}
      linkedCurrentCursor.value[linkTarget.modelLinkId] = null
      isLinkedSearchResult.value[linkTarget.modelLinkId] = false
      showUnlinkedRecords.value[linkTarget.modelLinkId] = false

      // Only fetch if there are linked records
      if (getLinkedCount(linkTarget.targetModelId) > 0) {
        await fetchLinkedRecords(linkTarget)
      }
    }
  }
}

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

const dateTimeFilterOptions = [
  { value: 'all', label: 'All dates' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
]

onMounted(() => {
  // Redirect if not authenticated
  const token = authStore.getAuthToken()
  if (!token) {
    router.push('/')
    return
  }

  loadData().then(() => {
    // Initialize linked records after model and record data are loaded
    initializeLinkedRecords()
  })
})
</script>

<style scoped>
.view-record {
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

.field-value {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  color: #495057;
  min-height: 1.2rem;
  font-size: 1rem;
}

.field-value-multiline {
  white-space: pre-wrap;
  min-height: 4rem;
}

.email-link {
  color: #007bff;
  text-decoration: none;
}

.email-link:hover {
  text-decoration: underline;
}

.boolean-value {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
}

.boolean-true {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.boolean-false {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.boolean-null {
  color: #6c757d;
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
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

.edit-btn {
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

.edit-btn:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.edit-btn:active {
  transform: translateY(0);
}

.linking-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.linking-section-fullwidth {
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  margin-top: 2rem;
  margin-bottom: 2rem;
  width: 100vw;
  padding: 0;
  background-color: transparent;
  border: none;
  box-sizing: border-box;
}

.linking-section-fullwidth > * {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.linking-section-fullwidth h4 {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 auto 1.5rem auto;
  padding: 0 2rem;
  max-width: 1400px;
  width: 100%;
  text-align: center;
  box-sizing: border-box;
}

.linking-section h4 {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
}

.link-target {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #dee2e6;
}

.linking-section-fullwidth .link-target {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0;
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.linking-section-fullwidth .link-target-header {
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.link-target:last-child {
  margin-bottom: 0;
}

.link-target-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.link-target-header h5 {
  color: #495057;
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.target-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.linked-count-badge {
  background-color: #d4edda;
  color: #155724;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid #c3e6cb;
  white-space: nowrap;
}

.link-constraints {
  font-size: 0.85rem;
  color: #6c757d;
  font-style: italic;
  text-align: right;
}

.link-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.linking-section-fullwidth .link-actions {
  padding: 1.5rem 1rem 1rem 1rem;
}

.link-records-btn {
  background-color: #6f42c1;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.link-records-btn:hover {
  background-color: #5a2d91;
  transform: translateY(-1px);
}

.link-records-btn:active {
  transform: translateY(0);
}

.view-linked-btn {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.view-linked-btn:hover {
  background-color: #138496;
  transform: translateY(-1px);
}

.view-linked-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .link-target-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .header-actions {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 0.5rem;
  }

  .unlinked-section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .search-toggle-btn {
    width: 100%;
    justify-content: center;
  }

  .target-info {
    align-items: flex-start;
    width: 100%;
  }

  .link-constraints {
    text-align: left;
  }

  .link-actions {
    justify-content: stretch;
    flex-direction: column;
  }

  .view-linked-btn,
  .link-records-btn {
    width: 100%;
  }
}

/* Delete record confirmation styles */
.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}

.delete-btn:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.delete-btn:active {
  transform: translateY(0);
}

/* View Record Modal Styles */
.view-record-modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  padding: 2rem;
  overflow-y: auto;
}

.view-record-modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
  background-color: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #495057;
  font-weight: 600;
}

.close-modal-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-modal-btn:hover {
  background-color: #e9ecef;
  color: #495057;
}

.modal-record-content {
  padding: 1.5rem;
}

.modal-actions {
  padding: 1.5rem;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
  border-radius: 0 0 12px 12px;
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.close-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .view-record-modal-container {
    padding: 1rem;
  }

  .view-record-modal-content {
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-record-content {
    padding: 1rem;
  }

  .modal-actions {
    padding: 1rem;
  }
}

.delete-confirmation-container {
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

.delete-confirmation-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.confirmation-header h3 {
  color: #dc3545;
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.confirmation-body {
  margin-bottom: 2rem;
}

.warning-text {
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  text-align: center;
}

.warning-subtext {
  color: #6c757d;
  margin-bottom: 1.5rem;
  text-align: center;
  line-height: 1.5;
}

.confirmation-input-group {
  margin-bottom: 1rem;
}

.confirmation-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.confirmation-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.confirmation-input:focus {
  outline: none;
  border-color: #dc3545;
}

.confirmation-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-delete-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.cancel-delete-btn:hover:not(:disabled) {
  background-color: #545b62;
}

.confirm-delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.confirm-delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.confirm-delete-btn:disabled,
.cancel-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Linked Records Table Styles */
.linked-records-container {
  margin-top: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.records-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}


.search-toggle-btn {
  background-color: #17a2b8;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
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

.records-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 0 0 8px 8px;
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
  padding: 0.75rem;
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
  padding: 0.5rem;
  vertical-align: top;
}

.search-filter {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-select {
  padding: 0.4rem;
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

.search-input-row {
  background-color: #fff3cd;
  border-bottom: 2px solid #ffeaa7;
}

.search-input-cell {
  padding: 0.5rem;
  vertical-align: top;
}

.search-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-input {
  padding: 0.4rem;
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
}

.filter-input-small {
  flex: 1;
}

.between-separator {
  font-size: 0.8rem;
  color: #6c757d;
}

.records-table td {
  padding: 0.75rem;
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
  transition: background-color 0.2s, transform 0.1s;
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

.search-btn:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
}

.search-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.pagination-controls {
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

.empty-state-row {
  background-color: #f8f9fa;
}

.empty-state-cell {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.empty-state-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.no-linked-records {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
  background-color: #f8f9fa;
  border-radius: 6px;
  margin: 1rem 0;
}

.unlinked-records-container {
  margin-top: 1rem;
  background: #fff8e1;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 2px solid #ffcc02;
}

.unlinked-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.unlinked-title {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
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

@media (max-width: 768px) {
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

  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
  }

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