import { NavLink, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import Button from '@/shared/ui/Button'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-100'
  }`

export default function Navbar() {
  const navigate = useNavigate()
  const usuario = useAuthStore((s) => s.usuario)
  const logout = useAuthStore((s) => s.logout)
  const cantidad = useCartStore((s) => s.items.reduce((suma, i) => suma + i.cantidad, 0))

  const cerrarSesion = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav aria-label="Principal" className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3">
        <NavLink to="/" end className="mr-3 text-lg font-bold text-orange-600">
          🍔 Food Store
        </NavLink>
        <NavLink to="/" end className={linkClass}>
          Catálogo
        </NavLink>
        <NavLink to="/carrito" className={linkClass}>
          Carrito{cantidad > 0 ? ` (${cantidad})` : ''}
        </NavLink>
        {usuario && (
          <NavLink to="/mis-pedidos" className={linkClass}>
            Mis pedidos
          </NavLink>
        )}
        {usuario?.role === 'admin' && (
          <NavLink to="/admin/resumen" className={linkClass}>
            Panel admin
          </NavLink>
        )}

        <div className="ml-auto flex items-center gap-2">
          {usuario ? (
            <>
              <span className="text-sm text-slate-600">
                {usuario.full_name} <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{usuario.role}</span>
              </span>
              <Button variant="secondary" size="sm" onClick={cerrarSesion}>
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Iniciar sesión
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
