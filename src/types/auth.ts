export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
  userId: string
}

export interface User {
  id: string
  username: string
}