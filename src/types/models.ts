export interface ModelField {
  id: string
  type:
    | 'SINGLE_LINE_TEXT'
    | 'MULTI_LINE_TEXT'
    | 'DECIMAL'
    | 'LONG'
    | 'BOOLEAN'
    | 'DATE'
    | 'DATETIME'
    | 'EMAIL'
  name: string
  description: string
  parentField: boolean
}

export interface Model {
  id: string
  name: string
  description: string
  fields: ModelField[]
}

export interface ModelsResponse {
  models: Model[]
}

export interface Record {
  id: string
  createdAt: string
  updatedAt: string
  fieldValues: { [key: string]: any }
  linkId?: string
}

export interface Pagination {
  limit: number
  hasNext: boolean
  hasPrevious: boolean
  nextCursor?: string
  previousCursor?: string
  totalEstimate: number
  sortField: string
  sortOrder: string
}

export interface GetRecordsResponse {
  records: Record[]
  pagination: Pagination
  fields: ModelField[]
}

export interface SearchParameter {
  fieldID?: string
  searchFieldIdentifier: SearchFieldIdentifier
  searchType: SearchType
  textSearchValue?: string
  dateOn?: string
  dateBefore?: string
  dateAfter?: string
  dateStart?: string
  dateEnd?: string
  dateTimeBefore?: string
  dateTimeAfter?: string
  dateTimeStart?: string
  dateTimeEnd?: string
  yesNo?: boolean
  longSearchValue?: number
  doubleSearchValue?: number
}

export enum SearchFieldIdentifier {
  ID = 'ID',
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
  CUSTOM_FIELD = 'CUSTOM_FIELD',
}

export enum SearchType {
  TEXT_CONTAINS = 'TEXT_CONTAINS',
  TEXT_EQUALS = 'TEXT_EQUALS',
  TEXT_STARTS_WITH = 'TEXT_STARTS_WITH',
  TEXT_ENDS_WITH = 'TEXT_ENDS_WITH',
  TEXT_NOT_CONTAINS = 'TEXT_NOT_CONTAINS',
  TEXT_NOT_EQUALS = 'TEXT_NOT_EQUALS',
  DATE_ON = 'DATE_ON',
  DATE_BEFORE = 'DATE_BEFORE',
  DATE_AFTER = 'DATE_AFTER',
  DATE_BETWEEN = 'DATE_BETWEEN',
  DATE_TIME_BEFORE = 'DATE_TIME_BEFORE',
  DATE_TIME_AFTER = 'DATE_TIME_AFTER',
  DATE_TIME_BETWEEN = 'DATE_TIME_BETWEEN',
  BOOLEAN_TRUE = 'BOOLEAN_TRUE',
  BOOLEAN_FALSE = 'BOOLEAN_FALSE',
  DECIMAL_EQUALS = 'DECIMAL_EQUALS',
  DECIMAL_GREATER_THAN = 'DECIMAL_GREATER_THAN',
  DECIMAL_LESS_THAN = 'DECIMAL_LESS_THAN',
  LONG_EQUALS = 'LONG_EQUALS',
  LONG_GREATER_THAN = 'LONG_GREATER_THAN',
  LONG_LESS_THAN = 'LONG_LESS_THAN',
}

export enum QueryType {
  ALL_RECORDS = 'ALL_RECORDS',
  LINKED_RECORDS = 'LINKED_RECORDS',
  RECORDS_NOT_LINKED = 'RECORDS_NOT_LINKED',
}

export interface GetRecordsRequest {
  limit: number
  cursor?: string
  sortField?: string
  sortOrder: string
  previous: boolean
  searchParameters: SearchParameter[]
  queryType: QueryType
  modelLinkId?: string
  sourceRecordId?: string
}

export interface LinkedRecordCount {
  targetModelName: string
  targetModelId: string
  recordCount: number
}

export interface RecordDto {
  id: string
  createdAt: string
  updatedAt: string
  fieldValues: { [key: string]: any }
  linkedRecordCounts?: LinkedRecordCount[]
}

export interface UpdateRecordRequest {
  recordId: string
  fieldValues: { [key: string]: any }
}

export interface FieldDto {
  id: string
  type: string
  name: string
  description: string
  isParentField: boolean
}

export interface ModelDto {
  id: string
  name: string
  description: string
  fields: FieldDto[]
}

export interface ModelLinkTarget {
  modelLinkId: string
  recordId: string
  targetModelId: string
  can_have_unlimited_targets: boolean
  can_have_targets_count: number | null
  targetModelName: string
}

export interface GetModelResponse {
  model: ModelDto
  modelLinkTargets: ModelLinkTarget[]
}

export interface UserDto {
  userName: string
  name: string
  surname: string
  userId: string
  canCreateModels: boolean
  adminUser: boolean
  mustChangePassword?: boolean
}

export interface GetUsersResponse {
  users: UserDto[]
}

export interface GetUserResponse {
  userId: string
  userName: string
  name: string
  surname: string
  adminUser: boolean
  canCreateModels: boolean
  mustChangePassword: boolean
}

export interface CreateUserRequest {
  name: string
  surname: string
  username: string
  canCreateModels: boolean
  adminUser: boolean
}

export interface CreateUserResponse {
  username: string
  password: string
}

export interface UserResetPasswordResponse {
  newPassword: string
}

export enum ModelPermission {
  VIEW_RECORDS = 'VIEW_RECORDS',
  ADD_RECORDS = 'ADD_RECORDS',
  EDIT_RECORDS = 'EDIT_RECORDS',
  DELETE_RECORDS = 'DELETE_RECORDS',
}

export interface UserModelPermissionDto {
  modelId: string
  permission: ModelPermission
  modelName: string
  modelDescription: string
}

export interface GetUserModelPermissionsResponse {
  userModelPermissions: UserModelPermissionDto[]
}

export interface UpdateUserModelPermissionDto {
  modelId: string
  permission: ModelPermission
}

export interface UpdateUserRequest {
  userId: string
  name?: string
  surname?: string
  username: string
  adminUser: boolean
  canCreateModels: boolean
  mustChangePassword: boolean
  permissions: UpdateUserModelPermissionDto[]
}

export interface CreateModelRequest {
  name: string
  description?: string
  fields: FieldDto[]
}

export interface ModelLinkDto {
  modelLinkId: string
  model1Id: string
  model2Id: string
  model1_can_have_unlimited_model2s: boolean
  model2_can_have_unlimited_model1s: boolean
  model1_can_have_so_many_model2s_count: number | null
  model2_can_have_so_many_model1s_count: number | null
  model1Name: string
  model2Name: string
}

export interface GetModelLinksResponse {
  modelLinks: ModelLinkDto[]
}

export interface LinkModelsRequest {
  model1Id: string
  model2Id: string
  model1_can_have_unlimited_model2s: boolean
  model2_can_have_unlimited_model1s: boolean
  model1_can_have_so_many_model2s_count: number | null
  model2_can_have_so_many_model1s_count: number | null
  model1Name: string
  model2Name: string
}

export interface UpdateLinkedModelsRequest {
  modelLinkId: string
  model1_can_have_unlimited_model2s: boolean
  model2_can_have_unlimited_model1s: boolean
  model1_can_have_so_many_model2s_count: number | null
  model2_can_have_so_many_model1s_count: number | null
}

export interface DeleteModelLinkRequest {
  modelLinkId: string
}

export interface LinkedRecordDto {
  id: string
  displayName: string
  modelId: string
  modelName: string
  createdAt: string
  fieldValues: { [key: string]: any }
}

export interface GetLinkableRecordsResponse {
  records: LinkedRecordDto[]
  pagination?: Pagination
}

export interface LinkRecordsRequest {
  modelLinkId: string
  sourceModelId: string
  sourceRecordId: string
  targetRecordId: string
}

export interface GetLinkedRecordsResponse {
  linkedRecords: LinkedRecordDto[]
}

export interface ErrorDto {
  errorIdentifier: string
  timestamp: string
  message: string
}

export interface ErrorDetailDto {
  errorIdentifier: string
  timestamp: string
  message: string
  stackTrace: string
}

export interface ErrorPagingInfo {
  currentPage: number
  pageSize: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  hasNext: boolean
  hasPrevious: boolean
}

export interface GetErrorsResponse {
  errors: ErrorDto[]
  pagingInfo: ErrorPagingInfo
}
