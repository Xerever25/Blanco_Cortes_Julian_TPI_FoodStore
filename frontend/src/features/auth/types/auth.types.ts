export type Rol = 'user' | 'admin'

/** Mismos campos que el schema UserPublic del backend. */
export interface UserPublic {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
  disabled: boolean
  created_at: string
}

/** Lo único que se guarda de la sesión en el navegador (nunca el token). */
export interface UsuarioSesion {
  id: number
  username: string
  full_name: string
  email: string
  role: Rol
}

export interface RegisterData {
  username: string
  full_name: string
  email: string
  password: string
}
