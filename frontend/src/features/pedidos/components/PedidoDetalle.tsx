import BadgeEstado from '@/shared/ui/BadgeEstado'
import { formatFecha, formatMoneda } from '@/shared/utils/format'

import type { Pedido } from '../types/pedido.types'

/** Detalle de un pedido: datos de entrega y líneas con el nombre y precio copiados al comprar. */
export default function PedidoDetalle({ pedido }: { pedido: Pedido }) {
  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-slate-500">Estado</dt>
        <dd>
          <BadgeEstado estado={pedido.estado} />
        </dd>
        <dt className="text-slate-500">Fecha</dt>
        <dd>{formatFecha(pedido.created_at)}</dd>
        <dt className="text-slate-500">Dirección</dt>
        <dd>{pedido.direccion_entrega}</dd>
        <dt className="text-slate-500">Forma de pago</dt>
        <dd>{pedido.forma_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}</dd>
        {pedido.notas && (
          <>
            <dt className="text-slate-500">Notas</dt>
            <dd>{pedido.notas}</dd>
          </>
        )}
      </dl>
      <table className="w-full text-left">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-1">Producto</th>
            <th className="py-1 text-right">Cant.</th>
            <th className="py-1 text-right">Precio</th>
            <th className="py-1 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {pedido.items.map((i) => (
            <tr key={i.producto_id} className="border-t border-slate-100">
              <td className="py-1.5">{i.nombre_producto}</td>
              <td className="py-1.5 text-right">{i.cantidad}</td>
              <td className="py-1.5 text-right">{formatMoneda(i.precio_unitario)}</td>
              <td className="py-1.5 text-right">{formatMoneda(i.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-300 font-semibold">
            <td colSpan={3} className="py-2 text-right">
              Total
            </td>
            <td className="py-2 text-right">{formatMoneda(pedido.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
