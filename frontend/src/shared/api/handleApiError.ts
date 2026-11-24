import axios from 'axios'

/** Convierte el `detail` de la API en un mensaje legible para la pantalla. */
export function handleApiError(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError<{ detail?: unknown }>(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor'
    const detail = error.response.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      // 422: lista de errores de validación de FastAPI
      const mensajes = detail
        .map((d: unknown) => (typeof d === 'object' && d !== null && 'msg' in d ? String(d.msg) : ''))
        .filter(Boolean)
      if (mensajes.length > 0) return mensajes.join('. ')
    }
  }
  return fallback
}
