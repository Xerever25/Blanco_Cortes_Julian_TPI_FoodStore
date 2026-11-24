import { NavLink } from 'react-router-dom'

const ENLACES = [
  { to: '/admin/resumen', texto: 'Resumen' },
  { to: '/admin/pedidos', texto: 'Pedidos' },
  { to: '/admin/productos', texto: 'Productos' },
  { to: '/admin/categorias', texto: 'Categorías' },
  { to: '/admin/usuarios', texto: 'Usuarios' },
]

/** Menú secundario del panel de administración. */
export default function AdminNav() {
  return (
    <nav aria-label="Panel de administración" className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {ENLACES.map((e) => (
        <NavLink
          key={e.to}
          to={e.to}
          className={({ isActive }) =>
            `rounded-full px-3 py-1 text-sm font-medium ${
              isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`
          }
        >
          {e.texto}
        </NavLink>
      ))}
    </nav>
  )
}
