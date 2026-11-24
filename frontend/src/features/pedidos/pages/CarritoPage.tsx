import { Link } from 'react-router-dom'

import EstadoVacio from '@/shared/components/EstadoVacio'
import Button from '@/shared/ui/Button'
import { formatMoneda } from '@/shared/utils/format'
import { useCartStore } from '@/store/cartStore'

export default function CarritoPage() {
  const items = useCartStore((s) => s.items)
  const cambiarCantidad = useCartStore((s) => s.cambiarCantidad)
  const quitar = useCartStore((s) => s.quitar)
  const vaciar = useCartStore((s) => s.vaciar)
  const total = useCartStore((s) => s.total())

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="Tu carrito está vacío"
        descripcion="Agregá productos desde el catálogo."
        accion={
          <Link to="/" className="text-orange-600 underline">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Carrito</h1>
        <Button variant="ghost" size="sm" onClick={() => vaciar()}>
          Vaciar carrito
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.producto_id} className="border-t border-slate-200">
                <td className="px-4 py-3 font-medium">{i.nombre}</td>
                <td className="px-4 py-3">{formatMoneda(i.precio_unitario)}</td>
                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-2">
                    <Button size="sm" variant="secondary" aria-label={`Quitar uno de ${i.nombre}`} onClick={() => cambiarCantidad(i.producto_id, i.cantidad - 1)}>
                      −
                    </Button>
                    <span className="w-6 text-center" aria-label={`Cantidad de ${i.nombre}`}>
                      {i.cantidad}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`Agregar uno de ${i.nombre}`}
                      disabled={i.cantidad >= i.stock}
                      onClick={() => cambiarCantidad(i.producto_id, i.cantidad + 1)}
                    >
                      +
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{formatMoneda(i.precio_unitario * i.cantidad)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => quitar(i.producto_id)}>
                    Quitar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 font-semibold">
              <td colSpan={3} className="px-4 py-3 text-right">
                Total
              </td>
              <td className="px-4 py-3 text-right">{formatMoneda(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <Link
          to="/checkout"
          className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
        >
          Continuar con el pedido
        </Link>
      </div>
    </section>
  )
}
