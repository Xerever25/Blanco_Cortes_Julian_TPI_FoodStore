import { Navigate, useNavigate } from 'react-router-dom'

import { handleApiError } from '@/shared/api/handleApiError'
import Card from '@/shared/ui/Card'
import { formatMoneda } from '@/shared/utils/format'
import { useCartStore } from '@/store/cartStore'

import CheckoutForm, { type DatosCheckout } from '../components/CheckoutForm'
import { useCrearPedido } from '../hooks/useCrearPedido'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const vaciar = useCartStore((s) => s.vaciar)
  const total = useCartStore((s) => s.total())
  const crearPedido = useCrearPedido()

  // Pedido confirmado: el carrito ya se vació y se navega, no se vuelve a mostrar como vacío.
  if (items.length === 0 && !crearPedido.isSuccess) return <Navigate to="/carrito" replace />

  const confirmar = (datos: DatosCheckout) => {
    crearPedido.mutate(
      {
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        ...datos,
      },
      {
        onSuccess: () => {
          vaciar()
          navigate('/mis-pedidos', { replace: true })
        },
      },
    )
  }

  return (
    <section className="grid gap-6 md:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Confirmar pedido</h1>
        {crearPedido.isError && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {handleApiError(crearPedido.error, 'No se pudo crear el pedido')}
          </p>
        )}
        <Card>
          <CheckoutForm onSubmit={confirmar} isSaving={crearPedido.isPending} />
        </Card>
      </div>
      <aside>
        <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
        <Card>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.producto_id} className="flex justify-between gap-2">
                <span>
                  {i.cantidad} × {i.nombre}
                </span>
                <span>{formatMoneda(i.precio_unitario * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-semibold">
            <span>Total</span>
            <span>{formatMoneda(total)}</span>
          </p>
        </Card>
      </aside>
    </section>
  )
}
