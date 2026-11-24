import { Navigate, Outlet, useLocation } from 'react-router-dom'

import type { Rol } from '@/features/auth/types/auth.types'
import { useAuthStore } from '@/store/authStore'

interface Props {
  /** Roles que pueden ver la ruta; si se omite, alcanza con tener sesión. */
  roles?: Rol[]
}

/**
 * Sin sesión redirige a /login; sin el rol, a /unauthorized. Mientras checkSession confirma la sesión
 * muestra un indicador. La protección real está en el backend: ocultar una pantalla no reemplaza a require_role.
 */
export default function ProtectedRoute({ roles }: Props) {
  const usuario = useAuthStore((s) => s.usuario)
  const cargando = useAuthStore((s) => s.cargando)
  const location = useLocation()

  if (cargando) {
    return (
      <div role="status" className="flex items-center justify-center gap-3 py-24 text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-orange-600" />
        <span className="text-sm">Verificando sesión…</span>
      </div>
    )
  }
  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(usuario.role)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
