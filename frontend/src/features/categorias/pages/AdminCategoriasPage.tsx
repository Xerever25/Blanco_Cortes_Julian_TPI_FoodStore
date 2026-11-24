import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import DataTable from '@/shared/components/DataTable'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import { SkeletonRows } from '@/shared/components/Skeleton'
import AdminNav from '@/shared/layout/AdminNav'
import { handleApiError } from '@/shared/api/handleApiError'
import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'

import CategoriaForm from '../components/CategoriaForm'
import { useActualizarCategoria, useCategorias, useCrearCategoria, useEliminarCategoria } from '../hooks/useCategorias'
import type { Categoria, CategoriaInput } from '../types/categoria.types'

export default function AdminCategoriasPage() {
  const { data: categorias = [], isLoading, isError, error, refetch } = useCategorias()
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const eliminar = useEliminarCategoria()

  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const cerrar = () => {
    setFormAbierto(false)
    setEditando(null)
    crear.reset()
    actualizar.reset()
  }

  const guardar = (data: CategoriaInput) => {
    if (editando) actualizar.mutate({ id: editando.id, data }, { onSuccess: cerrar })
    else crear.mutate(data, { onSuccess: cerrar })
  }

  const borrar = (categoria: Categoria) => {
    if (!window.confirm(`¿Dar de baja la categoría "${categoria.nombre}"?`)) return
    setErrorAccion(null)
    eliminar.mutate(categoria.id, { onError: (e) => setErrorAccion(handleApiError(e)) })
  }

  const columnas = useMemo<ColumnDef<Categoria>[]>(
    () => [
      { header: 'ID', accessorKey: 'id' },
      { header: 'Nombre', accessorKey: 'nombre', cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span> },
      { header: 'Descripción', cell: ({ row }) => row.original.descripcion ?? '—' },
      {
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditando(row.original)
                setFormAbierto(true)
              }}
            >
              Editar
            </Button>
            <Button size="sm" variant="danger" onClick={() => borrar(row.original)}>
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const errorForm = crear.error ?? actualizar.error

  return (
    <section>
      <AdminNav />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorías</h1>
        <Button onClick={() => setFormAbierto(true)}>Nueva categoría</Button>
      </div>
      {errorAccion && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorAccion}
        </p>
      )}
      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error, 'No se pudieron cargar las categorías')} onReintentar={() => void refetch()} />
      ) : categorias.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay categorías" descripcion="Creá la primera con «Nueva categoría»." />
      ) : (
        <DataTable data={categorias} columns={columnas} caption="Categorías" />
      )}

      <Modal open={formAbierto} title={editando ? 'Editar categoría' : 'Nueva categoría'} onClose={cerrar}>
        <CategoriaForm
          key={editando?.id ?? 'nueva'}
          initial={editando}
          onSubmit={guardar}
          onCancel={cerrar}
          isSaving={crear.isPending || actualizar.isPending}
          error={errorForm ? handleApiError(errorForm) : null}
        />
      </Modal>
    </section>
  )
}
