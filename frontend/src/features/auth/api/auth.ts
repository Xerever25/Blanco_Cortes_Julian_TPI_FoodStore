import { api } from '@/shared/api/axiosInstance'

import type { RegisterData, UserPublic } from '../types/auth.types'

/** Login por formulario OAuth2: el JWT llega en una cookie HttpOnly, no en el cuerpo. */
export async function loginRequest(username: string, password: string): Promise<void> {
  await api.post('/auth/token', new URLSearchParams({ username, password }))
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}

export async function getMe(): Promise<UserPublic> {
  return (await api.get<UserPublic>('/auth/me')).data
}

export async function registerRequest(data: RegisterData): Promise<UserPublic> {
  return (await api.post<UserPublic>('/auth/register', data)).data
}
