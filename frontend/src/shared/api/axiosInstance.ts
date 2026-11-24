import axios, { AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

/**
 * Cliente HTTP único. `withCredentials: true` hace que el navegador envíe la cookie HttpOnly con el JWT:
 * el frontend nunca lee ni guarda el token.
 */
export const api = axios.create({ baseURL: API_URL, withCredentials: true })

const CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada'

let limpiarSesion: (() => void) | null = null

/** El authStore registra aquí cómo limpiar la sesión (evita que este módulo dependa del store). */
export function setLimpiarSesionHandler(handler: () => void): void {
  limpiarSesion = handler
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: unknown }>) => {
    const status = error.response?.status
    const url = error.config?.url ?? ''
    const detail = error.response?.data?.detail
    // 401 fuera de /auth/token y /auth/me (ahí es una respuesta normal) o cuenta desactivada:
    // se limpia el authStore y ProtectedRoute lleva al login al quedar sin usuario.
    const sesionInvalida = status === 401 && !url.endsWith('/auth/token') && !url.endsWith('/auth/me')
    const cuentaDesactivada = status === 400 && detail === CUENTA_DESACTIVADA
    if (sesionInvalida || cuentaDesactivada) limpiarSesion?.()
    return Promise.reject(error)
  },
)
