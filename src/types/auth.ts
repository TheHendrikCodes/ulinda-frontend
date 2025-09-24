export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
}

export interface User {
  id: string
  username: string
}

export interface ForcedChangePasswordRequest {
  username: string
  oldPassword: string
  newPassword: string
}