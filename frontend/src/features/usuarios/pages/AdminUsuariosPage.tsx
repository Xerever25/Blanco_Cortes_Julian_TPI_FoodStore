import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { handleApiError } from '@/shared/api/handleApiError'
import DataTable from '@/shared/components/DataTable'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import { SkeletonRows } from '@/shared/components/Skeleton'
import AdminNav from '@/shared/layout/AdminNav'
import Button from '@/shared/ui/Button'
import { useAuthStore } from '@/store/authStore'

import { useActivarUsuario, useDesactivarUsuario, useUsuarios } from '../hooks/useUsuarios'
import type { Usuario } from '../types/usuario.types'

export default function AdminUsuariosPage() {
  const sesion = useAuthStore((s) => s.usuario)
  const { data: usuarios = [], isLoading, isError, error, refetch } = useUsuarios()
  const activar = useActivarUsuario()
  const desactivar = useDesactivarUsuario()
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const columnas = useMemo<ColumnDef<Usuario>[]>(
    () => [
      { header: 'Usuario', cell: ({ row }) => <span className="font-medium">{row.original.username}</span> },
      { header: 'Nombre', accessorKey: 'full_name' },
      { header: 'Email', accessorKey: 'email' },
      { header: 'Rol', accessorKey: 'role' },
      {
        header: 'Estado',
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              row.original.disabled ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {row.original.disabled ? 'Desactivado' : 'Activo'}
          </span>
        ),
      },
      {
        header: 'Acciones',
        cell: ({ row }) => {
          const u = row.original
          const onError = (e: unknown) => setErrorAccion(handleApiError(e))
          return (
            <div className="flex gap-2">
              {u.disabled && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={activar.isPending}
                  onClick={() => {
                    setErrorAccion(null)
                    activar.mutate(u.id, { onError })
                  }}
                >
                  Activar
                </Button>
              )}
              {/* El botón Desactivar no aparece en la fila del usuario de la sesión. */}
              {!u.disabled && u.id !== sesion?.id && (
                <Button
                  size="sm"
                  variant="danger"
                  disabled={desactivar.isPending}
                  onClick={() => {
                    setErrorAccion(null)
                    desactivar.mutate(u.id, { onError })
                  }}
                >
                  Desactivar
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [sesion?.id, activar, desactivar],
  )

  return (
    <section>
      <AdminNav />
      <h1 className="mb-4 text-2xl font-semibold">Usuarios</h1>
      {errorAccion && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorAccion}
        </p>
      )}
      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error, 'No se pudieron cargar los usuarios')} onReintentar={() => void refetch()} />
      ) : usuarios.length === 0 ? (
        <EstadoVacio titulo="No hay usuarios" />
      ) : (
        <DataTable data={usuarios} columns={columnas} caption="Usuarios" />
      )}
    </section>
  )
}
