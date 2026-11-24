import { formatMoneda } from '@/shared/utils/format'
import Button from '@/shared/ui/Button'
import { useCartStore } from '@/store/cartStore'

import type { Producto } from '../types/producto.types'

export default function ProductoCard({ producto }: { producto: Producto }) {
  const agregar = useCartStore((s) => s.agregar)
  const enCarrito = useCartStore((s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0)

  const sinStock = producto.stock <= 0
  const noVendible = !producto.disponible || sinStock
  const alMaximo = enCarrito >= producto.stock

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-36 items-center justify-center bg-orange-50 text-5xl">
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.nombre} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span aria-hidden="true">🍽️</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-orange-600">{producto.categoria.nombre}</span>
        <h3 className="font-semibold">{producto.nombre}</h3>
        {producto.descripcion && <p className="text-sm text-slate-500">{producto.descripcion}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold">{formatMoneda(producto.precio_base)}</span>
          {noVendible ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {!producto.disponible ? 'No disponible' : 'Sin stock'}
            </span>
          ) : (
            <span className="text-xs text-slate-500">Stock: {producto.stock}</span>
          )}
        </div>
        <Button
          className="mt-2"
          disabled={noVendible || alMaximo}
          onClick={() =>
            agregar({
              producto_id: producto.id,
              nombre: producto.nombre,
              precio_unitario: producto.precio_base,
              stock: producto.stock,
              imagen_url: producto.imagen_url,
            })
          }
        >
          {enCarrito > 0 ? `Agregar al carrito (${enCarrito})` : 'Agregar al carrito'}
        </Button>
      </div>
    </article>
  )
}
