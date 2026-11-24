import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { getMe, loginRequest, logoutRequest } from '@/features/auth/api/auth'
import type { UserPublic, UsuarioSesion } from '@/features/auth/types/auth.types'
import { setLimpiarSesionHandler } from '@/shared/api/axiosInstance'

interface AuthState {
  /** Usuario de la sesión (nombre, email y rol). El token NO se guarda: vive en la cookie HttpOnly. */
  usuario: UsuarioSesion | null
  /** true mientras checkSession confirma la sesión con /auth/me (no se persiste). */
  cargando: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Confirma la sesión con GET /auth/me; se llama una vez al montar la aplicación. */
  checkSession: () => Promise<void>
  /** Limpia el usuario sin llamar al backend (la usa el interceptor de Axios). */
  limpiarSesion: () => void
}

const aSesion = (u: UserPublic): UsuarioSesion => ({
  id: u.id,
  username: u.username,
  full_name: u.full_name,
  email: u.email,
  role: u.role,
})

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async (username, password) => {
        await loginRequest(username, password)
        set({ usuario: aSesion(await getMe()) })
      },

      logout: async () => {
        try {
          await logoutRequest()
        } finally {
          set({ usuario: null })
        }
      },

      checkSession: async () => {
        set({ cargando: true })
        try {
          set({ usuario: aSesion(await getMe()) })
        } catch {
          set({ usuario: null })
        } finally {
          set({ cargando: false })
        }
      },

      limpiarSesion: () => set({ usuario: null }),
    }),
    {
      name: 'auth-storage',
      // Solo se persiste el usuario; `cargando` y las acciones no.
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)

// El interceptor de Axios limpia la sesión ante un 401 o una cuenta desactivada.
setLimpiarSesionHandler(() => useAuthStore.getState().limpiarSesion())
