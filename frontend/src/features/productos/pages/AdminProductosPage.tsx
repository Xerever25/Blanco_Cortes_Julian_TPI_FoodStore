import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { useCategorias } from '@/features/categorias/hooks/useCategorias'
import { handleApiError } from '@/shared/api/handleApiError'
import DataTable from '@/shared/components/DataTable'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import { SkeletonRows } from '@/shared/components/Skeleton'
import AdminNav from '@/shared/layout/AdminNav'
import Button from '@/shared/ui/Button'
import Modal from '@/shared/ui/Modal'
import { formatMoneda } from '@/shared/utils/format'

import ProductoForm from '../components/ProductoForm'
import StockForm from '../components/StockForm'
import { useActualizarProducto, useCambiarStock, useCrearProducto, useEliminarProducto, useProductos } from '../hooks/useProductos'
import type { Producto, ProductoInput, StockInput } from '../types/producto.types'

export default function AdminProductosPage() {
  // El panel pide hasta 100 productos y pagina en el cliente con TanStack Table.
  const { data, isLoading, isError, error, refetch } = useProductos({ skip: 0, limit: 100 })
  const { data: categorias = [] } = useCategorias()
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const cambiarStock = useCambiarStock()
  const eliminar = useEliminarProducto()

  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [stockDe, setStockDe] = useState<Producto | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const cerrarForm = () => {
    setFormAbierto(false)
    setEditando(null)
    crear.reset()
    actualizar.reset()
  }
  const cerrarStock = () => {
    setStockDe(null)
    cambiarStock.reset()
  }

  const guardar = (input: ProductoInput) => {
    if (editando) actualizar.mutate({ id: editando.id, data: input }, { onSuccess: cerrarForm })
    else crear.mutate(input, { onSuccess: cerrarForm })
  }
  const guardarStock = (input: StockInput) => {
    if (stockDe) cambiarStock.mutate({ id: stockDe.id, data: input }, { onSuccess: cerrarStock })
  }
  const borrar = (producto: Producto) => {
    if (!window.confirm(`¿Dar de baja el producto "${producto.nombre}"?`)) return
    setErrorAccion(null)
    eliminar.mutate(producto.id, { onError: (e) => setErrorAccion(handleApiError(e)) })
  }

  const columnas = useMemo<ColumnDef<Producto>[]>(
    () => [
      { header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span> },
      { header: 'Categoría', cell: ({ row }) => row.original.categoria.nombre },
      { header: 'Precio', cell: ({ row }) => formatMoneda(row.original.precio_base) },
      { header: 'Stock', accessorKey: 'stock' },
      {
        header: 'Disponible',
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              row.original.disponible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {row.original.disponible ? 'Sí' : 'No'}
          </span>
        ),
      },
      {
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
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
            <Button size="sm" variant="secondary" onClick={() => setStockDe(row.original)}>
              Stock
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
        <h1 className="text-2xl font-semibold">Productos</h1>
        <Button onClick={() => setFormAbierto(true)}>Nuevo producto</Button>
      </div>
      {errorAccion && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorAccion}
        </p>
      )}
      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error, 'No se pudieron cargar los productos')} onReintentar={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay productos" descripcion="Creá el primero con «Nuevo producto»." />
      ) : (
        <DataTable data={data.items} columns={columnas} caption="Productos" />
      )}

      <Modal open={formAbierto} title={editando ? 'Editar producto' : 'Nuevo producto'} onClose={cerrarForm}>
        <ProductoForm
          key={editando?.id ?? 'nuevo'}
          initial={editando}
          categorias={categorias}
          onSubmit={guardar}
          onCancel={cerrarForm}
          isSaving={crear.isPending || actualizar.isPending}
          error={errorForm ? handleApiError(errorForm) : null}
        />
      </Modal>

      <Modal open={stockDe !== null} title="Stock y disponibilidad" onClose={cerrarStock}>
        {stockDe && (
          <StockForm
            key={stockDe.id}
            producto={stockDe}
            onSubmit={guardarStock}
            onCancel={cerrarStock}
            isSaving={cambiarStock.isPending}
            error={cambiarStock.error ? handleApiError(cambiarStock.error) : null}
          />
        )}
      </Modal>
    </section>
  )
}
