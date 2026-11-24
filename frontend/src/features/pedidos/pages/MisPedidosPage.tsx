import { useState } from 'react'
import { Link } from 'react-router-dom'

import { handleApiError } from '@/shared/api/handleApiError'
import EstadoError from '@/shared/components/EstadoError'
import EstadoVacio from '@/shared/components/EstadoVacio'
import Paginacion from '@/shared/components/Paginacion'
import { SkeletonRows } from '@/shared/components/Skeleton'
import BadgeEstado from '@/shared/ui/BadgeEstado'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import Modal from '@/shared/ui/Modal'
import { formatFecha, formatMoneda } from '@/shared/utils/format'

import PedidoDetalle from '../components/PedidoDetalle'
import { useCancelarPedido } from '../hooks/useCancelarPedido'
import { usePedidos } from '../hooks/usePedidos'
import type { Pedido } from '../types/pedido.types'

const POR_PAGINA = 10

export default function MisPedidosPage() {
  const [pagina, setPagina] = useState(1)
  const [detalle, setDetalle] = useState<Pedido | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const { data, isLoading, isError, error, refetch } = usePedidos({ skip: (pagina - 1) * POR_PAGINA, limit: POR_PAGINA })
  const cancelar = useCancelarPedido()

  const pedirCancelacion = (pedido: Pedido) => {
    if (!window.confirm(`¿Cancelar el pedido #${pedido.id}? El stock se devolverá al catálogo.`)) return
    setErrorAccion(null)
    cancelar.mutate(pedido.id, { onError: (e) => setErrorAccion(handleApiError(e, 'No se pudo cancelar el pedido')) })
  }

  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold">Mis pedidos</h1>
      {errorAccion && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorAccion}
        </p>
      )}
      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error, 'No se pudieron cargar tus pedidos')} onReintentar={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hiciste pedidos"
          accion={
            <Link to="/" className="text-orange-600 underline">
              Ir al catálogo
            </Link>
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {data.items.map((p) => (
              <li key={p.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Pedido #{p.id}</p>
                    <p className="text-sm text-slate-500">{formatFecha(p.created_at)}</p>
                  </div>
                  <BadgeEstado estado={p.estado} />
                  <p className="font-semibold">{formatMoneda(p.total)}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setDetalle(p)}>
                      Ver detalle
                    </Button>
                    {/* Solo el pedido PENDIENTE se puede cancelar (RN-04). */}
                    {p.estado === 'PENDIENTE' && (
                      <Button size="sm" variant="danger" disabled={cancelar.isPending} onClick={() => pedirCancelacion(p)}>
                        Cancelar pedido
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <Paginacion pagina={pagina} total={data.total} porPagina={POR_PAGINA} onCambiar={setPagina} />
        </>
      )}

      <Modal open={detalle !== null} title={detalle ? `Pedido #${detalle.id}` : 'Pedido'} onClose={() => setDetalle(null)} size="lg">
        {detalle && <PedidoDetalle pedido={data?.items.find((p) => p.id === detalle.id) ?? detalle} />}
      </Modal>
    </section>
  )
}
