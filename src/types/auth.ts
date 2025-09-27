export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
  mustChangePassword: boolean
  adminUser: boolean
}

export interface User {
  id: string
  username: string
  adminUser: boolean
}

export interface ForcedChangePasswordRequest {
  username: string
  oldPassword: string
  newPassword: string
}